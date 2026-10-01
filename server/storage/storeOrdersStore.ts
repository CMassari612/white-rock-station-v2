import { readCollection, writeCollection } from './db';

const KEY = 'storeOrders';

export interface StoreOrderItem {
  name: string;
  qty: number;
  priceCents: number;
}

export interface StoreOrder {
  id: string;
  createdAt: string;
  items: StoreOrderItem[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  customerName?: string;
  customerEmail?: string;
  stripeSessionId: string;
  pickedUp: boolean;
  pickedUpAt?: string;
}

export async function getAllStoreOrders(): Promise<StoreOrder[]> {
  const orders = await readCollection<StoreOrder>(KEY);
  // newest first
  return orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

export async function addStoreOrder(order: StoreOrder): Promise<void> {
  const orders = await readCollection<StoreOrder>(KEY);
  // idempotency: don't double-record the same Stripe session
  if (orders.some(o => o.stripeSessionId === order.stripeSessionId)) return;
  orders.push(order);
  await writeCollection(KEY, orders);
}

export async function setStoreOrderPickedUp(id: string, pickedUp: boolean): Promise<StoreOrder | null> {
  const orders = await readCollection<StoreOrder>(KEY);
  const order = orders.find(o => o.id === id);
  if (!order) return null;
  order.pickedUp = pickedUp;
  order.pickedUpAt = pickedUp ? new Date().toISOString() : undefined;
  await writeCollection(KEY, orders);
  return order;
}
