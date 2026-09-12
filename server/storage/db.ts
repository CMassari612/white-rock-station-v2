import { promises as fs } from 'fs';
import path from 'path';

/**
 * Shared persistence primitives for the JSON collections the app stores
 * (units, bookings, cleaners). Two backends:
 *
 *  - Postgres (production): when a POSTGRES_URL / DATABASE_URL env var is present,
 *    each collection is stored as a single JSONB document in a `kv_store` table.
 *    Uses the standard `pg` driver, so it works with any Postgres provider —
 *    Supabase, Neon, RDS, etc. For Supabase on serverless, use the Transaction
 *    connection-pooler string (port 6543).
 *
 *  - Filesystem (local dev): when no Postgres env is set, falls back to the
 *    data/<key>.json files, so `npm run dev` works with no database.
 *
 * NOTE: like the original file-based store, writes replace the whole document.
 * That's fine for this site's volume; if concurrency ever grows, the collections
 * can be normalized into real rows behind this same interface.
 */

// On Vercel the deployment filesystem is read-only; use the writable /tmp dir for
// the filesystem fallback. (Not durable across cold starts — set POSTGRES_URL.)
const DATA_DIR = process.env.VERCEL ? '/tmp/wrs-data' : path.join(process.cwd(), 'data');

function connectionString(): string | undefined {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

function usePostgres(): boolean {
  return Boolean(connectionString());
}

let poolPromise: Promise<any> | null = null;
let tableReady = false;

async function getPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      // Imported lazily so local (filesystem) dev never needs the pg driver.
      const pg = await import('pg');
      const Pool = (pg as any).Pool || (pg as any).default?.Pool;
      const pool = new Pool({
        connectionString: connectionString(),
        // Supabase / most hosted Postgres require TLS. The provider's cert isn't
        // in Node's trust store on the serverless runtime, so don't reject it.
        ssl: { rejectUnauthorized: false },
        max: 3,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 10_000,
      });
      return pool;
    })();
  }
  const pool = await poolPromise;
  if (!tableReady) {
    await pool.query('CREATE TABLE IF NOT EXISTS kv_store (key text PRIMARY KEY, value jsonb NOT NULL)');
    tableReady = true;
  }
  return pool;
}

export async function readCollection<T>(key: string): Promise<T[]> {
  if (usePostgres()) {
    const pool = await getPool();
    const { rows } = await pool.query('SELECT value FROM kv_store WHERE key = $1', [key]);
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
    const pool = await getPool();
    await pool.query(
      'INSERT INTO kv_store (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
      [key, JSON.stringify(value)]
    );
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
