import { readCollection, writeCollection } from './db';

/**
 * Tracks which turnovers (a cabin's checkout on a given date) have been cleaned.
 * Keyed by unitId + checkout date so it's stable across Airbnb re-syncs (where a
 * blocked-range id can change) and independent of whether the stay was a direct
 * booking or an Airbnb reservation.
 */
export interface CleaningMark {
  key: string;        // `${unitId}|${checkout}`
  unitId: string;
  checkout: string;   // YYYY-MM-DD checkout date
  cleanedAt: string;  // ISO timestamp
  by?: string;        // role/name that marked it (best-effort)
}

const KEY = 'cleanings';

export function cleaningKey(unitId: string, checkout: string): string {
  return `${unitId}|${checkout}`;
}

export async function getAllCleanings(): Promise<CleaningMark[]> {
  return readCollection<CleaningMark>(KEY);
}

/** Toggle a turnover's cleaned state. Returns the full updated list. */
export async function setCleaning(unitId: string, checkout: string, cleaned: boolean, by?: string): Promise<CleaningMark[]> {
  const key = cleaningKey(unitId, checkout);
  const all = await getAllCleanings();
  const idx = all.findIndex(c => c.key === key);
  if (cleaned) {
    const mark: CleaningMark = { key, unitId, checkout, cleanedAt: new Date().toISOString(), by };
    if (idx === -1) all.push(mark); else all[idx] = mark;
  } else if (idx !== -1) {
    all.splice(idx, 1);
  }
  await writeCollection(KEY, all);
  return all;
}
