import { describe, expect, it } from 'vitest';
import { products } from '../data/mock/products';
import { cartReducer, cartSubtotal, clampQuantity, hasBlockingIssues, lineKey, resolveLines } from './cart';
import type { CartLine, Product } from '../domain/types';

// Test-local fixture: Petals with Blush Pink EU 36 sold out and only 2 pairs of Rich Brown EU 35.
const realPetals = products.find((p) => p.id === 'petals-heels')!;
const petals: Product = {
  ...realPetals,
  colourways: realPetals.colourways.map((c) =>
    c.id === 'blush-pink' ? { ...c, stock: { ...c.stock, 36: 0 } } : c.id === 'rich-brown' ? { ...c, stock: { ...c.stock, 35: 2 } } : c,
  ),
};

const brown38 = { productId: 'petals-heels', colourId: 'rich-brown', size: 38 as const };
const pink38 = { productId: 'petals-heels', colourId: 'blush-pink', size: 38 as const };

describe('cart reducer', () => {
  it('merges the same variant and keeps different variants apart', () => {
    let lines: CartLine[] = [];
    lines = cartReducer(lines, { type: 'add', variant: brown38, quantity: 1, maxQuantity: 5 });
    lines = cartReducer(lines, { type: 'add', variant: brown38, quantity: 2, maxQuantity: 5 });
    lines = cartReducer(lines, { type: 'add', variant: pink38, quantity: 1, maxQuantity: 5 });
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => l.key === lineKey(brown38))?.quantity).toBe(3);
    expect(lines.find((l) => l.key === lineKey(pink38))?.quantity).toBe(1);
  });

  it('caps quantity by stock and by the per-line limit', () => {
    expect(clampQuantity(9, 2)).toBe(2);
    expect(clampQuantity(9, 50)).toBe(5);
    expect(clampQuantity(-3, 4)).toBe(0);
  });

  it('removes a line when its quantity is set to zero', () => {
    const lines = cartReducer([], { type: 'add', variant: brown38, quantity: 1, maxQuantity: 5 });
    expect(cartReducer(lines, { type: 'set-quantity', key: lineKey(brown38), quantity: 0, maxQuantity: 5 })).toEqual([]);
  });

  it('puts an undone removal back in its place, or merges it if re-added since', () => {
    const kiwi37 = { productId: 'petals-heels', colourId: 'sage-green', size: 37 as const };
    let lines: CartLine[] = [];
    for (const variant of [brown38, pink38, kiwi37]) lines = cartReducer(lines, { type: 'add', variant, quantity: 1, maxQuantity: 5 });
    const removed = { ...lines[1], quantity: 2 };
    const without = cartReducer(lines, { type: 'remove', key: removed.key });
    const restored = cartReducer(without, { type: 'restore', line: removed, index: 1, maxQuantity: 5 });
    expect(restored.map((l) => l.key)).toEqual(lines.map((l) => l.key));
    expect(restored[1].quantity).toBe(2);
    // Already back in the bag: quantities merge instead of duplicating the line.
    const readded = cartReducer(without, { type: 'add', variant: pink38, quantity: 1, maxQuantity: 5 });
    const merged = cartReducer(readded, { type: 'restore', line: removed, index: 1, maxQuantity: 5 });
    expect(merged.filter((l) => l.key === removed.key)).toHaveLength(1);
    expect(merged.find((l) => l.key === removed.key)?.quantity).toBe(3);
  });
});

describe('resolveLines', () => {
  it('prices lines and flags sold-out and over-quantity variants', () => {
    const lines: CartLine[] = [
      { ...brown38, key: lineKey(brown38), quantity: 2, addedAt: 0 },
      // Blush Pink EU 36 is sold out in the fixture.
      { productId: 'petals-heels', colourId: 'blush-pink', size: 36, key: 'petals-heels:blush-pink:36', quantity: 1, addedAt: 0 },
      // Rich Brown EU 35 has only 2 in stock.
      { productId: 'petals-heels', colourId: 'rich-brown', size: 35, key: 'petals-heels:rich-brown:35', quantity: 4, addedAt: 0 },
    ];
    const resolved = resolveLines(lines, [petals]);
    expect(resolved[0].status).toBe('ok');
    expect(resolved[0].lineTotal).toBe(2 * 19900);
    expect(resolved[1].status).toBe('unavailable');
    expect(resolved[1].lineTotal).toBe(0);
    expect(resolved[2].status).toBe('reduced');
    expect(resolved[2].lineTotal).toBe(2 * 19900);
    expect(cartSubtotal(resolved)).toBe(4 * 19900);
    expect(hasBlockingIssues(resolved)).toBe(true);
  });
});
