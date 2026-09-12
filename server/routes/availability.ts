import express, { Request, Response } from 'express';
import { getAllBookings } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { getUnitUnavailableDates, tentSpotsAvailable } from '../utils/availability';

const router = express.Router();

// GET /api/availability/by-unit?unitId=&start=&end=
// Returns the dates in [start,end) that the unit is already taken.
router.get('/by-unit', async (req: Request, res: Response) => {
  try {
    const { unitId, start, end } = req.query as { unitId?: string; start?: string; end?: string };
    if (!unitId || !start || !end) return res.status(400).json({ error: 'Missing unitId, start, end' });
    const [bookings, units] = await Promise.all([getAllBookings(), getAllUnits()]);
    const unit = units.find(u => u.id === unitId);
    const unavailableDates = getUnitUnavailableDates(unitId, start, end, bookings, unit?.blockedRanges || []);
    res.json({ unitId, start, end, unavailableDates });
  } catch (err) {
    console.error('[AVAIL] by-unit failed:', err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

// GET /api/availability/tent?start=&end=  → min free tent spots across the range
router.get('/tent', async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query as { start?: string; end?: string };
    if (!start || !end) return res.status(400).json({ error: 'Missing start, end' });
    const [bookings, units] = await Promise.all([getAllBookings(), getAllUnits()]);
    const tent = units.find(u => u.unitType === 'tent_site');
    const spots = tentSpotsAvailable(start, end, bookings, tent?.capacity ?? 0);
    res.json({ start, end, spots });
  } catch (err) {
    console.error('[AVAIL] tent failed:', err);
    res.status(500).json({ error: 'Failed to load availability' });
  }
});

export default router;
