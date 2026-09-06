import { useEffect, useMemo, useState } from 'react';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { api, LodgingType, CustomerInfo } from '../lib/api';
import { createBookingAndRedirectToStripe } from '../lib/bookingFlow';

interface BookingFormProps {
  lodgingType?: LodgingType;
  onAvailabilityChecked?: (available: boolean, data: BookingFormData) => void; // Optional for backward compatibility
  loading?: boolean;
}

export interface BookingFormData {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
  guests: number;
  customerInfo: CustomerInfo;
}

/**
 * Format phone number as user types: (XXX) XXX-XXXX
 * Returns formatted string and handles backspace naturally
 */
function formatPhoneNumber(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = digits.slice(0, 10);
  
  // Format based on length
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

/**
 * Extract clean digits-only phone number from formatted string
 */
function getCleanPhoneNumber(formatted: string): string {
  return formatted.replace(/\D/g, '');
}

function formatDateToYMDLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isValidEmail(email: string): boolean {
  // Basic email regex (good enough for UI validation)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type FieldErrors = Partial<{
  checkInOut: string;
  guests: string;
  name: string;
  email: string;
  phone: string;
}>;

export function BookingForm({ lodgingType: initialLodgingType, onAvailabilityChecked, loading }: BookingFormProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());
  const [availabilityDays, setAvailabilityDays] = useState<Array<{ date: string; available: number }>>([]);

  // Single source of truth for all form fields (controlled inputs)
  const [form, setForm] = useState<{
    lodgingType: LodgingType;
    checkIn: string;
    checkOut: string;
    guests: string; // keep as string so empty is representable
    notes: string;
    customerInfo: {
      name: string;
      email: string;
      phoneDigits: string; // digits-only
    };
  }>(() => ({
    lodgingType: initialLodgingType || 'small-cabin',
    checkIn: '',
    checkOut: '',
    guests: '1',
    notes: '',
    customerInfo: {
      name: '',
      email: '',
      phoneDigits: '',
    },
  }));

  const maxGuests = useMemo(() => {
    switch (form.lodgingType) {
      case 'small-cabin':
        return 2;
      case 'large-cabin':
        return 4;
      case 'campsite':
        return 8;
      default:
        return 8;
    }
  }, [form.lodgingType]);

  const phoneDisplay = useMemo(() => formatPhoneNumber(form.customerInfo.phoneDigits), [form.customerInfo.phoneDigits]);

  const availabilityUnitType = useMemo(() => {
    const bookingTypeMap: Record<LodgingType, { unitType: 'small_cabin' | 'large_cabin' | 'campsite' }> = {
      'small-cabin': { unitType: 'small_cabin' },
      'large-cabin': { unitType: 'large_cabin' },
      'campsite': { unitType: 'campsite' },
    };
    return bookingTypeMap[form.lodgingType].unitType;
  }, [form.lodgingType]);

  // Fetch availability for the visible calendar window so fully-booked dates can be disabled.
  useEffect(() => {
    let cancelled = false;

    async function fetchWindowAvailability() {
      try {
        // Window: current visible month + next month (end is exclusive)
        const start = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
        const endExclusive = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 2, 1);

        const resp = await api.getAvailability({
          unitType: availabilityUnitType,
          start: formatDateToYMDLocal(start),
          end: formatDateToYMDLocal(endExclusive),
        });

        if (cancelled) return;
        setAvailabilityDays(resp.days || []);
      } catch (err) {
        // If availability can't be fetched, don't block date selection in the UI.
        if (cancelled) return;
        setAvailabilityDays([]);
      }
    }

    fetchWindowAvailability();
    return () => {
      cancelled = true;
    };
  }, [availabilityUnitType, visibleMonth]);

  const fullyBookedDates = useMemo(() => {
    const set = new Set<string>();
    for (const day of availabilityDays) {
      if (day.available <= 0) set.add(day.date);
    }
    return set;
  }, [availabilityDays]);

  function clearFieldErrorIfValid(nextForm: typeof form, field: keyof FieldErrors) {
    setFieldErrors(prev => {
      if (!prev[field]) return prev;

      const next = { ...prev };
      const message = validateField(nextForm, field);
      if (!message) delete next[field];
      return next;
    });
  }

  function validateField(nextForm: typeof form, field: keyof FieldErrors): string | null {
    switch (field) {
      case 'checkInOut': {
        if (!nextForm.checkIn || !nextForm.checkOut) return 'Please select check-in and check-out dates';
        if (nextForm.checkIn >= nextForm.checkOut) return 'Check-out must be after check-in';
        return null;
      }
      case 'guests': {
        const n = Number(nextForm.guests);
        if (!nextForm.guests || Number.isNaN(n)) return 'Number of guests is required';
        if (!Number.isInteger(n) || n < 1) return 'At least 1 guest required';
        if (n > maxGuests) return `Maximum ${maxGuests} guests for this lodging type`;
        return null;
      }
      case 'name': {
        if (!nextForm.customerInfo.name.trim()) return 'Name is required';
        return null;
      }
      case 'email': {
        const email = nextForm.customerInfo.email.trim();
        if (!email) return 'Email is required';
        if (!isValidEmail(email)) return 'Invalid email address';
        return null;
      }
      case 'phone': {
        const digits = nextForm.customerInfo.phoneDigits;
        if (!digits) return 'Phone number is required';
        if (digits.length !== 10) return 'Phone number must be 10 digits';
        return null;
      }
      default:
        return null;
    }
  }

  function validateAll(nextForm: typeof form): FieldErrors {
    const nextErrors: FieldErrors = {};
    const fields: Array<keyof FieldErrors> = ['checkInOut', 'guests', 'name', 'email', 'phone'];
    for (const f of fields) {
      const msg = validateField(nextForm, f);
      if (msg) nextErrors[f] = msg;
    }
    return nextErrors;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrorMessage(null);

    const nextErrors = validateAll(form);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingTypeMap: Record<LodgingType, { bookingType: 'cabin' | 'campsite', unitType: 'small_cabin' | 'large_cabin' | 'campsite' }> = {
        'small-cabin': { bookingType: 'cabin', unitType: 'small_cabin' },
        'large-cabin': { bookingType: 'cabin', unitType: 'large_cabin' },
        'campsite': { bookingType: 'campsite', unitType: 'campsite' },
      };

      const { bookingType, unitType } = bookingTypeMap[form.lodgingType];
      const guestsNumber = Number(form.guests);

      // Optional client-side availability check (backend will also validate)
      try {
        const availabilityResponse = await api.getAvailability({
          unitType,
          start: form.checkIn,
          end: form.checkOut,
        });
        const hasAvailability = availabilityResponse.days.every(day => day.available > 0);
        if (!hasAvailability) {
          setErrorMessage('Selected dates are not available. Please choose different dates.');
          setIsSubmitting(false);
          return;
        }
      } catch {
        // non-blocking
      }

      await createBookingAndRedirectToStripe({
        name: form.customerInfo.name.trim(),
        email: form.customerInfo.email.trim(),
        phone: form.customerInfo.phoneDigits,
        bookingType,
        unitType,
        startDate: form.checkIn,
        endDate: form.checkOut,
        guests: guestsNumber,
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
    } catch (error: any) {
      console.error('Booking or checkout failed:', error);

      if (error.status === 501 || error.message?.includes('Stripe not configured')) {
        setErrorMessage('Online payments are not available yet. Please contact us to book.');
      } else if (error.status === 409) {
        setErrorMessage('Those dates are no longer available. Please choose different dates.');
      } else if (error.status === 400) {
        setErrorMessage(error.message || 'Please check your information and try again.');
      } else {
        setErrorMessage(error.message || 'Something went wrong. Please try again later.');
      }

      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="lodgingType">Lodging Type</Label>
          <Select
            value={form.lodgingType}
            onValueChange={(value) => {
              const next = { ...form, lodgingType: value as LodgingType };
              setForm(next);
              // Reset calendar view + selection when lodging type changes
              setVisibleMonth(new Date());
              setDateRange({});
              // guests max might change; re-validate guests if previously errored
              clearFieldErrorIfValid(next, 'guests');
            }}
          >
            <SelectTrigger id="lodgingType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small-cabin">Small Cabin</SelectItem>
              <SelectItem value="large-cabin">Large Cabin</SelectItem>
              <SelectItem value="campsite">Campsite</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Dates</Label>
          <div className="mt-2 p-4 border rounded-lg">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                const nextRange = { from: range?.from, to: range?.to };
                setDateRange(nextRange);

                const checkIn = range?.from ? formatDateToYMDLocal(range.from) : '';
                const checkOut = range?.to ? formatDateToYMDLocal(range.to) : '';
                const next = { ...form, checkIn, checkOut };
                setForm(next);

                clearFieldErrorIfValid(next, 'checkInOut');
              }}
              onMonthChange={setVisibleMonth}
              excludeDisabled
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (date < today) return true;

                const ymd = formatDateToYMDLocal(date);
                return fullyBookedDates.has(ymd);
              }}
              numberOfMonths={1}
              className="rounded-md border"
            />
          </div>
          {dateRange.from && dateRange.to && (
            <p className="text-sm text-muted-foreground mt-2">
              Check-in: {dateRange.from.toLocaleDateString()} - Check-out: {dateRange.to.toLocaleDateString()}
            </p>
          )}
          {fieldErrors.checkInOut && (
            <p className="text-sm text-destructive mt-1">{fieldErrors.checkInOut}</p>
          )}
        </div>

        <div>
          <Label htmlFor="guests">Number of Guests</Label>
          <Input
            id="guests"
            type="number"
            min="1"
            max={maxGuests}
            value={form.guests}
            onChange={(e) => {
              const next = { ...form, guests: e.target.value };
              setForm(next);
              clearFieldErrorIfValid(next, 'guests');
            }}
          />
          {fieldErrors.guests && (
            <p className="text-sm text-destructive mt-1">{fieldErrors.guests}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Maximum {maxGuests} guests</p>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium">Contact Information</h4>
          
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.customerInfo.name}
              onChange={(e) => {
                const next = { ...form, customerInfo: { ...form.customerInfo, name: e.target.value } };
                setForm(next);
                clearFieldErrorIfValid(next, 'name');
              }}
            />
            {fieldErrors.name && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.customerInfo.email}
              onChange={(e) => {
                const next = { ...form, customerInfo: { ...form.customerInfo, email: e.target.value } };
                setForm(next);
                clearFieldErrorIfValid(next, 'email');
              }}
            />
            {fieldErrors.email && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneDisplay}
              onChange={(e) => {
                const digits = getCleanPhoneNumber(e.target.value).slice(0, 10);
                const next = { ...form, customerInfo: { ...form.customerInfo, phoneDigits: digits } };
                setForm(next);
                clearFieldErrorIfValid(next, 'phone');
              }}
            />
            {fieldErrors.phone && (
              <p className="text-sm text-destructive mt-1">{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anything we should know?"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Continue to Payment'
        )}
      </Button>
    </form>
  );
}
