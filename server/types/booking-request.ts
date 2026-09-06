import { UnitType } from './unit';

export type { UnitType };

export type BookingStatus =
  | 'pending' // created, awaiting checkout
  | 'pending_approval' // card authorized (held), awaiting admin approval
  | 'confirmed' // approved + captured
  | 'cancelled'
  | 'expired'
  | 'refunded';

export interface BookingAddOns {
  firewood?: number; // number of bundles
}

export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  unitType: UnitType;
  unitId: string; // the specific cottage / tent area booked
  unitName?: string;
  startDate: string; // YYYY-MM-DD (check-in)
  endDate: string; // YYYY-MM-DD (checkout)
  guests: number;
  status: BookingStatus;
  createdAt: string; // ISO
  notes?: string;

  addOns?: BookingAddOns;
  promoCode?: string;
  agreedToTerms?: boolean;

  // Price snapshot (USD cents), captured at booking time
  lodgingCents?: number;
  cleaningFeeCents?: number;
  taxCents?: number;
  addOnsCents?: number;
  totalCents?: number;

  // Payment / approval flow (manual capture)
  paymentMethod?: 'stripe' | 'cash';
  authorizedAt?: string; // ISO — card held
  paidAt?: string; // ISO — charge captured
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  refundId?: string;
  refundedAt?: string;
  cleaningEmailSentAt?: string;

  // Cleaner assigned to this stay's cleaning (day after checkout)
  assignedCleanerId?: string;

  // Legacy assignment fields (kept so the shared store type-checks; unused here)
  assignedUnitId?: string;
  assignedUnitLabel?: string;
  assignedUnitNumber?: number;
}

// What the public booking form submits
export interface BookingRequestInput {
  unitId: string;
  startDate: string;
  endDate: string;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  addOns?: BookingAddOns;
  promoCode?: string;
  agreedToTerms: boolean;
}
