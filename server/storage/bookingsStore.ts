import { Booking, BookingStatus } from '../types/booking-request';
import { readCollection, writeCollection } from './db';

const BOOKINGS_KEY = 'bookings';

// Load all bookings (Postgres in prod, data/bookings.json in local dev)
export async function getAllBookings(): Promise<Booking[]> {
  return readCollection<Booking>(BOOKINGS_KEY);
}

// Save all bookings
export async function saveAllBookings(bookings: Booking[]): Promise<void> {
  await writeCollection<Booking>(BOOKINGS_KEY, bookings);
}

// Add a new booking
export async function addBooking(booking: Booking): Promise<Booking> {
  const bookings = await getAllBookings();
  bookings.push(booking);
  await saveAllBookings(bookings);
  return booking;
}

// Update booking status
export async function updateBookingStatus(
  id: string,
  status: BookingStatus
): Promise<Booking | null> {
  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.id === id);
  
  if (!booking) {
    return null;
  }
  
  booking.status = status;
  await saveAllBookings(bookings);
  return booking;
}

// Update booking with Stripe data
export async function updateBookingWithStripeData(
  id: string,
  updates: {
    status?: BookingStatus;
    stripeSessionId?: string;
    stripeCustomerId?: string;
    stripePaymentIntentId?: string;
    paidAt?: string;
    stripeRefundId?: string;
    refundAt?: string;
    refundId?: string;
    refundedAt?: string;
    assignedUnitId?: string;
    assignedUnitLabel?: string;
    assignedUnitNumber?: number;
    cleaningEmailSentAt?: string;
    paymentMethod?: 'stripe' | 'cash';
    authorizedAt?: string;
  }
): Promise<Booking | null> {
  const bookings = await getAllBookings();
  const booking = bookings.find(b => b.id === id);
  
  if (!booking) {
    return null;
  }
  
  if (updates.status !== undefined) {
    booking.status = updates.status;
  }
  if (updates.stripeSessionId !== undefined) {
    booking.stripeSessionId = updates.stripeSessionId;
  }
  if (updates.stripeCustomerId !== undefined) {
    booking.stripeCustomerId = updates.stripeCustomerId;
  }
  if (updates.stripePaymentIntentId !== undefined) {
    booking.stripePaymentIntentId = updates.stripePaymentIntentId;
  }
  if (updates.paidAt !== undefined) {
    booking.paidAt = updates.paidAt;
  }
  if (updates.stripeRefundId !== undefined) {
    booking.stripeRefundId = updates.stripeRefundId;
  }
  if (updates.refundAt !== undefined) {
    booking.refundAt = updates.refundAt;
  }
  if (updates.refundId !== undefined) {
    booking.refundId = updates.refundId;
  }
  if (updates.refundedAt !== undefined) {
    booking.refundedAt = updates.refundedAt;
  }
  if (updates.assignedUnitId !== undefined) {
    booking.assignedUnitId = updates.assignedUnitId;
  }
  if (updates.assignedUnitLabel !== undefined) {
    booking.assignedUnitLabel = updates.assignedUnitLabel;
  }
  if (updates.assignedUnitNumber !== undefined) {
    booking.assignedUnitNumber = updates.assignedUnitNumber;
  }
  if (updates.cleaningEmailSentAt !== undefined) {
    booking.cleaningEmailSentAt = updates.cleaningEmailSentAt;
  }
  if (updates.paymentMethod !== undefined) {
    booking.paymentMethod = updates.paymentMethod;
  }
  if (updates.authorizedAt !== undefined) {
    booking.authorizedAt = updates.authorizedAt;
  }

  await saveAllBookings(bookings);
  return booking;
}

// Get booking by ID
export async function getBookingById(id: string): Promise<Booking | null> {
  const bookings = await getAllBookings();
  return bookings.find(b => b.id === id) || null;
}

// Expire pending bookings older than specified minutes
export async function expirePendingBookings(expiryMinutes: number = 30): Promise<number> {
  const bookings = await getAllBookings();
  const now = new Date();
  let expiredCount = 0;
  
  bookings.forEach(booking => {
    if (booking.status === 'pending') {
      const createdAt = new Date(booking.createdAt);
      const ageMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (ageMinutes > expiryMinutes) {
        booking.status = 'expired';
        expiredCount++;
      }
    }
  });
  
  if (expiredCount > 0) {
    await saveAllBookings(bookings);
  }
  
  return expiredCount;
}


