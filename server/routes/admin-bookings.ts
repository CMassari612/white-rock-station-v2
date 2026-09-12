import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { getAllBookings, getBookingById, updateBookingWithStripeData, updateBookingStatus } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { getStripe } from '../utils/stripe';
import { isUnitAvailableForRange, tentSpotsAvailable } from '../utils/availability';
import { mailGuestApproved, mailGuestDeclined } from '../utils/mailer';

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/bookings — all bookings, newest first
router.get('/', async (_req: Request, res: Response) => {
  const bookings = await getAllBookings();
  bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  res.json({ bookings });
});

// POST /api/admin/bookings/:id/approve — capture the held payment + confirm
router.post('/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'confirmed') return res.json({ booking });
    // Normally 'pending_approval'; also allow 'pending' so a booking whose webhook
    // never landed (e.g. no local stripe listener) can still be force-confirmed.
    if (booking.status !== 'pending_approval' && booking.status !== 'pending') {
      return res.status(400).json({ error: `Booking cannot be approved (status: ${booking.status})` });
    }

    const [all, units] = await Promise.all([getAllBookings(), getAllUnits()]);
    const others = all.filter(b => b.id !== id);
    const unit = units.find(u => u.id === booking.unitId);

    let available: boolean;
    if (booking.unitType === 'tent_site') {
      available = tentSpotsAvailable(booking.startDate, booking.endDate, others, unit?.capacity ?? 0) >= 1;
    } else {
      available = isUnitAvailableForRange(booking.unitId, booking.startDate, booking.endDate, others, true, unit?.blockedRanges || []);
    }
    if (!available) {
      return res.status(409).json({ error: 'No longer available for those dates. Reject to release the hold.' });
    }

    const stripe = getStripe();
    if (stripe && booking.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.capture(booking.stripePaymentIntentId);
      } catch (err: any) {
        console.error('[ADMIN] capture failed', id, err?.message);
        return res.status(502).json({ error: `Failed to capture payment: ${err?.message || 'unknown'}` });
      }
    }

    const updated = await updateBookingWithStripeData(id, { status: 'confirmed', paidAt: new Date().toISOString() });
    const finalBooking = updated || booking;

    await mailGuestApproved(finalBooking);

    const refreshed = await getBookingById(id);
    return res.json({ booking: refreshed || finalBooking });
  } catch (err) {
    console.error('[ADMIN] approve error', err);
    return res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// POST /api/admin/bookings/:id/reject — void the card hold + cancel
router.post('/:id/reject', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await getBookingById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status === 'cancelled') return res.json({ booking });

    const stripe = getStripe();
    if (stripe && booking.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
      } catch (err: any) {
        console.error('[ADMIN] cancel authorization failed', id, err?.message);
      }
    }
    const updated = await updateBookingStatus(id, 'cancelled');
    await mailGuestDeclined(updated || booking);
    return res.json({ booking: updated || booking });
  } catch (err) {
    console.error('[ADMIN] reject error', err);
    return res.status(500).json({ error: 'Failed to reject booking' });
  }
});

export default router;
