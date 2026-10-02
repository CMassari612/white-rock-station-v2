import express, { Request, Response } from 'express';
import { requireStaff, resolveRole } from '../middleware/staffAuth';
import { getAllBookings } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { getAllCleanings, setCleaning, cleaningKey } from '../storage/cleaningsStore';

const router = express.Router();

// Property default address if a specific unit has no address set.
const PROPERTY_ADDRESS = '395 Silvis Hollow Rd, Kittanning, PA 16201';

type ResKind = 'booking' | 'airbnb';
interface CalReservation {
  id: string;        // stable per turnover: `${unitId}|${checkout}`
  unitId: string;
  unitName: string;
  address: string;
  start: string;     // check-in (YYYY-MM-DD)
  end: string;       // checkout (YYYY-MM-DD) — the morning the cabin frees up
  kind: ResKind;
  label: string;     // guest first name + party size, or "Airbnb"
  cleaned: boolean;
  cleanedAt?: string;
}

const firstName = (full: string) => (full || '').trim().split(/\s+/)[0] || 'Guest';

// Build the full reservation list (direct confirmed bookings + Airbnb blocks) for
// every cottage, joined with the cleaned-status marks. Shared by the calendar and
// the cleaning-schedule list so the two always agree.
async function buildReservations(): Promise<{ cottages: { id: string; name: string }[]; reservations: CalReservation[] }> {
  const [bookings, units, cleanings] = await Promise.all([getAllBookings(), getAllUnits(), getAllCleanings()]);
  const cottages = units.filter(u => u.unitType === 'cottage');
  const unitById = new Map(units.map(u => [u.id, u]));
  const cleanedByKey = new Map(cleanings.map(c => [c.key, c]));

  const reservations: CalReservation[] = [];

  for (const b of bookings) {
    if (b.status !== 'confirmed' || b.unitType !== 'cottage') continue;
    const unit = unitById.get(b.unitId);
    const key = cleaningKey(b.unitId, b.endDate);
    const mark = cleanedByKey.get(key);
    reservations.push({
      id: key,
      unitId: b.unitId,
      unitName: b.unitName || unit?.name || 'Cottage',
      address: unit?.address || PROPERTY_ADDRESS,
      start: b.startDate,
      end: b.endDate,
      kind: 'booking',
      label: (b.guests && b.guests > 1) ? `${firstName(b.name)} · ${b.guests}` : firstName(b.name),
      cleaned: Boolean(mark),
      cleanedAt: mark?.cleanedAt,
    });
  }

  for (const u of cottages) {
    for (const r of (u.blockedRanges || [])) {
      if ((r as any).source !== 'airbnb') continue;
      const key = cleaningKey(u.id, r.end);
      const mark = cleanedByKey.get(key);
      reservations.push({
        id: key,
        unitId: u.id,
        unitName: u.name,
        address: u.address || PROPERTY_ADDRESS,
        start: r.start,
        end: r.end,
        kind: 'airbnb',
        label: 'Airbnb',
        cleaned: Boolean(mark),
        cleanedAt: mark?.cleanedAt,
      });
    }
  }

  return { cottages: cottages.map(u => ({ id: u.id, name: u.name })), reservations };
}

// GET /api/staff/calendar — cleaners + admins. Per-cabin reservation bars with
// cleaned status, for the Airbnb-style calendar.
router.get('/calendar', requireStaff, async (_req: Request, res: Response) => {
  const { cottages, reservations } = await buildReservations();
  res.json({ cabins: cottages, reservations });
});

// GET /api/staff/cleaning-schedule — cleaners + admins. Upcoming checkouts to
// clean (site + address + checkout date + cleaned status). No pricing/controls.
router.get('/cleaning-schedule', requireStaff, async (_req: Request, res: Response) => {
  const today = new Date().toISOString().slice(0, 10);
  const { reservations } = await buildReservations();
  const schedule = reservations
    .filter(r => r.end >= today)
    .sort((a, b) => a.end.localeCompare(b.end))
    .map(r => ({
      id: r.id,
      unitId: r.unitId,
      site: r.unitName,
      address: r.address,
      checkout: r.end,
      cleaned: r.cleaned,
      cleanedAt: r.cleanedAt,
    }));
  res.json({ schedule });
});

// POST /api/staff/cleanings — cleaners + admins. Mark/unmark a turnover cleaned.
// Body: { unitId, checkout, cleaned }.
router.post('/cleanings', requireStaff, async (req: Request, res: Response) => {
  const { unitId, checkout, cleaned } = req.body || {};
  if (!unitId || !checkout) { res.status(400).json({ error: 'unitId and checkout are required' }); return; }
  let by = 'staff';
  try {
    const { role, cleaner } = await resolveRole((req.get('x-admin-password') || '').trim());
    by = cleaner?.name || role || 'staff';
  } catch { /* best-effort attribution */ }
  await setCleaning(String(unitId), String(checkout), Boolean(cleaned), by);
  res.json({ ok: true, unitId, checkout, cleaned: Boolean(cleaned) });
});

export default router;
