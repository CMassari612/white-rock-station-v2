import express, { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requireAdmin } from '../middleware/adminAuth';
import { getAllCleaners, addCleaner, updateCleaner, deleteCleaner } from '../storage/cleanersStore';

const router = express.Router();
router.use(requireAdmin);

// GET /api/admin/cleaners — list (passwords included so admin can share them)
router.get('/', async (_req: Request, res: Response) => {
  res.json({ cleaners: await getAllCleaners() });
});

// POST /api/admin/cleaners { name, phone, password }
router.post('/', async (req: Request, res: Response) => {
  const { name, phone, password } = req.body || {};
  if (!name || !password) return res.status(400).json({ error: 'Name and password are required.' });
  const cleaner = await addCleaner({
    id: randomUUID(),
    name: String(name).trim(),
    phone: String(phone || '').trim(),
    password: String(password).trim(),
    createdAt: new Date().toISOString(),
  });
  res.status(201).json({ cleaner });
});

// PATCH /api/admin/cleaners/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const { name, phone, password } = req.body || {};
  const updated = await updateCleaner(req.params.id, {
    ...(name !== undefined ? { name: String(name).trim() } : {}),
    ...(phone !== undefined ? { phone: String(phone).trim() } : {}),
    ...(password ? { password: String(password).trim() } : {}),
  });
  if (!updated) return res.status(404).json({ error: 'Cleaner not found' });
  res.json({ cleaner: updated });
});

// DELETE /api/admin/cleaners/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await deleteCleaner(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Cleaner not found' });
  res.json({ ok: true });
});

export default router;
