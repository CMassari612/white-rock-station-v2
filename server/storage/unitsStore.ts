import { Unit } from '../types/unit';
import { readCollection, writeCollection } from './db';
import unitsSeed from '../../data/units.json';

const UNITS_KEY = 'units';

const SEED = unitsSeed as unknown as Unit[];

/**
 * Units are now DB-backed so admin edits (price, occupancy, date blocks, new
 * listings) persist. On first run the kv_store has no `units` document, so we
 * seed it from the bundled data/units.json and write it back.
 *
 * Safety net: if the datastore is unreachable for any reason, we fall back to
 * the bundled seed so the public site never goes blank.
 */
export async function getAllUnits(): Promise<Unit[]> {
  try {
    const stored = await readCollection<Unit>(UNITS_KEY);
    if (stored && stored.length > 0) return stored;
    // First run — seed the store from the bundled catalog.
    await writeCollection<Unit>(UNITS_KEY, SEED);
    return SEED;
  } catch (err) {
    console.error('[units] datastore read failed, serving bundled seed:', err);
    return SEED;
  }
}

// Save all units
export async function saveAllUnits(units: Unit[]): Promise<void> {
  await writeCollection<Unit>(UNITS_KEY, units);
}

// Add a new unit
export async function addUnit(unit: Unit): Promise<Unit> {
  const units = await getAllUnits();
  units.push(unit);
  await saveAllUnits(units);
  return unit;
}

// Update a unit
export async function updateUnit(id: string, partial: Partial<Unit>): Promise<Unit | null> {
  const units = await getAllUnits();
  const unit = units.find(u => u.id === id);

  if (!unit) {
    return null;
  }

  Object.assign(unit, partial, {
    updatedAt: new Date().toISOString(),
  });

  await saveAllUnits(units);
  return unit;
}

// Delete a unit (removes from storage)
export async function deleteUnit(id: string): Promise<boolean> {
  const units = await getAllUnits();
  const initialLength = units.length;
  const filtered = units.filter(u => u.id !== id);

  if (filtered.length === initialLength) {
    return false; // Unit not found
  }

  await saveAllUnits(filtered);
  return true;
}
