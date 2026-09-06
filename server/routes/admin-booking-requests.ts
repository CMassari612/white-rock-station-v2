import express, { Request, Response } from 'express';
import { Booking, BookingStatus } from '../types/booking-request';
import { getAllBookings, updateBookingStatus } from '../storage/bookingsStore';
import { syncBookingStatusToSheet, syncBookingStatusToCalendar } from '../integrations/sync';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(requireAdmin);

// Valid booking statuses (admin may update legacy records; overbooked is set automatically by webhook)
const VALID_STATUSES: BookingStatus[] = ['pending', 'confirmed', 'cancelled', 'paid', 'expired', 'payment_conflict', 'overbooked', 'refunded'];

// GET /api/admin/booking-requests - Get all booking requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, bookingType, unitType, startDate, endDate } = req.query;
    let bookings = await getAllBookings();

    // Apply filters
    if (status) {
      bookings = bookings.filter(b => b.status === status as BookingStatus);
    }

    if (bookingType) {
      bookings = bookings.filter(b => b.bookingType === bookingType);
    }

    if (unitType) {
      bookings = bookings.filter(b => b.unitType === unitType);
    }

    if (startDate) {
      const start = new Date(startDate as string);
      bookings = bookings.filter(b => new Date(b.endDate) >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      bookings = bookings.filter(b => new Date(b.startDate) <= end);
    }

    // Sort by start date (newest first)
    bookings.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ error: 'Failed to fetch booking requests' });
  }
});

// GET /api/admin/booking-requests/:id - Get booking request by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookings = await getAllBookings();
    const booking = bookings.find(b => b.id === id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    res.json({ booking });
  } catch (error) {
    console.error('Error retrieving booking request:', error);
    res.status(500).json({ error: 'Failed to retrieve booking request' });
  }
});

// PATCH /api/admin/booking-requests/:id/status - Update booking request status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status as BookingStatus)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` 
      });
    }

    // Update booking status
    const updatedBooking = await updateBookingStatus(id, status as BookingStatus);

    if (!updatedBooking) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    // Trigger sync hooks (don't block on errors)
    try {
      await syncBookingStatusToSheet(updatedBooking);
    } catch (error) {
      console.error(`Failed to sync booking ${id} to Google Sheets:`, error);
    }

    try {
      await syncBookingStatusToCalendar(updatedBooking);
    } catch (error) {
      console.error(`Failed to sync booking ${id} to Google Calendar:`, error);
    }

    res.json({ booking: updatedBooking });
  } catch (error) {
    console.error('Error updating booking request status:', error);
    res.status(500).json({ error: 'Failed to update booking request status' });
  }
});

export default router;


