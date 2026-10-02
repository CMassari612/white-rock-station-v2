import { useEffect, useMemo, useState } from 'react';

// Same-origin in prod; Vite proxies /api in dev.
const API_URL = '';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
// UTC day index so date math never drifts across DST.
function dayIndex(s: string) { const [y, m, d] = s.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 86400000); }

/**
 * Check-in / check-out calendar that greys out and strikes through booked
 * nights (fetched from /api/availability/by-unit) so guests can only pick
 * available dates. Selecting a range that would cross a booked night restarts
 * the selection at the new date.
 */
export function AvailabilityDatePicker({
  unitId, checkIn, checkOut, onChange,
}: {
  unitId: string;
  checkIn: string;
  checkOut: string;
  onChange: (checkIn: string, checkOut: string) => void;
}) {
  const [unavailable, setUnavailable] = useState<Set<string>>(new Set());
  const now = useMemo(() => new Date(), []);
  const today = ymd(now);
  const [view, setView] = useState<{ y: number; m: number }>({ y: now.getFullYear(), m: now.getMonth() });

  useEffect(() => {
    if (!unitId) return;
    const start = today;
    const end = ymd(addDays(now, 365));
    let alive = true;
    fetch(`${API_URL}/api/availability/by-unit?unitId=${encodeURIComponent(unitId)}&start=${start}&end=${end}`)
      .then(r => r.json())
      .then(d => { if (alive) setUnavailable(new Set(d.unavailableDates || [])); })
      .catch(() => { /* availability is best-effort; booking still validates server-side */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const weeks = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const startIdx = Math.floor(Date.UTC(view.y, view.m, 1) / 86400000) - first.getDay();
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const lastIdx = Math.floor(Date.UTC(view.y, view.m, daysInMonth) / 86400000);
    const rows: { date: string; day: number; inMonth: boolean }[][] = [];
    let cur = startIdx;
    while (cur <= lastIdx || (cur - startIdx) % 7 !== 0) {
      if ((cur - startIdx) % 7 === 0) rows.push([]);
      const dt = new Date(cur * 86400000);
      rows[rows.length - 1].push({ date: ymd(new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())), day: dt.getUTCDate(), inMonth: dt.getUTCMonth() === view.m });
      cur++;
      if (rows.length >= 6 && (cur - startIdx) % 7 === 0) break;
    }
    return rows;
  }, [view]);

  function rangeHasUnavailable(a: string, b: string) {
    for (let i = dayIndex(a); i < dayIndex(b); i++) {
      if (unavailable.has(ymd(new Date(i * 86400000 + 12 * 3600000)))) return true;
    }
    return false;
  }

  function clickDay(date: string) {
    if (date < today || unavailable.has(date)) return;
    if (!checkIn || checkOut || date <= checkIn) {
      onChange(date, '');
    } else if (rangeHasUnavailable(checkIn, date)) {
      onChange(date, ''); // range crosses a booked night → restart here
    } else {
      onChange(checkIn, date);
    }
  }

  function shift(delta: number) {
    setView(v => {
      const d = new Date(v.y, v.m + delta, 1);
      const minFirst = new Date(now.getFullYear(), now.getMonth(), 1);
      if (d < minFirst) return v; // don't page before the current month
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  const canGoBack = !(view.y === now.getFullYear() && view.m === now.getMonth());
  const label = checkIn ? (checkOut ? `${checkIn} → ${checkOut}` : `${checkIn} → select checkout`) : 'Select your dates';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" className="wrs-btn wrs-btn-ghost" style={{ padding: '4px 12px', opacity: canGoBack ? 1 : 0.35, pointerEvents: canGoBack ? 'auto' : 'none' }} onClick={() => shift(-1)} aria-label="Previous month">←</button>
        <div style={{ fontWeight: 800 }}>{MONTHS[view.m]} {view.y}</div>
        <button type="button" className="wrs-btn wrs-btn-ghost" style={{ padding: '4px 12px' }} onClick={() => shift(1)} aria-label="Next month">→</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--wrs-muted, #6b7c6f)', marginBottom: 4 }}>
        {DOW.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {weeks.flat().map((cell, i) => {
          const isPast = cell.date < today;
          const isBooked = unavailable.has(cell.date);
          const disabled = isPast || isBooked || !cell.inMonth;
          const isCheckIn = cell.date === checkIn;
          const isCheckOut = cell.date === checkOut;
          const inRange = checkIn && checkOut && cell.date > checkIn && cell.date < checkOut;
          const selected = isCheckIn || isCheckOut;
          let bg = 'transparent', color = cell.inMonth ? 'var(--wrs-ink, #223)' : 'transparent', extra: any = {};
          if (!cell.inMonth) { color = 'transparent'; }
          else if (isPast) { color = '#c3c9c0'; }
          else if (isBooked) { color = '#b9937f'; extra = { textDecoration: 'line-through', background: 'rgba(196,105,74,.10)' }; }
          if (selected) { bg = 'var(--river-blue, #3d6e8a)'; color = '#fff'; }
          else if (inRange) { bg = 'rgba(61,110,138,.16)'; }
          return (
            <button
              type="button"
              key={i}
              disabled={disabled}
              onClick={() => clickDay(cell.date)}
              title={isBooked ? 'Booked' : undefined}
              style={{
                height: 38, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: selected ? 800 : 600,
                background: bg, color, cursor: disabled ? 'default' : 'pointer', ...extra,
              }}
            >
              {cell.inMonth ? cell.day : ''}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: 13 }}>
        <span className="wrs-muted">{label}</span>
        {(checkIn || checkOut) && (
          <button type="button" className="wrs-btn wrs-btn-ghost" style={{ padding: '2px 10px', fontSize: 13 }} onClick={() => onChange('', '')}>Clear</button>
        )}
      </div>
      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--wrs-muted, #6b7c6f)' }}>
        <span style={{ textDecoration: 'line-through', color: '#b9937f' }}>Crossed-out</span> dates are already booked.
      </div>
    </div>
  );
}
