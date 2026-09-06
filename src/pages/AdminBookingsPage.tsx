import { useState, useEffect } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { api, BookingRequest } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LogOut, Copy, ExternalLink, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { format } from 'date-fns';

interface AdminBookingsPageProps {
  onNavigate: (page: string) => void;
}

const STATUS_COLORS: Record<BookingRequest['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-emerald-100 text-emerald-900',
  expired: 'bg-gray-100 text-gray-600',
  payment_conflict: 'bg-red-100 text-red-800',
  overbooked: 'bg-orange-100 text-orange-800',
  refunded: 'bg-orange-100 text-orange-800',
};

const formatDate = (date: string) => {
  try {
    return format(new Date(date), 'MMM d, yyyy');
  } catch {
    return new Date(date).toLocaleDateString();
  }
};

const formatDateTime = (date: string) => {
  try {
    return format(new Date(date), 'MMM d, yyyy HH:mm');
  } catch {
    return new Date(date).toLocaleString();
  }
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
};

export function AdminBookingsPage({ onNavigate }: AdminBookingsPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingCheckout, setCreatingCheckout] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadBookings(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadBookings = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.admin.getBookings(token);
      setBookings(response.bookings);
    } catch (error: any) {
      console.error('Failed to load bookings:', error);
      if (error.status === 401) {
        setError('Invalid password. Please log in again.');
        setIsAuthenticated(false);
        setAuthToken(null);
        sessionStorage.removeItem('adminToken');
      } else {
        setError(error.message || 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password: string) => {
    setError(null);
    try {
      // Verify password by trying to fetch bookings
      await api.admin.getBookings(password);
      setAuthToken(password);
      setIsAuthenticated(true);
      sessionStorage.setItem('adminToken', password);
      loadBookings(password);
    } catch (error: any) {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setBookings([]);
    sessionStorage.removeItem('adminToken');
  };

  const handlePayAndConfirm = async (bookingId: string) => {
    setCreatingCheckout({ ...creatingCheckout, [bookingId]: true });
    setError(null);
    try {
      const response = await api.createCheckoutSession(bookingId);
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Failed to get Stripe checkout URL');
      }
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      if (error.status === 501 || error.message?.includes('Stripe not configured')) {
        setError('Online payments are not available yet.');
      } else {
        setError(error.message || 'Failed to initiate payment.');
      }
    } finally {
      setCreatingCheckout({ ...creatingCheckout, [bookingId]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--river-blue)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4 bg-[var(--off-white)]">
        <AdminLogin onLogin={handleLogin} error={error || undefined} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 bg-[var(--off-white)]">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bookings Admin</h1>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onNavigate('admin')}>
              Admin Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Bookings</CardTitle>
            <CardDescription>View and manage all bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--river-blue)]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                      <TableHead>Stripe</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          No bookings found
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
                          <TableCell>{booking.unitType.replace('_', ' ')}</TableCell>
                          <TableCell>{formatDate(booking.startDate)}</TableCell>
                          <TableCell>{formatDate(booking.endDate)}</TableCell>
                          <TableCell>{booking.guests}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[booking.status]}`}>
                              {booking.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {booking.paidAt ? (
                              <div className="text-sm">
                                <div>{formatDateTime(booking.paidAt)}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.stripeSessionId ? (
                              <div className="flex flex-col gap-1">
                                <a
                                  href={`https://dashboard.stripe.com/test/payments/${booking.stripePaymentIntentId || booking.stripeSessionId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View in Stripe
                                </a>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => copyToClipboard(booking.stripeSessionId || '')}
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy Session ID
                                </Button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {booking.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={creatingCheckout[booking.id]}
                                onClick={() => handlePayAndConfirm(booking.id)}
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
      </div>
    </div>
  );
}
