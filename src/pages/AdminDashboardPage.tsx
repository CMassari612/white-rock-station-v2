import { useEffect, useMemo, useState } from 'react';
import { api, BookingRequest } from '../lib/api';
import { setAdminPassword, clearAdminPassword, getAdminPassword } from '../lib/adminSession';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Copy, ExternalLink, RefreshCcw, ChevronDown, LogOut } from 'lucide-react';

interface AdminDashboardPageProps {
  onNavigate: (page: string) => void;
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

function parseYMDToLocalMidnight(ymd: string): Date {
  // ymd is expected to be YYYY-MM-DD
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

function formatDateRange(startYmd: string, endYmd: string): string {
  return `${startYmd} → ${endYmd}`;
}

function isActiveToday(booking: BookingRequest, today: Date): boolean {
  const start = parseYMDToLocalMidnight(booking.startDate);
  const end = parseYMDToLocalMidnight(booking.endDate); // end exclusive
  return today >= start && today < end;
}

function isUpcoming(booking: BookingRequest, today: Date): boolean {
  const start = parseYMDToLocalMidnight(booking.startDate);
  return start > today;
}

function isPast(booking: BookingRequest, today: Date): boolean {
  const end = parseYMDToLocalMidnight(booking.endDate); // end exclusive
  return end <= today;
}

function statusPillClasses(status: BookingRequest['status']) {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'pending_approval':
      return 'bg-amber-100 text-amber-900';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'expired':
      return 'bg-gray-100 text-gray-700';
    case 'overbooked':
    case 'refund_needed':
    case 'refunded':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback: no-op
  }
}

/**
 * Greedy interval coloring to assign cabin numbers (e.g. Small Cabin #1) deterministically.
 * This is UI-only and does not mutate backend state.
 */
function assignCabinNumbers(bookings: BookingRequest[], unitType: 'small_cabin' | 'large_cabin') {
  const items = bookings
    .filter(b => b.unitType === unitType)
    .slice()
    .sort((a, b) => (a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id)));

  type Slot = { end: string; bookingId: string; n: number };
  const activeSlots: Slot[] = [];
  const assignment = new Map<string, number>();

  for (const b of items) {
    // Remove ended slots (end is exclusive)
    for (let i = activeSlots.length - 1; i >= 0; i--) {
      if (activeSlots[i].end <= b.startDate) activeSlots.splice(i, 1);
    }

    const used = new Set(activeSlots.map(s => s.n));
    let n = 1;
    while (used.has(n)) n++;

    assignment.set(b.id, n);
    activeSlots.push({ end: b.endDate, bookingId: b.id, n });
  }

  return assignment;
}

