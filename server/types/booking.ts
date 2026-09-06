export type LodgingType = 'small-cabin' | 'large-cabin' | 'campsite';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Booking {
  id: string;
  lodgingType: LodgingType;
  checkIn: string; // ISO date string
  checkOut: string; // ISO date string
  guests: number;
  totalAmount: number;
  paymentIntentId: string;
  status: BookingStatus;
  customerInfo: CustomerInfo;
  createdAt: string; // ISO date string
}

export interface AvailabilityRequest {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
}

export interface CreateIntentRequest {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
  guests: number;
  customerInfo: CustomerInfo;
}

export interface ConfirmBookingRequest {
  paymentIntentId: string;
  bookingData: CreateIntentRequest;
}

