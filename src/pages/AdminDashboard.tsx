import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { clearAdminPassword, getAdminPassword, getRole, getStaffName } from '../lib/adminSession';
import {
  adminGetBookings, adminApprove, adminReject, adminAssignCleaner,
  getCleaningSchedule, getCleaners, addCleaner, deleteCleaner,
  AdminBooking, Cleaner, CleaningRow,
} from '../lib/adminApi';

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`;
const STATUS_COLORS: Record<string, string> = {
  pending_approval: '#b7791f', confirmed: '#2f7a4f', pending: '#7a7a7a', cancelled: '#b23b3b', expired: '#999', refunded: '#b23b3b',
};

export function AdminDashboard({ onNavigate }: Props) {
  const role = getRole() || 'admin';
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState<'bookings' | 'cleaning' | 'cleaners'>(isAdmin ? 'bookings' : 'cleaning');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [schedule, setSchedule] = useState<CleaningRow[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newCleaner, setNewCleaner] = useState({ name: '', phone: '', password: '' });
  const [showNewPw, setShowNewPw] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true); setError(null);
    try {
      const sched = await getCleaningSchedule();
      setSchedule(sched);
      if (isAdmin) {
        const [b, c] = await Promise.all([adminGetBookings(), getCleaners()]);
        setBookings(b); setCleaners(c);
      }
    } catch (err: any) {
      if (err?.status === 401) { clearAdminPassword(); onNavigate('admin-login'); return; }
      setError(err?.message || 'Failed to load');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (!getAdminPassword()) { onNavigate('admin-login'); return; }
    load();
    const onFocus = () => { if (getAdminPassword()) load(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approve(id: string) {
    if (!window.confirm("Approve this booking? This CHARGES the guest's held card now.")) return;
    setBusyId(id); setError(null);
    try { await adminApprove(id); await load(); } catch (e: any) { setError(e?.message || 'Approve failed'); } finally { setBusyId(null); }
  }
  async function reject(id: string) {
    if (!window.confirm('Reject this booking? The hold is released and the guest is NOT charged.')) return;
    setBusyId(id); setError(null);
    try { await adminReject(id); await load(); } catch (e: any) { setError(e?.message || 'Reject failed'); } finally { setBusyId(null); }
  }
  async function assign(bookingId: string, cleanerId: string) {
    try { await adminAssignCleaner(bookingId, cleanerId || null); await load(); } catch (e: any) { setError(e?.message || 'Assign failed'); }
  }
  async function createCleaner() {
    if (!newCleaner.name.trim() || !newCleaner.password.trim()) { setError('Cleaner needs a name and password.'); return; }
    try { await addCleaner(newCleaner); setNewCleaner({ name: '', phone: '', password: '' }); await load(); }
    catch (e: any) { setError(e?.message || 'Could not add cleaner'); }
  }
  async function removeCleaner(id: string) {
    if (!window.confirm('Remove this cleaner account?')) return;
    try { await deleteCleaner(id); await load(); } catch (e: any) { setError(e?.message || 'Could not remove cleaner'); }
  }

  // Awaiting: pending_approval (normal) + pending (webhook missed) so nothing gets stuck.
  const awaiting = useMemo(() => bookings.filter(b => b.status === 'pending_approval' || b.status === 'pending'), [bookings]);
  const pill = (s: string) => <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLORS[s] || '#777', padding: '2px 9px', borderRadius: 999 }}>{s.replace('_', ' ')}</span>;
  const tabBtn = (id: typeof tab, label: string) => (
    <button onClick={() => setTab(id)} style={{ background: 'none', border: 'none', color: tab === id ? '#fff' : 'rgba(255,255,255,.7)', cursor: 'pointer', fontWeight: 700, textDecoration: tab === id ? 'underline' : 'none' }}>{label}</button>
  );

  return (
    <div className="wrs" style={{ minHeight: '100vh' }}>
      <header style={{ background: 'var(--wrs-green)', color: '#fff', padding: '14px 0' }}>
        <div className="wrs-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>White Rock Station — {isAdmin ? 'Admin' : 'Cleaner'}</div>
            <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
              {isAdmin && tabBtn('bookings', 'Bookings')}
              {tabBtn('cleaning', 'Cleaning Schedule')}
              {isAdmin && tabBtn('cleaners', 'Cleaners')}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,.8)' }}>{getStaffName()}</span>
            <button className="wrs-btn wrs-btn-ghost" style={{ padding: '8px 16px' }} onClick={load} disabled={loading}>Refresh</button>
            <button className="wrs-btn wrs-btn-ghost" style={{ padding: '8px 16px' }} onClick={() => { clearAdminPassword(); onNavigate('admin-login'); }}>Logout</button>
          </div>
        </div>
      </header>

      <div className="wrs-container" style={{ padding: '28px 20px 60px' }}>
        {error && <div className="wrs-note" style={{ borderLeftColor: '#c0392b', marginBottom: 16 }}>{error}</div>}
        {loading && <p className="wrs-muted">Loading…</p>}

        {!loading && isAdmin && tab === 'bookings' && (
          <>
            <h2 className="wrs-h3">Awaiting approval ({awaiting.length})</h2>
            {awaiting.length === 0 && <p className="wrs-muted">Nothing awaiting approval.</p>}
            <div style={{ display: 'grid', gap: 12, marginTop: 10 }}>
              {awaiting.map(b => (
                <div key={b.id} className="wrs-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{b.unitName} · {b.startDate} → {b.endDate} &nbsp;{pill(b.status)}</div>
                      <div className="wrs-muted" style={{ fontSize: 14 }}>{b.name} · {b.email} · {b.phone || '—'} · {b.guests} guest(s)</div>
                      <div style={{ fontWeight: 700, marginTop: 4 }}>{money(b.totalCents)} <span className="wrs-muted" style={{ fontWeight: 400, fontSize: 13 }}>(card held, not charged)</span></div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 16px' }} disabled={busyId === b.id} onClick={() => approve(b.id)}>{busyId === b.id ? '…' : 'Approve & charge'}</button>
                      <button className="wrs-btn wrs-btn-outline" style={{ padding: '9px 16px', borderColor: '#c0392b', color: '#c0392b' }} disabled={busyId === b.id} onClick={() => reject(b.id)}>Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="wrs-h3" style={{ marginTop: 28 }}>All bookings ({bookings.length})</h2>
            <div className="wrs-card" style={{ padding: 0, overflow: 'hidden', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ textAlign: 'left', background: 'var(--wrs-offwhite)' }}>
                  <th style={{ padding: '10px 12px' }}>Reservation</th><th style={{ padding: '10px 12px' }}>Guest</th><th style={{ padding: '10px 12px' }}>Dates</th><th style={{ padding: '10px 12px' }}>Total</th><th style={{ padding: '10px 12px' }}>Status</th>
                </tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--wrs-line)' }}>
                      <td style={{ padding: '10px 12px' }}>{b.unitName}</td>
                      <td style={{ padding: '10px 12px' }}>{b.name}<div className="wrs-muted" style={{ fontSize: 12 }}>{b.email}</div></td>
                      <td style={{ padding: '10px 12px' }}>{b.startDate} → {b.endDate}</td>
                      <td style={{ padding: '10px 12px' }}>{money(b.totalCents)}</td>
                      <td style={{ padding: '10px 12px' }}>{pill(b.status)}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && <tr><td colSpan={5} style={{ padding: 16 }} className="wrs-muted">No bookings yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && tab === 'cleaning' && (
          <>
            <h2 className="wrs-h3">Cleaning Schedule</h2>
            <p className="wrs-muted" style={{ marginTop: 0 }}>Each cottage needs cleaning the day after checkout. {schedule.length} upcoming.</p>
            <div className="wrs-card" style={{ padding: 0, overflow: 'hidden', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ textAlign: 'left', background: 'var(--wrs-offwhite)' }}>
                  <th style={{ padding: '10px 12px' }}>Cleaning day</th><th style={{ padding: '10px 12px' }}>Cottage</th><th style={{ padding: '10px 12px' }}>Checkout</th><th style={{ padding: '10px 12px' }}>Assigned cleaner</th>
                </tr></thead>
                <tbody>
                  {schedule.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--wrs-line)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--wrs-blue)' }}>{r.cleaning}</td>
                      <td style={{ padding: '10px 12px' }}>{r.unit}</td>
                      <td style={{ padding: '10px 12px' }} className="wrs-muted">{r.checkout}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {isAdmin ? (
                          <select className="wrs-select" style={{ maxWidth: 200 }} value={r.cleanerId || ''} onChange={e => assign(r.id, e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {cleaners.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        ) : (r.cleanerName || <span className="wrs-muted">Unassigned</span>)}
                      </td>
                    </tr>
                  ))}
                  {schedule.length === 0 && <tr><td colSpan={4} style={{ padding: 16 }} className="wrs-muted">No cleanings scheduled.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && isAdmin && tab === 'cleaners' && (
          <>
            <h2 className="wrs-h3">Cleaner accounts</h2>
            <p className="wrs-muted" style={{ marginTop: 0 }}>Cleaners sign in with their password and see only the cleaning schedule. Phone is stored for future text reminders.</p>

            <div className="wrs-card" style={{ padding: 16, marginTop: 10, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Name</label><input className="wrs-input" value={newCleaner.name} onChange={e => setNewCleaner({ ...newCleaner, name: e.target.value })} placeholder="Jane Cleaner" /></div>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Mobile (for texts)</label><input className="wrs-input" value={newCleaner.phone} onChange={e => setNewCleaner({ ...newCleaner, phone: e.target.value })} placeholder="(724) 555-0100" /></div>
                <div className="wrs-field" style={{ marginBottom: 0 }}>
                  <label className="wrs-label">Login password</label>
                  <div style={{ position: 'relative' }}>
                    <input className="wrs-input" type={showNewPw ? 'text' : 'password'} style={{ paddingRight: 38 }} value={newCleaner.password} onChange={e => setNewCleaner({ ...newCleaner, password: e.target.value })} placeholder="set a password" />
                    <button type="button" aria-label={showNewPw ? 'Hide password' : 'Show password'} onClick={() => setShowNewPw(v => !v)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wrs-muted)', display: 'flex' }}>{showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>
                <button className="wrs-btn wrs-btn-green" style={{ padding: '11px 18px' }} onClick={createCleaner}>Add cleaner</button>
              </div>
            </div>

            <div className="wrs-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ textAlign: 'left', background: 'var(--wrs-offwhite)' }}>
                  <th style={{ padding: '10px 12px' }}>Name</th><th style={{ padding: '10px 12px' }}>Mobile</th><th style={{ padding: '10px 12px' }}>Password</th><th style={{ padding: '10px 12px' }}></th>
                </tr></thead>
                <tbody>
                  {cleaners.map(c => (
                    <tr key={c.id} style={{ borderTop: '1px solid var(--wrs-line)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{c.name}</td>
                      <td style={{ padding: '10px 12px' }} className="wrs-muted">{c.phone || '—'}</td>
                      <td style={{ padding: '10px 12px' }} className="wrs-muted">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace' }}>{revealed[c.id] ? c.password : '••••••••'}</span>
                          <button type="button" aria-label={revealed[c.id] ? 'Hide password' : 'Show password'} onClick={() => setRevealed(r => ({ ...r, [c.id]: !r[c.id] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wrs-muted)', display: 'flex' }}>{revealed[c.id] ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}><button className="wrs-btn wrs-btn-outline" style={{ padding: '6px 12px', borderColor: '#c0392b', color: '#c0392b' }} onClick={() => removeCleaner(c.id)}>Remove</button></td>
                    </tr>
                  ))}
                  {cleaners.length === 0 && <tr><td colSpan={4} style={{ padding: 16 }} className="wrs-muted">No cleaner accounts yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
