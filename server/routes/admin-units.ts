import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Unit, CreateUnitRequest, UpdateUnitRequest, UnitType, Category } from '../types/unit';
import { getAllUnits, addUnit, updateUnit, deleteUnit } from '../storage/unitsStore';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(requireAdmin);

// GET /api/admin/units - Get all units
router.get('/', async (req: Request, res: Response) => {
  try {
    const units = await getAllUnits();
    res.json({ units });
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// POST /api/admin/units - Create a new unit
router.post('/', async (req: Request<{}, {}, CreateUnitRequest>, res: Response) => {
  try {
    const { name, unitType, category, active, notes } = req.body;

    // Validation
    if (!name || !unitType) {
      return res.status(400).json({ error: 'Missing required fields: name, unitType' });
    }

    // Validate unitType
    const validUnitTypes: UnitType[] = ['small_cabin', 'large_cabin', 'campsite', 'marina_slip'];
    if (!validUnitTypes.includes(unitType)) {
      return res.status(400).json({ error: 'Invalid unitType' });
    }

    // Validate category if provided
    if (category) {
      const validCategories: Category[] = ['cabin', 'campsite', 'marina'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const now = new Date().toISOString();
    const unit: Unit = {
      id: randomUUID(),
      name,
      unitType,
      category: category || getCategoryFromUnitType(unitType),
      active: active !== undefined ? active : true,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    const createdUnit = await addUnit(unit);
    res.status(201).json({ unit: createdUnit });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

// PATCH /api/admin/units/:id - Update a unit
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates: UpdateUnitRequest = req.body;

    // Validate unitType if provided
    if (updates.unitType) {
      const validUnitTypes: UnitType[] = ['small_cabin', 'large_cabin', 'campsite', 'marina_slip'];
      if (!validUnitTypes.includes(updates.unitType)) {
        return res.status(400).json({ error: 'Invalid unitType' });
      }
    }

    // Validate category if provided
    if (updates.category) {
      const validCategories: Category[] = ['cabin', 'campsite', 'marina'];
      if (!validCategories.includes(updates.category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    const updatedUnit = await updateUnit(id, updates);

    if (!updatedUnit) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ unit: updatedUnit });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'Failed to update unit' });
  }
});

// DELETE /api/admin/units/:id - Delete a unit
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteUnit(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Unit not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
});

// Helper function to infer category from unitType
function getCategoryFromUnitType(unitType: UnitType): Category {
  if (unitType === 'small_cabin' || unitType === 'large_cabin') {
    return 'cabin';
  }
  if (unitType === 'campsite') {
    return 'campsite';
  }
  return 'marina';
}

export default router;


