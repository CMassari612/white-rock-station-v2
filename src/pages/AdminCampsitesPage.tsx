import { useEffect, useMemo, useState } from 'react';
import { api, BookingRequest } from '../lib/api';
import { getAdminPassword, setAdminPassword, clearAdminPassword } from '../lib/adminSession';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { RefreshCcw, LogOut } from 'lucide-react';

interface AdminCampsitesPageProps {
  onNavigate: (page: string) => void;
}

function parseYMDToLocalMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function slipLabel(n: number) {
  return `Campsite ${n}`;
}

/**
 * UI-only deterministic assignment of campsite spot numbers (1..capacity).
 * Greedy interval coloring by date overlap.
 */
function assignCampsiteNumbers(bookings: BookingRequest[], capacity: number) {
  const items = bookings
    .filter(b => b.unitType === 'campsite' && b.status === 'confirmed')
    .slice()
    .sort((a, b) => (a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)));

  type Slot = { end: string; n: number };
  const active: Slot[] = [];
  const assignment = new Map<string, number>();

  for (const b of items) {
    // Remove ended slots (end is exclusive)
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= b.startDate) active.splice(i, 1);
    }

    const used = new Set(active.map(s => s.n));
    let n = 1;
    while (n <= capacity && used.has(n)) n++;
    if (n > capacity) continue; // overflow; not displayed

    assignment.set(b.id, n);
    active.push({ end: b.endDate, n });
  }

  return assignment;
}

