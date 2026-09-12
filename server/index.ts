import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import unitsRoutes from './routes/units';
import availabilityRoutes from './routes/availability';
import bookingRequestRoutes from './routes/booking-request';
import stripeRouter from './routes/stripe';
import stripeWebhookRouter from './routes/stripe-webhook';
import adminBookingsRoutes from './routes/admin-bookings';
import adminUnitsRoutes from './routes/admin-units';
import adminCleanersRoutes from './routes/admin-cleaners';
import authRoutes from './routes/auth';
import staffRoutes from './routes/staff';
import { seedUnitsIfNeeded } from './utils/seedUnits';
import { expirePendingBookings } from './storage/bookingsStore';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

// Stripe webhook needs the raw body for signature verification (before express.json)
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());

app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Temporary DB diagnostic — reports whether Postgres is configured and reachable
// (no secrets leaked). Remove once persistence is confirmed working.
app.get('/api/db-status', async (_req, res) => {
  const configured = Boolean(
    process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
  );
  const host = (process.env.POSTGRES_URL || process.env.DATABASE_URL || '')
    .replace(/\/\/[^@]*@/, '//***@'); // mask credentials, keep host/port visible
  if (!configured) {
    return res.json({ configured: false, ok: false, error: 'No POSTGRES_URL / DATABASE_URL set on this deployment.' });
  }
  try {
    const { readCollection } = await import('./storage/db');
    const rows = await readCollection<any>('units');
    return res.json({ configured: true, ok: true, unitsInDb: rows.length, conn: host });
  } catch (e: any) {
    return res.json({ configured: true, ok: false, code: e?.code || null, error: String(e?.message || e).slice(0, 300), conn: host });
  }
});

app.use('/api/units', unitsRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/booking', bookingRequestRoutes);
app.use('/api/stripe', stripeRouter);
app.use('/api/auth', authRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/units', adminUnitsRoutes);
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
