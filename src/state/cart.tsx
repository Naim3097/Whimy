import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { CartLine, VariantRef } from '../domain/types';
import { cartCount, cartReducer, cartSubtotal, hasBlockingIssues, lineKey, resolveLines, type ResolvedLine } from '../lib/cart';
import { getColourway, sizeStock } from '../lib/catalog';
import { persistentStorage, STORAGE_KEYS, type StorageAdapter } from '../lib/storage';
import { MAX_QTY_PER_LINE } from '../data/mock/commerce';
import { useCatalog } from './catalog';

export interface AddResult {
  ok: boolean;
  added: number;
  /** True when the requested quantity was reduced by stock or the per-line cap. */
  capped: boolean;
}

/** A line taken out of the bag and where it stood, so Undo can put it back in place. */
export interface RemovedLine {
  line: CartLine;
  index: number;
}

interface CartContextValue {
  lines: CartLine[];
  resolved: ResolvedLine[];
  count: number;
  subtotal: number;
  blocked: boolean;
  /** False until the catalogue has loaded and lines can be resolved. */
  ready: boolean;
  add: (variant: VariantRef, quantity: number) => AddResult;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => RemovedLine | undefined;
  restore: (removed: RemovedLine) => void;
  clear: () => void;
  maxFor: (variant: VariantRef) => number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  /** Keys of every line added since the drawer last closed, oldest first (a set adds three at once). */
  addedKeys: string[];
  lastAddedKey: string | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children, storage = persistentStorage }: { children: ReactNode; storage?: StorageAdapter }) {
  const { products, productById, ready } = useCatalog();
  const [lines, dispatch] = useReducer(cartReducer, undefined, () => storage.read<CartLine[]>(STORAGE_KEYS.cart, []));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addedKeys, setAddedKeys] = useState<string[]>([]);

  // Persist + keep tabs in sync.
  useEffect(() => storage.write(STORAGE_KEYS.cart, lines), [lines, storage]);
  useEffect(
    () => storage.subscribe?.(STORAGE_KEYS.cart, () => dispatch({ type: 'replace', lines: storage.read<CartLine[]>(STORAGE_KEYS.cart, []) })),
    [storage],
  );

  const maxFor = useCallback(
    (variant: VariantRef) => {
      const product = productById(variant.productId);
      const colourway = product && getColourway(product, variant.colourId);
      return colourway ? Math.min(sizeStock(colourway, variant.size), MAX_QTY_PER_LINE) : 0;
    },
    [productById],
  );

  const add = useCallback(
    (variant: VariantRef, quantity: number): AddResult => {
      const max = maxFor(variant);
      const key = lineKey(variant);
      const existing = lines.find((l) => l.key === key)?.quantity ?? 0;
      const allowed = Math.max(0, Math.min(quantity, max - existing));
      if (allowed <= 0) return { ok: false, added: 0, capped: true };
      dispatch({ type: 'add', variant, quantity: allowed, maxQuantity: max });
      setAddedKeys((keys) => [...keys.filter((k) => k !== key), key]);
      return { ok: true, added: allowed, capped: allowed < quantity };
    },
    [lines, maxFor],
  );

  const value = useMemo<CartContextValue>(() => {
    const resolved = resolveLines(lines, products);
    return {
      lines,
      resolved,
      count: cartCount(lines),
      subtotal: cartSubtotal(resolved),
      blocked: ready && hasBlockingIssues(resolved),
      ready,
      add,
      setQuantity: (key, quantity) => {
        const line = lines.find((l) => l.key === key);
        if (line) dispatch({ type: 'set-quantity', key, quantity, maxQuantity: maxFor(line) });
      },
      remove: (key) => {
        const index = lines.findIndex((l) => l.key === key);
        if (index < 0) return undefined;
        dispatch({ type: 'remove', key });
        return { line: lines[index], index };
      },
      restore: ({ line, index }) => dispatch({ type: 'restore', line, index, maxQuantity: maxFor(line) }),
      clear: () => dispatch({ type: 'clear' }),
      maxFor,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => {
        setDrawerOpen(false);
        setAddedKeys((keys) => (keys.length ? [] : keys));
      },
      addedKeys,
      lastAddedKey: addedKeys.at(-1) ?? null,
    };
  }, [lines, products, ready, add, maxFor, drawerOpen, addedKeys]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
