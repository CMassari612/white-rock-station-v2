import Stripe from 'stripe';

/**
 * Get Stripe client instance if configured
 * Returns null if STRIPE_SECRET_KEY is not set (does not throw)
 */
export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    return null;
  }

  try {
    return new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  } catch (error) {
    console.error('[STRIPE] Error initializing Stripe client:', error);
    return null;
  }
}

/**
 * @deprecated Use getStripe() instead
 * Kept for backward compatibility with existing code
 */
export const stripe = getStripe();
