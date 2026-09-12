import { getAdminPassword } from './adminSession';

const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5050')
  : '';

export interface AdminBooking {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitType: 'cottage' | 'tent_site' | 'kayak';
  unitId: string;
  unitName?: string;
  startDate: string;
  endDate: string;
  guests: number;
  status: 'pending' | 'pending_approval' | 'confirmed' | 'cancelled' | 'expired' | 'refunded';
  createdAt: string;
  totalCents?: number;
  addOns?: { firewood?: number };
  promoCode?: string;
}

export interface Cleaner { id: string; name: string; phone: string; password: string; createdAt: string; }
// Read-only cleaner view: site + address + checkout date only.
export interface CleaningRow { id: string; site: string; address: string; checkout: string; }

export interface BlockedRange { id: string; start: string; end: string; reason?: string; source?: 'manual' | 'winter'; createdAt?: string; }
export interface AdminUnit {
  id: string; slug: string; name: string;
  unitType: 'cottage' | 'tent_site' | 'kayak';
  group?: string; active: boolean; placeholder?: boolean;
  tagline?: string; shortDescription?: string; description?: string;
  location?: string; address?: string; photos?: string[]; amenities?: string[];
  directions?: string; mapImageUrl?: string; parkingImageUrl?: string;
  airbnbIcalUrl?: string; airbnbSyncedAt?: string;
  bedrooms?: number; beds?: number; baths?: number; maxGuests?: number;
  weekdayPriceCents?: number; weekendPriceCents?: number; cleaningFeeCents?: number;
  taxable?: boolean; capacity?: number; blockedRanges?: BlockedRange[];
  createdAt: string; updatedAt: string;
}

function headers() {
  return { 'Content-Type': 'application/json', 'x-admin-password': getAdminPassword() || '' };
}

async function call(path: string, method = 'GET', body?: any) {
  const res = await fetch(`${API_URL}${path}`, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401) {
    const e: any = new Error('Unauthorized');
    e.status = 401;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Login (no auth header) — returns the role for the submitted password.
export async function staffLogin(password: string): Promise<{ role: 'admin' | 'cleaner'; name: string }> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
  } catch {
    const e: any = new Error('Could not reach the server. Is it running?');
    e.status = 0;
    throw e;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error || (res.status === 404 ? 'Login endpoint missing — restart the dev server.' : 'Sign in failed.');
    const e: any = new Error(msg);
    e.status = res.status;
    throw e;
  }
  return data;
}

export async function adminGetBookings(): Promise<AdminBooking[]> {
  return (await call('/api/admin/bookings')).bookings as AdminBooking[];
}
export async function adminApprove(id: string): Promise<AdminBooking> {
  return (await call(`/api/admin/bookings/${id}/approve`, 'POST')).booking;
}
export async function adminReject(id: string): Promise<AdminBooking> {
  return (await call(`/api/admin/bookings/${id}/reject`, 'POST')).booking;
}
export async function adminDeleteBooking(id: string): Promise<void> {
  await call(`/api/admin/bookings/${id}`, 'DELETE');
}

// ---- Units / sites (admin only) ----
export async function adminGetUnits(): Promise<AdminUnit[]> {
  return (await call('/api/admin/units')).units as AdminUnit[];
}
export async function adminUpdateUnit(id: string, patch: Partial<AdminUnit>): Promise<AdminUnit> {
  return (await call(`/api/admin/units/${id}`, 'PATCH', patch)).unit;
}
export async function adminAddUnit(input: Partial<AdminUnit>): Promise<AdminUnit> {
  return (await call('/api/admin/units', 'POST', input)).unit;
}
export async function adminDeleteUnit(id: string): Promise<void> {
  await call(`/api/admin/units/${id}`, 'DELETE');
}
export async function adminAddBlock(id: string, block: { start: string; end: string; reason?: string }): Promise<AdminUnit> {
  return (await call(`/api/admin/units/${id}/blocks`, 'POST', block)).unit;
}
export async function adminRemoveBlock(id: string, blockId: string): Promise<AdminUnit> {
  return (await call(`/api/admin/units/${id}/blocks/${blockId}`, 'DELETE')).unit;
}
export async function adminWinterClosure(input: { start: string; end: string; unitIds?: string[]; reason?: string }): Promise<{ applied: number; unitIds: string[] }> {
  return await call('/api/admin/units/winter-closure', 'POST', input);
}
export async function adminSyncAirbnb(id: string): Promise<{ imported: number; syncedAt?: string; unit: AdminUnit }> {
  return await call(`/api/admin/units/${id}/sync-airbnb`, 'POST');
}
export async function adminSyncAllAirbnb(): Promise<{ units: number; imported: number; errors: string[] }> {
  return await call('/api/admin/units/sync-airbnb', 'POST');
}

// ---- Listing photos ----
export async function adminUploadPhoto(id: string, blob: Blob): Promise<AdminUnit> {
  const res = await fetch(`${API_URL}/api/admin/units/${id}/photos`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg', 'x-admin-password': getAdminPassword() || '' },
    body: blob,
  });
  if (res.status === 401) { const e: any = new Error('Unauthorized'); e.status = 401; throw e; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.unit as AdminUnit;
}
export async function adminDeletePhoto(id: string, url: string): Promise<AdminUnit> {
  return (await call(`/api/admin/units/${id}/photos`, 'DELETE', { url })).unit;
}
export async function adminUploadAsset(id: string, slot: 'map' | 'parking', blob: Blob): Promise<AdminUnit> {
  const res = await fetch(`${API_URL}/api/admin/units/${id}/asset?slot=${slot}`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/jpeg', 'x-admin-password': getAdminPassword() || '' },
    body: blob,
  });
  if (res.status === 401) { const e: any = new Error('Unauthorized'); e.status = 401; throw e; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.unit as AdminUnit;
}
export async function adminReorderPhotos(id: string, photos: string[]): Promise<AdminUnit> {
  return (await call(`/api/admin/units/${id}`, 'PATCH', { photos })).unit;
}

// Cleaning schedule (admin + cleaner)
export async function getCleaningSchedule(): Promise<CleaningRow[]> {
  return (await call('/api/staff/cleaning-schedule')).schedule as CleaningRow[];
}

// Cleaner accounts (admin only)
export async function getCleaners(): Promise<Cleaner[]> {
  return (await call('/api/admin/cleaners')).cleaners as Cleaner[];
}
export async function addCleaner(input: { name: string; phone: string; password: string }): Promise<Cleaner> {
  return (await call('/api/admin/cleaners', 'POST', input)).cleaner;
}
export async function deleteCleaner(id: string): Promise<void> {
  await call(`/api/admin/cleaners/${id}`, 'DELETE');
}
