import { Unit } from '../types/unit';
import { readCollection, writeCollection } from './db';
import unitsSeed from '../../data/units.json';

const UNITS_KEY = 'units';

// Units are static content for now (no admin editing yet), so we read them from
// the bundled seed. This is bulletproof on serverless (no DB/filesystem needed).
// When admin unit-editing is added, switch this back to the kv store.
export async function getAllUnits(): Promise<Unit[]> {
  return unitsSeed as unknown as Unit[];
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


