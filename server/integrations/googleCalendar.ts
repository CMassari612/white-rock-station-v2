import { Booking } from '../types/booking-request';
import { format } from 'date-fns';

/**
 * Google Calendar Integration Module
 * 
 * Environment Variables Required:
 * - GOOGLE_CALENDAR_ID: The ID of the Google Calendar (usually an email address like "calendar@domain.com" or the calendar name)
 * - GOOGLE_SERVICE_ACCOUNT_JSON: Service account JSON credentials (either JSON string or path to JSON file)
 *   (Note: Can be the same GOOGLE_SERVICE_ACCOUNT_JSON used for Sheets integration)
 * 
 * Example .env:
 * GOOGLE_CALENDAR_ID=whiterockstation-reservations@domain.com
 * GOOGLE_SERVICE_ACCOUNT_JSON=/path/to/service-account.json
 * 
 * Until these env vars are configured, all functions will NO-OP safely.
 */

/**
 * Get a friendly unit type label for calendar events
 */
function getFriendlyUnitType(unitType: Booking['unitType']): string {
  const labels: Record<Booking['unitType'], string> = {
    small_cabin: 'Small Cabin',
    large_cabin: 'Large Cabin',
    campsite: 'Campsite',
    marina_slip: 'Marina Slip',
  };
  return labels[unitType] || unitType;
}

/**
 * Format a date string for display
 */
function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

/**
 * Check if Google Calendar integration is configured
 */
function isGoogleCalendarConfigured(): boolean {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const serviceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  return !!(calendarId && serviceAccount);
}

/**
 * Create a calendar event for a new booking
 * 
 * TODO: Implement Google Calendar API integration
 * - Use @googleapis/calendar package
 * - Authenticate using service account JSON from GOOGLE_SERVICE_ACCOUNT_JSON
 * - Use GOOGLE_CALENDAR_ID to identify the calendar
 * - Insert event with:
 *   - summary: `${friendlyUnitType} – ${booking.name} (${booking.startDate} to ${booking.endDate})`
 *     Example: "Small Cabin – John Doe (Jan 15, 2025 to Jan 20, 2025)"
 *   - start: { date: booking.startDate, timeZone: 'America/Chicago' } (or appropriate timezone)
 *     Default check-in time: 3:00 PM
 *   - end: { date: booking.endDate, timeZone: 'America/Chicago' }
 *     Default check-out time: 11:00 AM
 *   - description: Multiline text containing:
 *     - Guest: ${booking.name}
 *     - Email: ${booking.email}
 *     - Phone: ${booking.phone}
 *     - Guests: ${booking.guests}
 *     - Booking Type: ${booking.bookingType}
 *     - Unit Type: ${friendlyUnitType}
 *     - Status: ${booking.status}
 *     - Booking ID: ${booking.id}
 *     - Notes: ${booking.notes || 'None'}
 *   - colorId: Based on booking status (e.g., green for confirmed, yellow for pending, red for cancelled)
 * - Store the returned event.id in booking.calendarEventId when Calendar integration is fully implemented
 * - Handle errors gracefully
 */
export async function createBookingEvent(booking: Booking): Promise<void> {
  if (!isGoogleCalendarConfigured()) {
    console.log(`Google Calendar integration not configured; skipping create for booking ${booking.id}`);
    return;
  }

  try {
    // TODO: Implement Google Calendar API create event operation
    // const { google } = require('googleapis');
    // const calendar = google.calendar('v3');
    // 
    // Example structure:
    // 1. Authenticate with service account
    // 2. Get calendar by ID
    // 3. Format start/end times with default check-in/out times
    // 4. Create event with summary, description, dates
    // 5. Set color based on status
    // 6. Store event.id in booking.calendarEventId (requires booking model update)
    
    const friendlyUnitType = getFriendlyUnitType(booking.unitType);
    const summary = `${friendlyUnitType} – ${booking.name} (${formatDate(booking.startDate)} to ${formatDate(booking.endDate)})`;
    
    console.log(`[Google Calendar] Would create event for booking ${booking.id}: "${summary}" (not yet implemented)`);
  } catch (error) {
    console.error(`[Google Calendar] Error creating event for booking ${booking.id}:`, error);
    throw error; // Re-throw so caller can log
  }
}

/**
 * Update an existing calendar event for a booking
 * 
 * TODO: Implement Google Calendar API integration
 * - Use @googleapis/calendar package
 * - Authenticate using service account JSON from GOOGLE_SERVICE_ACCOUNT_JSON
 * - Use GOOGLE_CALENDAR_ID to identify the calendar
 * - Look up event using booking.calendarEventId (when this field is added to booking model)
 * - If calendarEventId is not present, log warning and skip update
 * - Patch the event with:
 *   - summary: Updated summary with new dates/name if changed
 *   - description: Updated description with new contact info, guests, status, notes
 *   - start/end: Updated dates if booking dates changed
 *   - colorId: Updated based on current booking.status:
 *     - pending: yellow (11)
 *     - confirmed: green (10)
 *     - cancelled: red (11) or gray (8)
 *     - paid: bright green (6)
 * - Handle case where event is not found (log warning)
 * - Handle errors gracefully
 */
export async function updateBookingEvent(booking: Booking): Promise<void> {
  if (!isGoogleCalendarConfigured()) {
    console.log(`Google Calendar integration not configured; skipping update for booking ${booking.id}`);
    return;
  }

  try {
    // TODO: Implement Google Calendar API update event operation
    // const { google } = require('googleapis');
    // const calendar = google.calendar('v3');
    // 
    // Example structure:
    // 1. Authenticate with service account
    // 2. Get calendar by ID
    // 3. Check if booking.calendarEventId exists (requires booking model update)
    // 4. If not, log warning: "Booking ${booking.id} has no calendarEventId; cannot update event"
    // 5. Get event by ID from calendar
    // 6. Patch event with updated summary, description, dates, colorId
    // 7. Handle case where event is not found
    // 8. Handle errors gracefully
    
    const friendlyUnitType = getFriendlyUnitType(booking.unitType);
    const summary = `${friendlyUnitType} – ${booking.name} (${formatDate(booking.startDate)} to ${formatDate(booking.endDate)})`;
    
    console.log(`[Google Calendar] Would update event for booking ${booking.id}: "${summary}" (not yet implemented)`);
  } catch (error) {
    console.error(`[Google Calendar] Error updating event for booking ${booking.id}:`, error);
    throw error; // Re-throw so caller can log
  }
}


