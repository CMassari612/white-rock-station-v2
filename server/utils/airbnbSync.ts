// Airbnb → WRS import: fetch a unit's Airbnb iCal feed and store the booked
// dates as 'airbnb'-sourced blocks so those dates can't be double-booked here.

import { randomUUID } from 'crypto';
import { getAllUnits, saveAllUnits } from '../storage/unitsStore';
import { parseIcsToRanges } from './ical';
import { BlockedRange, Unit } from '../types/unit';

/** Sync one unit in place (does not persist). Replaces its prior 'airbnb'
 *  blocks with the current feed, so Airbnb cancellations free the dates here. */
export async function syncUnitAirbnb(unit: Unit): Promise<{ imported: number }> {
  if (!unit.airbnbIcalUrl) return { imported: 0 };
  const res = await fetch(unit.airbnbIcalUrl, { headers: { 'User-Agent': 'WhiteRockStation/1.0 (+calendar-sync)' } });
  if (!res.ok) throw new Error(`Airbnb feed returned ${res.status}`);
  const text = await res.text();
  const ranges = parseIcsToRanges(text);
  const now = new Date().toISOString();
  const kept = (unit.blockedRanges || []).filter(b => b.source !== 'airbnb');
  const fresh: BlockedRange[] = ranges.map(r => ({
    id: randomUUID(), start: r.start, end: r.end, reason: 'Airbnb', source: 'airbnb', createdAt: now,
  }));
  unit.blockedRanges = [...kept, ...fresh];
  unit.airbnbSyncedAt = now;
  unit.updatedAt = now;
  return { imported: fresh.length };
}

/** Sync every unit that has an Airbnb iCal URL, then persist once. */
export async function syncAllAirbnb(): Promise<{ units: number; imported: number; errors: string[] }> {
  const units = await getAllUnits();
  let count = 0, imported = 0;
  const errors: string[] = [];
  for (const u of units) {
    if (!u.airbnbIcalUrl) continue;
    count++;
    try { imported += (await syncUnitAirbnb(u)).imported; }
    catch (e: any) { errors.push(`${u.id}: ${String(e?.message || e).slice(0, 100)}`); }
  }
  if (count > 0) await saveAllUnits(units);
  return { units: count, imported, errors };
}
