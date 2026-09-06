import { useState, useEffect } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { UnitsManager } from '../components/admin/UnitsManager';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';

interface AdminUnitsPageProps {
  onNavigate: (page: string) => void;
}

export function AdminUnitsPage({ onNavigate }: AdminUnitsPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if already authenticated (stored in sessionStorage)
    const token = sessionStorage.getItem('adminToken');
    if (token) {
      // Verify token still works
      api.admin.getUnits(token)
        .then(() => {
          setAuthToken(token);
          setIsAuthenticated(true);
        })
        .catch(() => {
          sessionStorage.removeItem('adminToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (password: string) => {
    setError(null);
    try {
      // Verify password by trying to fetch units
      await api.admin.getUnits(password);
      setAuthToken(password);
      setIsAuthenticated(true);
      sessionStorage.setItem('adminToken', password);
    } catch (error: any) {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminToken');
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
          <div>
            <h1>Units Management</h1>
            <p className="text-muted-foreground mt-1">Manage your rental inventory</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => onNavigate('admin')}
            >
              View Bookings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <UnitsManager authToken={authToken!} />
      </div>
    </div>
  );
}

