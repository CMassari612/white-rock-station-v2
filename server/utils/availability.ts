// White Rock Station — availability (rework).
// Cottages are unique units (capacity 1 each); the primitive tent area is a
// single capacity pool. Bookings that hold inventory: pending, pending_approval,
// confirmed. Cottages also block one cleaning day after checkout.

import { Booking } from '../types/booking-request';

const HOLD_STATUSES: Booking['status'][] = ['pending', 'pending_approval', 'confirmed'];

// Cottages get a 1-day cleaning gap after checkout (the checkout day itself is
// blocked, so the next guest checks in the following day).
const COTTAGE_CLEANING_DAYS = 1;

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}
function ymd(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
export function addDaysYMD(s: string, n: number): string {
  const d = parseYMD(s);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}
function datesInRange(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = parseYMD(start); d < parseYMD(end); d.setUTCDate(d.getUTCDate() + 1)) out.push(ymd(d));
  return out;
}

// Exclusive end of a booking's blocked window, including cottage cleaning buffer.
function blockedEnd(b: Booking): string {
  return b.unitType === 'cottage' ? addDaysYMD(b.endDate, COTTAGE_CLEANING_DAYS) : b.endDate;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Dates (YYYY-MM-DD) in [start,end) on which a specific unit is already taken. */
export function getUnitUnavailableDates(unitId: string, start: string, end: string, bookings: Booking[]): string[] {
  const holds = bookings.filter(b => b.unitId === unitId && HOLD_STATUSES.includes(b.status));
  return datesInRange(start, end).filter(day =>
    holds.some(b => day >= b.startDate && day < blockedEnd(b))
  );
}

/** True if a specific unit is free for [start,end), accounting for cleaning buffer. */
export function isUnitAvailableForRange(unitId: string, start: string, end: string, bookings: Booking[], isCottage = true): boolean {
  const reqEnd = isCottage ? addDaysYMD(end, COTTAGE_CLEANING_DAYS) : end;
  return !bookings.some(
    b => b.unitId === unitId && HOLD_STATUSES.includes(b.status) && overlaps(start, reqEnd, b.startDate, blockedEnd(b))
  );
}

/** Minimum tent spots free across every night of [start,end) given total capacity. */
export function tentSpotsAvailable(start: string, end: string, bookings: Booking[], capacity: number): number {
  const tentHolds = bookings.filter(b => b.unitType === 'tent_site' && HOLD_STATUSES.includes(b.status));
  let minFree = capacity;
  for (const day of datesInRange(start, end)) {
    const used = tentHolds.filter(b => day >= b.startDate && day < b.endDate).length;
    minFree = Math.min(minFree, capacity - used);
  }
  return minFree;
}
