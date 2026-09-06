import express, { Request, Response } from 'express';
import { resolveRole } from '../middleware/staffAuth';

const router = express.Router();

// POST /api/auth/login { password } → { role, name }
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body || {};
    const { role, cleaner } = await resolveRole(password || '');
    if (!role) return res.status(401).json({ error: 'Incorrect password' });
    res.json({ role, name: cleaner?.name || 'Admin' });
  } catch (err) {
    console.error('[AUTH] login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
