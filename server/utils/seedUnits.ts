import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Unit } from '../types/unit';
import { getAllUnits, addUnit } from '../storage/unitsStore';

/**
 * Seed units from the bundled data/units.json if the store is empty.
 * Idempotent: does nothing when units already exist (local dev reads units.json
 * directly; this mainly matters for a fresh Postgres store in production).
 */
export async function seedUnitsIfNeeded(): Promise<void> {
  const existing = await getAllUnits();
  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing units, skipping seed`);
    return;
  }

  try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const file = path.resolve(__dirname, '..', '..', 'data', 'units.json');
    const seed: Unit[] = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const u of seed) {
      await addUnit(u);
    }
    console.log(`Seeded ${seed.length} units from units.json`);
  } catch (err) {
    console.error('Failed to seed units from units.json:', err);
  }
}
