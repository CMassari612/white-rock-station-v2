import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import unitsRoutes from './routes/units';
import availabilityRoutes from './routes/availability';
import bookingRequestRoutes from './routes/booking-request';
import stripeRouter from './routes/stripe';
import stripeWebhookRouter from './routes/stripe-webhook';
import adminBookingsRoutes from './routes/admin-bookings';
import adminCleanersRoutes from './routes/admin-cleaners';
import authRoutes from './routes/auth';
import staffRoutes from './routes/staff';
import { seedUnitsIfNeeded } from './utils/seedUnits';
import { expirePendingBookings } from './storage/bookingsStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

// Stripe webhook needs the raw body for signature verification (before express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/units', unitsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/booking', bookingRequestRoutes);
app.use('/api/stripe', stripeRouter);
app.use('/api/auth', authRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/cleaners', adminCleanersRoutes);
app.use('/api/staff', staffRoutes);

seedUnitsIfNeeded().catch(err => console.error('Error seeding units:', err));

if (!process.env.VERCEL) {
  // Expire abandoned pending (pre-checkout) bookings periodically.
  expirePendingBookings(30).catch(() => {});
  setInterval(() => { expirePendingBookings(30).catch(() => {}); }, 15 * 60 * 1000);
  app.listen(PORT, () => console.log(`White Rock Station server running on port ${PORT}`));
}

export default app;
