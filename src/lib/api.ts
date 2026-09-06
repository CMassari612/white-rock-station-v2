import { getAdminPassword } from './adminSession';

// In production (e.g. Vercel) the API is served from the same origin, so use a
// relative base ('') and let the platform route /api/* to the serverless function.
// In local dev, default to the standalone Express server on :5050.
const API_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5050' : '');

export type LodgingType = 'small-cabin' | 'large-cabin' | 'campsite';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string; // Optional - can be empty string
}

export interface AvailabilityRequest {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
}

export interface BookingRequest {
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
  guests: number;
  customerInfo: CustomerInfo;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  amount: number;
  paymentIntentId: string;
}

export interface Booking {
  id: string;
  lodgingType: LodgingType;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  paymentIntentId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  customerInfo: CustomerInfo;
  createdAt: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch (err: any) {
    const errorWithStatus = new Error(
      `Failed to reach backend API at ${API_URL}. Is the server running?`
    ) as Error & { status?: number; cause?: unknown };
    errorWithStatus.status = 0;
    errorWithStatus.cause = err;
    throw errorWithStatus;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const errorWithStatus = new Error(error.error || 'Request failed') as Error & { status?: number };
    errorWithStatus.status = response.status;
    throw errorWithStatus;
  }

  return response.json();
}

function getAdminHeaders(authToken?: string) {
  const token = authToken || getAdminPassword();
  return token ? { 'x-admin-password': token } : {};
}

