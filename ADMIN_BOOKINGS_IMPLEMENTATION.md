# Admin Bookings API + Page - Implementation Summary

## Files Changed

### Backend (Server)

1. **`server/routes/admin-bookings.ts`** (NEW)
   - GET `/api/admin/bookings` - List all bookings sorted by createdAt DESC
   - GET `/api/admin/bookings/:id` - Get single booking by ID
   - Authentication via `x-admin-password` header
   - Returns fields: id, name, email, phone, bookingType, unitType, startDate, endDate, guests, status, createdAt, paidAt, stripeSessionId, stripeCustomerId, stripePaymentIntentId

2. **`server/index.ts`**
   - Added import for `adminBookingsRoutes`
   - Mounted routes at `/api/admin/bookings`

### Frontend (Client)

3. **`src/lib/api.ts`**
   - Updated `admin.getBookings()` to use `x-admin-password` header
   - Updated `admin.getBooking()` to use `x-admin-password` header
   - Changed return types to use `BookingRequest[]` (new booking system)

4. **`src/pages/AdminBookingsPage.tsx`** (NEW)
   - New admin page component with password authentication
   - Table displaying all booking fields
   - Status badges with color coding
   - "Pay & Confirm" button for pending bookings
   - Stripe dashboard links and copy-to-clipboard buttons
   - Stores password in sessionStorage

5. **`src/App.tsx`**
   - Added `AdminBookingsPage` import
   - Added `admin-bookings` to PageType
   - Added route case for `admin-bookings`

## Key Code Snippets

### 1. Backend Route - List Bookings

**File:** `server/routes/admin-bookings.ts`

```typescript
// Simple authentication middleware using x-admin-password header
function requireAdmin(req: Request, res: Response, next: express.NextFunction) {
  const adminPassword = req.headers['x-admin-password'];
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (!adminPassword || adminPassword !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

router.get('/', async (req: Request, res: Response) => {
  try {
    let bookings = await getAllBookings();
    
    // Sort by createdAt DESC (newest first)
    bookings.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Return only the fields specified in requirements
    const bookingList = bookings.map(booking => ({
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      bookingType: booking.bookingType,
      unitType: booking.unitType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
      status: booking.status,
      createdAt: booking.createdAt,
      paidAt: booking.paidAt,
      stripeSessionId: booking.stripeSessionId,
      stripeCustomerId: booking.stripeCustomerId,
      stripePaymentIntentId: booking.stripePaymentIntentId,
    }));
    
    res.json({ bookings: bookingList });
  } catch (error) {
    console.error('[ADMIN] Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});
```

### 2. Backend Route - Get Single Booking

**File:** `server/routes/admin-bookings.ts`

```typescript
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    // Return only the fields specified in requirements
    const bookingResponse = {
      id: booking.id,
      name: booking.name,
      email: booking.email,
      phone: booking.phone,
      bookingType: booking.bookingType,
      unitType: booking.unitType,
      startDate: booking.startDate,
      endDate: booking.endDate,
      guests: booking.guests,
      status: booking.status,
      createdAt: booking.createdAt,
      paidAt: booking.paidAt,
      stripeSessionId: booking.stripeSessionId,
      stripeCustomerId: booking.stripeCustomerId,
      stripePaymentIntentId: booking.stripePaymentIntentId,
    };
    
    res.json({ booking: bookingResponse });
  } catch (error) {
    console.error('[ADMIN] Error retrieving booking:', error);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});
```

### 3. Frontend API Function

**File:** `src/lib/api.ts`

```typescript
getBookings: (authToken?: string) =>
  request<{ bookings: BookingRequest[] }>('/api/admin/bookings', {
    headers: authToken ? { 'x-admin-password': authToken } : {},
  }),

getBooking: (id: string, authToken?: string) =>
  request<{ booking: BookingRequest }>(`/api/admin/bookings/${id}`, {
    headers: authToken ? { 'x-admin-password': authToken } : {},
  }),
```

### 4. Server Route Mounting

**File:** `server/index.ts`

```typescript
import adminBookingsRoutes from './routes/admin-bookings';

// Routes
app.use('/api/admin/bookings', adminBookingsRoutes);
```

## cURL Examples

### List All Bookings

```bash
curl -H "x-admin-password: WhiteRockStation1" http://localhost:5050/api/admin/bookings
```

**Response:**
```json
{
  "bookings": [
    {
      "id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "bookingType": "cabin",
      "unitType": "small_cabin",
      "startDate": "2024-07-01",
      "endDate": "2024-07-03",
      "guests": 2,
      "status": "confirmed",
      "createdAt": "2024-06-15T10:00:00.000Z",
      "paidAt": "2024-06-15T10:05:00.000Z",
      "stripeSessionId": "cs_test_...",
      "stripeCustomerId": "cus_...",
      "stripePaymentIntentId": "pi_..."
    }
  ]
}
```

### Get Single Booking

```bash
curl -H "x-admin-password: WhiteRockStation1" http://localhost:5050/api/admin/bookings/<booking-id>
```

**Response:**
```json
{
  "booking": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "bookingType": "cabin",
    "unitType": "small_cabin",
    "startDate": "2024-07-01",
    "endDate": "2024-07-03",
    "guests": 2,
    "status": "confirmed",
    "createdAt": "2024-06-15T10:00:00.000Z",
    "paidAt": "2024-06-15T10:05:00.000Z",
    "stripeSessionId": "cs_test_...",
    "stripeCustomerId": "cus_...",
    "stripePaymentIntentId": "pi_..."
  }
}
```

### Unauthorized Request (Missing Header)

```bash
curl http://localhost:5050/api/admin/bookings
```

**Response:**
```json
{
  "error": "Unauthorized"
}
```

**Status:** 401

### Unauthorized Request (Wrong Password)

```bash
curl -H "x-admin-password: wrongpassword" http://localhost:5050/api/admin/bookings
```

**Response:**
```json
{
  "error": "Unauthorized"
}
```

**Status:** 401

## Frontend Usage

### Accessing the Admin Bookings Page

1. Navigate to `/admin-bookings` (or add link to navigate programmatically)
2. Enter admin password (stored in `ADMIN_PASSWORD` env var)
3. Password is stored in `sessionStorage` (cleared on browser close)
4. View all bookings in table format
5. Click "Pay & Confirm" for pending bookings to initiate Stripe checkout
6. Click "View in Stripe" link to open Stripe dashboard (test mode)
7. Click "Copy Session ID" to copy Stripe session ID to clipboard

### Features

- ✅ Password authentication (sessionStorage)
- ✅ Table with all booking fields
- ✅ Status badges with color coding
- ✅ Paid At timestamp display
- ✅ Stripe dashboard links (test mode)
- ✅ Copy-to-clipboard for Stripe IDs
- ✅ "Pay & Confirm" button for pending bookings
- ✅ Sorted by createdAt DESC (newest first)
