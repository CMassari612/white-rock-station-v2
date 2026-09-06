const STORAGE_KEY = 'adminPassword';
const ROLE_KEY = 'adminRole';
const NAME_KEY = 'adminName';

export type StaffRole = 'admin' | 'cleaner';

export function setAdminPassword(password: string) {
  sessionStorage.setItem(STORAGE_KEY, password);
}
export function getAdminPassword(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}
export function setRole(role: StaffRole, name?: string) {
  sessionStorage.setItem(ROLE_KEY, role);
  if (name) sessionStorage.setItem(NAME_KEY, name);
}
export function getRole(): StaffRole | null {
  return sessionStorage.getItem(ROLE_KEY) as StaffRole | null;
}
export function getStaffName(): string {
  return sessionStorage.getItem(NAME_KEY) || 'Staff';
}
export function clearAdminPassword() {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(NAME_KEY);
}
