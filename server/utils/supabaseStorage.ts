import { randomUUID } from 'crypto';

/**
 * Minimal Supabase Storage uploader — no @supabase/supabase-js dependency.
 * Uploads a buffer to the public `listing-photos` bucket via the Storage REST
 * API using the service-role key (server-side only), and returns the public URL.
 *
 * Requires env:
 *   SUPABASE_URL                (e.g. https://<ref>.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY   (service_role key — server secret)
 */

const BUCKET = 'listing-photos';

function config() {
  const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return { url, key };
}

export function isStorageConfigured(): boolean {
  const { url, key } = config();
  return Boolean(url && key);
}

function extFor(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('gif')) return 'gif';
  return 'jpg';
}

/** Upload an image buffer for a unit; returns the public URL. */
export async function uploadUnitPhoto(unitId: string, buffer: Buffer, contentType = 'image/jpeg'): Promise<string> {
  const { url, key } = config();
  if (!url || !key) throw new Error('Supabase Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');

  const path = `units/${unitId}/${randomUUID()}.${extFor(contentType)}`;
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
      'cache-control': '3600',
    },
    body: buffer as any,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Storage upload failed (${res.status}): ${body.slice(0, 200)}`);
  }
  return `${url}/storage/v1/object/public/${BUCKET}/${path}`;
}

/** Best-effort delete of a previously uploaded photo by its public URL. */
export async function deleteUnitPhoto(publicUrl: string): Promise<void> {
  const { url, key } = config();
  if (!url || !key) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return; // not one of our stored objects (e.g. a bundled /images path)
  const path = publicUrl.slice(idx + marker.length);
  try {
    await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch {
    // best-effort — an orphaned object is harmless
  }
}
