import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import { getSiteText, applySiteTextEdits } from '../storage/siteTextStore';

const router = express.Router();

// GET /api/site-text — public: the current text overrides for the whole site.
router.get('/', async (_req: Request, res: Response) => {
  res.json({ text: await getSiteText() });
});

// POST /api/site-text — admin only: save a batch of edits { edits: { id: value } }.
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const edits = (req.body && req.body.edits) || {};
    if (typeof edits !== 'object' || Array.isArray(edits)) {
      return res.status(400).json({ error: 'edits must be an object of id -> text.' });
    }
    const text = await applySiteTextEdits(edits as Record<string, string>);
    res.json({ text });
  } catch (err: any) {
    console.error('[site-text] save failed:', err);
    res.status(500).json({ error: err?.message || 'Could not save text.' });
  }
});

export default router;
