import { readCollection, writeCollection } from './db';

const STORE_KEY = 'storeProducts';

export interface StoreProduct {
  id: string;
  name: string;
  priceCents: number;
  blurb: string;      // short description shown on the card
  accent: string;     // brand-colored fallback tile if image is missing
  image: string;      // product photo URL (served from /public or Supabase)
  active?: boolean;   // hidden from the storefront when false
  taxable?: boolean;  // charge PA 6% sales tax (true for housewares like mugs;
                      // clothing and firewood are exempt in PA)
  updatedAt?: string;
}

// Default catalog — seeded into the datastore on first run so admins can edit
// products (price, description, photo) and have it persist.
const SEED: StoreProduct[] = [
  { id: 'hat', name: 'White Rock Station Hat', priceCents: 2800, accent: 'var(--river-blue)',
    image: '/images/store/store-06.jpg', active: true,
    blurb: 'Embroidered cap with the White Rock Station mark.' },
  { id: 'tee', name: 'White Rock Station T-Shirt', priceCents: 2500, accent: 'var(--forest-green)',
    image: '/images/store/store-05.jpg', active: true,
    blurb: 'Soft cotton tee with the trailside logo.' },
  { id: 'sweatshirt', name: 'White Rock Station Sweatshirt', priceCents: 5000, accent: 'var(--forest-green)',
    image: '/images/store/store-09.jpg', active: true,
    blurb: 'Heavyweight crew sweatshirt for cool riverside nights.' },
  { id: 'mug', name: 'White Rock Station Mug', priceCents: 1500, accent: 'var(--river-blue)',
    image: '/images/store/store-02.jpg', active: true, taxable: true,
    blurb: 'Sturdy ceramic camp mug for riverside mornings.' },
  { id: 'firewood', name: 'Firewood Bundle', priceCents: 800, accent: 'var(--forest-green)',
    image: '/images/store/store-03.jpg', active: true,
    blurb: 'Seasoned firewood bundle for your fire ring.' },
];

export async function getAllStoreProducts(): Promise<StoreProduct[]> {
  try {
    const stored = await readCollection<StoreProduct>(STORE_KEY);
    if (stored && stored.length > 0) return stored;
    await writeCollection<StoreProduct>(STORE_KEY, SEED);
    return SEED;
  } catch (err) {
    console.error('[store] datastore read failed, serving bundled seed:', err);
    return SEED;
  }
}

export async function saveAllStoreProducts(products: StoreProduct[]): Promise<void> {
  await writeCollection<StoreProduct>(STORE_KEY, products);
}

export async function addStoreProduct(product: StoreProduct): Promise<StoreProduct> {
  const products = await getAllStoreProducts();
  products.push(product);
  await saveAllStoreProducts(products);
  return product;
}

export async function updateStoreProduct(id: string, partial: Partial<StoreProduct>): Promise<StoreProduct | null> {
  const products = await getAllStoreProducts();
  const product = products.find(p => p.id === id);
  if (!product) return null;
  Object.assign(product, partial, { updatedAt: new Date().toISOString() });
  await saveAllStoreProducts(products);
  return product;
}

export async function deleteStoreProduct(id: string): Promise<boolean> {
  const products = await getAllStoreProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  await saveAllStoreProducts(filtered);
  return true;
}
