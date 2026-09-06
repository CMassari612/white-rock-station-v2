import { getAllUnits } from '../storage/unitsStore';

/**
 * Units are served from the bundled data/units.json (see unitsStore), so there's
 * nothing to seed for the current setup. Kept as a no-op hook for when unit
 * editing / a database is introduced.
 */
export async function seedUnitsIfNeeded(): Promise<void> {
  const existing = await getAllUnits();
  console.log(`Units available: ${existing.length}`);
}
