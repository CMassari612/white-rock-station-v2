import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, EyeOff, Plus, Trash2, CalendarOff, Pencil, Upload } from 'lucide-react';
import { clearAdminPassword, getAdminPassword, getRole, getStaffName } from '../lib/adminSession';
import {
  adminGetBookings, adminApprove, adminReject, adminDeleteBooking,
  getCleaningSchedule, getCleaners, addCleaner, deleteCleaner,
  adminGetUnits, adminUpdateUnit, adminAddUnit, adminDeleteUnit, adminAddBlock, adminRemoveBlock, adminWinterClosure,
  adminUploadPhoto, adminDeletePhoto, adminReorderPhotos, adminUploadAsset,
  adminSyncAirbnb,
  AdminBooking, Cleaner, CleaningRow, AdminUnit,
} from '../lib/adminApi';

// Downscale + compress an image in the browser before upload (keeps pages fast
// and storage small — phone photos are often several MB).
async function optimizeImage(file: File, maxDim = 2000, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file; // unsupported type — send as-is
  let { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob: Blob | null = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
  return blob || file;
}

interface Props {
  onNavigate: (page: string, slug?: string) => void;
}

const money = (c?: number) => `$${((c ?? 0) / 100).toFixed(2)}`;
const toCents = (dollars: string | number) => Math.max(0, Math.round(Number(dollars || 0) * 100));
const STATUS_COLORS: Record<string, string> = {
  pending_approval: '#b7791f', confirmed: '#2f7a4f', pending: '#7a7a7a', cancelled: '#b23b3b', expired: '#999', refunded: '#b23b3b',
};

type Tab = 'bookings' | 'sites' | 'cleaning' | 'cleaners';

export function AdminDashboard({ onNavigate }: Props) {
  const role = getRole() || 'admin';
  const isAdmin = role === 'admin';

  const [tab, setTab] = useState<Tab>(isAdmin ? 'bookings' : 'cleaning');
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [units, setUnits] = useState<AdminUnit[]>([]);
  const [schedule, setSchedule] = useState<CleaningRow[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newCleaner, setNewCleaner] = useState({ name: '', phone: '', password: '' });
  const [showNewPw, setShowNewPw] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  // Sites tab UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showWinter, setShowWinter] = useState(false);
  const [showAddSite, setShowAddSite] = useState(false);

  async function load() {
    // Only blank the screen on the very first load. Later refreshes (after every
    // edit/upload/block) update the data in place so the page never flashes.
    if (!loadedRef.current) setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        // One round-trip: fetch everything in parallel instead of sequentially.
        const [sched, b, c, u] = await Promise.all([
          getCleaningSchedule(), adminGetBookings(), getCleaners(), adminGetUnits(),
        ]);
        setSchedule(sched); setBookings(b); setCleaners(c); setUnits(u);
      } else {
        setSchedule(await getCleaningSchedule());
      }
      loadedRef.current = true;
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
  async function deleteBooking(id: string) {
    if (!window.confirm('Delete this booking entirely? Any captured test payment is refunded / held authorization is voided. This cannot be undone.')) return;
    setBusyId(id); setError(null);
    try { await adminDeleteBooking(id); await load(); } catch (e: any) { setError(e?.message || 'Delete failed'); } finally { setBusyId(null); }
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

  const awaiting = useMemo(() => bookings.filter(b => b.status === 'pending_approval' || b.status === 'pending'), [bookings]);
  const editingUnit = units.find(u => u.id === editingId) || null;
  const pill = (s: string) => <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: STATUS_COLORS[s] || '#777', padding: '2px 9px', borderRadius: 999 }}>{s.replace('_', ' ')}</span>;
  const tabBtn = (id: Tab, label: string) => (
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
              {isAdmin && tabBtn('sites', 'Sites')}
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
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '90px 0', gap: 14 }}>
            <style>{`@keyframes wrsspin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid var(--wrs-line)', borderTopColor: 'var(--wrs-green)', animation: 'wrsspin 0.7s linear infinite' }} />
            <p className="wrs-muted" style={{ margin: 0 }}>Loading your dashboard…</p>
          </div>
        )}

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
                  <th style={{ padding: '10px 12px' }}>Reservation</th><th style={{ padding: '10px 12px' }}>Guest</th><th style={{ padding: '10px 12px' }}>Dates</th><th style={{ padding: '10px 12px' }}>Total</th><th style={{ padding: '10px 12px' }}>Status</th><th style={{ padding: '10px 12px' }}></th>
                </tr></thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} style={{ borderTop: '1px solid var(--wrs-line)' }}>
                      <td style={{ padding: '10px 12px' }}>{b.unitName}</td>
                      <td style={{ padding: '10px 12px' }}>{b.name}<div className="wrs-muted" style={{ fontSize: 12 }}>{b.email}</div></td>
                      <td style={{ padding: '10px 12px' }}>{b.startDate} → {b.endDate}</td>
                      <td style={{ padding: '10px 12px' }}>{money(b.totalCents)}</td>
                      <td style={{ padding: '10px 12px' }}>{pill(b.status)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button className="wrs-btn wrs-btn-outline" style={{ padding: '5px 10px', borderColor: '#c0392b', color: '#c0392b' }} disabled={busyId === b.id} onClick={() => deleteBooking(b.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && <tr><td colSpan={6} style={{ padding: 16 }} className="wrs-muted">No bookings yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && isAdmin && tab === 'sites' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 className="wrs-h3" style={{ margin: 0 }}>Sites ({units.length})</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="wrs-btn wrs-btn-outline" style={{ padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowWinter(true)}><CalendarOff size={16} /> Winter Closure</button>
                <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAddSite(true)}><Plus size={16} /> Add Unit</button>
              </div>
            </div>
            <p className="wrs-muted" style={{ marginTop: 6 }}>Edit pricing, occupancy, and blocked dates per site. Blocks and price changes go live immediately.</p>

            <div className="wrs-grid" style={{ marginTop: 14 }}>
              {units.map(u => (
                <div key={u.id} className="wrs-card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                      <div style={{ width: 72, height: 54, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--wrs-offwhite)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.photos?.[0]
                          ? <img src={encodeURI(u.photos[0])} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span className="wrs-muted" style={{ fontSize: 10, textAlign: 'center' }}>No photo</span>}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800 }}>{u.name}</div>
                        <div className="wrs-muted" style={{ fontSize: 13 }}>
                          {u.unitType === 'cottage' ? 'Cottage' : u.unitType === 'tent_site' ? 'Camping' : 'Kayak'}
                          {!u.active && ' · hidden'}{u.placeholder && ' · coming soon'}
                        </div>
                      </div>
                    </div>
                    <button className="wrs-btn wrs-btn-outline" style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, flexShrink: 0 }} onClick={() => setEditingId(u.id)}>
                      <Pencil size={14} /> Edit
                    </button>
                  </div>
                  {u.unitType !== 'kayak' && (
                    <div style={{ marginTop: 8, fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>{money(u.weekdayPriceCents)}</span> wk · <span style={{ fontWeight: 700 }}>{money(u.weekendPriceCents)}</span> wknd
                      {' · '}sleeps {u.maxGuests ?? '—'}
                      {(u.blockedRanges?.length || 0) > 0 && <span className="wrs-muted"> · {u.blockedRanges!.length} block(s)</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {editingUnit && (
              <Modal title={`Edit — ${editingUnit.name}`} maxWidth={780} onClose={() => setEditingId(null)}>
                <SiteEditor unit={editingUnit} onSaved={load} onError={setError} />
              </Modal>
            )}
          </>
        )}

        {!loading && tab === 'cleaning' && (
          <>
            <h2 className="wrs-h3">Cleaning Schedule</h2>
            <p className="wrs-muted" style={{ marginTop: 0 }}>Upcoming checkouts to clean. {schedule.length} upcoming.</p>
            <div className="wrs-card" style={{ padding: 0, overflow: 'hidden', marginTop: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ textAlign: 'left', background: 'var(--wrs-offwhite)' }}>
                  <th style={{ padding: '10px 12px' }}>Site</th><th style={{ padding: '10px 12px' }}>Address</th><th style={{ padding: '10px 12px' }}>Checkout date</th>
                </tr></thead>
                <tbody>
                  {schedule.map(r => (
                    <tr key={r.id} style={{ borderTop: '1px solid var(--wrs-line)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 700 }}>{r.site}</td>
                      <td style={{ padding: '10px 12px' }} className="wrs-muted">{r.address}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--wrs-blue)' }}>{r.checkout}</td>
                    </tr>
                  ))}
                  {schedule.length === 0 && <tr><td colSpan={3} style={{ padding: 16 }} className="wrs-muted">No upcoming checkouts.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && isAdmin && tab === 'cleaners' && (
          <>
            <h2 className="wrs-h3">Cleaner accounts</h2>
            <p className="wrs-muted" style={{ marginTop: 0 }}>Cleaners sign in with their password and see only the site address and checkout date for each booking.</p>

            <div className="wrs-card" style={{ padding: 16, marginTop: 10, marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Name</label><input className="wrs-input" value={newCleaner.name} onChange={e => setNewCleaner({ ...newCleaner, name: e.target.value })} placeholder="Jane Cleaner" /></div>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Mobile (optional)</label><input className="wrs-input" value={newCleaner.phone} onChange={e => setNewCleaner({ ...newCleaner, phone: e.target.value })} placeholder="(724) 555-0100" /></div>
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

      {showWinter && <WinterClosureModal units={units} onClose={() => setShowWinter(false)} onDone={async () => { setShowWinter(false); await load(); }} onError={setError} />}
      {showAddSite && <AddSiteModal onClose={() => setShowAddSite(false)} onDone={async () => { setShowAddSite(false); await load(); }} onError={setError} />}
    </div>
  );
}

// ---- Per-site editor (price, occupancy, blocks) ----
function SiteEditor({ unit, onSaved, onError }: { unit: AdminUnit; onSaved: () => Promise<void> | void; onError: (m: string) => void }) {
  const [wk, setWk] = useState(((unit.weekdayPriceCents ?? 0) / 100).toString());
  const [wknd, setWknd] = useState(((unit.weekendPriceCents ?? 0) / 100).toString());
  const [clean, setClean] = useState(((unit.cleaningFeeCents ?? 0) / 100).toString());
  const [guests, setGuests] = useState((unit.maxGuests ?? 0).toString());
  const [active, setActive] = useState(unit.active);
  const [address, setAddress] = useState(unit.address || '');
  const [saving, setSaving] = useState(false);

  const [bStart, setBStart] = useState('');
  const [bEnd, setBEnd] = useState('');
  const [bReason, setBReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const isCottage = unit.unitType === 'cottage';

  const [airbnbUrl, setAirbnbUrl] = useState(unit.airbnbIcalUrl || '');
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const exportUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/units/${unit.id}/calendar.ics`;

  async function syncNow() {
    setSyncBusy(true); setSyncMsg(null);
    try {
      await adminUpdateUnit(unit.id, { airbnbIcalUrl: airbnbUrl.trim() });
      const r = await adminSyncAirbnb(unit.id);
      setSyncMsg(`Synced — imported ${r.imported} Airbnb reservation${r.imported === 1 ? '' : 's'}.`);
      await onSaved();
    } catch (e: any) { onError(e?.message || 'Airbnb sync failed'); }
    finally { setSyncBusy(false); }
  }

  const [photos, setPhotos] = useState<string[]>(unit.photos || []);
  const [uploading, setUploading] = useState(0);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const [directions, setDirections] = useState(unit.directions || '');
  const [mapUrl, setMapUrl] = useState(unit.mapImageUrl || '');
  const [parkingUrl, setParkingUrl] = useState(unit.parkingImageUrl || '');
  const [assetBusy, setAssetBusy] = useState<'map' | 'parking' | null>(null);

  async function onAsset(slot: 'map' | 'parking', files: FileList | null) {
    const file = files && files[0];
    if (!file || !file.type.startsWith('image/')) return;
    setAssetBusy(slot);
    try {
      const blob = await optimizeImage(file, 2400, 0.85);
      const updated = await adminUploadAsset(unit.id, slot, blob);
      if (slot === 'map') setMapUrl(updated.mapImageUrl || '');
      else setParkingUrl(updated.parkingImageUrl || '');
      await onSaved();
    } catch (e: any) { onError(e?.message || 'Upload failed'); }
    finally { setAssetBusy(null); }
  }
  async function clearAsset(slot: 'map' | 'parking') {
    try {
      await adminUpdateUnit(unit.id, slot === 'map' ? { mapImageUrl: '' } : { parkingImageUrl: '' });
      if (slot === 'map') setMapUrl(''); else setParkingUrl('');
      await onSaved();
    } catch (e: any) { onError(e?.message || 'Could not remove image'); }
  }

  async function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      setUploading(n => n + 1);
      try {
        const blob = await optimizeImage(file);
        const updated = await adminUploadPhoto(unit.id, blob);
        setPhotos(updated.photos || []);
      } catch (e: any) { onError(e?.message || 'Photo upload failed'); }
      finally { setUploading(n => n - 1); }
    }
    await onSaved();
  }
  async function removePhoto(url: string) {
    const prev = photos;
    setPhotos(photos.filter(p => p !== url));
    try { await adminDeletePhoto(unit.id, url); await onSaved(); }
    catch (e: any) { setPhotos(prev); onError(e?.message || 'Could not remove photo'); }
  }
  async function reorder(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= photos.length || to >= photos.length) return;
    const next = photos.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPhotos(next);
    try { await adminReorderPhotos(unit.id, next); await onSaved(); }
    catch (e: any) { onError(e?.message || 'Could not reorder photos'); }
  }

  async function save() {
    setSaving(true);
    try {
      await adminUpdateUnit(unit.id, {
        weekdayPriceCents: toCents(wk),
        weekendPriceCents: toCents(wknd),
        cleaningFeeCents: toCents(clean),
        maxGuests: Math.max(1, Math.trunc(Number(guests) || 1)),
        active,
        address: address.trim(),
        directions: directions.trim(),
        airbnbIcalUrl: airbnbUrl.trim(),
      });
      await onSaved();
    } catch (e: any) { onError(e?.message || 'Could not save site'); }
    finally { setSaving(false); }
  }
  async function addBlock() {
    if (!bStart || !bEnd) { onError('Pick a start and end date to block.'); return; }
    try { await adminAddBlock(unit.id, { start: bStart, end: bEnd, reason: bReason }); setBStart(''); setBEnd(''); setBReason(''); setShowBlockForm(false); await onSaved(); }
    catch (e: any) { onError(e?.message || 'Could not add block'); }
  }
  async function removeBlock(blockId: string) {
    try { await adminRemoveBlock(unit.id, blockId); await onSaved(); } catch (e: any) { onError(e?.message || 'Could not remove block'); }
  }
  async function removeSite() {
    if (!window.confirm(`Delete "${unit.name}"? This removes the listing entirely. Existing bookings are not affected.`)) return;
    try { await adminDeleteUnit(unit.id); await onSaved(); } catch (e: any) { onError(e?.message || 'Could not delete site'); }
  }

  return (
    <div>
      {unit.unitType !== 'kayak' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Weekday price ($/night)</label><input className="wrs-input" type="number" min={0} value={wk} onChange={e => setWk(e.target.value)} /></div>
          <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Weekend price ($/night)</label><input className="wrs-input" type="number" min={0} value={wknd} onChange={e => setWknd(e.target.value)} /></div>
          {isCottage && <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Cleaning fee ($)</label><input className="wrs-input" type="number" min={0} value={clean} onChange={e => setClean(e.target.value)} /></div>}
          <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Max guests</label><input className="wrs-input" type="number" min={1} value={guests} onChange={e => setGuests(e.target.value)} /></div>
        </div>
      )}
      <div className="wrs-field" style={{ marginTop: 10, marginBottom: 0 }}>
        <label className="wrs-label">Site address (shown to cleaners)</label>
        <input className="wrs-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="395 Silvis Hollow Rd, Kittanning, PA 16201" />
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 14 }}>
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Visible &amp; bookable on the public site
      </label>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 16px' }} disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        <button className="wrs-btn wrs-btn-outline" style={{ padding: '9px 14px', borderColor: '#c0392b', color: '#c0392b', display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={removeSite}><Trash2 size={15} /> Delete unit</button>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          Photos <span className="wrs-muted" style={{ fontWeight: 400 }}>· drag to reorder — the first photo is the cover</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {photos.map((p, i) => (
            <div
              key={p}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => { if (dragIdx !== null) reorder(dragIdx, i); setDragIdx(null); }}
              style={{ position: 'relative', width: 120, height: 90, borderRadius: 8, overflow: 'hidden', border: i === 0 ? '2px solid var(--wrs-green)' : '1px solid var(--wrs-line)', cursor: 'grab', background: 'var(--wrs-offwhite)' }}
            >
              <img src={encodeURI(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
              {i === 0 && <span style={{ position: 'absolute', top: 4, left: 4, background: 'var(--wrs-green)', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 999 }}>Cover</span>}
              <button aria-label="Remove photo" onClick={() => removePhoto(p)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 999, width: 22, height: 22, cursor: 'pointer', lineHeight: 1, fontSize: 15 }}>×</button>
            </div>
          ))}
          <label style={{ width: 120, height: 90, borderRadius: 8, border: '2px dashed var(--wrs-line)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--wrs-muted)', fontSize: 12, gap: 4, textAlign: 'center' }}>
            <Upload size={18} />
            {uploading > 0 ? `Uploading… (${uploading})` : 'Add photos'}
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => { onFiles(e.target.files); e.currentTarget.value = ''; }} />
          </label>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          Directions &amp; arrival <span className="wrs-muted" style={{ fontWeight: 400 }}>· sent in the confirmation email, not shown publicly</span>
        </div>
        <div className="wrs-field" style={{ marginBottom: 10 }}>
          <label className="wrs-label">Typed directions</label>
          <textarea className="wrs-input" rows={4} value={directions} onChange={e => setDirections(e.target.value)} placeholder="Turn-by-turn directions to this unit (the campground can be hard to find)…" />
          <div className="wrs-muted" style={{ fontSize: 12, marginTop: 4 }}>Saved with “Save changes” above.</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Map image</div>
            {mapUrl ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--wrs-line)' }}>
                <img src={encodeURI(mapUrl)} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button aria-label="Remove map" onClick={() => clearAsset('map')} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 999, width: 24, height: 24, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', aspectRatio: '4 / 3', borderRadius: 8, border: '2px dashed var(--wrs-line)', cursor: 'pointer', color: 'var(--wrs-muted)', fontSize: 13 }}>
                <Upload size={18} />{assetBusy === 'map' ? 'Uploading…' : 'Upload map'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { onAsset('map', e.target.files); e.currentTarget.value = ''; }} />
              </label>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Parking image <span className="wrs-muted" style={{ fontWeight: 400 }}>· circle THIS unit</span></div>
            {parkingUrl ? (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--wrs-line)' }}>
                <img src={encodeURI(parkingUrl)} alt="Parking" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button aria-label="Remove parking" onClick={() => clearAsset('parking')} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: 999, width: 24, height: 24, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', aspectRatio: '4 / 3', borderRadius: 8, border: '2px dashed var(--wrs-line)', cursor: 'pointer', color: 'var(--wrs-muted)', fontSize: 13 }}>
                <Upload size={18} />{assetBusy === 'parking' ? 'Uploading…' : 'Upload parking'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { onAsset('parking', e.target.files); e.currentTarget.value = ''; }} />
              </label>
            )}
          </div>
        </div>
      </div>

      {unit.unitType !== 'kayak' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Blocked dates</div>
          {(unit.blockedRanges?.length || 0) === 0 && <p className="wrs-muted" style={{ margin: '0 0 8px' }}>No blocked dates.</p>}
          <div style={{ display: 'grid', gap: 6 }}>
            {(unit.blockedRanges || []).map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--wrs-offwhite)', borderRadius: 8, padding: '6px 10px', fontSize: 14 }}>
                <span>{b.start} → {b.end}{b.reason ? ` · ${b.reason}` : ''}{b.source === 'winter' ? ' · ❄' : ''}</span>
                <button aria-label="Remove block" className="wrs-btn wrs-btn-outline" style={{ padding: '4px 8px', borderColor: '#c0392b', color: '#c0392b', display: 'inline-flex', gap: 4 }} onClick={() => removeBlock(b.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {!showBlockForm ? (
            <button className="wrs-btn wrs-btn-outline" style={{ padding: '9px 14px', marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setShowBlockForm(true)}>
              <CalendarOff size={15} /> Block dates
            </button>
          ) : (
            <div style={{ marginTop: 10, border: '1px solid var(--wrs-line)', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">From</label><input className="wrs-input" type="date" value={bStart} onChange={e => setBStart(e.target.value)} /></div>
                <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">To</label><input className="wrs-input" type="date" value={bEnd} onChange={e => setBEnd(e.target.value)} /></div>
              </div>
              <div className="wrs-field" style={{ marginTop: 8, marginBottom: 0 }}><label className="wrs-label">Reason (optional)</label><input className="wrs-input" value={bReason} onChange={e => setBReason(e.target.value)} placeholder="Owner use" /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button className="wrs-btn wrs-btn-ghost" style={{ padding: '9px 14px' }} onClick={() => { setShowBlockForm(false); setBStart(''); setBEnd(''); setBReason(''); }}>Cancel</button>
                <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 14px' }} onClick={addBlock}>Block</button>
              </div>
            </div>
          )}
        </div>
      )}
      {unit.unitType !== 'kayak' && (
        <div style={{ marginTop: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Airbnb calendar sync</div>
          <div className="wrs-muted" style={{ fontSize: 13, marginBottom: 8 }}>
            Two-way iCal. Import the WRS export URL into Airbnb (Listing → Availability → Connect calendars), and paste this unit's Airbnb export link below.
          </div>
          <div className="wrs-field" style={{ marginBottom: 8 }}>
            <label className="wrs-label">WRS export URL <span className="wrs-muted" style={{ fontWeight: 400 }}>— import this into Airbnb</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="wrs-input" readOnly value={exportUrl} onFocus={e => e.currentTarget.select()} />
              <button className="wrs-btn wrs-btn-outline" style={{ padding: '0 14px', whiteSpace: 'nowrap' }} onClick={() => { try { navigator.clipboard?.writeText(exportUrl); setSyncMsg('Export URL copied.'); } catch { /* noop */ } }}>Copy</button>
            </div>
          </div>
          <div className="wrs-field" style={{ marginBottom: 8 }}>
            <label className="wrs-label">Airbnb calendar URL <span className="wrs-muted" style={{ fontWeight: 400 }}>— paste Airbnb's export link</span></label>
            <input className="wrs-input" value={airbnbUrl} onChange={e => setAirbnbUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/….ics" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 14px' }} disabled={syncBusy || !airbnbUrl.trim()} onClick={syncNow}>{syncBusy ? 'Syncing…' : 'Sync now'}</button>
            {unit.airbnbSyncedAt && <span className="wrs-muted" style={{ fontSize: 13 }}>Last synced {new Date(unit.airbnbSyncedAt).toLocaleString()}</span>}
            {syncMsg && <span style={{ fontSize: 13, color: 'var(--wrs-green)' }}>{syncMsg}</span>}
          </div>
          <div className="wrs-muted" style={{ fontSize: 12, marginTop: 6 }}>Also refreshes automatically every hour. Airbnb's feed can lag a few hours on their side.</div>
        </div>
      )}
    </div>
  );
}

// ---- Winter Closure modal ----
function WinterClosureModal({ units, onClose, onDone, onError }: { units: AdminUnit[]; onClose: () => void; onDone: () => Promise<void> | void; onError: (m: string) => void }) {
  const eligible = units.filter(u => u.unitType !== 'kayak' && !u.placeholder);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>(() => Object.fromEntries(eligible.map(u => [u.id, true])));
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (!start || !end) { onError('Pick a start and end date.'); return; }
    const unitIds = eligible.filter(u => selected[u.id]).map(u => u.id);
    if (unitIds.length === 0) { onError('Select at least one site.'); return; }
    setBusy(true);
    try { await adminWinterClosure({ start, end, unitIds, reason: 'Winter closure' }); await onDone(); }
    catch (e: any) { onError(e?.message || 'Could not apply winter closure'); setBusy(false); }
  }

  return (
    <Modal title="Winter Closure" onClose={onClose}>
      <p className="wrs-muted" style={{ marginTop: 0 }}>Block a date range across every selected site at once — for the seasonal shutdown when the water's off.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">From</label><input className="wrs-input" type="date" value={start} onChange={e => setStart(e.target.value)} /></div>
        <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">To</label><input className="wrs-input" type="date" value={end} onChange={e => setEnd(e.target.value)} /></div>
      </div>
      <div style={{ marginTop: 12, fontWeight: 700, fontSize: 14 }}>Sites to close</div>
      <div style={{ display: 'grid', gap: 6, marginTop: 6, maxHeight: 220, overflow: 'auto' }}>
        {eligible.map(u => (
          <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <input type="checkbox" checked={!!selected[u.id]} onChange={e => setSelected(s => ({ ...s, [u.id]: e.target.checked }))} />
            {u.name}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
        <button className="wrs-btn wrs-btn-ghost" style={{ padding: '9px 16px' }} onClick={onClose}>Cancel</button>
        <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 16px' }} disabled={busy} onClick={apply}>{busy ? 'Applying…' : 'Apply closure'}</button>
      </div>
    </Modal>
  );
}

// ---- Add Site modal ----
function AddSiteModal({ onClose, onDone, onError }: { onClose: () => void; onDone: () => Promise<void> | void; onError: (m: string) => void }) {
  const [name, setName] = useState('');
  const [unitType, setUnitType] = useState<'cottage' | 'tent_site'>('cottage');
  const [wk, setWk] = useState('');
  const [wknd, setWknd] = useState('');
  const [clean, setClean] = useState('');
  const [guests, setGuests] = useState('2');
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) { onError('Give the site a name.'); return; }
    setBusy(true);
    try {
      await adminAddUnit({
        name: name.trim(),
        unitType,
        weekdayPriceCents: toCents(wk),
        weekendPriceCents: toCents(wknd),
        cleaningFeeCents: toCents(clean),
        maxGuests: Math.max(1, Math.trunc(Number(guests) || 1)),
        taxable: unitType === 'cottage',
        active: true,
      });
      await onDone();
    } catch (e: any) { onError(e?.message || 'Could not create site'); setBusy(false); }
  }

  return (
    <Modal title="Add Unit" onClose={onClose}>
      <div className="wrs-field"><label className="wrs-label">Site name</label><input className="wrs-input" value={name} onChange={e => setName(e.target.value)} placeholder="New Cottage" /></div>
      <div className="wrs-field"><label className="wrs-label">Type</label>
        <select className="wrs-select" value={unitType} onChange={e => setUnitType(e.target.value as any)}>
          <option value="cottage">Cottage</option>
          <option value="tent_site">Primitive camping</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Weekday price ($)</label><input className="wrs-input" type="number" min={0} value={wk} onChange={e => setWk(e.target.value)} /></div>
        <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Weekend price ($)</label><input className="wrs-input" type="number" min={0} value={wknd} onChange={e => setWknd(e.target.value)} /></div>
        {unitType === 'cottage' && <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Cleaning fee ($)</label><input className="wrs-input" type="number" min={0} value={clean} onChange={e => setClean(e.target.value)} /></div>}
        <div className="wrs-field" style={{ marginBottom: 0 }}><label className="wrs-label">Max guests</label><input className="wrs-input" type="number" min={1} value={guests} onChange={e => setGuests(e.target.value)} /></div>
      </div>
      <p className="wrs-muted" style={{ fontSize: 13 }}>You can add photos, description, and amenities after creating the site.</p>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
        <button className="wrs-btn wrs-btn-ghost" style={{ padding: '9px 16px' }} onClick={onClose}>Cancel</button>
        <button className="wrs-btn wrs-btn-green" style={{ padding: '9px 16px' }} disabled={busy} onClick={create}>{busy ? 'Creating…' : 'Create unit'}</button>
      </div>
    </Modal>
  );
}

// ---- Lightweight modal ----
function Modal({ title, onClose, children, maxWidth = 520 }: { title: string; onClose: () => void; children: ReactNode; maxWidth?: number }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(20,28,24,.5)',
        backdropFilter: 'blur(7px)', WebkitBackdropFilter: 'blur(7px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '5vh 16px', zIndex: 100, overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="wrs-card"
        style={{ width: '100%', maxWidth, padding: 24, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,.35)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 className="wrs-h3" style={{ margin: 0 }}>{title}</h3>
          <button aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 26, lineHeight: 1, color: 'var(--wrs-muted)' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
