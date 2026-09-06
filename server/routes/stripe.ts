import express, { Request, Response } from 'express';
import { getStripe } from '../utils/stripe';
import { getBookingById, updateBookingWithStripeData } from '../storage/bookingsStore';
import { FIREWOOD_CENTS } from './booking-request';

const router = express.Router();

function isEmail(s?: string): boolean {
  return !!s && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

// POST /api/stripe/create-checkout-session  { bookingId }
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(501).json({ error: 'Stripe not configured' });

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ error: 'Missing bookingId' });

    const booking = await getBookingById(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking is not pending (status: ${booking.status})` });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const line_items: any[] = [];
    if (booking.lodgingCents) {
      line_items.push({
        price_data: { currency: 'usd', unit_amount: booking.lodgingCents, product_data: { name: `${booking.unitName} — lodging` } },
        quantity: 1,
      });
    }
    if (booking.cleaningFeeCents) {
      line_items.push({
        price_data: { currency: 'usd', unit_amount: booking.cleaningFeeCents, product_data: { name: 'Cleaning fee' } },
        quantity: 1,
      });
    }
    const firewood = booking.addOns?.firewood || 0;
    if (firewood > 0) {
      line_items.push({
        price_data: { currency: 'usd', unit_amount: FIREWOOD_CENTS, product_data: { name: 'Firewood bundle' } },
        quantity: firewood,
      });
    }
    if (booking.taxCents) {
      line_items.push({
        price_data: { currency: 'usd', unit_amount: booking.taxCents, product_data: { name: 'Lodging tax (5%)' } },
        quantity: 1,
      });
    }

    const sessionConfig: any = {
      mode: 'payment',
      // Manual capture: authorize (hold) the card now, capture on admin approval.
      payment_intent_data: { capture_method: 'manual' },
      line_items,
      success_url: `${baseUrl}/booking/success?bookingId=${booking.id}`,
      cancel_url: `${baseUrl}/booking/cancel?bookingId=${booking.id}`,
      metadata: { bookingId: booking.id },
    };
    if (isEmail(booking.email)) sessionConfig.customer_email = booking.email.trim();

    const session = await stripe.checkout.sessions.create(sessionConfig);
    await updateBookingWithStripeData(booking.id, { stripeSessionId: session.id });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[STRIPE] create-checkout-session failed:', err);
    res.status(500).json({ error: err.message || 'Failed to create checkout session' });
  }
});

export default router;
