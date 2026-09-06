import { Booking, LodgingType, CustomerInfo } from '../types/booking';
import { randomUUID } from 'crypto';

// In-memory storage for Phase 1
export const bookings: Booking[] = [];

// Property capacity (Phase 1 - simple logic)
const PROPERTY_COUNTS: Record<LodgingType, number> = {
  'small-cabin': 8,
  'large-cabin': 4,
  'campsite': 40,
};

export function checkAvailability(
  lodgingType: LodgingType,
  checkIn: string,
  checkOut: string
): boolean {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  
  // Get confirmed bookings for this lodging type that overlap with requested dates
  const overlappingBookings = bookings.filter(booking => {
    if (booking.lodgingType !== lodgingType || booking.status !== 'confirmed') {
      return false;
    }

    const bookingStart = new Date(booking.checkIn);
    const bookingEnd = new Date(booking.checkOut);

    // Check if dates overlap
    return start < bookingEnd && end > bookingStart;
  });

  const capacity = PROPERTY_COUNTS[lodgingType];
  return overlappingBookings.length < capacity;
}

export function createBooking(data: {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
  guests: number;
  customerInfo: CustomerInfo;
  paymentIntentId: string;
  totalAmount: number;
}): Booking {
  const booking: Booking = {
    id: randomUUID(),
    ...data,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  return booking;
}

