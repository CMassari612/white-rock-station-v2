# White Rock Station — Final To-Do

_Last updated: Sep 12, 2026_

## ✅ Already built & live
- Booking site (cottages, weekday/weekend pricing, cleaning fee, 5% lodging tax, guest agreement, add-ons, promo codes)
- Supabase Postgres persistence (all admin edits, bookings, blocks persist)
- Admin: editable units (price, occupancy, address), date blocking, Winter Closure, add/delete unit, photo upload/reorder, one login + read-only cleaner role
- Stripe checkout + manual-capture approve-to-charge flow (currently **test mode**, correct White Rock Station account)
- Confirmation emails via Resend on verified `whiterockstation.com` (address, directions, map, per-site circled parking)
- Arrival info for all 8 units (maps + directions; 7 with circled parking)

## 🚧 Remaining to-do

### 1. Deploy current build
- [ ] Push + deploy the **Delete booking** button and **Airbnb two-way sync** (already coded)
- [ ] Per-listing Airbnb setup: paste WRS export URL into Airbnb; paste Airbnb export URL into each unit → Sync
- [ ] Add `CRON_SECRET` in Vercel (protects the hourly Airbnb sync cron)

### 2. Policies / content pages
- [ ] **Terms of Service** page — needs the actual TOS text (client/attorney), or I draft an original starter to review
- [ ] **Cancellation policy** page — needs the refund rules (e.g., full refund if cancelled X days out); I can draft from your rules
- [ ] (Optional) Allegheny Shore parking photo + any remaining listing photos

### 3. Camp Store (new e-commerce feature — merch: t-shirts & hoodies)
- [ ] Public **Camp Store** page: product cards with photos, price, size/variant selector
- [ ] Admin **product management**: add/edit/delete products, upload photos, set price, sizes, stock, active toggle
- [ ] **Purchase flow**: cart or per-item Stripe checkout, order records visible in admin
- [ ] Decisions to make before building:
  - Shipping, local pickup, or both?
  - Sizes/variants per product (S–XXL)? Multiple colors?
  - Track inventory/stock, or unlimited?
  - Sales tax on merchandise?

### 4. Go-live: Stripe test → live
- [ ] Create **live** webhook + swap 3 Vercel vars to live values: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Confirm the client's real bank account is connected in Stripe for payouts
- [ ] **Split payout question** (from kickoff): investigate routing linen + lodging tax to a separate bank account. Working assumption: Stripe can't true-split to two banks — confirm, and note alternatives (manual reconciliation, scheduled transfers, or separate accounting)

### 5. Later / Phase 2
- [ ] Airbnb **API** integration if iCal sync lag ever causes double-bookings on tight calendars
- [ ] Kayak rentals (currently removed) if/when offered
