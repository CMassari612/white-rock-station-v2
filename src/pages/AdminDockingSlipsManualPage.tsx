import { useEffect, useState } from 'react';
import { api } from '../lib/api';
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
import { Copy, RefreshCcw, LogOut } from 'lucide-react';

interface AdminDockingSlipsManualPageProps {
  onNavigate: (page: string) => void;
}

type SlipKind = 'year' | 'days';

export function AdminDockingSlipsManualPage({ onNavigate }: AdminDockingSlipsManualPageProps) {
  const [password, setPassword] = useState('');
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(() => !getAdminPassword());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<{
    slipKind: SlipKind;
    startDate: string;
    endDate: string;
    name: string;
    email: string;
    phone: string;
    slipLengthFt: string;
    boatLengthFt: string;
  }>({
    slipKind: 'days',
    startDate: '',
    endDate: '',
    name: '',
    email: '',
    phone: '',
    slipLengthFt: '',
    boatLengthFt: '',
  });

  const [result, setResult] = useState<{ bookingId: string } | null>(null);
  const [selectedSlipNumber, setSelectedSlipNumber] = useState<number | null>(null);

  useEffect(() => {
    // If password already exists for session, don't force the login dialog.
    const existing = getAdminPassword();
    if (existing) setIsPasswordDialogOpen(false);

    const slipRaw = sessionStorage.getItem('adminDockSlipNumber');
    const slip = slipRaw ? Number(slipRaw) : null;
    if (slip && Number.isFinite(slip) && slip >= 1 && slip <= 20) {
      setSelectedSlipNumber(slip);
      // Default to Year for slips 1-15, Day(s) for slips 16-20 (matches your pool split).
      setForm(prev => ({ ...prev, slipKind: slip <= 15 ? 'year' : 'days' }));
    }
  }, []);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // no-op
    }
  }

  const submitPassword = () => {
    setError(null);
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Password is required');
      return;
    }
    setAdminPassword(trimmed);
    setIsPasswordDialogOpen(false);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Guest name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!form.startDate) return 'Start date is required';
    if (!form.endDate) return 'End date is required';
    if (form.startDate >= form.endDate) return 'End date must be after start date';
    if (form.slipKind === 'days') {
      const ft = Number(form.slipLengthFt);
      if (!Number.isFinite(ft) || ft <= 0) return 'Boat length (ft) is required for Day(s) Slip';
    }
    if (form.slipKind === 'year' && form.boatLengthFt.trim()) {
      const ft = Number(form.boatLengthFt);
      if (!Number.isFinite(ft) || ft <= 0) return 'Boat length (ft) must be a positive number';
    }
    return null;
  };

  const submit = async () => {
    setError(null);
    setResult(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const bookingType = form.slipKind === 'year' ? 'season_slip' : 'marina_daily';

      const created = await api.admin.createManualBooking({
        paymentMethod: 'cash',
        bookingType,
        unitType: 'marina_slip',
        startDate: form.startDate,
        endDate: form.endDate,
        guests: 1,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        slipLengthFt: form.slipKind === 'days' ? Number(form.slipLengthFt) : undefined,
        boatLengthFt: form.slipKind === 'year' && form.boatLengthFt.trim() ? Number(form.boatLengthFt) : undefined,
      });

      const bookingId = created.booking.id;

      setResult({ bookingId });
    } catch (err: any) {
      if (err?.status === 401) {
        setError('Invalid password');
        clearAdminPassword();
        setIsPasswordDialogOpen(true);
      } else {
        setError(err?.message || 'Failed to create slip booking');
      }
    } finally {
      setLoading(false);
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
                  onClick={() => onNavigate('admin-calendar')}
                  className="text-white/80 hover:text-white transition-colors underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--forest-green)]"
                >
                  White Rock Station Calendar
                </button>
                <span className="text-white/80">Manual Booking</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setError(null);
                  setResult(null);
                }}
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
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">{error}</div>
        )}

        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold">Manual Boat Slip Booking</h2>
            {selectedSlipNumber ? (
              <div className="text-sm text-muted-foreground">{`Slip ${selectedSlipNumber}`}</div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white border border-gray-100 shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Boat Slip</div>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm"
                  value={form.slipKind}
                  onChange={(e) => setForm(prev => ({ ...prev, slipKind: e.target.value as SlipKind }))}
                >
                  <option value="year">Year Slip</option>
                  <option value="days">Day(s) Slip</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Guest Name</div>
                <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Email</div>
                <Input value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Phone</div>
                <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                <Input type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                <Input type="date" value={form.endDate} onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))} />
              </div>

              {form.slipKind === 'days' ? (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                  <Input value={form.slipLengthFt} onChange={(e) => setForm(prev => ({ ...prev, slipLengthFt: e.target.value }))} />
                </div>
              ) : (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Boat Length (ft)</div>
                  <Input value={form.boatLengthFt} onChange={(e) => setForm(prev => ({ ...prev, boatLengthFt: e.target.value }))} />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button type="button" onClick={submit} disabled={loading}>
                Create Booking
              </Button>

              {result?.bookingId && (
                <Button variant="outline" type="button" onClick={() => copyToClipboard(result.bookingId)}>
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
            <DialogDescription>Enter the admin password to create slip bookings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitPassword();
              }}
              autoFocus
            />
            {error && <div className="text-sm text-red-700">{error}</div>}
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
            <Button onClick={submitPassword} disabled={loading}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

