# Admin Authentication Fix - Summary

## Problem
- GET `/api/admin` and all subroutes returned 401 even with correct `x-admin-password` header
- Root cause: `server/routes/admin.ts` was mounted at `/api/admin` with router-level middleware that blocked all subroutes
- Admin routes used inconsistent authentication (some used `Authorization: Bearer`, some used `x-admin-password`)

## Solution
- Created shared middleware at `server/middleware/adminAuth.ts`
- Updated all admin routes to use the shared middleware
- Simplified `server/routes/admin.ts` to only provide `/health` endpoint (doesn't block subroutes)

## Files Changed

### 1. `server/middleware/adminAuth.ts` (NEW)
- Shared admin authentication middleware
- Uses `req.get('x-admin-password')` for case-insensitive header access
- Trims both provided and expected passwords
- Logs auth failures in non-production (doesn't log password value)

### 2. `server/routes/admin.ts`
- **Before:** Had multiple routes with router-level `router.use(requireAdmin)` that blocked all `/api/admin/*` requests
- **After:** Only provides `GET /api/admin/health` endpoint with route-level `requireAdmin` middleware
- No longer blocks subroutes like `/api/admin/bookings`, `/api/admin/units`, etc.

### 3. `server/routes/admin-units.ts`
- Removed local `requireAdmin` function
- Now imports and uses shared `requireAdmin` from `server/middleware/adminAuth`

### 4. `server/routes/admin-booking-requests.ts`
- Removed local `requireAdmin` function
- Now imports and uses shared `requireAdmin` from `server/middleware/adminAuth`

### 5. `server/routes/admin-bookings.ts`
- Removed local `requireAdmin` function
- Now imports and uses shared `requireAdmin` from `server/middleware/adminAuth`

## Key Code Snippets

### Shared Middleware

**File:** `server/middleware/adminAuth.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
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
```

### Simplified Admin Route

**File:** `server/routes/admin.ts`

```typescript
import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * GET /api/admin/health
 * Simple authenticated ping endpoint
 */
router.get('/health', requireAdmin, (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
```

### Updated Route Example

**File:** `server/routes/admin-bookings.ts`

```typescript
import express, { Request, Response } from 'express';
import { Booking } from '../types/booking-request';
import { getAllBookings, getBookingById } from '../storage/bookingsStore';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Apply auth middleware to all routes
router.use(requireAdmin);

// ... route handlers ...
```

## Verification

### Health Check
```bash
curl -i http://localhost:5050/api/admin/health -H 'x-admin-password: WhiteRockStation1'
```

**Expected:** 200 OK with `{"status":"ok"}`

### List Bookings
```bash
curl -i http://localhost:5050/api/admin/bookings -H 'x-admin-password: WhiteRockStation1'
```

**Expected:** 200 OK with JSON array of bookings

### Without Header (Unauthorized)
```bash
curl -i http://localhost:5050/api/admin/bookings
```

**Expected:** 401 Unauthorized with `{"error":"Unauthorized"}`

### Wrong Password (Unauthorized)
```bash
curl -i http://localhost:5050/api/admin/bookings -H 'x-admin-password: wrongpassword'
```

**Expected:** 401 Unauthorized with `{"error":"Unauthorized"}`

## Benefits

✅ **Consistent Authentication:** All admin routes use the same middleware  
✅ **No Route Blocking:** `/api/admin` no longer blocks subroutes  
✅ **Case-Insensitive Headers:** Uses `req.get()` for header access  
✅ **Proper Logging:** Logs auth failures in development (doesn't log passwords)  
✅ **Maintainable:** Single source of truth for admin authentication  
