import express, { Request, Response } from 'express';
import { stripe } from '../utils/stripe';
import { bookings, checkAvailability, createBooking } from '../utils/bookings';
import { 
  Booking, 
  AvailabilityRequest, 
  CreateIntentRequest, 
  ConfirmBookingRequest,
  LodgingType 
} from '../types/booking';

const router = express.Router();

// Pricing configuration
const PRICING: Record<LodgingType, number> = {
  'small-cabin': 125,
  'large-cabin': 250,
  'campsite': 45,
};

function calculateTotal(lodgingType: LodgingType, checkIn: string, checkOut: string): number {
  const pricePerNight = PRICING[lodgingType];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return pricePerNight * nights;
}

// Check availability
router.post('/check-availability', (req: Request<{}, {}, AvailabilityRequest>, res: Response) => {
  try {
    const { lodgingType, checkIn, checkOut } = req.body;
    
    if (!lodgingType || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const isAvailable = checkAvailability(lodgingType, checkIn, checkOut);
    
    res.json({ 
      available: isAvailable,
      lodgingType,
      checkIn,
      checkOut,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Create payment intent
// Stripe code commented out - uncomment when Stripe API keys are configured
router.post('/create-intent', async (req: Request<{}, {}, CreateIntentRequest>, res: Response) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(501).json({ 
        error: 'Online payments are not configured yet. Please contact us to book.' 
      });
    }

    const { lodgingType, checkIn, checkOut, guests, customerInfo } = req.body;

    if (!lodgingType || !checkIn || !checkOut || !guests || !customerInfo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check availability first
    const isAvailable = checkAvailability(lodgingType, checkIn, checkOut);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Selected dates are not available' });
    }

    const amount = calculateTotal(lodgingType, checkIn, checkOut);
    const amountInCents = Math.round(amount * 100);

    // Create Stripe PaymentIntent - COMMENTED OUT
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amountInCents,
    //   currency: 'usd',
    //   metadata: {
    //     lodgingType,
    //     checkIn,
    //     checkOut,
    //     guests: guests.toString(),
    //     customerName: customerInfo.name,
    //     customerEmail: customerInfo.email,
    //   },
    // });

    // res.json({
    //   clientSecret: paymentIntent.client_secret,
    //   amount,
    //   paymentIntentId: paymentIntent.id,
    // });

    // Temporary: Return error until Stripe is configured
    return res.status(501).json({ 
      error: 'Online payments are not configured yet. Please contact us to book.' 
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm booking after successful payment
// Stripe code commented out - uncomment when Stripe API keys are configured
router.post('/confirm', async (req: Request<{}, {}, ConfirmBookingRequest>, res: Response) => {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return res.status(501).json({ 
        error: 'Online payments are not configured yet. Please contact us to book.' 
      });
    }

    const { paymentIntentId, bookingData } = req.body;

    if (!paymentIntentId || !bookingData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify payment intent - COMMENTED OUT
    // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    // 
    // if (paymentIntent.status !== 'succeeded') {
    //   return res.status(400).json({ error: 'Payment not completed' });
    // }

    // Create booking - COMMENTED OUT
    // const booking = createBooking({
    //   ...bookingData,
    //   paymentIntentId,
    //   totalAmount: calculateTotal(bookingData.lodgingType, bookingData.checkIn, bookingData.checkOut),
    // });

    // res.json({ booking });

    // Temporary: Return error until Stripe is configured
    return res.status(501).json({ 
      error: 'Online payments are not configured yet. Please contact us to book.' 
    });
  } catch (error) {
    console.error('Error confirming booking:', error);
    res.status(500).json({ error: 'Failed to confirm booking' });
  }
});

// Get booking by ID
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error retrieving booking:', error);
    res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

export default router;

