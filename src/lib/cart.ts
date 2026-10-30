/**
 * Pure cart logic. The React store (`src/state/cart.tsx`) wraps this reducer;
 * a backend cart API could implement the same actions server-side.
 */
import type { CartLine, Money, Product, Size, VariantRef } from '../domain/types';
import { MAX_QTY_PER_LINE } from '../data/mock/commerce';
import { getColourway, sizeStock } from './catalog';

export function lineKey(v: VariantRef): string {
  return `${v.productId}:${v.colourId}:${v.size}`;
}

export type CartAction =
  | { type: 'add'; variant: VariantRef; quantity: number; maxQuantity: number }
  | { type: 'set-quantity'; key: string; quantity: number; maxQuantity: number }
  | { type: 'remove'; key: string }
  /** Puts a removed line back where it was (undo). Merges if the variant has been added again since. */
  | { type: 'restore'; line: CartLine; index: number; maxQuantity: number }
  | { type: 'clear' }
  | { type: 'replace'; lines: CartLine[] };

export function clampQuantity(quantity: number, maxQuantity: number): number {
  const ceiling = Math.max(0, Math.min(maxQuantity, MAX_QTY_PER_LINE));
  if (!Number.isFinite(quantity)) return Math.min(1, ceiling);
  return Math.max(0, Math.min(Math.floor(quantity), ceiling));
}

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case 'add': {
      const key = lineKey(action.variant);
      const existing = lines.find((l) => l.key === key);
      if (existing) {
        const quantity = clampQuantity(existing.quantity + action.quantity, action.maxQuantity);
        return lines.map((l) => (l.key === key ? { ...l, quantity } : l));
      }
      const quantity = clampQuantity(action.quantity, action.maxQuantity);
      if (quantity <= 0) return lines;
      return [...lines, { ...action.variant, key, quantity, addedAt: Date.now() }];
    }
    case 'set-quantity': {
      const quantity = clampQuantity(action.quantity, action.maxQuantity);
      if (quantity <= 0) return lines.filter((l) => l.key !== action.key);
      return lines.map((l) => (l.key === action.key ? { ...l, quantity } : l));
    }
    case 'remove':
      return lines.filter((l) => l.key !== action.key);
    case 'restore': {
      if (lines.some((l) => l.key === action.line.key)) {
        return cartReducer(lines, { type: 'add', variant: action.line, quantity: action.line.quantity, maxQuantity: action.maxQuantity });
      }
      const quantity = clampQuantity(action.line.quantity, action.maxQuantity);
      if (quantity <= 0) return lines;
      const at = Math.max(0, Math.min(action.index, lines.length));
      return [...lines.slice(0, at), { ...action.line, quantity }, ...lines.slice(at)];
    }
    case 'clear':
      return [];
    case 'replace':
      return action.lines;
  }
}

export type LineStatus = 'ok' | 'low' | 'reduced' | 'unavailable' | 'missing';

export interface ResolvedLine extends CartLine {
  product?: Product;
  unitPrice: Money;
  lineTotal: Money;
  available: number;
  status: LineStatus;
}

/** Joins cart lines with catalogue data and flags stock problems. */
export function resolveLines(lines: CartLine[], products: Product[]): ResolvedLine[] {
  return lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const colourway = product ? getColourway(product, line.colourId) : undefined;
    if (!product || !colourway || !product.sizes.includes(line.size)) {
      return { ...line, product, unitPrice: 0, lineTotal: 0, available: 0, status: 'missing' as const };
    }
    const available = sizeStock(colourway, line.size as Size);
    const unitPrice = product.price.amount;
    let status: LineStatus = 'ok';
    if (available <= 0) status = 'unavailable';
    else if (line.quantity > available) status = 'reduced';
    else if (available <= 3) status = 'low';
    const billable = status === 'unavailable' ? 0 : Math.min(line.quantity, available);
    return { ...line, product, unitPrice, lineTotal: unitPrice * billable, available, status };
  });
}

export function cartSubtotal(resolved: ResolvedLine[]): Money {
  return resolved.reduce((sum, l) => sum + l.lineTotal, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function hasBlockingIssues(resolved: ResolvedLine[]): boolean {
  return resolved.some((l) => l.status === 'unavailable' || l.status === 'missing' || l.status === 'reduced');
}
