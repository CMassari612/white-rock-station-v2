import { useEffect, useMemo, useState } from 'react';
import { getStaffCalendar, setCleaning, StaffCabin, StaffReservation } from '../../lib/adminApi';

/**
 * Per-cabin month calendar, Airbnb-style. Each reservation renders as a bar that
 * spans its nights and EXTENDS INTO THE MORNING of the checkout day — so at a
 * glance you can see a cabin frees up that morning (10 AM) and schedule cleaners.
 * Bars are labeled with the guest's first name (or "Airbnb"). Tap a bar to mark
 * that turnover cleaned; tap again to undo. Shared by admins and cleaners.
 */

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dayIndex(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const CELL = 100 / 7;

export function CabinCalendar({ onChanged }: { onChanged?: () => void }) {
  const [cabins, setCabins] = useState<StaffCabin[]>([]);
  const [reservations, setReservations] = useState<StaffReservation[]>([]);
  const [cabinId, setCabinId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const now = new Date();
  const [view, setView] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getStaffCalendar();
        if (!alive) return;
        setCabins(data.cabins);
        setReservations(data.reservations);
        setCabinId(prev => prev || data.cabins[0]?.id || '');
      } catch (e: any) {
        if (alive) setError(e?.message || 'Could not load the calendar');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const cabinRes = useMemo(() => reservations.filter(r => r.unitId === cabinId), [reservations, cabinId]);

  async function toggle(r: StaffReservation) {
    setBusyId(r.id);
    const next = !r.cleaned;
    // Optimistic — every reservation sharing this turnover key flips together.
    setReservations(list => list.map(x => x.id === r.id ? { ...x, cleaned: next, cleanedAt: next ? new Date().toISOString() : undefined } : x));
    try {
      await setCleaning(r.unitId, r.end, next);
      onChanged?.();
    } catch (e: any) {
      setReservations(list => list.map(x => x.id === r.id ? { ...x, cleaned: r.cleaned, cleanedAt: r.cleanedAt } : x));
      setError(e?.message || 'Could not update cleaning status');
    } finally {
      setBusyId(null);
    }
  }

  const weeks = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1));
    const startIdx = Math.floor(first.getTime() / 86400000) - first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const lastDayIdx = dayIndex(ymd(view.y, view.m, daysInMonth));
    const rows: { idx: number; inMonth: boolean; day: number }[][] = [];
    let cur = startIdx;
    while (cur <= lastDayIdx || (cur - startIdx) % 7 !== 0) {
      if ((cur - startIdx) % 7 === 0) rows.push([]);
      const dt = new Date(cur * 86400000);
      rows[rows.length - 1].push({ idx: cur, inMonth: dt.getUTCMonth() === view.m, day: dt.getUTCDate() });
      cur++;
      if (rows.length >= 6 && (cur - startIdx) % 7 === 0) break;
    }
    return rows;
  }, [view]);

  function shiftMonth(delta: number) {
    setView(v => {
      const d = new Date(Date.UTC(v.y, v.m + delta, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });
  }

  const COLORS: Record<StaffReservation['kind'], string> = { booking: 'var(--river-blue, #3d6e8a)', airbnb: '#C4694A' };

  if (loading) return <p className="wrs-muted">Loading the calendar…</p>;

  return (
    <div>
      {error && <div className="wrs-note" style={{ borderLeftColor: '#c0392b', marginBottom: 12 }}>{error}</div>}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="wrs-btn wrs-btn-ghost" style={{ padding: '6px 12px' }} onClick={() => shiftMonth(-1)}>←</button>
          <div style={{ fontWeight: 800, fontSize: 18, minWidth: 170, textAlign: 'center' }}>{MONTHS[view.m]} {view.y}</div>
          <button className="wrs-btn wrs-btn-ghost" style={{ padding: '6px 12px' }} onClick={() => shiftMonth(1)}>→</button>
          <button className="wrs-btn wrs-btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setView({ y: now.getFullYear(), m: now.getMonth() })}>Today</button>
        </div>
        <select className="wrs-select" style={{ maxWidth: 260 }} value={cabinId} onChange={e => setCabinId(e.target.value)}>
          {cabins.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <p className="wrs-muted" style={{ marginTop: 0, marginBottom: 12, fontSize: 13 }}>Tap a reservation to mark that turnover cleaned. Tap again to undo.</p>

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--wrs-muted, #6b7c6f)', marginBottom: 4 }}>
        {DOW.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      {/* Weeks */}
      <div style={{ border: '1px solid var(--wrs-line, #e4ddcf)', borderRadius: 10, overflow: 'hidden' }}>
        {weeks.map((week, wi) => {
          const wStart = week[0].idx;
          const wEnd = week[6].idx;
          const bars = cabinRes
            .map(r => ({ r, a: dayIndex(r.start), b: dayIndex(r.end) }))
            .filter(({ a, b }) => a <= wEnd && b >= wStart)
            .map(({ r, a, b }) => {
              const startsHere = a >= wStart;
              const endsHere = b <= wEnd;
              const leftCol = Math.max(a - wStart, 0) + (startsHere ? 0.45 : 0);
              const rightCol = endsHere ? (b - wStart + 0.45) : 7;
              return { r, left: leftCol * CELL, width: Math.max((rightCol - leftCol) * CELL, 3), labeled: startsHere };
            });
          return (
            <div key={wi} style={{ position: 'relative', borderTop: wi ? '1px solid var(--wrs-line, #e4ddcf)' : 'none', minHeight: 78 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((cell, ci) => (
                  <div key={ci} style={{ borderLeft: ci ? '1px solid var(--wrs-line, #f0ebe0)' : 'none', minHeight: 78, padding: '4px 6px', color: cell.inMonth ? 'var(--wrs-ink, #223)' : '#c3c9c0', fontSize: 13, fontWeight: 600 }}>
                    {cell.day}
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', top: 26, left: 0, right: 0, height: 44 }}>
                {bars.map((bar, bi) => {
                  const cleaned = bar.r.cleaned;
                  return (
                    <button
                      key={bi}
                      onClick={() => toggle(bar.r)}
                      disabled={busyId === bar.r.id}
                      title={`${bar.r.label} · ${bar.r.start} → ${bar.r.end}` + (cleaned ? ' · cleaned ✓ (tap to undo)' : ' · tap to mark cleaned')}
                      style={{
                        position: 'absolute', top: bi * 22, left: `${bar.left}%`, width: `${bar.width}%`, height: 20,
                        background: cleaned ? '#2f7a4f' : COLORS[bar.r.kind], color: '#fff', border: cleaned ? '1px solid #1f5c39' : 'none',
                        borderRadius: 10, fontSize: 12, fontWeight: 700, lineHeight: '18px', padding: '0 8px',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left',
                        cursor: busyId === bar.r.id ? 'wait' : 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,.15)',
                        opacity: cleaned ? 0.92 : 1,
                      }}
                    >
                      {bar.labeled ? `${cleaned ? '✓ ' : ''}${bar.r.label}` : (cleaned ? '✓' : '')}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 13, color: 'var(--wrs-muted, #6b7c6f)', flexWrap: 'wrap' }}>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: 'var(--river-blue, #3d6e8a)', marginRight: 6, verticalAlign: 'middle' }} />Direct booking</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#C4694A', marginRight: 6, verticalAlign: 'middle' }} />Airbnb</span>
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#2f7a4f', marginRight: 6, verticalAlign: 'middle' }} />Cleaned ✓</span>
        <span style={{ marginLeft: 'auto' }}>Bars end at the <b>morning of checkout</b> (10 AM).</span>
      </div>
    </div>
  );
}
