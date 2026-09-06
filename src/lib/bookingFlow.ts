import { api } from './api';

/**
 * Shared Stripe checkout flow:
 * 1) Create booking (pending) via POST /api/booking/request
 * 2) Create Stripe Checkout Session via POST /api/stripe/create-checkout-session
 * 3) Redirect browser to Stripe Checkout URL
 */
export async function createBookingAndRedirectToStripe(payload: Parameters<typeof api.submitBookingRequest>[0]) {
  const booking = await api.submitBookingRequest(payload);
  const checkout = await api.createCheckoutSession(booking.id);

  if (!checkout.url) {
    throw new Error('Failed to get Stripe checkout URL');
  }

  window.location.href = checkout.url;
}

