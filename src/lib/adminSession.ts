const STORAGE_KEY = 'adminPassword';
const ROLE_KEY = 'adminRole';
const NAME_KEY = 'adminName';

export type StaffRole = 'admin' | 'cleaner';

// Persisted in localStorage so a signed-in admin stays signed in across browser
// restarts (and the on-page "Edit text" button stays available) until they log out.
export function setAdminPassword(password: string) {
  localStorage.setItem(STORAGE_KEY, password);
}
export function getAdminPassword(): string | null {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
}
export function setRole(role: StaffRole, name?: string) {
  localStorage.setItem(ROLE_KEY, role);
  if (name) localStorage.setItem(NAME_KEY, name);
}
export function getRole(): StaffRole | null {
  return (localStorage.getItem(ROLE_KEY) || sessionStorage.getItem(ROLE_KEY)) as StaffRole | null;
}
export function getStaffName(): string {
  return localStorage.getItem(NAME_KEY) || sessionStorage.getItem(NAME_KEY) || 'Staff';
}
export function clearAdminPassword() {
  for (const k of [STORAGE_KEY, ROLE_KEY, NAME_KEY]) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
}
