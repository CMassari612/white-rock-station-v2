import { getAllBookings } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { mailCleanerWeekly } from './mailer';

// Today's date in America/New_York as YYYY-MM-DD (en-CA formats that way).
function etTodayYMD(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

const firstName = (full: string) => (full || '').trim().split(/\s+/)[0] || 'Guest';

// Weekly look-ahead: email the cleaners the checkouts (direct bookings + Airbnb)
// for the next 7 days. Recipients come from CLEANER_EMAILS (comma-separated) or,
// as a fallback, ADMIN_CLEANING_EMAIL. Pass `overrideTo` to send a one-off test
// to a specific address regardless of the configured recipients.
export async function sendWeeklyCleanerDigest(overrideTo?: string): Promise<{ sent: boolean; count: number; to: string }> {
  const recipients = (overrideTo || process.env.CLEANER_EMAILS || process.env.ADMIN_CLEANING_EMAIL || '').trim();
  if (!recipients) {
    console.log('[CLEANER] No recipients configured — weekly digest skipped.');
    return { sent: false, count: 0, to: '' };
  }

  const today = etTodayYMD();
  const weekEnd = addDays(today, 7);

  const [bookings, units] = await Promise.all([getAllBookings(), getAllUnits()]);
  const unitById = new Map(units.map(u => [u.id, u]));

  type Item = { date: string; unitName: string; guestName?: string };
  const items: Item[] = [];

  for (const b of bookings) {
    if (b.status !== 'confirmed' || b.unitType !== 'cottage') continue;
    if (b.endDate < today || b.endDate > weekEnd) continue;
    items.push({ date: b.endDate, unitName: b.unitName || unitById.get(b.unitId)?.name || 'Cottage', guestName: firstName(b.name) });
  }
  for (const u of units) {
    if (u.unitType !== 'cottage') continue;
    for (const r of (u.blockedRanges || [])) {
      if ((r as any).source !== 'airbnb') continue;
      if (r.end < today || r.end > weekEnd) continue;
      items.push({ date: r.end, unitName: u.name, guestName: 'Airbnb' });
    }
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  await mailCleanerWeekly(recipients, items);
  console.log(`[CLEANER] Weekly digest sent to ${recipients} — ${items.length} checkout(s).`);
  return { sent: true, count: items.length, to: recipients };
}
