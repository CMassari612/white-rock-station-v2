import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { api, BookingRequest } from '../../lib/api';
import { Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { format } from 'date-fns';

// Simple format function if date-fns format fails
const formatDate = (date: Date | string) => {
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return new Date(date).toLocaleDateString();
  }
};

interface BookingRequestListProps {
  authToken: string;
  onViewBooking?: (booking: BookingRequest) => void;
}

const UNIT_TYPE_LABELS: Record<BookingRequest['unitType'], string> = {
  small_cabin: 'Small Cabin',
  large_cabin: 'Large Cabin',
  campsite: 'Campsite',
  marina_slip: 'Marina Slip',
};

const BOOKING_TYPE_LABELS: Record<BookingRequest['bookingType'], string> = {
  cabin: 'Cabin',
  campsite: 'Campsite',
  marina: 'Marina',
};

const STATUS_COLORS: Record<BookingRequest['status'], { bg: string; text: string; border?: string; bold?: boolean }> = {
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  confirmed: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-900', border: 'border-emerald-300', bold: true },
  expired: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  payment_conflict: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', bold: true },
  overbooked: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', bold: true },
  refunded: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', bold: true },
};

export function BookingRequestList({ authToken, onViewBooking }: BookingRequestListProps) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [creatingCheckout, setCreatingCheckout] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState({
    status: '',
    bookingType: '',
    unitType: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadBookings();
  }, [filters, authToken]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.getBookingRequests(filters, authToken);
      setBookings(response.bookings);
    } catch (error: any) {
      console.error('Failed to load booking requests:', error);
      if (error.status === 401) {
        setError('Invalid admin password. Please log in again.');
      } else {
        setError(error.message || 'Failed to load booking requests');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingRequest['status']) => {
    setUpdatingStatus({ ...updatingStatus, [bookingId]: true });
    setError(null);

    try {
      const response = await api.admin.updateBookingRequestStatus(bookingId, newStatus, authToken);
      
      // Update the booking in the list
      setBookings(bookings.map(b => 
        b.id === bookingId ? response.booking : b
      ));
    } catch (error: any) {
      console.error('Failed to update booking status:', error);
      if (error.status === 401) {
        setError('Invalid admin password. Please log in again.');
      } else {
        setError(error.message || 'Failed to update booking status');
      }
    } finally {
      setUpdatingStatus({ ...updatingStatus, [bookingId]: false });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Requests</CardTitle>
        <CardDescription>View and manage booking requests from the new booking system</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Booking Type</Label>
              <Select
                value={filters.bookingType}
                onValueChange={(value) => setFilters({ ...filters, bookingType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="cabin">Cabin</SelectItem>
                  <SelectItem value="campsite">Campsite</SelectItem>
                  <SelectItem value="marina">Marina</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Unit Type</Label>
              <Select
                value={filters.unitType}
                onValueChange={(value) => setFilters({ ...filters, unitType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="small_cabin">Small Cabin</SelectItem>
                  <SelectItem value="large_cabin">Large Cabin</SelectItem>
                  <SelectItem value="campsite">Campsite</SelectItem>
                  <SelectItem value="marina_slip">Marina Slip</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Guest</TableHead>
                  <TableHead>Unit Type</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No booking requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{booking.name}</div>
                          <div className="text-sm text-muted-foreground">{booking.email}</div>
                          <div className="text-sm text-muted-foreground">{booking.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{UNIT_TYPE_LABELS[booking.unitType]}</TableCell>
                      <TableCell>{formatDate(booking.startDate)}</TableCell>
                      <TableCell>{formatDate(booking.endDate)}</TableCell>
                      <TableCell>{booking.guests}</TableCell>
                      <TableCell>
                        <Select
                          value={booking.status}
                          onValueChange={(value) => handleStatusChange(booking.id, value as BookingRequest['status'])}
                          disabled={updatingStatus[booking.id]}
                        >
                          <SelectTrigger className={`w-32 ${STATUS_COLORS[booking.status].bg} ${STATUS_COLORS[booking.status].text} ${STATUS_COLORS[booking.status].border} border ${STATUS_COLORS[booking.status].bold ? 'font-bold' : ''}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <span className="text-yellow-800">Pending</span>
                            </SelectItem>
                            <SelectItem value="confirmed">
                              <span className="text-green-800">Confirmed</span>
                            </SelectItem>
                            <SelectItem value="cancelled">
                              <span className="text-red-800">Cancelled</span>
                            </SelectItem>
                            <SelectItem value="paid">
                              <span className="text-emerald-900 font-bold">Paid</span>
                            </SelectItem>
                            <SelectItem value="expired">
                              <span className="text-gray-600">Expired</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {booking.paidAt ? (
                          <div className="text-sm">
                            <div>{formatDate(booking.paidAt)}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(booking.paidAt).toLocaleTimeString()}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {onViewBooking && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onViewBooking(booking)}
                              >
                                View
                              </Button>
                            )}
                            {booking.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={creatingCheckout[booking.id]}
                                onClick={async () => {
                                  setCreatingCheckout({ ...creatingCheckout, [booking.id]: true });
                                  try {
                                    const response = await api.createCheckoutSession(booking.id);
                                    window.location.href = response.url;
                                  } catch (error: any) {
                                    setCreatingCheckout({ ...creatingCheckout, [booking.id]: false });
                                    if (error.status === 501 || error.message?.includes('Stripe not configured')) {
                                      alert('Online payments are not available yet.');
                                    } else {
                                      alert(error.message || 'Failed to create payment session');
                                    }
                                  }
                                }}
                              >
                                {creatingCheckout[booking.id] ? (
                                  <>
                                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  'Pay & Confirm'
                                )}
                              </Button>
                            )}
                          </div>
                          {booking.stripeSessionId && (
                            <a
                              href={`https://dashboard.stripe.com/test/payments/${booking.stripePaymentIntentId || booking.stripeSessionId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View in Stripe
                            </a>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

