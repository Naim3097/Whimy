import { describe, expect, it } from 'vitest';
import { createMemoryStorage, STORAGE_KEYS } from '../../lib/storage';
import { createMockServices } from '.';
import { products } from '../../data/mock/products';
import type { OrderDraft, Product } from '../../domain/types';
import { OrderError } from '../types';

// Test-local fixture: Petals with Blush Pink EU 36 sold out.
const realPetals = products.find((p) => p.id === 'petals-heels')!;
const catalog: Product[] = [
  { ...realPetals, colourways: realPetals.colourways.map((c) => (c.id === 'blush-pink' ? { ...c, stock: { ...c.stock, 36: 0 } } : c)) },
];

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    lines: [{ productId: 'petals-heels', colourId: 'rich-brown', size: 38, name: 'Petals Heels', colourName: 'Rich Brown', unitPrice: 19900, quantity: 1 }],
    contact: { email: 'test@example.com', phone: '+60123456789', marketingOptIn: false },
    address: { fullName: 'Test Babe', line1: '1 Jalan Test', postcode: '50450', city: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'MY' },
    shippingMethodId: 'west-standard',
    payment: { method: 'fpx', provider: 'Maybank2u' },
    totals: { subtotal: 19900, discount: 0, shipping: 0, total: 19900 },
    idempotencyKey: 'key-1',
    ...overrides,
  };
}

describe('mock order service', () => {
  it('creates exactly one order for repeated submissions with the same key', async () => {
    const storage = createMemoryStorage();
    const { orders } = createMockServices({ latencyMs: 0, storage, catalog });
    const [a, b] = await Promise.all([orders.submitOrder(draft()), orders.submitOrder(draft())]);
    expect(a.reference).toBe(b.reference);
    expect(a.simulated).toBe(true);
    expect(storage.read(STORAGE_KEYS.orders, [])).toHaveLength(1);
    expect(await orders.getOrder(a.reference)).not.toBeNull();
  });

  it('rejects lines without enough stock', async () => {
    const { orders } = createMockServices({ latencyMs: 0, storage: createMemoryStorage(), catalog });
    const bad = draft({ idempotencyKey: 'k2', lines: [{ ...draft().lines[0], colourId: 'blush-pink', size: 36 }] });
    await expect(orders.submitOrder(bad)).rejects.toMatchObject({ code: 'out-of-stock' });
  });

  it('simulates a declined payment for testing', async () => {
    const { orders } = createMockServices({ latencyMs: 0, storage: createMemoryStorage(), catalog });
    const declined = orders.submitOrder(draft({ idempotencyKey: 'k3', contact: { ...draft().contact, email: 'decline@example.com' } }));
    await expect(declined).rejects.toBeInstanceOf(OrderError);
  });
});
