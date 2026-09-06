import { getAdminPassword } from './adminSession';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5050' : '');

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
export interface CleaningRow { id: string; unit: string; checkout: string; cleaning: string; cleanerId: string | null; cleanerName: string | null; }

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
export async function adminAssignCleaner(bookingId: string, cleanerId: string | null): Promise<void> {
  await call(`/api/admin/bookings/${bookingId}/assign-cleaner`, 'PATCH', { cleanerId });
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
