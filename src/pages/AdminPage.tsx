import { useState, useEffect } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { StatsDashboard } from '../components/admin/StatsDashboard';
import { BookingList } from '../components/admin/BookingList';
import { BookingRequestList } from '../components/admin/BookingRequestList';
import { BookingDetails } from '../components/admin/BookingDetails';
import { api, Booking } from '../lib/api';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface AdminPageProps {
  onNavigate: (page: string) => void;
}

export function AdminPage({ onNavigate }: AdminPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadStats(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStats = async (token: string) => {
    try {
      const response = await api.admin.getStats(token);
      setStats(response.stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (password: string) => {
    setError(null);
    // Simple auth - in production, this would verify via backend
    // For Phase 1, we store the password as token (not secure, but simple)
    try {
      // Verify password with backend
      const response = await api.admin.getStats(password);
      setAuthToken(password);
      setIsAuthenticated(true);
      setStats(response.stats);
      sessionStorage.setItem('adminToken', password);
    } catch (error: any) {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    setStats(null);
    setSelectedBooking(null);
    sessionStorage.removeItem('adminToken');
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
  };

  const handleBookingUpdate = () => {
    if (authToken) {
      loadStats(authToken);
      // Refresh booking list would be handled by BookingList component
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-16 px-4 flex items-center justify-center">
        <p>Loading...</p>
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
          <h1>Admin Dashboard</h1>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('admin-units')}
            >
              Manage Units
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {selectedBooking ? (
          <BookingDetails
            booking={selectedBooking}
            authToken={authToken!}
            onClose={() => setSelectedBooking(null)}
            onUpdate={handleBookingUpdate}
          />
        ) : (
          <>
            {stats && <StatsDashboard stats={stats} />}
            <Tabs defaultValue="new-bookings" className="mt-6">
              <TabsList>
                <TabsTrigger value="new-bookings">Booking Requests (New System)</TabsTrigger>
                <TabsTrigger value="old-bookings">Legacy Bookings</TabsTrigger>
              </TabsList>
              <TabsContent value="new-bookings">
                <BookingRequestList authToken={authToken!} />
              </TabsContent>
              <TabsContent value="old-bookings">
                <BookingList authToken={authToken!} onViewBooking={handleViewBooking} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

