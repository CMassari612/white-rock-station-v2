# Stripe Payment Integration - Testing Guide

This document provides testing instructions for the Stripe payment integration.

## Prerequisites

1. **Stripe Account Setup**
   - Create a Stripe account at https://dashboard.stripe.com
   - Get your test API keys from: Developers > API keys
   - Add to `.env`:
     ```bash
     STRIPE_SECRET_KEY=sk_test_...
     STRIPE_WEBHOOK_SECRET=whsec_...
     VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
     FRONTEND_URL=http://localhost:3000
     ```

2. **Local Webhook Testing**
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Login: `stripe login`
   - Forward webhooks: `stripe listen --forward-to localhost:5050/api/stripe/webhook`
   - Copy the webhook signing secret (starts with `whsec_`) and add to `.env`

## Testing Flow

### 1. Create Pending Booking

**Test for each booking type:**

#### Lodging (Cabin/Campsite)
1. Navigate to Lodging page
2. Fill booking form:
   - Select unit type (Small Cabin, Large Cabin, or Campsite)
   - Select dates (check-in and check-out)
   - Enter guest count
   - Enter contact info (name, email, phone)
3. Submit form
4. **Expected:** Booking created with status `pending`, redirect to Stripe Checkout

#### Marina Slip
1. Navigate to Marina page
2. Fill booking form:
   - Select Marina Slip
   - Enter slip length (feet)
   - Select dates
   - Enter contact info
3. Submit form
4. **Expected:** Booking created with status `pending`, redirect to Stripe Checkout

### 2. Test Stripe Checkout

1. **On Stripe Checkout page:**
   - Review booking details
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., `12/25`)
   - Any CVC (e.g., `123`)
   - Any ZIP code (e.g., `12345`)
   - Complete payment

2. **Expected:**
   - Redirect to success page (`/booking/success`)
   - Booking status changes to `confirmed`
   - `paidAt` timestamp set
   - Stripe IDs stored: `stripeSessionId`, `stripeCustomerId`, `stripePaymentIntentId`
   - Email notifications sent (owner + guest)
   - Google Sheets updated (if configured)
   - Google Calendar event created (if configured)

### 3. Verify Booking Confirmation

**Check Admin Panel:**
1. Log into admin panel
2. Navigate to Booking Requests
3. Find the booking
4. **Verify:**
   - Status shows "Confirmed" (green)
   - "Paid At" column shows date/time
   - "View in Stripe" link appears (if payment completed)
   - Status dropdown includes: Pending, Confirmed, Cancelled, Paid, Expired

**Check Booking Data:**
- Status: `confirmed`
- `paidAt`: ISO timestamp
- `stripeSessionId`: Session ID
- `stripeCustomerId`: Customer ID (if available)
- `stripePaymentIntentId`: Payment Intent ID

### 4. Test Availability Locking

**Before Payment:**
1. Create a pending booking for dates (e.g., July 1-3)
2. In a new tab, check availability for same dates
3. **Expected:** Dates still show as available (pending bookings don't lock inventory)

**After Payment:**
1. Complete payment for the pending booking
2. Check availability again
3. **Expected:** Dates show reduced availability (confirmed bookings lock inventory)

### 5. Test Email Validation

**Invalid Email:**
1. Create booking with invalid email (e.g., `notanemail`, `test@`, `@domain.com`)
2. **Expected:**
   - Booking created successfully
   - Stripe Checkout doesn't prefill email
   - Stripe collects email on checkout page
   - Webhook uses email from Stripe session if booking email invalid

**Valid Email:**
1. Create booking with valid email (e.g., `test@example.com`)
2. **Expected:**
   - Booking created successfully
   - Stripe Checkout pre-fills email
   - Email notifications use booking email

### 6. Test Booking Expiry

**Manual Test:**
1. Create a pending booking
2. Wait 30+ minutes OR manually update booking `createdAt` timestamp in `data/bookings.json` to 31+ minutes ago
3. Restart server OR wait for next expiry check (every 15 minutes)
4. **Expected:**
   - Booking status changes to `expired`
   - Expired bookings don't affect availability
   - Expired bookings can't proceed to payment

### 7. Test Webhook Idempotency

1. Complete a payment (triggers webhook)
2. Manually re-trigger the same webhook event (or wait for Stripe retry)
3. **Expected:**
   - Webhook returns 200 OK
   - Booking remains confirmed (no duplicate processing)
   - No duplicate emails sent
   - Console log: "Booking already confirmed and paid. Skipping webhook processing."

### 8. Test Error Cases

**Stripe Not Configured:**
1. Remove/comment out `STRIPE_SECRET_KEY` in `.env`
2. Try to create checkout session
3. **Expected:** Error message: "Stripe not configured" (501 status)

**Invalid Booking:**
1. Try to create checkout session for non-existent booking ID
2. **Expected:** Error: "Booking not found" (404 status)

**Non-Pending Booking:**
1. Try to create checkout session for already-confirmed booking
2. **Expected:** Error: "Booking is not pending. Current status: confirmed" (400 status)

**Invalid Email:**
1. Create booking with placeholder email (e.g., `placeholder@example.com`)
2. Submit to Stripe
3. **Expected:** Stripe collects email on checkout page, webhook processes successfully

## Verification Checklist

- [ ] Pending bookings don't reduce availability
- [ ] Confirmed bookings reduce availability
- [ ] Payment completion updates booking status to `confirmed`
- [ ] `paidAt` timestamp is set on payment
- [ ] Stripe IDs are stored (`stripeSessionId`, `stripeCustomerId`, `stripePaymentIntentId`)
- [ ] Email notifications sent (owner + guest)
- [ ] Invalid emails don't crash checkout
- [ ] Webhook is idempotent (can be called multiple times safely)
- [ ] Booking expiry works (30 minutes for pending)
- [ ] Admin UI shows status, paidAt, and Stripe links
- [ ] All booking types work (cabins, campsites, marina slips)

## Stripe Dashboard

After testing, verify in Stripe Dashboard:
- **Payments:** All test payments appear
- **Customers:** Customer records created (if email valid)
- **Webhooks:** Events received and processed (check logs)
- **Sessions:** Checkout sessions created with correct metadata

## Test Cards

Use these Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires 3D Secure:** `4000 0025 0000 3155`

## Troubleshooting

**Webhook not firing:**
- Check Stripe CLI is running: `stripe listen --forward-to localhost:5050/api/stripe/webhook`
- Verify webhook secret in `.env` matches CLI output
- Check server logs for webhook errors

**Booking not confirming:**
- Check webhook logs in Stripe Dashboard
- Verify webhook secret is correct
- Check server console for errors
- Verify booking exists in `data/bookings.json`

**Availability not updating:**
- Verify booking status is `confirmed` (not `pending`)
- Check availability calculation only counts `confirmed` and `paid` statuses
- Verify date math: booking from July 1-3 reserves nights of July 1 and 2 (checkout July 3)