export function AdminCampsitesPage({ onNavigate }: AdminCampsitesPageProps) {
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(() => !getAdminPassword());
  const [authError, setAuthError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<{ bookingId: string } | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<{ n: number; booking: BookingRequest } | null>(null);
  const [manual, setManual] = useState<{
    campsiteNumber: string;
    startDate: string;
    endDate: string;
    name: string;
    email: string;
    phone: string;
  }>({
    campsiteNumber: '1',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  async function loadBookings() {
    setLoading(true);
    setAuthError(null);
    try {
      const resp = await api.admin.getBookings();
      setBookings(resp.bookings.slice().sort((a, b) => a.startDate.localeCompare(b.startDate)));
    } catch (err: any) {
      if (err?.status === 401) {
        setAuthError('Invalid password');
        clearAdminPassword();
        setIsPasswordDialogOpen(true);
      } else {
        setAuthError(err?.message || 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const existing = getAdminPassword();
    if (existing) {
      setIsPasswordDialogOpen(false);
      loadBookings();
    }
    // Auto-refresh when returning to this tab (e.g. after a new booking confirms).
    const onFocus = () => { if (getAdminPassword()) loadBookings(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const relevantConfirmed = useMemo(() => {
    return bookings.filter(b => {
      if (b.unitType !== 'campsite') return false;
      if (b.status !== 'confirmed') return false;
      const end = parseYMDToLocalMidnight(b.endDate);
      return end >= today; // active or upcoming
    });
  }, [bookings, today]);

  const campsiteNums = useMemo(() => assignCampsiteNumbers(relevantConfirmed, 40), [relevantConfirmed]);

  const dock = useMemo(() => {
    // Group bookings by campsite number.
    // Prefer explicit assignment (assignedUnitNumber/requestedCampsiteNumber), otherwise fall back to UI greedy assignment.
    const byN = new Map<number, BookingRequest[]>();

    const withoutAssigned = relevantConfirmed.filter(b => {
      const assigned = (b as any).requestedCampsiteNumber ?? b.assignedUnitNumber;
      return !(typeof assigned === 'number' && assigned >= 1 && assigned <= 40);
    });
    const fallback = assignCampsiteNumbers(withoutAssigned, 40);

    for (const b of relevantConfirmed) {
      const explicit = (b as any).requestedCampsiteNumber ?? b.assignedUnitNumber;
      const n =
        typeof explicit === 'number' && explicit >= 1 && explicit <= 40
          ? explicit
          : fallback.get(b.id);
      if (!n) continue;
      const list = byN.get(n) || [];
      list.push(b);
      byN.set(n, list);
    }

    // For each campsite, choose a single booking to display:
    // Prefer active today; otherwise soonest upcoming.
    const spots = Array.from({ length: 40 }, (_, i) => {
      const n = i + 1;
      const list = (byN.get(n) || []).slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
      let chosen: BookingRequest | null = null;
      for (const b of list) {
        const start = parseYMDToLocalMidnight(b.startDate);
        const end = parseYMDToLocalMidnight(b.endDate);
        const isActive = today >= start && today < end;
        if (isActive) {
          chosen = b;
          break;
        }
      }
      if (!chosen && list.length > 0) chosen = list[0];
      return { n, booking: chosen };
    });

    return spots;
  }, [relevantConfirmed, today]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  }

  async function removeBooking(id: string) {
    if (!window.confirm('Remove this booking and free the campsite? This cancels the reservation.')) return;
    try {
      await api.admin.cancelBooking(id);
      setSelectedSpot(null);
      await loadBookings();
    } catch (e: any) {
      setManualError(e?.message || 'Failed to remove booking.');
    }
  }

  async function submitManualCampsiteBooking() {
    setManualError(null);
    setManualResult(null);

    const n = Number(manual.campsiteNumber);
    if (!Number.isFinite(n) || n < 1 || n > 40) {
      setManualError('Please choose a campsite number (1–40).');
      return;
    }
    if (!manual.name.trim()) {
      setManualError('Guest name is required.');
      return;
    }
    if (!manual.email.trim()) {
      setManualError('Email is required.');
      return;
    }
    if (!manual.startDate || !manual.endDate) {
      setManualError('Start date and end date are required.');
      return;
    }
    if (manual.startDate >= manual.endDate) {
      setManualError('End date must be after start date.');
      return;
    }
    const guests = 1;

    setLoading(true);
    try {
      const created = await api.admin.createManualBooking({
        paymentMethod: 'cash',
        bookingType: 'campsite',
        unitType: 'campsite',
        requestedCampsiteNumber: n,
        startDate: manual.startDate,
        endDate: manual.endDate,
        guests,
        name: manual.name.trim(),
        email: manual.email.trim(),
        phone: manual.phone.trim(),
      });
      setManualResult({ bookingId: created.booking.id });
      await loadBookings();
    } catch (err: any) {
      if (err?.status === 401) {
        setManualError('Invalid password');
        clearAdminPassword();
        setIsPasswordDialogOpen(true);
      } else {
        setManualError(err?.message || 'Failed to create campsite booking.');
      }
    } finally {
      setLoading(false);
    }
  }

  const onSubmitPassword = async () => {
    setAuthError(null);
    const trimmed = password.trim();
    if (!trimmed) {
      setAuthError('Password is required');
      return;
    }
    setAdminPassword(trimmed);
    setIsPasswordDialogOpen(false);
    await loadBookings();
  };

  return (
    <div className="min-h-screen bg-[var(--off-white)]">
      <header className="sticky top-0 z-50 bg-[var(--forest-green)] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <div className="mt-1 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  Cabin Bookings
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-docking-slips')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  Docking Slips
                </button>
                <button
                  type="button"
                  aria-current="page"
                  className="text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  Campsites
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-cleaning')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  Cleaning Schedule
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-calendar')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  White Rock Station Calendar
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={loadBookings}
                disabled={loading}
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  clearAdminPassword();
                  setPassword('');
                  setBookings([]);
                  onNavigate('admin-login');
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{authError}</div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Campsites</h2>
            <div className="text-sm text-muted-foreground">Sites 1–40 · tap a booked site for renter info</div>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))' }}>
            {dock.map((spot) => {
              const isBooked = !!spot.booking;
              return (
                <button
                  key={spot.n}
                  type="button"
                  onClick={() => { if (isBooked && spot.booking) setSelectedSpot({ n: spot.n, booking: spot.booking }); }}
                  aria-label={slipLabel(spot.n)}
                  className="text-left rounded-xl border transition-all hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  style={{
                    minHeight: 66,
                    padding: 10,
                    cursor: isBooked ? 'pointer' : 'default',
                    backgroundColor: isBooked ? 'rgb(187 247 208)' : 'rgb(243 244 246)',
                    borderColor: isBooked ? 'rgb(110 231 183)' : 'rgb(226 232 240)',
                  }}
                >
                  <div className="text-[var(--forest-green)] font-semibold text-sm">{slipLabel(spot.n)}</div>
                  {isBooked && spot.booking ? (
                    <div className="text-xs text-[var(--forest-green)]/80 truncate mt-1">{spot.booking.name}</div>
                  ) : (
                    <div className="text-xs text-[var(--forest-green)]/50 mt-1">Open</div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Renter detail popup — inline-styled so it renders without a live Tailwind compiler */}
        {selectedSpot && (
          <div
            onClick={() => setSelectedSpot(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--forest-green)' }}>{slipLabel(selectedSpot.n)}</h3>
                <button onClick={() => setSelectedSpot(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#888' }}>×</button>
              </div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', margin: '4px 0 14px' }}>Renter information</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 14, color: 'var(--forest-green)' }}>
                <div><strong>Name:</strong> {selectedSpot.booking.name}</div>
                <div><strong>Dates:</strong> {selectedSpot.booking.startDate} → {selectedSpot.booking.endDate}</div>
                <div><strong>Phone:</strong> {selectedSpot.booking.phone || '—'}</div>
                <div><strong>Email:</strong> {selectedSpot.booking.email}</div>
                <div><strong>Status:</strong> {selectedSpot.booking.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyToClipboard(selectedSpot.booking.id)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', background: '#fff', cursor: 'pointer', fontSize: 14 }}
                >
                  Copy booking ID
                </button>
                <button
                  onClick={() => removeBooking(selectedSpot.booking.id)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#b3261e', color: '#fff', cursor: 'pointer', fontSize: 14 }}
                >
                  Remove booking
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Manual Campsite Booking</h2>
          </div>

          {manualError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{manualError}</div>
          )}

          <div className="rounded-2xl bg-white border border-gray-100 shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Campsite Number</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={manual.campsiteNumber}
                  onChange={(e) => setManual(prev => ({ ...prev, campsiteNumber: e.target.value }))}
                >
                  {Array.from({ length: 40 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={String(n)}>{`Campsite ${n}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Guest Name</div>
                <Input value={manual.name} onChange={(e) => setManual(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <Input value={manual.email} onChange={(e) => setManual(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Phone</div>
                <Input value={manual.phone} onChange={(e) => setManual(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                <Input type="date" value={manual.startDate} onChange={(e) => setManual(prev => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                <Input type="date" value={manual.endDate} onChange={(e) => setManual(prev => ({ ...prev, endDate: e.target.value }))} />
              </div>
              <div />
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button type="button" onClick={submitManualCampsiteBooking} disabled={loading}>
                Create Booking
              </Button>
              {manualResult?.bookingId && (
                <Button variant="outline" type="button" onClick={() => copyToClipboard(manualResult.bookingId)}>
                  Copy Booking ID
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>Enter the admin password to view campsites.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmitPassword();
              }}
              autoFocus
            />
            {authError && <div className="text-sm text-red-700">{authError}</div>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                onNavigate('home');
                setIsPasswordDialogOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={onSubmitPassword} disabled={loading}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

