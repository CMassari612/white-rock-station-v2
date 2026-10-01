import { useMemo, useState } from 'react';
import { AdminBooking, AdminUnit } from '../../lib/adminApi';

/**
 * Per-cabin month calendar, Airbnb-style. Each reservation renders as a bar
 * that spans its nights and EXTENDS INTO THE MORNING of the checkout day — so
 * at a glance you can see a cabin frees up that morning (10 AM) and schedule
 * cleaners. Bars are labeled with the guest name. Reservations come from direct
 * bookings (status "confirmed") and Airbnb-synced blocks on the unit.
 */

type Res = { start: string; end: string; label: string; kind: 'booking' | 'airbnb' | 'block' };

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// 'YYYY-MM-DD' → epoch day index (UTC), so day math never drifts across TZ/DST.
function dayIndex(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
function ymd(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const CELL = 100 / 7;

export function CabinCalendar({ units, bookings }: { units: AdminUnit[]; bookings: AdminBooking[] }) {
  const cabins = useMemo(() => units.filter(u => (u as any).unitType ? (u as any).unitType === 'cottage' : true), [units]);
  const [cabinId, setCabinId] = useState<string>(() => cabins[0]?.id || '');
  const now = new Date();
  const [view, setView] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() });

  const unit = cabins.find(u => u.id === cabinId) || units.find(u => u.id === cabinId);

  const reservations: Res[] = useMemo(() => {
    if (!cabinId) return [];
    const out: Res[] = [];
    for (const b of bookings) {
      if (b.unitId !== cabinId || b.status !== 'confirmed') continue;
      const label = b.guests && b.guests > 1 ? `${b.name} · ${b.guests}` : b.name;
      out.push({ start: b.startDate, end: b.endDate, label, kind: 'booking' });
    }
    for (const r of (unit?.blockedRanges || [])) {
      const src = (r as any).source;
      if (src === 'airbnb') out.push({ start: r.start, end: r.end, label: 'Airbnb', kind: 'airbnb' });
      else out.push({ start: r.start, end: r.end, label: r.reason || 'Blocked', kind: 'block' });
    }
    return out;
  }, [bookings, unit, cabinId]);

  // Build the month grid: weeks starting Sunday, covering all days of the month.
  const weeks = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1));
    const startIdx = Math.floor(first.getTime() / 86400000) - first.getUTCDay(); // back up to Sunday
    const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const lastDayIdx = dayIndex(ymd(view.y, view.m, daysInMonth));
    const rows: { idx: number; inMonth: boolean; day: number }[][] = [];
    let cur = startIdx;
    while (cur <= lastDayIdx || rows.length < 1 || (cur - startIdx) % 7 !== 0) {
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

  const COLORS: Record<Res['kind'], { bg: string; fg: string }> = {
    booking: { bg: 'var(--river-blue, #3d6e8a)', fg: '#fff' },
    airbnb: { bg: '#C4694A', fg: '#fff' },
    block: { bg: '#9aa0a6', fg: '#fff' },
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
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

      {/* Weekday header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--wrs-muted, #6b7c6f)', marginBottom: 4 }}>
        {DOW.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      {/* Weeks */}
      <div style={{ border: '1px solid var(--wrs-line, #e4ddcf)', borderRadius: 10, overflow: 'hidden' }}>
        {weeks.map((week, wi) => {
          const wStart = week[0].idx;
          const wEnd = week[6].idx;
          const bars = reservations
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
              {/* day number cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {week.map((cell, ci) => (
                  <div key={ci} style={{ borderLeft: ci ? '1px solid var(--wrs-line, #f0ebe0)' : 'none', minHeight: 78, padding: '4px 6px', color: cell.inMonth ? 'var(--wrs-ink, #223)' : '#c3c9c0', fontSize: 13, fontWeight: 600 }}>
                    {cell.day}
                  </div>
                ))}
              </div>
              {/* reservation bars overlaid */}
              <div style={{ position: 'absolute', top: 26, left: 0, right: 0, height: 44 }}>
                {bars.map((bar, bi) => {
                  const c = COLORS[bar.r.kind];
                  return (
                    <div
                      key={bi}
                      title={`${bar.r.label} · ${bar.r.start} → ${bar.r.end}`}
                      style={{
                        position: 'absolute', top: bi * 22, left: `${bar.left}%`, width: `${bar.width}%`, height: 20,
                        background: c.bg, color: c.fg, borderRadius: 10, fontSize: 12, fontWeight: 700,
                        lineHeight: '20px', padding: '0 8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        boxShadow: '0 1px 2px rgba(0,0,0,.15)',
                      }}
                    >
                      {bar.labeled ? bar.r.label : ''}
                    </div>
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
        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#9aa0a6', marginRight: 6, verticalAlign: 'middle' }} />Blocked / closed</span>
        <span style={{ marginLeft: 'auto' }}>Bars end at the <b>morning of checkout</b> (10 AM).</span>
      </div>
    </div>
  );
}
