// Client helpers for the Johnetta Supply / White Rock Station store.
// Mirrors the cottages.ts API base convention: same-origin in production,
// VITE_API_URL (or localhost) in dev.
const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5050')
  : '';

export interface StoreProduct {
  id: string;
  name: string;
  priceCents: number;
  blurb: string;
  accent: string;
  image?: string;
}

export interface CartLine {
  id: string;
  qty: number;
}

export type Fulfillment = 'pickup' | 'ship';

export function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export async function fetchStore(): Promise<{ products: StoreProduct[]; shipFeeCents: number }> {
  const res = await fetch(`${API_URL}/api/store/products`);
  if (!res.ok) throw new Error('Could not load the store.');
  return res.json();
}

export async function createStoreCheckout(items: CartLine[], fulfillment: Fulfillment): Promise<string> {
  const res = await fetch(`${API_URL}/api/store/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, fulfillment }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Checkout failed. Please try again.');
  return data.url as string;
}
