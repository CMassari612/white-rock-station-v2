import { Request, Response, NextFunction } from 'express';
import { getAllCleaners } from '../storage/cleanersStore';
import { Cleaner } from '../types/cleaner';

export type Role = 'admin' | 'cleaner';

/** Resolve a submitted password to a role (or null). Always validates real
 *  credentials so login/role detection is accurate regardless of dev bypass. */
export async function resolveRole(password: string): Promise<{ role: Role | null; cleaner?: Cleaner }> {
  const admin = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  const pw = (password || '').trim();
  if (pw && pw === admin) return { role: 'admin' };
  if (pw) {
    const cleaner = (await getAllCleaners()).find(c => c.password && c.password.trim() === pw);
    if (cleaner) return { role: 'cleaner', cleaner };
  }
  return { role: null };
}

/** Any signed-in staff member (admin or cleaner). */
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (process.env.DISABLE_ADMIN_AUTH === 'true') return next();
  const pw = (req.get('x-admin-password') || '').trim();
  resolveRole(pw)
    .then(({ role }) => {
      if (!role) return res.status(401).json({ error: 'Unauthorized' });
      next();
    })
    .catch(() => res.status(500).json({ error: 'Auth error' }));
}
