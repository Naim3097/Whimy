import { useCallback, useState } from 'react';
import { persistentStorage, STORAGE_KEYS } from '../lib/storage';

const LIMIT = 8;

/** Recently viewed product ids, most recent first. */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() => persistentStorage.read<string[]>(STORAGE_KEYS.recentlyViewed, []));

  const record = useCallback((productId: string) => {
    setIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, LIMIT);
      persistentStorage.write(STORAGE_KEYS.recentlyViewed, next);
      return next;
    });
  }, []);

  return { ids, record };
}

export function useRecentSearches() {
  const [terms, setTerms] = useState<string[]>(() => persistentStorage.read<string[]>(STORAGE_KEYS.recentSearches, []));
  const remember = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setTerms((prev) => {
      const next = [clean, ...prev.filter((t) => t.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      persistentStorage.write(STORAGE_KEYS.recentSearches, next);
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    persistentStorage.write(STORAGE_KEYS.recentSearches, []);
    setTerms([]);
  }, []);
  return { terms, remember, clear };
}
