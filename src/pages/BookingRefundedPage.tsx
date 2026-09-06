import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

interface BookingRefundedPageProps {
  onNavigate: (page: string) => void;
}

export function BookingRefundedPage({ onNavigate }: BookingRefundedPageProps) {
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBookingId(params.get('bookingId'));
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-[var(--off-white)]">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Payment Refunded</CardTitle>
            <CardDescription className="text-center">
              We’re sorry — those dates were booked by another guest at the same time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-sm text-muted-foreground space-y-3">
              <p>
                Your payment was automatically refunded. Please allow up to <strong>5 business days</strong> for the
                refund to appear on your statement.
              </p>
              <p>We apologize for the inconvenience.</p>
              {bookingId && (
                <p className="text-xs text-muted-foreground">
                  Booking ID: <span className="font-mono">{bookingId}</span>
                </p>
              )}
            </div>

            <div className="flex justify-center pt-2">
              <Button onClick={() => onNavigate('booking')}>Pick new dates</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

