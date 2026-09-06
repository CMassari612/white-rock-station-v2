# Stripe Payment Integration - Implementation Summary

## Files Changed

### Backend (Server)

1. **`server/types/booking-request.ts`**
   - Added `expired` to `BookingStatus` type
   - Added Stripe payment fields to `Booking` interface:
     - `stripeSessionId?: string`
     - `stripeCustomerId?: string`
     - `stripePaymentIntentId?: string`
     - `paidAt?: string`

2. **`server/storage/bookingsStore.ts`**
   - Added `updateBookingWithStripeData()` function
   - Added `getBookingById()` function
   - Added `expirePendingBookings()` function (30-minute expiry)

3. **`server/utils/availability.ts`**
   - Updated `ACTIVE_STATUSES` to only include `['confirmed', 'paid']`
   - Removed `'pending'` from active statuses (pending bookings don't lock inventory)

4. **`server/routes/stripe.ts`**
   - Added email validation (`isValidEmail()`)
   - Only sets `customer_email` if email is valid
   - Sets `customer_creation: 'always'` for invalid emails
   - Stores `stripeSessionId` on booking after session creation

5. **`server/routes/stripe-webhook.ts`**
   - Extracts Stripe IDs from session (`customer`, `payment_intent`)
   - Stores all Stripe data via `updateBookingWithStripeData()`
   - Sets `paidAt` timestamp
   - Adds idempotency check (skips if already confirmed and paid)
   - Uses session email if booking email invalid

6. **`server/index.ts`**
   - Runs `expirePendingBookings()` on startup
   - Sets up periodic expiry check (every 15 minutes)

### Frontend (Client)

7. **`src/lib/api.ts`**
   - Updated `BookingRequest` interface with Stripe fields
   - Added `expired` to status type

8. **`src/components/admin/BookingRequestList.tsx`**
   - Added "Paid At" column to table
   - Added `expired` status option with styling
   - Added "View in Stripe" link for bookings with Stripe session ID
   - Updated table colspan for new column

9. **`STRIPE_TESTING.md`** (New)
   - Comprehensive testing guide

## Key Code Snippets

### 1. Booking Type Update

**File:** `server/types/booking-request.ts`

```typescript
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'paid' | 'expired';

export interface Booking {
  // ... existing fields ...
  // Stripe payment fields
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string; // ISO string
}
```

### 2. Availability Filter Logic

**File:** `server/utils/availability.ts`

```typescript
// Active statuses that count toward occupancy
// Only confirmed/paid bookings reduce availability - pending bookings don't lock inventory
const ACTIVE_STATUSES: Booking['status'][] = ['confirmed', 'paid'];
```

### 3. Stripe Checkout Session Creation

**File:** `server/routes/stripe.ts`

```typescript
// Build session config - only include customer_email if email is valid
const sessionConfig: any = {
  mode: 'payment',
  success_url: `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking.id}`,
  cancel_url: `${baseUrl}/booking/cancel?bookingId=${booking.id}`,
  line_items: [/* ... */],
  metadata: {
    bookingId: booking.id,
    bookingType: booking.bookingType,
    unitType: booking.unitType,
  },
};

// Only set customer_email if email is valid
if (isValidEmail(booking.email)) {
  sessionConfig.customer_email = booking.email.trim();
} else {
  // Let Stripe collect email on checkout page
  sessionConfig.customer_creation = 'always';
  console.warn(`[STRIPE] Invalid email for booking ${booking.id}: "${booking.email}". Stripe will collect email on checkout.`);
}

const session = await stripe.checkout.sessions.create(sessionConfig);

// Store session ID on booking
await updateBookingWithStripeData(booking.id, {
  stripeSessionId: session.id,
});
```

### 4. Webhook Confirm Update + Idempotency

**File:** `server/routes/stripe-webhook.ts`

```typescript
// Load booking
const booking = await getBookingById(bookingId);

if (!booking) {
  console.error('[STRIPE] Booking not found:', bookingId);
  return res.status(404).json({ error: 'Booking not found' });
}

// Idempotency: If booking already confirmed and paidAt exists, no-op
if (booking.status === 'confirmed' && booking.paidAt) {
  console.log(`[STRIPE] Booking ${bookingId} already confirmed and paid. Skipping webhook processing.`);
  return res.json({ received: true, message: 'Booking already confirmed' });
}

// Extract Stripe data from session
const stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
const stripePaymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
const paidAt = new Date().toISOString();

// Get email - prefer booking.email if valid, otherwise use session email
let emailForNotifications = booking.email;
if (session.customer_details?.email && (!emailForNotifications || !emailForNotifications.includes('@'))) {
  emailForNotifications = session.customer_details.email;
}

// Update booking with Stripe data and confirm status
const updatedBooking = await updateBookingWithStripeData(booking.id, {
  status: 'confirmed',
  stripeSessionId: session.id,
  stripeCustomerId: stripeCustomerId || undefined,
  stripePaymentIntentId: stripePaymentIntentId || undefined,
  paidAt: paidAt,
});
```

### 5. Booking Expiry Logic

**File:** `server/index.ts`

```typescript
// Expire pending bookings on startup (30 minutes default)
expirePendingBookings(30).then(expiredCount => {
  if (expiredCount > 0) {
    console.log(`[BOOKING] Expired ${expiredCount} pending booking(s) on startup`);
  }
}).catch(err => {
  console.error('Error expiring pending bookings:', err);
});

// Set up periodic expiry check (every 15 minutes)
setInterval(() => {
  expirePendingBookings(30).then(expiredCount => {
    if (expiredCount > 0) {
      console.log(`[BOOKING] Expired ${expiredCount} pending booking(s)`);
    }
  }).catch(err => {
    console.error('Error expiring pending bookings:', err);
  });
}, 15 * 60 * 1000); // 15 minutes
```

## Summary of Features

✅ **Inventory Locking:** Only `confirmed` and `paid` bookings reduce availability  
✅ **Stripe Data Persistence:** All Stripe IDs stored on booking record  
✅ **Email Validation:** Invalid emails handled gracefully (Stripe collects on checkout)  
✅ **Webhook Idempotency:** Safe to process same webhook multiple times  
✅ **Booking Expiry:** Pending bookings expire after 30 minutes  
✅ **Admin UI:** Shows status, paidAt timestamp, and Stripe links  
✅ **All Booking Types:** Works for cabins, campsites, and marina slips  

## Testing

See `STRIPE_TESTING.md` for comprehensive testing instructions.
