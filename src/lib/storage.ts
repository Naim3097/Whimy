/**
 * Storage abstraction. The cart, wishlist and simulated orders persist through
 * a `StorageAdapter`, so local persistence can later be swapped for (or
 * synced with) a backend without touching UI code.
 */
export interface StorageAdapter {
  read<T>(key: string, fallback: T): T;
  write<T>(key: string, value: T): void;
  remove(key: string): void;
  /** Subscribe to changes made in another tab. Returns an unsubscribe fn. */
  subscribe?(key: string, onChange: () => void): () => void;
}

const NAMESPACE = 'whimy:v1:';

/** In-memory fallback for private windows or blocked storage. */
export function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    read(key, fallback) {
      const raw = map.get(NAMESPACE + key);
      if (raw == null) return fallback;
      try {
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      map.set(NAMESPACE + key, JSON.stringify(value));
    },
    remove(key) {
      map.delete(NAMESPACE + key);
    },
  };
}

function safeWebStorage(kind: 'localStorage' | 'sessionStorage'): Storage | null {
  try {
    const s = window[kind];
    const probe = `${NAMESPACE}probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function createWebStorage(kind: 'localStorage' | 'sessionStorage' = 'localStorage'): StorageAdapter {
  const store = typeof window === 'undefined' ? null : safeWebStorage(kind);
  if (!store) return createMemoryStorage();
  const memory = createMemoryStorage();
  return {
    read(key, fallback) {
      try {
        const raw = store.getItem(NAMESPACE + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return memory.read(key, fallback);
      }
    },
    write(key, value) {
      try {
        store.setItem(NAMESPACE + key, JSON.stringify(value));
      } catch {
        memory.write(key, value);
      }
    },
    remove(key) {
      try {
        store.removeItem(NAMESPACE + key);
      } catch {
        memory.remove(key);
      }
    },
    subscribe(key, onChange) {
      const handler = (e: StorageEvent) => {
        if (e.key === NAMESPACE + key) onChange();
      };
      window.addEventListener('storage', handler);
      return () => window.removeEventListener('storage', handler);
    },
  };
}

export const persistentStorage = createWebStorage('localStorage');
export const sessionStore = createWebStorage('sessionStorage');

export const STORAGE_KEYS = {
  cart: 'cart',
  wishlist: 'wishlist',
  recentlyViewed: 'recently-viewed',
  recentSearches: 'recent-searches',
  orders: 'orders',
  checkoutDraft: 'checkout-draft',
  bloomVotes: 'bloom-votes',
  newsletter: 'newsletter',
  launchStage: 'launch-stage',
  /** The homepage concept last visited (A or B), which also styles the shared pages. */
  concept: 'concept',
} as const;
