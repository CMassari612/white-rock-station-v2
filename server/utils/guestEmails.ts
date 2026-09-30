import { getAllBookings, saveAllBookings } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { mailGuestDirections, mailGuestCheckinDay } from './mailer';

// Current date/hour in Eastern time (the resort's timezone), so "tomorrow" and
// the 3 PM cutoff are correct regardless of where the server runs (Vercel = UTC).
function etNow(): { today: string; tomorrow: string; hour: number } {
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const tomorrow = new Date(nowET);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today: fmt(nowET), tomorrow: fmt(tomorrow), hour: nowET.getHours() };
}

/**
 * Sends the two time-based guest emails, once each:
 *  - Directions (EMAIL 3): the day before check-in.
 *  - Day-of check-in (EMAIL 4): on the arrival day, from 3 PM ET onward.
 * Idempotent — a per-booking timestamp flag prevents duplicates.
 */
export async function sendScheduledGuestEmails(): Promise<{ directions: number; checkinDay: number }> {
  const { today, tomorrow, hour } = etNow();
  const [bookings, units] = await Promise.all([getAllBookings(), getAllUnits()]);
  let directions = 0;
  let checkinDay = 0;
  let changed = false;

  for (const b of bookings) {
    if (b.status !== 'confirmed') continue;
    const unit = units.find(u => u.id === b.unitId);

    if (b.startDate === tomorrow && !b.directionsSentAt) {
      await mailGuestDirections(b, {
        address: unit?.address,
        directions: unit?.directions,
        mapImageUrl: unit?.mapImageUrl,
        parkingImageUrl: unit?.parkingImageUrl,
      });
      b.directionsSentAt = new Date().toISOString();
      directions++; changed = true;
    }

    if (b.startDate === today && hour >= 15 && !b.checkinDaySentAt) {
      await mailGuestCheckinDay(b);
      b.checkinDaySentAt = new Date().toISOString();
      checkinDay++; changed = true;
    }
  }

  if (changed) await saveAllBookings(bookings);
  return { directions, checkinDay };
}
