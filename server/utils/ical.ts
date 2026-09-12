// Minimal iCal (RFC 5545) generation + parsing for Airbnb two-way sync.
// No external dependency — Airbnb's feeds are all-day VEVENTs with DATE values.

import { Unit } from '../types/unit';
import { Booking } from '../types/booking-request';

const HOLD_STATUSES = ['pending', 'pending_approval', 'confirmed'];

function ymdToIcs(ymd: string): string { return ymd.replace(/-/g, ''); }
function icsToYmd(ics: string): string { return `${ics.slice(0, 4)}-${ics.slice(4, 6)}-${ics.slice(6, 8)}`; }
function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
function stamp(): string { return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; }

/** Build the iCal feed for a unit: its holding bookings + manual/winter blocks.
 *  DTEND is exclusive (checkout day), matching how Airbnb reads calendars. */
export function generateUnitIcs(unit: Unit, bookings: Booking[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//White Rock Station//Booking//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${unit.name} — White Rock Station`,
  ];
  const event = (uid: string, startYmd: string, endExclusiveYmd: string, summary: string) => {
    lines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${stamp()}`,
      `DTSTART;VALUE=DATE:${ymdToIcs(startYmd)}`, `DTEND;VALUE=DATE:${ymdToIcs(endExclusiveYmd)}`,
      `SUMMARY:${summary}`, 'END:VEVENT');
  };
  for (const b of bookings) {
    if (b.unitId !== unit.id || !HOLD_STATUSES.includes(b.status)) continue;
    event(`wrs-booking-${b.id}@whiterockstation`, b.startDate, b.endDate, 'Reserved — White Rock Station');
  }
  for (const bl of (unit.blockedRanges || [])) {
    if (bl.source === 'airbnb') continue; // don't echo Airbnb's own blocks back to it
    event(`wrs-block-${bl.id}@whiterockstation`, bl.start, addDays(bl.end, 1), bl.reason || 'Blocked');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}

export interface ParsedRange { start: string; end: string } // inclusive nights [start, end]

/** Parse an iCal feed into inclusive night ranges. DTEND is exclusive, so the
 *  last occupied night is DTEND − 1 day. */
export function parseIcsToRanges(text: string): ParsedRange[] {
  const out: ParsedRange[] = [];
  const chunks = text.split('BEGIN:VEVENT').slice(1);
  for (const c of chunks) {
    const ds = /DTSTART[^:\n]*:(\d{8})/.exec(c);
    const de = /DTEND[^:\n]*:(\d{8})/.exec(c);
    if (!ds) continue;
    const start = icsToYmd(ds[1]);
    let end = de ? addDays(icsToYmd(de[1]), -1) : start;
    if (end < start) end = start;
    out.push({ start, end });
  }
  return out;
}
