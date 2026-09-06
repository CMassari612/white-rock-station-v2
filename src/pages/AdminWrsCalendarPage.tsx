import { useEffect, useMemo, useState } from 'react';
import { api, BookingRequest } from '../lib/api';
import { getAdminPassword, setAdminPassword, clearAdminPassword } from '../lib/adminSession';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Calendar } from '../components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { RefreshCcw, LogOut } from 'lucide-react';

interface AdminWrsCalendarPageProps {
  onNavigate: (page: string) => void;
}

function parseYMDToLocalMidnight(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

function addDaysYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function formatLocalDateToYMD(date: Date): string {
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function unitTypeLabel(unitType: BookingRequest['unitType']): string {
  switch (unitType) {
    case 'small_cabin':
      return 'Small Cabin';
    case 'large_cabin':
      return 'Large Cabin';
    case 'campsite':
      return 'Campsite';
    case 'marina_slip':
      return 'Marina Slip';
    default:
      return unitType;
  }
}

function bookingTypeLabel(bookingType: BookingRequest['bookingType'], unitType: BookingRequest['unitType']): string {
  if (bookingType === 'season_slip') return 'Marina Season Slip';
  if (bookingType === 'marina_daily' || bookingType === 'marina') return 'Marina Daily Slip';
  if (unitType === 'small_cabin') return 'Small Cabin';
  if (unitType === 'large_cabin') return 'Large Cabin';
  if (unitType === 'campsite') return 'Campsite';
  return bookingType;
}

export function AdminWrsCalendarPage({ onNavigate }: AdminWrsCalendarPageProps) {
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(() => !getAdminPassword());
  const [authError, setAuthError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<Date | undefined>(undefined);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  async function loadBookings() {
    setLoading(true);
    setAuthError(null);
    try {
      const resp = await api.admin.getBookings();
      // Sort by startDate so day list feels ordered.
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

  async function handleApprove(id: string) {
    if (!window.confirm("Approve this booking? This will CHARGE the guest's held card now.")) return;
    setActionBusyId(id);
    setAuthError(null);
    try {
      await api.admin.approveBooking(id);
      await loadBookings();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to approve booking');
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleReject(id: string) {
    if (!window.confirm('Reject this booking? The card hold will be released and the guest will NOT be charged.')) return;
    setActionBusyId(id);
    setAuthError(null);
    try {
      await api.admin.rejectBooking(id);
      await loadBookings();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to reject booking');
    } finally {
      setActionBusyId(null);
    }
  }

  useEffect(() => {
    const existing = getAdminPassword();
    if (existing) {
      setIsPasswordDialogOpen(false);
      loadBookings();
    }
    const onFocus = () => { if (getAdminPassword()) loadBookings(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const pendingApproval = useMemo(
    () => bookings.filter(b => b.status === 'pending_approval'),
    [bookings]
  );

  const bookedDayCounts = useMemo(() => {
    // Count CONFIRMED bookings per day (all unit types)
    const counts = new Map<string, number>();
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    for (const b of confirmed) {
      if (!b.startDate || !b.endDate) continue;
      for (let d = b.startDate; d < b.endDate; d = addDaysYMD(d, 1)) {
        counts.set(d, (counts.get(d) || 0) + 1);
      }
    }
    return counts;
  }, [bookings]);

  const bookedDates = useMemo(() => {
    return Array.from(bookedDayCounts.keys()).map(parseYMDToLocalMidnight);
  }, [bookedDayCounts]);

  // Cabin cleaning days = the day AFTER checkout for each confirmed cabin booking.
  const cleaningDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status !== 'confirmed') continue;
      if (b.unitType !== 'small_cabin' && b.unitType !== 'large_cabin') continue;
      if (!b.endDate) continue;
      set.add(addDaysYMD(b.endDate, 1));
    }
    return set;
  }, [bookings]);

  const cleaningDates = useMemo(
    () => Array.from(cleaningDateSet).map(parseYMDToLocalMidnight),
    [cleaningDateSet]
  );

  const bookingsForSelectedDay = useMemo(() => {
    if (!calendarSelectedDay) return [];
    const ymd = formatLocalDateToYMD(calendarSelectedDay);
    return bookings
      .filter(b => b.status === 'confirmed')
      .filter(b => b.startDate <= ymd && ymd < b.endDate)
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bookings, calendarSelectedDay]);

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
                  aria-current="page"
                  className="text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
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

        {pendingApproval.length > 0 && (
          <section className="mb-8">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="font-semibold text-amber-900">Awaiting approval ({pendingApproval.length})</div>
              <div className="text-xs text-amber-800 mt-0.5 mb-3">
                These guests' cards are authorized (held) but not charged. Approve to capture the payment, or reject to release the hold.
              </div>
              <div className="space-y-3">
                {pendingApproval.map(b => (
                  <div key={b.id} className="rounded-xl bg-white border border-amber-100 shadow-sm p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{b.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bookingTypeLabel(b.bookingType, b.unitType)} • {b.assignedUnitLabel || unitTypeLabel(b.unitType)}
                        </div>
                        <div className="text-sm text-muted-foreground">{b.startDate} → {b.endDate}</div>
                        <div className="text-sm text-muted-foreground break-all">{b.email}</div>
                        <div className="text-sm text-muted-foreground">{b.phone || '—'}</div>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(b.id)}
                          disabled={actionBusyId === b.id}
                          className="bg-[var(--forest-green)] text-white hover:opacity-90"
                        >
                          {actionBusyId === b.id ? 'Working…' : 'Approve & charge'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(b.id)}
                          disabled={actionBusyId === b.id}
                          className="border-red-300 text-red-700 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {!calendarSelectedDay ? (
                <div className="text-sm text-muted-foreground">Select a day on the calendar to see everything booked.</div>
              ) : (
                <div>
                  <div className="text-2xl font-semibold">{formatLocalDateToYMD(calendarSelectedDay)}</div>
                  {bookingsForSelectedDay.length === 0 ? (
                    <div className="text-sm text-muted-foreground mt-2">Nothing is booked on this day.</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {bookingsForSelectedDay.map(b => (
                        <div key={b.id} className="rounded-2xl bg-white border border-gray-100 shadow p-4">
                          <div className="font-semibold">{b.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {bookingTypeLabel(b.bookingType, b.unitType)} • {b.assignedUnitLabel || unitTypeLabel(b.unitType)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {b.startDate} → {b.endDate}
                          </div>
                          <div className="text-sm text-muted-foreground break-all">{b.email}</div>
                          <div className="text-sm text-muted-foreground">{b.phone || '—'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold">Bookings Calendar</div>
                  <div className="text-sm text-muted-foreground">Confirmed bookings per day</div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setCalendarSelectedDay(undefined)}>
                  Clear
                </Button>
              </div>

              <Calendar
                mode="single"
                selected={calendarSelectedDay}
                onSelect={setCalendarSelectedDay}
                modifiers={{ booked: bookedDates, cleaning: cleaningDates }}
                modifiersClassNames={{ booked: 'bg-[var(--sand-tan)]/30' }}
                components={{
                  DayContent: (props: any) => {
                    const date: Date = props.date;
                    const ymd = formatLocalDateToYMD(date);
                    const count = bookedDayCounts.get(ymd) || 0;
                    const isCleaning = cleaningDateSet.has(ymd);
                    return (
                      <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isCleaning && (
                          <span
                            title="Cabin cleaning day"
                            style={{ position: 'absolute', top: 1, right: 2, width: 6, height: 6, borderRadius: '9999px', backgroundColor: '#16a34a' }}
                          />
                        )}
                        <span>{date.getDate()}</span>
                        {count > 0 && (
                          <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', fontSize: 9, lineHeight: 1, fontWeight: 700, color: 'var(--river-blue)' }}>
                            {count}
                          </span>
                        )}
                      </div>
                    );
                  },
                }}
              />
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '9999px', backgroundColor: '#16a34a' }} />
                Cabin cleaning day (day after checkout)
              </div>
            </div>
          </div>
        </section>
      </div>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Login</DialogTitle>
            <DialogDescription>Enter the admin password to view the calendar.</DialogDescription>
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

