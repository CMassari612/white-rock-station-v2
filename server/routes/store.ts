import express, { Request, Response } from 'express';
import { getStripe } from '../utils/stripe';
import { getAllStoreProducts } from '../storage/storeStore';

const router = express.Router();

// Flat shipping fee (placeholder) applied when the customer chooses shipping.
const SHIP_FEE_CENTS = 800;
// PA 6% sales tax, charged only on taxable items (housewares like mugs).
// Clothing and firewood are exempt in PA.
const MERCH_TAX_RATE = 0.06;

// GET /api/store/products — public catalog (active products only) for the storefront.
router.get('/products', async (_req: Request, res: Response) => {
  try {
    const all = await getAllStoreProducts();
    const products = all.filter(p => p.active !== false);
    res.json({ products, shipFeeCents: SHIP_FEE_CENTS });
  } catch (err) {
    console.error('[STORE] products failed:', err);
    res.status(500).json({ error: 'Could not load the store.' });
  }
});

// POST /api/store/checkout — build a Stripe Checkout session from the cart.
// Body: { items: [{ id, qty }], fulfillment: 'pickup' | 'ship' }
// Prices are read fresh from the datastore at checkout time, so any price the
// admin changes is applied to Stripe automatically on the next order.
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(501).json({ error: 'Stripe is not configured.' });

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    const catalog = await getAllStoreProducts();

    const line_items: any[] = [];
    const orderItems: { n: string; q: number; p: number }[] = [];
    let taxableCents = 0;
    for (const it of items) {
      const product = catalog.find((p) => p.id === it?.id && p.active !== false);
      if (!product) continue;
      const qty = Math.max(1, Math.min(20, parseInt(String(it?.qty ?? 1), 10) || 1));
      line_items.push({
        price_data: {
          currency: 'usd',
          unit_amount: product.priceCents,
          product_data: { name: product.name },
        },
        quantity: qty,
      });
      orderItems.push({ n: product.name, q: qty, p: product.priceCents });
      if (product.taxable) taxableCents += product.priceCents * qty;
    }
    if (line_items.length === 0) {
      return res.status(400).json({ error: 'No valid items in cart.' });
    }

    // PA 6% sales tax on taxable items only (mugs); clothing & firewood exempt.
    const taxCents = Math.round(taxableCents * MERCH_TAX_RATE);
    if (taxCents > 0) {
      line_items.push({
        price_data: { currency: 'usd', unit_amount: taxCents, product_data: { name: 'PA sales tax (6%)' } },
        quantity: 1,
      });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Pickup only. No shipping, no phone/text collection. The item summary is
    // stashed in metadata so the webhook can record the order without a second
    // Stripe call (kept well under Stripe's 500-char metadata limit).
    const sessionConfig: any = {
      mode: 'payment',
      line_items,
      success_url: `${baseUrl}/store?checkout=success`,
      cancel_url: `${baseUrl}/store?checkout=cancel`,
      metadata: { kind: 'merch', fulfillment: 'pickup', items: JSON.stringify(orderItems).slice(0, 480) },
      custom_text: {
        submit: { message: 'Pickup at Johnetta Supply — your items will be ready at the store.' },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[STORE] checkout failed:', err);
    res.status(500).json({ error: err.message || 'Failed to start checkout.' });
  }
});

export default router;
