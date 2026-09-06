import express, { Request, Response } from 'express';
import { requireStaff } from '../middleware/staffAuth';
import { getAllBookings } from '../storage/bookingsStore';
import { getAllCleaners } from '../storage/cleanersStore';
import { addDaysYMD } from '../utils/availability';

const router = express.Router();

// GET /api/staff/cleaning-schedule — cleaners + admins.
// Cleaning = day after checkout for confirmed cottage stays. No financial data.
router.get('/cleaning-schedule', requireStaff, async (_req: Request, res: Response) => {
  const [bookings, cleaners] = await Promise.all([getAllBookings(), getAllCleaners()]);
  const today = new Date().toISOString().slice(0, 10);
  const nameById = new Map(cleaners.map(c => [c.id, c.name]));

  const schedule = bookings
    .filter(b => b.status === 'confirmed' && b.unitType === 'cottage')
    .map(b => ({
      id: b.id,
      unit: b.unitName || 'Cottage',
      checkout: b.endDate,
      cleaning: addDaysYMD(b.endDate, 1),
      cleanerId: b.assignedCleanerId || null,
      cleanerName: b.assignedCleanerId ? (nameById.get(b.assignedCleanerId) || 'Unknown') : null,
    }))
    .filter(r => r.cleaning >= today)
    .sort((a, b) => a.cleaning.localeCompare(b.cleaning));

  res.json({ schedule });
});

export default router;
