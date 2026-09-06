import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { BookingRequestInput, Booking } from '../types/booking-request';
import { getAllBookings, addBooking } from '../storage/bookingsStore';
import { getAllUnits } from '../storage/unitsStore';
import { isUnitAvailableForRange, tentSpotsAvailable } from '../utils/availability';
import { computePriceBreakdown } from '../utils/pricing';

const router = express.Router();

export const FIREWOOD_CENTS = 800; // add-on price (editable later in admin)

function isEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s || '').trim());
}

// POST /api/booking — create a pending booking (checkout follows via Stripe)
router.post('/', async (req: Request<{}, {}, BookingRequestInput>, res: Response) => {
  try {
    const b = req.body;
    if (!b.unitId || !b.startDate || !b.endDate || !b.name || !b.email) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (!isEmail(b.email)) return res.status(400).json({ error: 'Please enter a valid email.' });
    if (!b.agreedToTerms) return res.status(400).json({ error: 'Please accept the guest agreement.' });
    if (b.startDate >= b.endDate) return res.status(400).json({ error: 'Check-out must be after check-in.' });

    const units = await getAllUnits();
    const unit = units.find(u => u.id === b.unitId && u.active);
    if (!unit || unit.placeholder) return res.status(404).json({ error: 'That option is not available for booking.' });

    const guests = Math.max(1, Math.min(unit.maxGuests || 8, Number(b.guests) || 1));
    const bookings = await getAllBookings();

    if (unit.unitType === 'tent_site') {
      if (tentSpotsAvailable(b.startDate, b.endDate, bookings, unit.capacity ?? 0) < 1) {
        return res.status(409).json({ error: 'No tent sites are available for those dates.' });
      }
    } else {
      if (!isUnitAvailableForRange(unit.id, b.startDate, b.endDate, bookings, true)) {
        return res.status(409).json({ error: 'That cottage is no longer available for those dates.' });
      }
    }

    const bd = computePriceBreakdown(unit, b.startDate, b.endDate);
    const firewood = Math.max(0, Math.min(20, Math.trunc(Number(b.addOns?.firewood) || 0)));
    const addOnsCents = firewood * FIREWOOD_CENTS;

    const booking: Booking = {
      id: randomUUID(),
      name: b.name.trim(),
      email: b.email.trim(),
      phone: (b.phone || '').trim(),
      unitType: unit.unitType,
      unitId: unit.id,
      unitName: unit.name,
      startDate: b.startDate,
      endDate: b.endDate,
      guests,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: b.notes?.trim() || undefined,
      addOns: { firewood },
      promoCode: b.promoCode?.trim() || undefined,
      agreedToTerms: true,
      lodgingCents: bd.lodgingCents,
      cleaningFeeCents: bd.cleaningFeeCents,
      taxCents: bd.taxCents,
      addOnsCents,
      totalCents: bd.totalCents + addOnsCents,
      paymentMethod: 'stripe',
    };

    await addBooking(booking);
    return res.status(201).json({ bookingId: booking.id });
  } catch (err) {
    console.error('[BOOKING] create failed:', err);
    return res.status(500).json({ error: 'Could not create booking.' });
  }
});

export default router;
