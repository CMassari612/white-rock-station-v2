import express, { Request, Response } from 'express';
import { getStripe } from '../utils/stripe';
import { getBookingById, updateBookingWithStripeData } from '../storage/bookingsStore';
import { mailGuestReceived, mailAdminApprovalNeeded } from '../utils/mailer';

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
