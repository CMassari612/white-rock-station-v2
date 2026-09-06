import express, { Request, Response } from 'express';
import { getAllUnits } from '../storage/unitsStore';

const router = express.Router();

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
