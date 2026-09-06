// Carries the guest's cottage/date/guest selection from the detail page into the
// booking/checkout page. Uses sessionStorage so it survives the navigation.

export interface BookingSelection {
  slug: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  guests: number;
}

const KEY = 'wrs_booking_selection';

export function setBookingSelection(sel: BookingSelection) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(sel));
  } catch {
    /* ignore */
  }
}

export function getBookingSelection(): BookingSelection | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BookingSelection) : null;
  } catch {
    return null;
  }
}

export function clearBookingSelection() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
