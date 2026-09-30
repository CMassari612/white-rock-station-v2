import express, { Request, Response } from 'express';
import { requireAdmin } from '../middleware/adminAuth';
import {
  getAllStoreProducts, addStoreProduct, updateStoreProduct, deleteStoreProduct, StoreProduct,
} from '../storage/storeStore';
import { uploadUnitPhoto, isStorageConfigured } from '../utils/supabaseStorage';

const router = express.Router();
router.use(requireAdmin);

function slugify(s: string): string {
  return (s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || `item-${Date.now()}`;
}

const EDITABLE: (keyof StoreProduct)[] = ['name', 'priceCents', 'blurb', 'accent', 'image', 'active'];

function sanitize(body: any): Partial<StoreProduct> {
  const patch: Partial<StoreProduct> = {};
  for (const k of EDITABLE) {
    if (body[k] !== undefined) (patch as any)[k] = body[k];
  }
  if (patch.priceCents !== undefined) patch.priceCents = Math.max(0, Math.trunc(Number(patch.priceCents) || 0));
  return patch;
}

// GET /api/admin/store — all products (incl. inactive)
router.get('/', async (_req: Request, res: Response) => {
  res.json({ products: await getAllStoreProducts() });
});

// POST /api/admin/store — add a product
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ error: 'A product name is required.' });
    }
    const products = await getAllStoreProducts();
    let id = slugify(body.id || body.name);
    const existing = new Set(products.map(p => p.id));
    if (existing.has(id)) id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
    const patch = sanitize(body);
    const product: StoreProduct = {
      id,
      name: String(body.name).trim(),
      priceCents: patch.priceCents ?? 0,
      blurb: patch.blurb ?? '',
      accent: patch.accent ?? 'var(--forest-green)',
      image: patch.image ?? '',
      active: body.active !== false,
      updatedAt: new Date().toISOString(),
    };
    await addStoreProduct(product);
    res.status(201).json({ product });
  } catch (err) {
    console.error('[ADMIN store] create failed:', err);
    res.status(500).json({ error: 'Could not create the product.' });
  }
});

// PATCH /api/admin/store/:id — edit name, price, description, active
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const updated = await updateStoreProduct(req.params.id, sanitize(req.body || {}));
    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    res.json({ product: updated });
  } catch (err) {
    console.error('[ADMIN store] update failed:', err);
    res.status(500).json({ error: 'Could not update the product.' });
  }
});

// DELETE /api/admin/store/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const ok = await deleteStoreProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found.' });
  res.json({ ok: true });
});

// POST /api/admin/store/:id/photo — upload a product image (raw image bytes)
router.post('/:id/photo', express.raw({ type: ['image/*'], limit: '15mb' }), async (req: Request, res: Response) => {
  try {
    if (!isStorageConfigured()) {
      return res.status(503).json({ error: 'Photo storage is not configured yet (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' });
    }
    const buf = req.body as Buffer;
    if (!buf || !buf.length) return res.status(400).json({ error: 'No image data received.' });
    const products = await getAllStoreProducts();
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const contentType = req.get('content-type') || 'image/jpeg';
    const url = await uploadUnitPhoto(`store-${product.id}`, buf, contentType);
    const updated = await updateStoreProduct(product.id, { image: url });
    res.status(201).json({ product: updated, url });
  } catch (err: any) {
    console.error('[ADMIN store] photo upload failed:', err);
    res.status(500).json({ error: err?.message || 'Could not upload the photo.' });
  }
});

export default router;
