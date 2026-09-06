import { Booking } from '../types/booking-request';
import { updateBookingRowInSheet } from './googleSheets';
import { updateBookingEvent } from './googleCalendar';

/**
 * Sync booking status to Google Sheets
 * This function is called after booking status updates to keep the sheet in sync.
 */
export async function syncBookingStatusToSheet(booking: Booking): Promise<void> {
  try {
    await updateBookingRowInSheet(booking);
  } catch (error) {
    console.warn(`[Sync] Failed to sync booking ${booking.id} status to Google Sheets:`, error);
    // Don't throw - this is a non-critical sync operation
  }
}

/**
 * Sync booking status to Google Calendar
 * This function is called after booking status updates to keep the calendar in sync.
 */
export async function syncBookingStatusToCalendar(booking: Booking): Promise<void> {
  try {
    await updateBookingEvent(booking);
  } catch (error) {
    console.warn(`[Sync] Failed to sync booking ${booking.id} status to Google Calendar:`, error);
    // Don't throw - this is a non-critical sync operation
  }
}

