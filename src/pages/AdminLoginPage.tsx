import { useState } from 'react';
import { api } from '../lib/api';
import { setAdminPassword, clearAdminPassword } from '../lib/adminSession';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Lock } from 'lucide-react';

interface AdminLoginPageProps {
  onNavigate: (page: string) => void;
}

export function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    setError(null);
    // Store the password for the session, then verify it with an authenticated call.
    setAdminPassword(trimmed);
    try {
      await api.admin.getBookings();
      // Valid — enter the admin area.
      onNavigate('admin');
    } catch (err: any) {
      clearAdminPassword();
      if (err?.status === 401) {
        setError('Incorrect password');
      } else {
        setError(err?.message || 'Could not sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--off-white)] px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-lg p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div
              className="flex items-center justify-center rounded-full mb-3"
              style={{ width: 56, height: 56, backgroundColor: 'var(--forest-green)' }}
            >
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--forest-green)' }}>
              White Rock Station
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Admin sign in</p>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full text-white"
              style={{ backgroundColor: 'var(--forest-green)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              Back to website
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          This area is for White Rock Station staff only.
        </p>
      </div>
    </div>
  );
}
