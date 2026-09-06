import { promises as fs } from 'fs';
import path from 'path';

/**
 * Shared persistence primitives for the JSON collections the app stores
 * (bookings, units). Two backends:
 *
 *  - Postgres (production / Vercel): when a POSTGRES_URL-style env var is present,
 *    each collection is stored as a single JSONB document in a `kv_store` table.
 *    This keeps the existing "read whole array, mutate, write whole array" model,
 *    so no business logic changes — it's just durable instead of on local disk.
 *
 *  - Filesystem (local dev): when no Postgres env is set, falls back to the
 *    original data/<key>.json files, so `npm run dev` works with no database.
 *
 * NOTE: like the original file-based store, writes replace the whole document.
 * That's fine for this site's volume; if booking concurrency ever grows, the
 * collections can be normalized into real rows behind this same interface.
 */

// On Vercel the deployment filesystem is read-only; use the writable /tmp dir so
// bookings can be created during a demo. (Not durable across cold starts — swap
// in Postgres/Neon by setting POSTGRES_URL for persistence.)
const DATA_DIR = process.env.VERCEL ? '/tmp/wrs-data' : path.join(process.cwd(), 'data');

function usePostgres(): boolean {
  return Boolean(
    process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.DATABASE_URL
  );
}

let tableReady: Promise<void> | null = null;

async function getSql() {
  // Imported lazily so local (filesystem) dev never needs the pg driver installed.
  const { sql } = await import('@vercel/postgres');
  if (!tableReady) {
    tableReady = sql`
      CREATE TABLE IF NOT EXISTS kv_store (
        key   text PRIMARY KEY,
        value jsonb NOT NULL
      )
    `.then(() => undefined);
  }
  await tableReady;
  return sql;
}

export async function readCollection<T>(key: string): Promise<T[]> {
  if (usePostgres()) {
    const sql = await getSql();
    const { rows } = await sql`SELECT value FROM kv_store WHERE key = ${key}`;
    if (rows.length === 0) return [];
    return rows[0].value as T[];
  }

  // Filesystem fallback
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(path.join(DATA_DIR, `${key}.json`), 'utf-8');
    return JSON.parse(data) as T[];
  } catch (error: any) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function writeCollection<T>(key: string, value: T[]): Promise<void> {
  if (usePostgres()) {
    const sql = await getSql();
    await sql`
      INSERT INTO kv_store (key, value)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `;
    return;
  }

  // Filesystem fallback
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${key}.json`),
    JSON.stringify(value, null, 2),
    'utf-8'
  );
}
