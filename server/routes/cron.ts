import { Router, Request, Response } from 'express';
import { expirePendingBookings } from '../storage/bookingsStore';

const router = Router();

/**
 * Invoked by Vercel Cron (see vercel.json) to expire stale pending bookings,
 * replacing the in-process setInterval used during local dev.
 *
 * If CRON_SECRET is set, Vercel sends it as `Authorization: Bearer <secret>`.
 * We verify it when present so the endpoint can't be triggered by random traffic.
 */
router.get('/expire-pending', async (req: Request, res: Response) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.header('authorization');
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    const expiredCount = await expirePendingBookings(30);
    return res.status(200).json({ ok: true, expiredCount });
  } catch (err) {
    console.error('[CRON] Error expiring pending bookings:', err);
    return res.status(500).json({ ok: false, error: 'Failed to expire bookings' });
  }
});

export default router;
