import { Request, Response, NextFunction } from 'express';

/**
 * Admin authentication middleware
 * Checks x-admin-password header against ADMIN_PASSWORD env var
 * Uses req.get() for case-insensitive header access
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // TEMP TEST BYPASS:
  // Set DISABLE_ADMIN_AUTH=true in .env to bypass admin auth (development/testing only).
  // This is intentionally explicit so it can't be enabled accidentally.
  if (process.env.DISABLE_ADMIN_AUTH === 'true') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ADMIN AUTH] DISABLE_ADMIN_AUTH=true; bypassing admin auth');
    }
    return next();
  }

  // Get password from header (req.get() is case-insensitive)
  const headerValue = req.get('x-admin-password');
  const providedPassword = headerValue ? headerValue.trim() : '';
  
  const expectedPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();
  
  // Check if password is missing or incorrect
  if (!providedPassword || providedPassword !== expectedPassword) {
    // Log in non-production (do not log password value)
    if (process.env.NODE_ENV !== 'production') {
      const headerPresent = headerValue !== null;
      console.log(`[ADMIN AUTH] Authentication failed - Header present: ${headerPresent}`);
    }
    
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}
