import express, { Request, Response } from 'express';
import { getAllUnits } from '../storage/unitsStore';
import { getAllBookings } from '../storage/bookingsStore';
import { generateUnitIcs } from '../utils/ical';

const router = express.Router();

// GET /api/units/:id/calendar.ics — public iCal feed of this unit's reserved +
// blocked dates. Paste this URL into Airbnb's "Import calendar" for the listing.
router.get('/:id/calendar.ics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [units, bookings] = await Promise.all([getAllUnits(), getAllBookings()]);
    const unit = units.find(u => u.id === id || u.slug === id);
    if (!unit) return res.status(404).send('Not found');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${unit.slug}.ics"`);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(generateUnitIcs(unit, bookings));
  } catch (err) {
    console.error('[CAL] export failed:', err);
    res.status(500).send('Calendar error');
  }
});

// GET /api/units — public list of active, bookable/visible units (cottages, tent, kayak)
router.get('/', async (_req: Request, res: Response) => {
  try {
    const units = (await getAllUnits()).filter(u => u.active);
    res.json({ units });
  } catch (err) {
    console.error('[UNITS] Failed to list units:', err);
    res.status(500).json({ error: 'Failed to load units' });
  }
});

// GET /api/units/:slug — a single unit by slug (or id)
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const units = await getAllUnits();
    const unit = units.find(u => u.slug === slug || u.id === slug);
    if (!unit || !unit.active) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    res.json({ unit });
  } catch (err) {
    console.error('[UNITS] Failed to get unit:', err);
    res.status(500).json({ error: 'Failed to load unit' });
  }
});

export default router;
