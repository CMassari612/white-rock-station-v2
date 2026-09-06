import { useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createBookingAndRedirectToStripe } from '../lib/bookingFlow';

function todayYmdUtc(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface SeasonSlipApplicationFormProps {
  publicEndIso?: string;
}

export function SeasonSlipApplicationForm({ publicEndIso }: SeasonSlipApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    accessCode: '',
    boatLengthFt: '',
    boatMake: '',
    boatRegistration: '',
    insuranceCarrier: '',
    insurancePolicyNumber: '',
    insuranceExpiration: '',
  });

  const isClosed = useMemo(() => {
    if (!publicEndIso) return false;
    const end = new Date(publicEndIso);
    if (isNaN(end.getTime())) return false;
    return new Date() > end;
  }, [publicEndIso]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isClosed) {
      setErrorMessage('Season applications are closed.');
      return;
    }

    // Basic client validation (server validates access code + window)
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setErrorMessage('Name, email, and phone are required.');
      return;
    }
    if (!form.accessCode.trim()) {
      setErrorMessage('Access code is required.');
      return;
    }
    if (!form.boatLengthFt.trim() || Number(form.boatLengthFt) <= 0) {
      setErrorMessage('Boat length (ft) is required.');
      return;
    }
    if (!form.boatMake.trim() || !form.boatRegistration.trim()) {
      setErrorMessage('Boat make and registration are required.');
      return;
    }
    if (!form.insuranceCarrier.trim() || !form.insurancePolicyNumber.trim() || !form.insuranceExpiration.trim()) {
      setErrorMessage('Insurance carrier, policy #, and expiration are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Dates are not used for season slips; backend will store a placeholder.
      await createBookingAndRedirectToStripe({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bookingType: 'season_slip',
        unitType: 'marina_slip',
        guests: 1,
        startDate: todayYmdUtc(),
        endDate: todayYmdUtc(),
        accessCode: form.accessCode.trim(),
        boatLengthFt: Number(form.boatLengthFt),
        boatMake: form.boatMake.trim(),
        boatRegistration: form.boatRegistration.trim(),
        insuranceCarrier: form.insuranceCarrier.trim(),
        insurancePolicyNumber: form.insurancePolicyNumber.trim(),
        insuranceExpiration: form.insuranceExpiration,
      });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit application');
      setIsSubmitting(false);
    }
  };

  if (isClosed) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow p-6">
        <h3 className="mb-2">Season Slip Applications</h3>
        <p className="text-muted-foreground">Season applications are closed.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow p-6">
      <h3 className="mb-2">Season Slip Application</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Season lease slips are first-come, first-served. Flat fee. Mooring application required.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Full Name</Label>
            <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Boat Length (ft)</Label>
            <Input value={form.boatLengthFt} onChange={(e) => setForm(prev => ({ ...prev, boatLengthFt: e.target.value }))} />
          </div>
          <div>
            <Label>Boat Make</Label>
            <Input value={form.boatMake} onChange={(e) => setForm(prev => ({ ...prev, boatMake: e.target.value }))} />
          </div>
          <div>
            <Label>Registration</Label>
            <Input value={form.boatRegistration} onChange={(e) => setForm(prev => ({ ...prev, boatRegistration: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Insurance Carrier</Label>
            <Input value={form.insuranceCarrier} onChange={(e) => setForm(prev => ({ ...prev, insuranceCarrier: e.target.value }))} />
          </div>
          <div>
            <Label>Policy #</Label>
            <Input value={form.insurancePolicyNumber} onChange={(e) => setForm(prev => ({ ...prev, insurancePolicyNumber: e.target.value }))} />
          </div>
          <div>
            <Label>Expiration</Label>
            <Input type="date" value={form.insuranceExpiration} onChange={(e) => setForm(prev => ({ ...prev, insuranceExpiration: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Access Code (2-week window)</Label>
            <Input value={form.accessCode} onChange={(e) => setForm(prev => ({ ...prev, accessCode: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting to payment…
                </>
              ) : (
                'Continue to Payment ($850)'
              )}
            </Button>
          </div>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  );
}

