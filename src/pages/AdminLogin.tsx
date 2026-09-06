import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { setAdminPassword, setRole, clearAdminPassword } from '../lib/adminSession';
import { staffLogin } from '../lib/adminApi';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

export function AdminLogin({ onNavigate }: Props) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const pw = password.trim();
    if (!pw) { setError('Password is required'); return; }
    setLoading(true);
    setError(null);
    setAdminPassword(pw);
    try {
      const { role, name } = await staffLogin(pw);
      setRole(role, name);
      onNavigate('admin');
    } catch (err: any) {
      clearAdminPassword();
      setError(err?.status === 401 ? 'Incorrect password' : (err?.message || 'Could not sign in'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="wrs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ background: 'var(--wrs-green)', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <img src="/brand/wrs-lockup-cream.png" alt="White Rock Station" style={{ height: 90, width: 'auto', maxWidth: '100%' }} />
        </div>
        <div className="wrs-card" style={{ padding: 24 }}>
          <h1 className="wrs-h3" style={{ textAlign: 'center' }}>Staff sign in</h1>
          <div className="wrs-field" style={{ marginTop: 12 }}>
            <label className="wrs-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="wrs-input" type={showPw ? 'text' : 'password'} value={password} autoFocus style={{ paddingRight: 40 }}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
              <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wrs-muted)', display: 'flex' }}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <div className="wrs-note" style={{ borderLeftColor: '#c0392b', marginBottom: 12 }}>{error}</div>}
          <button className="wrs-btn wrs-btn-primary wrs-btn-block" onClick={submit} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
          <button className="wrs-btn wrs-btn-ghost wrs-btn-block" style={{ marginTop: 8 }} onClick={() => onNavigate('home')}>Back to website</button>
        </div>
      </div>
    </div>
  );
}
