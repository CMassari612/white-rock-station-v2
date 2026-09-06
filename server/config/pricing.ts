/**
 * Pricing configuration for all booking types
 * Prices are in USD per unit (night for lodging, day for marina)
 */

// Lodging prices (per night)
export const LODGING_PRICES = {
  small_cabin: 125, // $125 per night
  large_cabin: 250, // $250 per night
  campsite: 65, // $65 per night (placeholder as requested)
} as const;

// Marina slip pricing
export const MARINA_PRICE_PER_FOOT = 35; // $35 per foot per day

/**
 * Get price per night for lodging unit types
 */
export function getLodgingPrice(unitType: 'small_cabin' | 'large_cabin' | 'campsite'): number {
  return LODGING_PRICES[unitType];
}

/**
 * Get price per day for marina slips
 * @param lengthFt - Length of the boat in feet
 * @returns Price per day for the slip
 */
export function getMarinaPricePerDay(lengthFt: number): number {
  return lengthFt * MARINA_PRICE_PER_FOOT;
}
