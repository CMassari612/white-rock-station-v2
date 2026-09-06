import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { api, Booking, LodgingType } from '../../lib/api';
import { X } from 'lucide-react';

// Simple format function
const formatDate = (date: Date | string, formatStr: string = 'MMMM d, yyyy') => {
  try {
    const d = new Date(date);
    if (formatStr === 'MMMM d, yyyy') {
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return d.toLocaleDateString();
  } catch {
    return new Date(date).toLocaleDateString();
  }
};

interface BookingDetailsProps {
  booking: Booking;
  authToken: string;
  onClose: () => void;
  onUpdate: () => void;
}

const LODGING_LABELS: Record<LodgingType, string> = {
  'small-cabin': 'Small Cabin',
  'large-cabin': 'Large Cabin',
  'campsite': 'Campsite',
};

export function BookingDetails({ booking, authToken, onClose, onUpdate }: BookingDetailsProps) {
  const handleStatusUpdate = async (status: string) => {
    try {
      await api.admin.updateBookingStatus(booking.id, status, authToken);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to update booking status');
    }
  };

  const nights = Math.ceil(
    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Booking Details</CardTitle>
            <CardDescription>Booking ID: {booking.id}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Status</h4>
          <span
            className={`px-3 py-1 rounded text-sm ${
              booking.status === 'confirmed'
                ? 'bg-green-100 text-green-800'
                : booking.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {booking.status}
          </span>
        </div>

        <div>
          <h4 className="font-medium mb-2">Lodging</h4>
          <p className="text-muted-foreground">{LODGING_LABELS[booking.lodgingType]}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Dates</h4>
          <p className="text-muted-foreground">
            Check-in: {formatDate(booking.checkIn)}
          </p>
          <p className="text-muted-foreground">
            Check-out: {formatDate(booking.checkOut)}
          </p>
          <p className="text-muted-foreground">{nights} {nights === 1 ? 'night' : 'nights'}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Guests</h4>
          <p className="text-muted-foreground">{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Customer Information</h4>
          <p className="text-muted-foreground">Name: {booking.customerInfo.name}</p>
          <p className="text-muted-foreground">Email: {booking.customerInfo.email}</p>
          <p className="text-muted-foreground">Phone: {booking.customerInfo.phone}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Payment</h4>
          <p className="text-muted-foreground">Total: ${booking.totalAmount.toFixed(2)}</p>
          <p className="text-muted-foreground text-xs">Payment Intent: {booking.paymentIntentId}</p>
        </div>

        <div>
          <h4 className="font-medium mb-2">Created</h4>
          <p className="text-muted-foreground">
            {new Date(booking.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          {booking.status !== 'cancelled' && (
            <Button
              variant="destructive"
              onClick={() => handleStatusUpdate('cancelled')}
            >
              Cancel Booking
            </Button>
          )}
          {booking.status === 'pending' && (
            <Button onClick={() => handleStatusUpdate('confirmed')}>
              Confirm Booking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

