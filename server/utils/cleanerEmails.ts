import { getAllBookings } from '../storage/bookingsStore';
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

// Weekly look-ahead: email the cleaners the confirmed checkouts for the next 7
// days. Recipients come from CLEANER_EMAILS (comma-separated) or, as a fallback,
// ADMIN_CLEANING_EMAIL. Runs from a weekly cron.
export async function sendWeeklyCleanerDigest(): Promise<{ sent: boolean; count: number }> {
  const recipients = (process.env.CLEANER_EMAILS || process.env.ADMIN_CLEANING_EMAIL || '').trim();
  if (!recipients) {
    console.log('[CLEANER] No CLEANER_EMAILS configured — weekly digest skipped.');
    return { sent: false, count: 0 };
  }

  const today = etTodayYMD();
  const weekEnd = addDays(today, 7);

  const bookings = await getAllBookings();
  const items = bookings
    .filter(b => b.status === 'confirmed' && b.endDate >= today && b.endDate <= weekEnd)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .map(b => ({ date: b.endDate, unitName: b.unitName || b.unitType || 'Cabin', guestName: b.name }));

  await mailCleanerWeekly(recipients, items);
  console.log(`[CLEANER] Weekly digest sent to ${recipients} — ${items.length} checkout(s).`);
  return { sent: true, count: items.length };
}
