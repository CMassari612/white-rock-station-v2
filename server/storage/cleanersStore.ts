import { Cleaner } from '../types/cleaner';
import { readCollection, writeCollection } from './db';

const KEY = 'cleaners';

export async function getAllCleaners(): Promise<Cleaner[]> {
  return readCollection<Cleaner>(KEY);
}
export async function saveAllCleaners(c: Cleaner[]): Promise<void> {
  await writeCollection<Cleaner>(KEY, c);
}
export async function addCleaner(c: Cleaner): Promise<Cleaner> {
  const all = await getAllCleaners();
  all.push(c);
  await saveAllCleaners(all);
  return c;
}
export async function updateCleaner(id: string, partial: Partial<Cleaner>): Promise<Cleaner | null> {
  const all = await getAllCleaners();
  const c = all.find(x => x.id === id);
  if (!c) return null;
  Object.assign(c, partial);
  await saveAllCleaners(all);
  return c;
}
export async function deleteCleaner(id: string): Promise<boolean> {
  const all = await getAllCleaners();
  const filtered = all.filter(c => c.id !== id);
  if (filtered.length === all.length) return false;
  await saveAllCleaners(filtered);
  return true;
}
