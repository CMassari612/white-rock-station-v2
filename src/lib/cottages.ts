// White Rock Station — client-side cottage data + pricing preview.
// Mirrors server/types/unit.ts and server/utils/pricing.ts so the UI can show
// a live price breakdown before hitting the booking API.

// In production the API is served same-origin (/api/*) on Vercel, so we force
// an empty base regardless of VITE_API_URL — a stale/incorrect value in the
// hosting env can't misdirect the frontend. VITE_API_URL only applies in dev.
const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5050')
  : '';

export type UnitType = 'cottage' | 'tent_site' | 'kayak';

export interface Unit {
  id: string;
  slug: string;
  name: string;
  unitType: UnitType;
  group?: string;
  active: boolean;
  placeholder?: boolean;
  tagline?: string;
  shortDescription?: string;
  description?: string;
  location?: string;
  photos?: string[];
  amenities?: string[];
  bedrooms?: number;
  beds?: number;
  baths?: number;
  maxGuests?: number;
  weekdayPriceCents?: number;
  weekendPriceCents?: number;
  cleaningFeeCents?: number;
  taxable?: boolean;
  capacity?: number;
}

export async function getUnits(): Promise<Unit[]> {
  const res = await fetch(`${API_URL}/api/units`);
  if (!res.ok) throw new Error('Failed to load units');
  const data = await res.json();
  return data.units as Unit[];
}

export async function getUnit(slug: string): Promise<Unit | null> {
  const res = await fetch(`${API_URL}/api/units/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load unit');
  const data = await res.json();
  return data.unit as Unit;
}

export interface CreateBookingInput {
  unitId: string;
  startDate: string;
  endDate: string;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  addOns?: { firewood?: number };
  promoCode?: string;
  agreedToTerms: boolean;
}

async function postJson(path: string, body: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function createBooking(input: CreateBookingInput): Promise<{ bookingId: string }> {
  return postJson('/api/booking', input);
}

export async function createCheckoutSession(bookingId: string): Promise<{ url: string }> {
  return postJson('/api/stripe/create-checkout-session', { bookingId });
}

export async function getUnitUnavailableDates(unitId: string, start: string, end: string): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/availability/by-unit?unitId=${encodeURIComponent(unitId)}&start=${start}&end=${end}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.unavailableDates as string[]) || [];
}

export const FIREWOOD_CENTS = 800;

// ── Pricing preview (mirror of server/utils/pricing.ts) ───────────────────────
export const LODGING_TAX_RATE = 0.05;
export const TAX_INCLUDES_CLEANING_FEE = false;

export interface PriceLine {
  label: string;
  amountCents: number;
}
export interface PriceBreakdown {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  lodgingCents: number;
  cleaningFeeCents: number;
  taxCents: number;
  totalCents: number;
  lines: PriceLine[];
}

function parseYMD(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}
function isWeekendNight(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 5 || day === 6; // Fri, Sat
}

export function computePriceBreakdown(unit: Unit, startDate: string, endDate: string): PriceBreakdown | null {
  const start = parseYMD(startDate);
  const end = parseYMD(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return null;

  const weekday = unit.weekdayPriceCents ?? 0;
  const weekend = unit.weekendPriceCents ?? weekday;
  const cleaningFeeCents = unit.cleaningFeeCents ?? 0;

  let weekdayNights = 0;
  let weekendNights = 0;
  let lodgingCents = 0;
  let nights = 0;
  for (let d = new Date(start); d < end; d.setUTCDate(d.getUTCDate() + 1)) {
    nights++;
    if (isWeekendNight(d)) {
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
  if (weekdayNights > 0) lines.push({ label: `Weekday nights (${weekdayNights} × ${dollars(weekday)})`, amountCents: weekdayNights * weekday });
  if (weekendNights > 0) lines.push({ label: `Weekend nights (${weekendNights} × ${dollars(weekend)})`, amountCents: weekendNights * weekend });
  if (cleaningFeeCents > 0) lines.push({ label: 'Cleaning fee', amountCents: cleaningFeeCents });
  if (taxCents > 0) lines.push({ label: 'Lodging tax (5%)', amountCents: taxCents });

  return { nights, weekdayNights, weekendNights, lodgingCents, cleaningFeeCents, taxCents, totalCents, lines };
}

export function dollars(cents: number): string {
  const v = (cents ?? 0) / 100;
  return `$${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

export const CHECK_IN_TIME = '3:00 PM';
export const CHECK_OUT_TIME = '10:00 AM';

export const GUEST_AGREEMENT_TEXT =
  "I agree to abide by White Rock Station's policies and understand that I am financially responsible for any damage caused by me or members of my party beyond normal wear and tear. I authorize White Rock Station to recover reasonable costs for repairs, replacement of damaged or missing items, and excessive cleaning resulting from my stay.";
