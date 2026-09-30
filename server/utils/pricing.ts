// White Rock Station — pricing engine (rework)
// Per-night weekday (Mon–Thu) / weekend (Fri–Sun) rates from the unit,
// a separate cleaning fee, and a 6% PA hotel occupancy tax on cottages
// (primitive tent camping is NOT taxed).

import { Unit } from '../types/unit';

// 6% PA state hotel occupancy tax. (Armstrong County adds no local sales/hotel
// surcharge; bump this only if the county confirms a local lodging tax.)
export const LODGING_TAX_RATE = 0.06;

// PA taxes cleaning fees as part of the accommodation charge, so the tax applies
// to the nightly subtotal + cleaning fee.
export const TAX_INCLUDES_CLEANING_FEE = true;

export interface PriceLine {
  label: string;
  amountCents: number;
}

export interface PriceBreakdown {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  lodgingCents: number; // sum of nightly rates
  cleaningFeeCents: number;
  taxCents: number;
  totalCents: number;
  currency: 'usd';
  lines: PriceLine[];
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

// A night is identified by its check-in date. Fri (5), Sat (6), Sun (0) are weekend nights.
function isWeekendNight(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 5 || day === 6 || day === 0;
}

/**
 * List the nights in a stay as [start, end) — one entry per night, keyed by the
 * date the guest sleeps there. Checkout day is not a night.
 */
export function nightsInRange(startDate: string, endDate: string): Date[] {
  const start = parseYMD(startDate);
  const end = parseYMD(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) throw new Error('Invalid date format');
  if (start >= end) throw new Error('End date must be after start date');
  const nights: Date[] = [];
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    nights.push(new Date(d));
  }
  return nights;
}

/**
 * Compute a full price breakdown for a stay in a given unit.
 * @param unit The unit being booked (provides nightly rates, cleaning fee, taxable flag)
 * @param startDate check-in (YYYY-MM-DD)
 * @param endDate checkout (YYYY-MM-DD)
 * @param guests optional (reserved for future per-guest fees)
 */
export function computePriceBreakdown(
  unit: Pick<Unit, 'name' | 'weekdayPriceCents' | 'weekendPriceCents' | 'cleaningFeeCents' | 'taxable'>,
  startDate: string,
  endDate: string
): PriceBreakdown {
  const weekday = unit.weekdayPriceCents ?? 0;
  const weekend = unit.weekendPriceCents ?? weekday;
  const cleaningFeeCents = unit.cleaningFeeCents ?? 0;

  const nights = nightsInRange(startDate, endDate);
  let weekdayNights = 0;
  let weekendNights = 0;
  let lodgingCents = 0;
  for (const night of nights) {
    if (isWeekendNight(night)) {
      weekendNights++;
      lodgingCents += weekend;
    } else {
      weekdayNights++;
      lodgingCents += weekday;
    }
  }

  const taxableBase = unit.taxable
    ? lodgingCents + (TAX_INCLUDES_CLEANING_FEE ? cleaningFeeCents : 0)
    : 0;
  const taxCents = Math.round(taxableBase * LODGING_TAX_RATE);

  const totalCents = lodgingCents + cleaningFeeCents + taxCents;

  const lines: PriceLine[] = [];
  if (weekdayNights > 0) {
    lines.push({ label: `Mon–Thu nights (${weekdayNights} × $${(weekday / 100).toFixed(0)})`, amountCents: weekdayNights * weekday });
  }
  if (weekendNights > 0) {
    lines.push({ label: `Fri–Sun nights (${weekendNights} × $${(weekend / 100).toFixed(0)})`, amountCents: weekendNights * weekend });
  }
  if (cleaningFeeCents > 0) {
    lines.push({ label: 'Cleaning fee', amountCents: cleaningFeeCents });
  }
  if (taxCents > 0) {
    lines.push({ label: 'Lodging tax (6%)', amountCents: taxCents });
  }

  return {
    nights: nights.length,
    weekdayNights,
    weekendNights,
    lodgingCents,
    cleaningFeeCents,
    taxCents,
    totalCents,
    currency: 'usd',
    lines,
  };
}
