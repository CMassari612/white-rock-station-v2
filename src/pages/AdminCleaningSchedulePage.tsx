import { useEffect, useMemo, useState } from 'react';
import { api, BookingRequest } from '../lib/api';
import { getAdminPassword, clearAdminPassword } from '../lib/adminSession';
import { Button } from '../components/ui/button';
import { RefreshCcw, LogOut } from 'lucide-react';

interface AdminCleaningSchedulePageProps {
  onNavigate: (page: string) => void;
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

function todayYMD(): string {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function prettyDate(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(n => Number(n));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function isCabin(b: BookingRequest): boolean {
  return b.unitType === 'small_cabin' || b.unitType === 'large_cabin';
}

function cabinLabel(b: BookingRequest): string {
  if (b.assignedUnitLabel) return b.assignedUnitLabel;
  return b.unitType === 'small_cabin' ? 'Small Cabin' : 'Large Cabin';
}

export function AdminCleaningSchedulePage({ onNavigate }: AdminCleaningSchedulePageProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  async function loadBookings() {
    setLoading(true);
    setAuthError(null);
    try {
      const resp = await api.admin.getBookings();
      setBookings(resp.bookings);
    } catch (err: any) {
      if (err?.status === 401) {
        clearAdminPassword();
        onNavigate('admin-login');
      } else {
        setAuthError(err?.message || 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
    const onFocus = () => { if (getAdminPassword()) loadBookings(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // One cleaning row per confirmed cabin booking. Cleaning day = day AFTER checkout.
  const rows = useMemo(() => {
    const today = todayYMD();
    return bookings
      .filter(b => b.status === 'confirmed' && isCabin(b))
      .map(b => ({
        id: b.id,
        cabin: cabinLabel(b),
        guest: b.name,
        phone: b.phone || '—',
        checkout: b.endDate,
        cleaning: addDaysYMD(b.endDate, 1),
      }))
      .filter(r => (showPast ? true : r.cleaning >= today))
      .sort((a, b) => a.cleaning.localeCompare(b.cleaning) || a.cabin.localeCompare(b.cabin));
  }, [bookings, showPast]);

  const navBtn = (label: string, page: string, current = false) => (
    <button
      type="button"
      onClick={() => (current ? undefined : onNavigate(page))}
      aria-current={current ? 'page' : undefined}
      className={
        current
          ? 'text-white underline underline-offset-4'
          : 'text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline'
      }
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--off-white)]">
      <header className="sticky top-0 z-50 bg-[var(--forest-green)] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <div className="mt-1 flex flex-wrap items-center gap-4">
                {navBtn('Cabin Bookings', 'admin')}
                {navBtn('Docking Slips', 'admin-docking-slips')}
                {navBtn('Campsites', 'admin-campsites')}
                {navBtn('Cleaning Schedule', 'admin-cleaning', true)}
                {navBtn('White Rock Station Calendar', 'admin-calendar')}
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

        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Cleaning Schedule</h2>
            <p className="text-sm text-muted-foreground">
              Each cabin needs cleaning the day after checkout. {rows.length} cleaning{rows.length === 1 ? '' : 's'} {showPast ? 'total' : 'upcoming'}.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowPast(v => !v)}>
            {showPast ? 'Hide past' : 'Show past'}
          </Button>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No cleanings {showPast ? 'on record' : 'scheduled'}.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100 bg-[var(--off-white)]">
                  <th className="px-4 py-3 font-semibold">Cleaning Day</th>
                  <th className="px-4 py-3 font-semibold">Cabin</th>
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Checkout</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--river-blue)' }}>{prettyDate(r.cleaning)}</td>
                    <td className="px-4 py-3">{r.cabin}</td>
                    <td className="px-4 py-3">{r.guest}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground">{prettyDate(r.checkout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
