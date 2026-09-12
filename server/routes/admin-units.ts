import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requireAdmin } from '../middleware/adminAuth';
import { getAllUnits, saveAllUnits, addUnit, updateUnit, deleteUnit } from '../storage/unitsStore';
import { Unit, BlockedRange, UnitType } from '../types/unit';

const router = express.Router();
router.use(requireAdmin);

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `site-${Date.now()}`;
}

// Fields an admin is allowed to edit on a unit. (id/slug/createdAt are managed.)
const EDITABLE: (keyof Unit)[] = [
  'name', 'group', 'active', 'placeholder', 'tagline', 'shortDescription',
  'description', 'location', 'address', 'photos', 'amenities', 'bedrooms',
  'beds', 'baths', 'maxGuests', 'weekdayPriceCents', 'weekendPriceCents',
  'cleaningFeeCents', 'taxable', 'capacity', 'unitType',
];

function sanitizePatch(body: any): Partial<Unit> {
  const patch: Partial<Unit> = {};
  for (const key of EDITABLE) {
    if (body[key] !== undefined) (patch as any)[key] = body[key];
  }
  // Coerce numeric money/occupancy fields to integers.
  for (const k of ['weekdayPriceCents', 'weekendPriceCents', 'cleaningFeeCents', 'maxGuests', 'bedrooms', 'beds', 'baths', 'capacity'] as const) {
    if (patch[k] !== undefined) (patch as any)[k] = Math.max(0, Math.trunc(Number(patch[k]) || 0));
  }
  return patch;
}

// GET /api/admin/units — all units incl. inactive, with blocks
router.get('/', async (_req: Request, res: Response) => {
  const units = await getAllUnits();
  res.json({ units });
});

// POST /api/admin/units — create a new listing ("Add Site")
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ error: 'A site name is required.' });
    }
    const units = await getAllUnits();
    let slug = slugify(body.slug || body.name);
    // ensure unique slug/id
    const existing = new Set(units.map(u => u.slug));
    if (existing.has(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const now = new Date().toISOString();
    const patch = sanitizePatch(body);
    const unitType: UnitType = (body.unitType as UnitType) || 'cottage';
    const unit: Unit = {
      id: slug,
      slug,
      name: String(body.name).trim(),
      unitType,
      active: body.active !== false,
      taxable: body.taxable ?? (unitType === 'cottage'),
      maxGuests: patch.maxGuests ?? 2,
      bedrooms: patch.bedrooms ?? 0,
      beds: patch.beds ?? 1,
      baths: patch.baths ?? 1,
      weekdayPriceCents: patch.weekdayPriceCents ?? 0,
      weekendPriceCents: patch.weekendPriceCents ?? 0,
      cleaningFeeCents: patch.cleaningFeeCents ?? 0,
      photos: patch.photos ?? [],
      amenities: patch.amenities ?? [],
      blockedRanges: [],
      createdAt: now,
      updatedAt: now,
      ...patch,
    };
    await addUnit(unit);
    res.status(201).json({ unit });
  } catch (err) {
    console.error('[ADMIN units] create failed:', err);
    res.status(500).json({ error: 'Could not create the site.' });
  }
});

// PATCH /api/admin/units/:id — edit price, occupancy, marketing, etc.
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const patch = sanitizePatch(req.body || {});
    const updated = await updateUnit(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Site not found.' });
    res.json({ unit: updated });
  } catch (err) {
    console.error('[ADMIN units] update failed:', err);
    res.status(500).json({ error: 'Could not update the site.' });
  }
});

// DELETE /api/admin/units/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await deleteUnit(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Site not found.' });
  res.json({ ok: true });
});

// POST /api/admin/units/:id/blocks — add a manual date block { start, end, reason }
router.post('/:id/blocks', async (req: Request, res: Response) => {
  try {
    const { start, end, reason } = req.body || {};
    if (!start || !end) return res.status(400).json({ error: 'start and end dates are required.' });
    if (start > end) return res.status(400).json({ error: 'end must be on or after start.' });
    const units = await getAllUnits();
    const unit = units.find(u => u.id === req.params.id);
    if (!unit) return res.status(404).json({ error: 'Site not found.' });
    const block: BlockedRange = {
      id: randomUUID(),
      start, end,
      reason: (reason || '').trim() || undefined,
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    unit.blockedRanges = [...(unit.blockedRanges || []), block];
    unit.updatedAt = new Date().toISOString();
    await saveAllUnits(units);
    res.status(201).json({ unit });
  } catch (err) {
    console.error('[ADMIN units] add block failed:', err);
    res.status(500).json({ error: 'Could not add the date block.' });
  }
});

// DELETE /api/admin/units/:id/blocks/:blockId
router.delete('/:id/blocks/:blockId', async (req: Request, res: Response) => {
  const units = await getAllUnits();
  const unit = units.find(u => u.id === req.params.id);
  if (!unit) return res.status(404).json({ error: 'Site not found.' });
  const before = (unit.blockedRanges || []).length;
  unit.blockedRanges = (unit.blockedRanges || []).filter(b => b.id !== req.params.blockId);
  if (unit.blockedRanges.length === before) return res.status(404).json({ error: 'Block not found.' });
  unit.updatedAt = new Date().toISOString();
  await saveAllUnits(units);
  res.json({ unit });
});

// POST /api/admin/winter-closure — block a date range across many units at once.
// Body: { start, end, unitIds?: string[], reason? }. Omitting unitIds blocks all
// active bookable units (cottages + tent sites, not placeholders).
router.post('/winter-closure', async (req: Request, res: Response) => {
  try {
    const { start, end, unitIds, reason } = req.body || {};
    if (!start || !end) return res.status(400).json({ error: 'start and end dates are required.' });
    if (start > end) return res.status(400).json({ error: 'end must be on or after start.' });
    const units = await getAllUnits();
    const targetIds: string[] = Array.isArray(unitIds) && unitIds.length
      ? unitIds
      : units.filter(u => u.active && !u.placeholder && u.unitType !== 'kayak').map(u => u.id);
    const now = new Date().toISOString();
    let applied = 0;
    for (const unit of units) {
      if (!targetIds.includes(unit.id)) continue;
      const block: BlockedRange = {
        id: randomUUID(),
        start, end,
        reason: (reason || 'Winter closure').trim(),
        source: 'winter',
        createdAt: now,
      };
      unit.blockedRanges = [...(unit.blockedRanges || []), block];
      unit.updatedAt = now;
      applied++;
    }
    await saveAllUnits(units);
    res.json({ applied, unitIds: targetIds });
  } catch (err) {
    console.error('[ADMIN units] winter closure failed:', err);
    res.status(500).json({ error: 'Could not apply the winter closure.' });
  }
});

export default router;
