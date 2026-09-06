import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Calendar } from './ui/calendar';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { api } from '../lib/api';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createBookingAndRedirectToStripe } from '../lib/bookingFlow';

export type BookingType = 'cabin' | 'campsite' | 'marina';
export type UnitType = 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';

interface BookingWidgetProps {
  defaultBookingType?: BookingType;
  defaultUnitType?: UnitType;
  onSuccess?: () => void;
  onNavigate?: (page: string) => void;
  compact?: boolean;
}

interface BookingFormData {
  unitType: UnitType;
  startDate: string;
  endDate: string;
  guests: number;
  name: string;
  email: string;
  phone: string; // Optional - can be empty string
  notes?: string;
  slipLengthFt?: number;
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

const UNIT_TYPES: Record<BookingType, { value: UnitType; label: string }[]> = {
  cabin: [
    { value: 'small_cabin', label: 'Small Cabin' },
    { value: 'large_cabin', label: 'Large Cabin' },
  ],
  campsite: [
    { value: 'campsite', label: 'Campsite' },
  ],
  marina: [
    { value: 'marina_slip', label: 'Marina Slip' },
  ],
};

function getBookingTypeFromUnitType(unitType: UnitType): BookingType {
  if (unitType === 'small_cabin' || unitType === 'large_cabin') return 'cabin';
  if (unitType === 'campsite') return 'campsite';
  return 'marina';
}

export function BookingWidget({
  defaultBookingType,
  defaultUnitType,
  onSuccess,
  onNavigate,
  compact = false,
}: BookingWidgetProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [bookingType, setBookingType] = useState<BookingType>(
    defaultBookingType || (defaultUnitType ? getBookingTypeFromUnitType(defaultUnitType) : 'cabin')
  );
  const [unitType, setUnitType] = useState<UnitType>(
    defaultUnitType || (defaultBookingType ? UNIT_TYPES[defaultBookingType][0].value : 'small_cabin')
  );
  const [availabilityData, setAvailabilityData] = useState<Array<{ date: string; available: number }>>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [phoneDisplay, setPhoneDisplay] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
    control,
  } = useForm<BookingFormData>({
    defaultValues: {
      unitType: defaultUnitType || 'small_cabin',
      guests: 1,
      name: '',
      email: '',
      phone: '',
      notes: '',
      slipLengthFt: undefined,
    },
  });

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneDisplay(formatted);
    // Store clean digits-only value in form
    const cleanPhone = getCleanPhoneNumber(formatted);
    setValue('phone', cleanPhone, { shouldValidate: true });
  }, [setValue]);


  // Get date range for availability check (visible month in calendar)
  const getAvailabilityRange = useMemo(() => {
    const today = new Date();
    const start = dateRange.from || today;
    const visibleStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const visibleEnd = new Date(start.getFullYear(), start.getMonth() + 2, 0); // End of next month
    
    return {
      start: visibleStart.toISOString().split('T')[0],
      end: visibleEnd.toISOString().split('T')[0],
    };
  }, [dateRange.from]);

  // Update unitType when bookingType changes programmatically
  useEffect(() => {
    const currentBookingType = getBookingTypeFromUnitType(unitType);
    if (currentBookingType !== bookingType) {
      const firstUnitType = UNIT_TYPES[bookingType][0].value;
      setUnitType(firstUnitType);
      setValue('unitType', firstUnitType);
    }
  }, [bookingType, unitType, setValue]);

  // Fetch availability when unitType or visible month changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!unitType) return;

      setLoadingAvailability(true);
      setAvailabilityError(null);

      try {
        const { start, end } = getAvailabilityRange;
        const response = await api.getAvailability({ unitType, start, end });
        setAvailabilityData(response.days);
      } catch (error: any) {
        console.error('Failed to fetch availability:', error);
        setAvailabilityError('Availability data is currently unavailable');
        setAvailabilityData([]);
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [unitType, getAvailabilityRange.start, getAvailabilityRange.end]);

  // Create disabled dates map from availability data
  const disabledDates = useMemo(() => {
    const disabled = new Set<string>();
    availabilityData.forEach((day) => {
      if (day.available === 0) {
        disabled.add(day.date);
      }
    });
    return disabled;
  }, [availabilityData]);

  // Get date modifiers for calendar (low availability warning)
  const modifiers = useMemo(() => {
    const lowAvailability: Date[] = [];
    availabilityData.forEach((day) => {
      if (day.available > 0 && day.available <= 3) {
        lowAvailability.push(new Date(day.date));
      }
    });
    return { lowAvailability };
  }, [availabilityData]);

  const handleUnitTypeChange = (value: UnitType) => {
    setUnitType(value);
    setValue('unitType', value);
    const newBookingType = getBookingTypeFromUnitType(value);
    setBookingType(newBookingType);
    // Reset date range when unit type changes
    setDateRange({});
  };

  const handleBookingTypeChange = (value: BookingType) => {
    setBookingType(value);
    const firstUnitType = UNIT_TYPES[value][0].value;
    setUnitType(firstUnitType);
    setValue('unitType', firstUnitType);
    setDateRange({});
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!dateRange.from || !dateRange.to) {
      setErrorMessage('Please select check-in and check-out dates');
      return;
    }

    const startDate = dateRange.from.toISOString().split('T')[0];
    const endDate = dateRange.to.toISOString().split('T')[0];

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Clean phone number before submitting (remove formatting)
      const cleanPhone = getCleanPhoneNumber(data.phone || '');
      await createBookingAndRedirectToStripe({
        name: data.name,
        email: data.email,
        phone: cleanPhone || '', // Send empty string if no phone
        bookingType,
        unitType: data.unitType,
        startDate,
        endDate,
        guests: data.guests,
        notes: data.notes || undefined,
        slipLengthFt: unitType === 'marina_slip' ? data.slipLengthFt : undefined,
      });
    } catch (error: any) {
      console.error('Booking request failed:', error);
      
      if (error.status === 409) {
        setErrorMessage('Those dates are no longer available for this unit type. Please choose different dates.');
      } else {
        setErrorMessage(error.message || 'Something went wrong. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={compact ? '' : 'max-w-2xl mx-auto'}>
      <CardHeader>
        <CardTitle>Book Your Stay</CardTitle>
        <CardDescription>Enter your details, then you’ll be taken to secure payment</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Booking Type */}
          <div>
            <Label htmlFor="bookingType">Booking Type</Label>
            <Select value={bookingType} onValueChange={handleBookingTypeChange}>
              <SelectTrigger id="bookingType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cabin">Cabin</SelectItem>
                <SelectItem value="campsite">Campsite</SelectItem>
                <SelectItem value="marina">Marina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Type */}
          <div>
            <Label htmlFor="unitType">Unit Type</Label>
            <Select value={unitType} onValueChange={handleUnitTypeChange}>
              <SelectTrigger id="unitType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_TYPES[bookingType].map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.unitType && (
              <p className="text-sm text-destructive mt-1">{errors.unitType.message}</p>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <Label>Select Dates</Label>
            {availabilityError && (
              <Alert variant="default" className="mt-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{availabilityError}</AlertDescription>
              </Alert>
            )}
            {loadingAvailability && (
              <div className="text-sm text-muted-foreground mb-2">Loading availability...</div>
            )}
            <div className="mt-2 p-4 border rounded-lg flex justify-center">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setDateRange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  // Disable past dates
                  if (date < today) return true;
                  
                  // Disable fully booked dates
                  const dateStr = date.toISOString().split('T')[0];
                  return disabledDates.has(dateStr);
                }}
                modifiers={modifiers}
                modifierClassNames={{
                  lowAvailability: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
                }}
                numberOfMonths={1}
                className="rounded-md border"
              />
              <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                  <span>Limited availability (≤3)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-200 border border-gray-300 rounded"></div>
                  <span>Fully booked</span>
                </div>
              </div>
            </div>
            {dateRange.from && dateRange.to && (
              <p className="text-sm text-muted-foreground mt-2">
                Check-in: {dateRange.from.toLocaleDateString()} - Check-out: {dateRange.to.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Guests */}
          <div>
            <Label htmlFor="guests">Number of Guests</Label>
            <Input
              id="guests"
              type="number"
              min="1"
              max="20"
              {...register('guests', {
                required: 'Number of guests is required',
                min: { value: 1, message: 'At least 1 guest required' },
              })}
            />
            {errors.guests && (
              <p className="text-sm text-destructive mt-1">{errors.guests.message}</p>
            )}
          </div>

          {/* Slip Length (Marina only) */}
          {unitType === 'marina_slip' && (
            <div>
              <Label htmlFor="slipLengthFt">Boat Length (feet) *</Label>
              <Input
                id="slipLengthFt"
                type="number"
                min="1"
                step="0.1"
                placeholder="e.g., 30"
                {...register('slipLengthFt', {
                  required: 'Boat length is required for marina slip bookings',
                  min: { value: 1, message: 'Length must be at least 1 foot' },
                  valueAsNumber: true,
                })}
              />
              {errors.slipLengthFt && (
                <p className="text-sm text-destructive mt-1">{errors.slipLengthFt.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Pricing: $35 per foot per day
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Contact Information</h4>

            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Name is required' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Controller
                name="phone"
                control={control}
                rules={{
                  // Phone is optional - no required validation
                  validate: (value) => {
                    const clean = getCleanPhoneNumber(value || '');
                    // If provided, must be at least 10 digits
                    if (clean && clean.length > 0 && clean.length < 10) {
                      return 'Phone number must be 10 digits';
                    }
                    return true;
                  },
                }}
                render={({ field }) => (
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneDisplay}
                    onChange={handlePhoneChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.phone && (
                <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                rows={3}
                {...register('notes')}
                placeholder="Any special requests or information..."
              />
            </div>
          </div>

          {/* Error Message */}
          {!!errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to payment...
              </>
            ) : (
              'Continue to Payment'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

