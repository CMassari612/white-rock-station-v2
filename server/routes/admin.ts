import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';

const router = express.Router();

/**
 * GET /api/admin/health
 * Simple authenticated ping endpoint
 */
router.get('/health', requireAdmin, (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;