export const api = {
  checkAvailability: (data: AvailabilityRequest) =>
    request<{ available: boolean }>('/api/bookings/check-availability', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createPaymentIntent: (data: BookingRequest) =>
    request<PaymentIntentResponse>('/api/bookings/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  confirmBooking: (data: { paymentIntentId: string; bookingData: BookingRequest }) =>
    request<{ booking: Booking }>('/api/bookings/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBooking: (id: string) =>
    request<{ booking: Booking }>(`/api/bookings/${id}`),

  // Booking request endpoints
  getAvailability: (params: { unitType: string; start: string; end: string }) =>
    request<{
      unitType: string;
      start: string;
      end: string;
      days: Array<{ date: string; available: number }>;
    }>(`/api/availability?unitType=${params.unitType}&start=${params.start}&end=${params.end}`),

  // Per-unit availability — each cabin with the dates it's already taken.
  getUnitAvailability: (params: { unitType: string; start: string; end: string }) =>
    request<{
      unitType: string;
      start: string;
      end: string;
      units: Array<{
        unitId: string;
        name: string;
        number: number | null;
        photoUrl?: string;
        description?: string;
        unavailableDates: string[];
      }>;
    }>(`/api/availability/by-unit?unitType=${params.unitType}&start=${params.start}&end=${params.end}`),

  submitBookingRequest: (data: {
    name: string;
    email: string;
    phone: string;
    bookingType: 'cabin' | 'campsite' | 'marina' | 'marina_daily' | 'season_slip';
    unitType: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
    unitId?: string;
    startDate?: string;
    endDate?: string;
    guests?: number;
    notes?: string;
    slipLengthFt?: number;
    accessCode?: string;
    boatLengthFt?: number;
    boatMake?: string;
    boatRegistration?: string;
    insuranceCarrier?: string;
    insurancePolicyNumber?: string;
    insuranceExpiration?: string;
  }) =>
    request<{
      id: string;
      name: string;
      email: string;
      phone: string;
      bookingType: string;
      unitType: string;
      startDate: string;
      endDate: string;
      guests: number;
      status: string;
      createdAt: string;
      notes?: string;
      slipLengthFt?: number;
      boatLengthFt?: number;
      boatMake?: string;
      boatRegistration?: string;
      insuranceCarrier?: string;
      insurancePolicyNumber?: string;
      insuranceExpiration?: string;
      accessCodeUsed?: boolean;
      accessCodeUsedAt?: string;
    }>('/api/booking/request', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createCheckoutSession: (bookingId: string) =>
    request<{ url: string }>('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ bookingId }),
    }),

  // Public booking lookup for the post-payment success page
  getBookingRequest: (id: string) =>
    request<{
      booking: {
        id: string;
        status: BookingRequest['status'];
        unitType: BookingRequest['unitType'];
        startDate: string;
        endDate: string;
        paidAt?: string;
        refundId?: string;
        refundedAt?: string;
      };
    }>(`/api/booking/${id}`),

  // Admin endpoints
  admin: {
    createManualBooking: (data: {
      paymentMethod: 'cash' | 'stripe';
      name: string;
      email: string;
      phone?: string;
      bookingType: 'cabin' | 'campsite' | 'marina' | 'marina_daily' | 'season_slip';
      unitType: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
      startDate?: string;
      endDate?: string;
      guests?: number;
      notes?: string;
      slipLengthFt?: number;
      requestedSlipNumber?: number;
      requestedCampsiteNumber?: number;
      boatLengthFt?: number;
      boatMake?: string;
      boatRegistration?: string;
      insuranceCarrier?: string;
      insurancePolicyNumber?: string;
      insuranceExpiration?: string;
    }, authToken?: string) =>
      request<{ booking: BookingRequest }>('/api/admin/bookings/manual', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAdminHeaders(authToken),
      }),
    getBookings: (authToken?: string) =>
      request<{ bookings: BookingRequest[] }>('/api/admin/bookings', {
        headers: getAdminHeaders(authToken),
      }),

    getBooking: (id: string, authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/bookings/${id}`, {
        headers: getAdminHeaders(authToken),
      }),

    updateBookingStatus: (id: string, status: string, authToken?: string) =>
      request<{ booking: Booking }>(`/api/admin/bookings/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
        headers: getAdminHeaders(authToken),
      }),

    // Cancel/remove a booking (frees the slot). Uses the working booking-requests status endpoint.
    cancelBooking: (id: string, authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/booking-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
        headers: getAdminHeaders(authToken),
      }),

    // Approve a booking awaiting approval: captures the held payment + confirms.
    approveBooking: (id: string, authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/bookings/${id}/approve`, {
        method: 'POST',
        headers: getAdminHeaders(authToken),
      }),

    // Reject a booking awaiting approval: voids the card hold (no charge) + cancels.
    rejectBooking: (id: string, authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/bookings/${id}/reject`, {
        method: 'POST',
        headers: getAdminHeaders(authToken),
      }),

    getAvailability: (startDate?: string, endDate?: string, authToken?: string) =>
      request<{ availability: any; dateRange: any }>(
        `/api/admin/availability?${new URLSearchParams({
          ...(startDate && { startDate }),
          ...(endDate && { endDate }),
        })}`,
        {
          headers: getAdminHeaders(authToken),
        }
      ),

    getStats: (authToken?: string) =>
      request<{ stats: any }>('/api/admin/stats', {
        headers: getAdminHeaders(authToken),
      }),

    // Units endpoints
    getUnits: (authToken?: string) =>
      request<{ units: Unit[] }>('/api/admin/units', {
        headers: getAdminHeaders(authToken),
      }),

    createUnit: (data: {
      name: string;
      unitType: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
      category?: 'cabin' | 'campsite' | 'marina';
      active?: boolean;
      notes?: string;
    }, authToken?: string) =>
      request<{ unit: Unit }>('/api/admin/units', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: getAdminHeaders(authToken),
      }),

    updateUnit: (id: string, data: {
      name?: string;
      unitType?: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
      category?: 'cabin' | 'campsite' | 'marina';
      active?: boolean;
      notes?: string;
    }, authToken?: string) =>
      request<{ unit: Unit }>(`/api/admin/units/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: getAdminHeaders(authToken),
      }),

    deleteUnit: (id: string, authToken?: string) =>
      request<{ success: boolean }>(`/api/admin/units/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(authToken),
      }),

    // Booking request endpoints (new booking system)
    getBookingRequests: (filters?: {
      status?: string;
      bookingType?: string;
      unitType?: string;
      startDate?: string;
      endDate?: string;
    }, authToken?: string) =>
      request<{ bookings: BookingRequest[] }>(
        `/api/admin/booking-requests?${new URLSearchParams((filters as any) || {})}`,
        {
          headers: getAdminHeaders(authToken),
        }
      ),

    getBookingRequest: (id: string, authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/booking-requests/${id}`, {
        headers: getAdminHeaders(authToken),
      }),

    updateBookingRequestStatus: (id: string, status: 'pending' | 'confirmed' | 'cancelled' | 'paid', authToken?: string) =>
      request<{ booking: BookingRequest }>(`/api/admin/booking-requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        headers: getAdminHeaders(authToken),
      }),
  },
};

export interface Unit {
  id: string;
  name: string;
  unitType: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
  category?: 'cabin' | 'campsite' | 'marina';
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Booking request type (new booking system)
export interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  bookingType: 'cabin' | 'campsite' | 'marina' | 'marina_daily' | 'season_slip';
  unitType: 'small_cabin' | 'large_cabin' | 'campsite' | 'marina_slip';
  assignedUnitId?: string;
  assignedUnitLabel?: string;
  assignedUnitNumber?: number;
  startDate: string;
  endDate: string;
  guests: number;
  status: 'pending' | 'pending_approval' | 'confirmed' | 'cancelled' | 'paid' | 'expired' | 'payment_conflict' | 'overbooked' | 'refund_needed' | 'refunded';
  createdAt: string;
  notes?: string;
  slipLengthFt?: number;
  requestedSlipNumber?: number;
  requestedCampsiteNumber?: number;
  boatLengthFt?: number;
  boatMake?: string;
  boatRegistration?: string;
  insuranceCarrier?: string;
  insurancePolicyNumber?: string;
  insuranceExpiration?: string;
  paymentMethod?: 'stripe' | 'cash';
  cleaningEmailSentAt?: string;
  // Stripe payment fields
  stripeSessionId?: string;
  stripeCustomerId?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  stripeRefundId?: string;
  refundAt?: string;
  refundId?: string;
  refundedAt?: string;
}

