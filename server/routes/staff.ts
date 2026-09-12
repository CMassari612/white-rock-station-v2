import express, { Request, Response } from 'express';
import { requireStaff } from '../middleware/staffAuth';
import { getAllBookings } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';

const router = express.Router();

// Property default address if a specific unit has no address set.
const PROPERTY_ADDRESS = '395 Silvis Hollow Rd, Kittanning, PA 16201';

// GET /api/staff/cleaning-schedule — cleaners + admins.
// Read-only cleaner view: ONLY the site (which cottage) + its address + the
// checkout date. No guest names, no pricing, no booking controls. The cleaning
// company runs its own ticketing beyond this list.
router.get('/cleaning-schedule', requireStaff, async (_req: Request, res: Response) => {
  const [bookings, units] = await Promise.all([getAllBookings(), getAllUnits()]);
  const today = new Date().toISOString().slice(0, 10);
  const unitById = new Map(units.map(u => [u.id, u]));

  const schedule = bookings
    .filter(b => b.status === 'confirmed' && b.unitType === 'cottage')
    .filter(b => b.endDate >= today)
    .map(b => {
      const unit = unitById.get(b.unitId);
      return {
        id: b.id,
        site: b.unitName || unit?.name || 'Cottage',
        address: unit?.address || PROPERTY_ADDRESS,
        checkout: b.endDate,
      };
    })
    .sort((a, b) => a.checkout.localeCompare(b.checkout));

  res.json({ schedule });
});

export default router;
