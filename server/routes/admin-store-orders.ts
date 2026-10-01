import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { getAllStoreOrders, setStoreOrderPickedUp } from '../storage/storeOrdersStore';

const router = express.Router();

// GET /api/admin/store-orders — list all store (merch) orders, newest first.
router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  try {
    res.json({ orders: await getAllStoreOrders() });
  } catch (err: any) {
    console.error('[STORE-ORDERS] list failed:', err);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

// POST /api/admin/store-orders/:id/picked-up  { pickedUp?: boolean }
router.post('/:id/picked-up', requireAdmin, async (req: Request, res: Response) => {
  try {
    const pickedUp = (req.body?.pickedUp !== false);
    const order = await setStoreOrderPickedUp(req.params.id, pickedUp);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json({ order });
  } catch (err: any) {
    console.error('[STORE-ORDERS] update failed:', err);
    res.status(500).json({ error: 'Could not update the order.' });
  }
});

export default router;
