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

    const { items, fulfillment } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty.' });
    }
    const ship = fulfillment === 'ship';
    const catalog = await getAllStoreProducts();

    const line_items: any[] = [];
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

    const sessionConfig: any = {
      mode: 'payment',
      line_items,
      success_url: `${baseUrl}/store?checkout=success`,
      cancel_url: `${baseUrl}/store?checkout=cancel`,
      metadata: { kind: 'merch', fulfillment: ship ? 'ship' : 'pickup' },
      phone_number_collection: { enabled: true },
    };

    if (ship) {
      sessionConfig.shipping_address_collection = { allowed_countries: ['US'] };
      sessionConfig.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: SHIP_FEE_CENTS, currency: 'usd' },
            display_name: 'Standard shipping',
          },
        },
      ];
    } else {
      sessionConfig.custom_text = {
        submit: { message: "Pickup at Johnetta Supply — we'll text you when your order is ready." },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });
  } catch (err: any) {
    console.error('[STORE] checkout failed:', err);
    res.status(500).json({ error: err.message || 'Failed to start checkout.' });
  }
});

export default router;
