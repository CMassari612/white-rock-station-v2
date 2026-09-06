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
import { RefreshCcw, LogOut, ExternalLink, Copy } from 'lucide-react';

interface AdminDockingSlipsPageProps {
  onNavigate: (page: string) => void;
}

function parseYMDToLocalMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function parseAssignedSlipNumber(b: BookingRequest): number | null {
  const n =
    typeof (b as any).assignedUnitNumber === 'number'
      ? (b as any).assignedUnitNumber
      : null;
  if (n && Number.isFinite(n)) return n;

  const label = (b as any).assignedUnitLabel as string | undefined;
  if (!label) return null;
  const m = label.match(/#\s*(\d+)\b/) || label.match(/\bSlip\s*(\d+)\b/i) || label.match(/\b(\d+)\b/);
  if (!m) return null;
  const parsed = Number(m[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function slipBookingTypeLabel(bookingType: BookingRequest['bookingType']): string {
  if (bookingType === 'season_slip') return 'Year Slip';
  if (bookingType === 'marina_daily' || bookingType === 'marina') return 'Day(s) Slip';
  return bookingType;
}

export function AdminDockingSlipsPage({ onNavigate }: AdminDockingSlipsPageProps) {
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(() => !getAdminPassword());
  const [authError, setAuthError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlipNumber, setSelectedSlipNumber] = useState<number | null>(null);
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<{ slipNumber: number; booking: BookingRequest } | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<{ bookingId: string } | null>(null);
  const [manual, setManual] = useState<{
    slipNumber: string;
    slipType: 'year' | 'days';
    startDate: string;
    endDate: string;
    name: string;
    email: string;
    phone: string;
    boatTypeAndColor: string;
    slipLengthFt: string;
    boatLengthFt: string;
  }>({
    slipNumber: '16',
    slipType: 'days',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
    boatTypeAndColor: '',
    slipLengthFt: '',
    boatLengthFt: '',
  });

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  }

  async function removeBooking(id: string) {
    if (!window.confirm('Remove this booking and free the slip? This cancels the reservation.')) return;
    try {
      await api.admin.cancelBooking(id);
      setSelectedSlipBooking(null);
      await loadBookings();
    } catch (e: any) {
      setAuthError(e?.message || 'Failed to remove booking.');
    }
  }

  async function loadBookings() {
    setLoading(true);
    setAuthError(null);
    try {
      const resp = await api.admin.getBookings();
      const slips = resp.bookings
        .filter(b => b.unitType === 'marina_slip')
        .slice()
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      setBookings(slips);
    } catch (err: any) {
      if (err?.status === 401) {
        setAuthError('Invalid password');
        clearAdminPassword();
        setIsPasswordDialogOpen(true);
      } else {
        setAuthError(err?.message || 'Failed to load docking slips');
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
  }, []);

  useEffect(() => {
    if (!selectedSlipNumber) return;
    setManual(prev => ({ ...prev, slipNumber: String(selectedSlipNumber) }));
  }, [selectedSlipNumber]);

  async function submitManualSlipBooking() {
    setManualError(null);
    setManualResult(null);

    const slipNum = Number(manual.slipNumber);
    if (!Number.isFinite(slipNum) || slipNum < 1 || slipNum > 20) {
      setManualError('Please choose a slip number (Slip 1–20).');
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

    const isYear = manual.slipType === 'year';
    if (isYear && slipNum > 15) {
      setManualError('Year slips must be Slip 1–15.');
      return;
    }
    if (!isYear && slipNum <= 15) {
      setManualError('Day(s) slips must be Slip 16–20.');
      return;
    }
    if (!isYear) {
      const ft = Number(manual.slipLengthFt);
      if (!Number.isFinite(ft) || ft <= 0) {
        setManualError('Boat length (ft) is required for Day(s) Slip.');
        return;
      }
    } else if (manual.boatLengthFt.trim()) {
      const ft = Number(manual.boatLengthFt);
      if (!Number.isFinite(ft) || ft <= 0) {
        setManualError('Boat length (ft) must be a positive number.');
        return;
      }
    }

    setLoading(true);
    try {
      const bookingType = isYear ? 'season_slip' : 'marina_daily';
      const created = await api.admin.createManualBooking({
        paymentMethod: 'cash',
        bookingType,
        unitType: 'marina_slip',
        requestedSlipNumber: slipNum,
        startDate: manual.startDate,
        endDate: manual.endDate,
        guests: 1,
        name: manual.name.trim(),
        email: manual.email.trim(),
        phone: manual.phone.trim(),
        notes: manual.boatTypeAndColor.trim() ? `Boat: ${manual.boatTypeAndColor.trim()}` : undefined,
        slipLengthFt: isYear ? undefined : Number(manual.slipLengthFt),
        boatLengthFt: isYear && manual.boatLengthFt.trim() ? Number(manual.boatLengthFt) : undefined,
      });

      const bookingId = created.booking.id;
      setManualResult({ bookingId });

      await loadBookings();
    } catch (err: any) {
      if (err?.status === 401) {
        setManualError('Invalid password');
        clearAdminPassword();
        setIsPasswordDialogOpen(true);
      } else {
        setManualError(err?.message || 'Failed to create slip booking.');
      }
    } finally {
      setLoading(false);
    }
  }

  const boatDock = useMemo(() => {
    const bookedSlipNumbers = new Set<number>();
    const bookingBySlipNumber = new Map<number, BookingRequest>();

    const confirmedSlipBookings = bookings.filter(
      b => b.status === 'confirmed' && b.unitType === 'marina_slip'
    );

    const relevant = confirmedSlipBookings
      .filter(b => {
        const end = parseYMDToLocalMidnight(b.endDate);
        return end >= today;
      })
      .filter(b => !!parseAssignedSlipNumber(b));

    // Choose a single "best" booking to display per slip:
    // Prefer an active booking today; otherwise the soonest upcoming booking.
    for (const b of relevant) {
      const slipNumber = parseAssignedSlipNumber(b);
      if (!slipNumber) continue;
      if (slipNumber < 1 || slipNumber > 20) continue;

      const start = parseYMDToLocalMidnight(b.startDate);
      const end = parseYMDToLocalMidnight(b.endDate); // end exclusive
      const isActive = today >= start && today < end;

      const existing = bookingBySlipNumber.get(slipNumber);
      if (!existing) {
        bookingBySlipNumber.set(slipNumber, b);
      } else {
        const existingStart = parseYMDToLocalMidnight(existing.startDate);
        const existingEnd = parseYMDToLocalMidnight(existing.endDate);
        const existingIsActive = today >= existingStart && today < existingEnd;

        if (isActive && !existingIsActive) {
          bookingBySlipNumber.set(slipNumber, b);
        } else if (isActive === existingIsActive) {
          // Both active or both upcoming: choose the one with the earlier startDate.
          if (b.startDate < existing.startDate) bookingBySlipNumber.set(slipNumber, b);
        }
      }
    }

    for (const b of confirmedSlipBookings) {
      // Consider slips "booked" if the booking is active today or upcoming (endDate >= today).
      const end = parseYMDToLocalMidnight(b.endDate);
      if (end < today) continue;
      const slipNumber = parseAssignedSlipNumber(b);
      if (slipNumber && slipNumber >= 1 && slipNumber <= 20) bookedSlipNumbers.add(slipNumber);
    }

    const slips = Array.from({ length: 20 }, (_, i) => {
      const slipNumber = i + 1;
      const isBooked = bookedSlipNumbers.has(slipNumber);
      const booking = bookingBySlipNumber.get(slipNumber) || null;
      return { slipNumber, isBooked, booking };
    });

    return slips;
  }, [bookings, today]);

  const selectedSlipBookings = useMemo(() => {
    if (!selectedSlipNumber) return [];
    const relevantConfirmed = bookings.filter(b => b.status === 'confirmed' && b.unitType === 'marina_slip');
    return relevantConfirmed.filter(b => {
      const end = parseYMDToLocalMidnight(b.endDate);
      if (end < today) return false;
      return parseAssignedSlipNumber(b) === selectedSlipNumber;
    });
  }, [bookings, selectedSlipNumber, today]);

  const selectedSlipIsBooked = selectedSlipBookings.length > 0;

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
                  aria-current="page"
                  className="text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  Docking Slips
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('admin-campsites')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
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
            <h2 className="text-2xl font-semibold">Boat Dock</h2>
            <div className="text-sm text-muted-foreground">Slips 1–20</div>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(108px, 1fr))' }}>
            {boatDock.map((slip) => (
              <button
                key={slip.slipNumber}
                type="button"
                onClick={() => {
                  setSelectedSlipNumber(slip.slipNumber);
                  if (slip.isBooked && slip.booking) setSelectedSlipBooking({ slipNumber: slip.slipNumber, booking: slip.booking });
                }}
                aria-label={`Slip ${slip.slipNumber}`}
                className="text-left rounded-xl border transition-all hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                style={{
                  minHeight: 66,
                  padding: 10,
                  cursor: slip.isBooked ? 'pointer' : 'default',
                  backgroundColor: slip.isBooked ? 'rgb(187 247 208)' : 'rgb(243 244 246)',
                  borderColor: slip.isBooked ? 'rgb(110 231 183)' : 'rgb(226 232 240)',
                }}
              >
                <div className="text-[var(--forest-green)] font-semibold text-sm">Slip {slip.slipNumber}</div>
                {slip.isBooked && slip.booking ? (
                  <div className="text-xs text-[var(--forest-green)]/80 truncate mt-1">{slip.booking.name}</div>
                ) : (
                  <div className="text-xs text-[var(--forest-green)]/50 mt-1">Open</div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Renter detail popup — inline-styled so it renders without a live Tailwind compiler */}
        {selectedSlipBooking && (
          <div
            onClick={() => setSelectedSlipBooking(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--forest-green)' }}>Slip {selectedSlipBooking.slipNumber}</h3>
                <button onClick={() => setSelectedSlipBooking(null)} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#888' }}>×</button>
              </div>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#999', margin: '4px 0 14px' }}>Renter information</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 14, color: 'var(--forest-green)' }}>
                <div><strong>Name:</strong> {selectedSlipBooking.booking.name}</div>
                <div><strong>Type:</strong> {slipBookingTypeLabel(selectedSlipBooking.booking.bookingType)}</div>
                <div><strong>Dates:</strong> {selectedSlipBooking.booking.startDate} → {selectedSlipBooking.booking.endDate}</div>
                <div><strong>Phone:</strong> {selectedSlipBooking.booking.phone || '—'}</div>
                <div><strong>Email:</strong> {selectedSlipBooking.booking.email}</div>
                <div><strong>Status:</strong> {selectedSlipBooking.booking.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button onClick={() => copyToClipboard(selectedSlipBooking.booking.id)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.2)', background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  Copy booking ID
                </button>
                <button onClick={() => removeBooking(selectedSlipBooking.booking.id)} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#b3261e', color: '#fff', cursor: 'pointer', fontSize: 14 }}>
                  Remove booking
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Manual Boat Slip Booking</h2>
          </div>

          {manualError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {manualError}
            </div>
          )}

          <div className="rounded-2xl bg-white border border-gray-100 shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Slip Number</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={manual.slipNumber}
                  onChange={(e) => setManual(prev => ({ ...prev, slipNumber: e.target.value }))}
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={String(n)}>{`Slip ${n}`}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Slip Type</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={manual.slipType}
                  onChange={(e) => setManual(prev => ({ ...prev, slipType: e.target.value as any }))}
                >
                  <option value="year">Year Slip</option>
                  <option value="days">Day(s) Slip</option>
                </select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Guest Name</div>
                <Input value={manual.name} onChange={(e) => setManual(prev => ({ ...prev, name: e.target.value }))} />
              </div>
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
              <div>
                <div className="text-xs text-muted-foreground mb-1">Boat Type &amp; Color</div>
                <Input
                  placeholder="e.g. Pontoon - Blue/White"
                  value={manual.boatTypeAndColor}
                  onChange={(e) => setManual(prev => ({ ...prev, boatTypeAndColor: e.target.value }))}
                />
              </div>
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
              {manual.slipType === 'days' ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                  <Input value={manual.slipLengthFt} onChange={(e) => setManual(prev => ({ ...prev, slipLengthFt: e.target.value }))} />
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                  <Input value={manual.boatLengthFt} onChange={(e) => setManual(prev => ({ ...prev, boatLengthFt: e.target.value }))} />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button type="button" onClick={submitManualSlipBooking} disabled={loading}>
                Create Booking
              </Button>
              {manualResult?.bookingId && (
                <Button variant="outline" type="button" onClick={() => copyToClipboard(manualResult.bookingId)}>
                  <Copy className="h-4 w-4 mr-2" />
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
            <DialogDescription>Enter the admin password to view docking slips.</DialogDescription>
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

