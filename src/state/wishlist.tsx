import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { WishlistItem } from '../domain/types';
import { persistentStorage, STORAGE_KEYS, type StorageAdapter } from '../lib/storage';

interface WishlistContextValue {
  items: WishlistItem[];
  count: number;
  has: (productId: string, colourId: string) => boolean;
  toggle: (productId: string, colourId: string) => boolean;
  remove: (productId: string, colourId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children, storage = persistentStorage }: { children: ReactNode; storage?: StorageAdapter }) {
  const [items, setItems] = useState<WishlistItem[]>(() => storage.read<WishlistItem[]>(STORAGE_KEYS.wishlist, []));

  useEffect(() => storage.write(STORAGE_KEYS.wishlist, items), [items, storage]);
  useEffect(() => storage.subscribe?.(STORAGE_KEYS.wishlist, () => setItems(storage.read(STORAGE_KEYS.wishlist, []))), [storage]);

  const has = useCallback((productId: string, colourId: string) => items.some((i) => i.productId === productId && i.colourId === colourId), [items]);

  const toggle = useCallback(
    (productId: string, colourId: string) => {
      const exists = has(productId, colourId);
      setItems((prev) =>
        exists ? prev.filter((i) => !(i.productId === productId && i.colourId === colourId)) : [{ productId, colourId, addedAt: Date.now() }, ...prev],
      );
      return !exists;
    },
    [has],
  );

  const remove = useCallback((productId: string, colourId: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.colourId === colourId)));
  }, []);

  const value = useMemo(() => ({ items, count: items.length, has, toggle, remove }), [items, has, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}