export function AdminDashboardPage({ onNavigate }: AdminDashboardPageProps) {
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(() => !getAdminPassword());
  const [authError, setAuthError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState<{
    bookingType: BookingRequest['bookingType'];
    unitType: BookingRequest['unitType'];
    startDate: string;
    endDate: string;
    guests: string;
    name: string;
    email: string;
    phone: string;
    slipLengthFt: string;
    boatLengthFt: string;
    boatMake: string;
    boatRegistration: string;
    insuranceCarrier: string;
    insurancePolicyNumber: string;
    insuranceExpiration: string;
  }>({
    bookingType: 'cabin',
    unitType: 'small_cabin',
    startDate: '',
    endDate: '',
    guests: '1',
    name: '',
    email: '',
    phone: '',
    slipLengthFt: '',
    boatLengthFt: '',
    boatMake: '',
    boatRegistration: '',
    insuranceCarrier: '',
    insurancePolicyNumber: '',
    insuranceExpiration: '',
  });
  const [manualResult, setManualResult] = useState<{ bookingId: string } | null>(null);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<Date | undefined>(undefined);
  const [showExpired, setShowExpired] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

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
      // Requirement: sort by startDate ascending
      const sorted = resp.bookings.slice().sort((a, b) => a.startDate.localeCompare(b.startDate));
      setBookings(sorted);
      setIsPasswordDialogOpen(false);
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
    // Load immediately on mount. On success the gate closes; a 401 re-opens it.
    loadBookings();
    // Auto-refresh whenever the admin returns to this tab (e.g. after a new booking).
    const onFocus = () => loadBookings();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => {
    const active = bookings.filter(b => isActiveToday(b, today));
    const upcoming = bookings.filter(b => isUpcoming(b, today));

    // Anything else, plus explicitly “closed” statuses, goes into Past/Expired/Cancelled/Overbooked.
    const closedStatuses: BookingRequest['status'][] = ['cancelled', 'expired', 'overbooked', 'refunded', 'payment_conflict', 'paid'];
    const past = bookings.filter(b => isPast(b, today) || closedStatuses.includes(b.status));

    // De-dupe: remove active/upcoming from past
    const activeIds = new Set(active.map(b => b.id));
    const upcomingIds = new Set(upcoming.map(b => b.id));
    const pastDeduped = past.filter(b => !activeIds.has(b.id) && !upcomingIds.has(b.id));

    return { active, upcoming, past: pastDeduped };
  }, [bookings, today]);

  // Statuses considered "closed" — hidden by default, revealed by the expired toggle.
  const closedStatusList: BookingRequest['status'][] = ['cancelled', 'expired', 'overbooked', 'refunded', 'payment_conflict', 'paid'];
  // This page is for CABINS only — campsite/marina live on their own pages,
  // and the all-bookings-per-day view lives on the White Rock Station Calendar.
  const isCabinBooking = (b: BookingRequest) => b.unitType === 'small_cabin' || b.unitType === 'large_cabin';
  const expiredCount = useMemo(
    () => bookings.filter(b => isCabinBooking(b) && closedStatusList.includes(b.status)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bookings]
  );
  // Default view: pending (+ awaiting approval) + confirmed cabins. Toggle adds expired/closed cabins.
  const visibleBookings = useMemo(() => {
    const open = bookings.filter(b => isCabinBooking(b) && (b.status === 'pending' || b.status === 'pending_approval' || b.status === 'confirmed'));
    if (!showExpired) return open;
    const closed = bookings.filter(b => isCabinBooking(b) && closedStatusList.includes(b.status));
    return [...open, ...closed];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings, showExpired]);

  const bookedDayCounts = useMemo(() => {
    // Count CONFIRMED bookings per day for the calendar.
    // Overlap rule: startDate <= day < endDate (end exclusive).
    const counts = new Map<string, number>();
    const confirmed = bookings.filter(b => b.status === 'confirmed' && isCabinBooking(b));

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

  // Cabin cleaning days = day AFTER checkout for each confirmed cabin booking.
  const cleaningDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status !== 'confirmed' || !isCabinBooking(b) || !b.endDate) continue;
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
      .filter(b => b.status === 'confirmed' && isCabinBooking(b))
      .filter(b => b.startDate <= ymd && ymd < b.endDate)
      .slice()
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bookings, calendarSelectedDay]);

  const cleaningSchedule = useMemo(() => {
    const cabinConfirmed = bookings.filter(
      b =>
        b.status === 'confirmed' &&
        (b.unitType === 'small_cabin' || b.unitType === 'large_cabin')
    );

    const items = cabinConfirmed
      .map(b => ({
        bookingId: b.id,
        guestName: b.name,
        unitLabel: b.assignedUnitLabel || unitTypeLabel(b.unitType),
        cleaningDate: b.endDate, // day after the last night in our [start, end) model
      }))
      .filter(i => parseYMDToLocalMidnight(i.cleaningDate) >= today)
      .sort((a, b) => a.cleaningDate.localeCompare(b.cleaningDate) || a.unitLabel.localeCompare(b.unitLabel));

    return items;
  }, [bookings, today]);

  const smallCabinNums = useMemo(() => assignCabinNumbers([...grouped.active, ...grouped.upcoming], 'small_cabin'), [grouped.active, grouped.upcoming]);
  const largeCabinNums = useMemo(() => assignCabinNumbers([...grouped.active, ...grouped.upcoming], 'large_cabin'), [grouped.active, grouped.upcoming]);

  function renderCard(b: BookingRequest) {
    const label = unitTypeLabel(b.unitType);
    const fallbackCabinNumber =
      b.unitType === 'small_cabin'
        ? smallCabinNums.get(b.id)
        : b.unitType === 'large_cabin'
          ? largeCabinNums.get(b.id)
          : null;

    const assignedUnit =
      b.assignedUnitLabel
        ? b.assignedUnitLabel
        : fallbackCabinNumber && (b.unitType === 'small_cabin' || b.unitType === 'large_cabin')
          ? `${label} #${fallbackCabinNumber}`
          : label;

    const stripeSessionId = b.stripeSessionId;
    const stripeSessionUrl = stripeSessionId
      ? `https://dashboard.stripe.com/test/checkout/sessions/${stripeSessionId}`
      : null;

    return (
      <div key={b.id} className="rounded-2xl shadow bg-white p-4 border border-gray-100">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold truncate">{assignedUnit}</div>
            <div className="text-xs text-muted-foreground">{bookingTypeLabel(b.bookingType, b.unitType)}</div>
            <div className="text-sm text-muted-foreground">{formatDateRange(b.startDate, b.endDate)}</div>
            <div className="text-sm text-muted-foreground">Check-in after 10:00 AM</div>
          </div>
          <div className={`shrink-0 px-2 py-1 rounded-full text-xs ${statusPillClasses(b.status)}`}>
            {b.status}
          </div>
        </div>

        <div className="mt-3 text-sm">
          <div className="font-medium">{b.name}</div>
          <div className="text-muted-foreground">{b.phone || '—'}</div>
          <div className="text-muted-foreground break-all">{b.email}</div>
        </div>

        <div className="mt-3 flex flex-col gap-2 text-sm">
          {(b.unitType === 'small_cabin' || b.unitType === 'large_cabin') && b.status === 'confirmed' && (
            <div>
              <span className="text-muted-foreground">Cleaning day:</span> {b.endDate} (day after the last night)
            </div>
          )}
          {b.status === 'confirmed' && b.paidAt && (
            <div>
              <span className="text-muted-foreground">Paid at:</span> {new Date(b.paidAt).toLocaleString()}
            </div>
          )}

          {stripeSessionUrl && (
            <a
              href={stripeSessionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Stripe Session
            </a>
          )}
        </div>

        {b.status === 'pending_approval' && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="text-sm font-medium text-amber-900">Awaiting your approval</div>
            <div className="text-xs text-amber-800 mt-0.5">
              The guest's card is authorized (held) but not yet charged. Approve to capture the payment, or reject to release the hold.
            </div>
            <div className="mt-3 flex items-center gap-2">
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
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(b.id)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy booking ID
          </Button>
        </div>
      </div>
    );
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

  const submitManualBooking = async () => {
    setAuthError(null);
    setManualResult(null);
    try {
      const payload: any = {
        paymentMethod: 'cash',
        bookingType: manual.bookingType,
        unitType: manual.unitType,
        name: manual.name,
        email: manual.email,
        phone: manual.phone,
        notes: undefined,
      };

      if (manual.bookingType === 'season_slip') {
        payload.unitType = 'marina_slip';
        payload.boatLengthFt = manual.boatLengthFt ? Number(manual.boatLengthFt) : undefined;
        payload.boatMake = manual.boatMake || undefined;
        payload.boatRegistration = manual.boatRegistration || undefined;
        payload.insuranceCarrier = manual.insuranceCarrier || undefined;
        payload.insurancePolicyNumber = manual.insurancePolicyNumber || undefined;
        payload.insuranceExpiration = manual.insuranceExpiration || undefined;
      } else {
        payload.startDate = manual.startDate;
        payload.endDate = manual.endDate;
        payload.guests = Number(manual.guests);
      }

      if (manual.unitType === 'marina_slip' && (manual.bookingType === 'marina_daily' || manual.bookingType === 'marina')) {
        payload.slipLengthFt = manual.slipLengthFt ? Number(manual.slipLengthFt) : undefined;
      }

      const resp = await api.admin.createManualBooking(payload);
      const bookingId = resp.booking.id;

      setManualResult({ bookingId });

      await loadBookings();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to create booking');
    }
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
                  aria-current="page"
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
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {authError}
          </div>
        )}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold">Cabin Bookings</h2>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowExpired(v => !v)}
                className="text-sm underline text-muted-foreground hover:text-foreground"
              >
                {showExpired ? 'Hide expired' : `Show expired${expiredCount ? ` (${expiredCount})` : ''}`}
              </button>
              <div className="text-sm text-muted-foreground">{visibleBookings.length} bookings</div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {visibleBookings.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending or confirmed bookings.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {visibleBookings.map(renderCard)}
                </div>
              )}

              {calendarSelectedDay && (
                <div className="mt-6">
                  <div className="text-sm font-medium">{formatLocalDateToYMD(calendarSelectedDay)}</div>
                  {bookingsForSelectedDay.length === 0 ? (
                    <div className="text-sm text-muted-foreground mt-1">No confirmed bookings on this day.</div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {bookingsForSelectedDay.map(b => (
                        <div key={b.id} className="rounded-xl border p-3 bg-[var(--off-white)]">
                          <div className="font-medium">{b.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {bookingTypeLabel(b.bookingType, b.unitType)} • {b.assignedUnitLabel || unitTypeLabel(b.unitType)}
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDateRange(b.startDate, b.endDate)}</div>
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

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Manual Booking</h2>
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Booking Type</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={manual.bookingType}
                  onChange={(e) => {
                    const bookingType = e.target.value as BookingRequest['bookingType'];
                    setManual(prev => ({ ...prev, bookingType, unitType: 'small_cabin' }));
                  }}
                >
                  <option value="cabin">Cabin</option>
                </select>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Unit Type</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={manual.unitType}
                  onChange={(e) => setManual(prev => ({ ...prev, unitType: e.target.value as any }))}
                >
                  <option value="small_cabin">Small Cabin</option>
                  <option value="large_cabin">Large Cabin</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Guest Name</div>
                <Input value={manual.name} onChange={(e) => setManual(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <Input value={manual.email} onChange={(e) => setManual(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Phone</div>
                <Input value={manual.phone} onChange={(e) => setManual(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>

            {manual.bookingType !== 'season_slip' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                  <Input type="date" value={manual.startDate} onChange={(e) => setManual(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">End Date</div>
                  <Input type="date" value={manual.endDate} onChange={(e) => setManual(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Guests</div>
                  <Input value={manual.guests} onChange={(e) => setManual(prev => ({ ...prev, guests: e.target.value }))} />
                </div>
                {(manual.unitType === 'marina_slip' && (manual.bookingType === 'marina_daily' || manual.bookingType === 'marina')) && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                    <Input value={manual.slipLengthFt} onChange={(e) => setManual(prev => ({ ...prev, slipLengthFt: e.target.value }))} />
                  </div>
                )}
              </div>
            )}

            {manual.bookingType === 'season_slip' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                  <Input value={manual.boatLengthFt} onChange={(e) => setManual(prev => ({ ...prev, boatLengthFt: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Make</div>
                  <Input value={manual.boatMake} onChange={(e) => setManual(prev => ({ ...prev, boatMake: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Registration</div>
                  <Input value={manual.boatRegistration} onChange={(e) => setManual(prev => ({ ...prev, boatRegistration: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Insurance Carrier</div>
                  <Input value={manual.insuranceCarrier} onChange={(e) => setManual(prev => ({ ...prev, insuranceCarrier: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Policy #</div>
                  <Input value={manual.insurancePolicyNumber} onChange={(e) => setManual(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Insurance Expiration</div>
                  <Input type="date" value={manual.insuranceExpiration} onChange={(e) => setManual(prev => ({ ...prev, insuranceExpiration: e.target.value }))} />
                </div>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <Button type="button" onClick={submitManualBooking} disabled={loading}>
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
            <DialogDescription>Enter the admin password to view bookings.</DialogDescription>
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

