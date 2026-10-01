import express, { Request, Response } from 'express';
import { getStripe } from '../utils/stripe';
import { getBookingById, updateBookingWithStripeData } from '../storage/bookingsStore';
import { mailGuestReceived, mailAdminApprovalNeeded, mailStoreBuyerReceipt, mailStoreOwnerAlert } from '../utils/mailer';
import { addStoreOrder, StoreOrder, StoreOrderItem } from '../storage/storeOrdersStore';

const router = express.Router();

// POST /api/stripe/webhook  (mounted with express.raw)
router.post('/', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return res.status(400).send('Missing signature/secret');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err: any) {
    console.error('[STRIPE] webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object;

      // Store (merch) order — pickup only. Record it and notify buyer + owner.
      if (session.metadata?.kind === 'merch') {
        let items: StoreOrderItem[] = [];
        try {
          const raw = JSON.parse(session.metadata?.items || '[]');
          items = (Array.isArray(raw) ? raw : []).map((r: any) => ({
            name: String(r.n ?? r.name ?? 'Item'),
            qty: Number(r.q ?? r.qty ?? 1),
            priceCents: Number(r.p ?? r.priceCents ?? 0),
          }));
        } catch { /* ignore malformed metadata */ }

        const order: StoreOrder = {
          id: 'so_' + (session.id || Date.now()).toString().slice(-18),
          createdAt: new Date().toISOString(),
          items,
          subtotalCents: session.amount_subtotal ?? 0,
          taxCents: session.total_details?.amount_tax ?? 0,
          totalCents: session.amount_total ?? 0,
          customerName: session.customer_details?.name || undefined,
          customerEmail: session.customer_details?.email || undefined,
          stripeSessionId: session.id,
          pickedUp: false,
        };

        await addStoreOrder(order);
        if (order.customerEmail) { try { await mailStoreBuyerReceipt(order); } catch (e) { console.error('[STORE] buyer email failed', e); } }
        try { await mailStoreOwnerAlert(order); } catch (e) { console.error('[STORE] owner email failed', e); }
        console.log('[STORE] merch order recorded:', order.id);
        return res.json({ received: true });
      }

      const bookingId = session.metadata?.bookingId;
      if (!bookingId) return res.json({ received: true });

      const booking = await getBookingById(bookingId);
      if (!booking) return res.json({ received: true });

      // Idempotency — only act on a still-pending booking.
      if (booking.status !== 'pending') {
        return res.json({ received: true, message: 'already processed' });
      }

      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;

      const updated = await updateBookingWithStripeData(bookingId, {
        status: 'pending_approval',
        stripeSessionId: session.id,
        stripeCustomerId: customerId || undefined,
        stripePaymentIntentId: paymentIntentId || undefined,
        authorizedAt: new Date().toISOString(),
        paymentMethod: 'stripe',
      });

      const finalBooking = updated || booking;
      if (session.customer_details?.email && !finalBooking.email) {
        finalBooking.email = session.customer_details.email;
      }

      console.log('[STRIPE] Booking authorized (card held), awaiting approval:', bookingId);
      await mailGuestReceived(finalBooking);
      await mailAdminApprovalNeeded(finalBooking);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('[STRIPE] webhook processing error:', err);
    res.status(500).json({ error: err.message || 'Webhook error' });
  }
});

export default router;
