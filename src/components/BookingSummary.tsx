import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BookingFormData } from './BookingForm';
import { LodgingType } from '../lib/api';

interface BookingSummaryProps {
  bookingData: BookingFormData;
  totalAmount: number;
  nights: number;
  onProceed: () => void;
  onBack: () => void;
}

const PRICING: Record<LodgingType, number> = {
  'small-cabin': 125,
  'large-cabin': 250,
  'campsite': 45,
};

const LODGING_LABELS: Record<LodgingType, string> = {
  'small-cabin': 'Small Cabin',
  'large-cabin': 'Large Cabin',
  'campsite': 'Campsite',
};

export function BookingSummary({ bookingData, totalAmount, nights, onProceed, onBack }: BookingSummaryProps) {
  const pricePerNight = PRICING[bookingData.lodgingType];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Summary</CardTitle>
        <CardDescription>Review your booking details before proceeding to payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Lodging</h4>
            <p className="text-sm text-muted-foreground">{LODGING_LABELS[bookingData.lodgingType]}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Dates</h4>
            <p className="text-sm text-muted-foreground">
              Check-in: {new Date(bookingData.checkIn).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">
              Check-out: {new Date(bookingData.checkOut).toLocaleDateString()}
            </p>
            <p className="text-sm text-muted-foreground">{nights} {nights === 1 ? 'night' : 'nights'}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Guests</h4>
            <p className="text-sm text-muted-foreground">{bookingData.guests} {bookingData.guests === 1 ? 'guest' : 'guests'}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Contact Information</h4>
            <p className="text-sm text-muted-foreground">{bookingData.customerInfo.name}</p>
            <p className="text-sm text-muted-foreground">{bookingData.customerInfo.email}</p>
            <p className="text-sm text-muted-foreground">{bookingData.customerInfo.phone}</p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>${pricePerNight.toFixed(2)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
              <span>${(pricePerNight * nights).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium text-lg pt-2 border-t">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onProceed} className="flex-1">
            Proceed to Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

