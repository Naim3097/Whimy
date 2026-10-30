import { useCallback, useEffect, useState } from 'react';

/**
 * Minimal async data hook with an in-memory cache, so revisiting a page
 * doesn't flash a loading state. Swap for TanStack Query (or similar)
 * if the real backend needs invalidation, retries or pagination.
 */
type ResourceState<T> =
  | { key: string | null; status: 'idle' | 'loading'; data?: undefined; error?: undefined }
  | { key: string | null; status: 'success'; data: T; error?: undefined }
  | { key: string | null; status: 'error'; data?: undefined; error: unknown };

const cache = new Map<string, unknown>();
const pending = new Map<string, Promise<unknown>>();

export function primeResource<T>(key: string, value: T) {
  cache.set(key, value);
}

export function useResource<T>(key: string | null, fetcher: () => Promise<T>) {
  const initial = (): ResourceState<T> =>
    key && cache.has(key) ? { key, status: 'success', data: cache.get(key) as T } : { key, status: key ? 'loading' : 'idle' };
  const [state, setState] = useState<ResourceState<T>>(initial);
  const [nonce, setNonce] = useState(0);

  // Reset synchronously when the key changes (avoids showing stale data for a new key).
  let current = state;
  if (state.key !== key) {
    current = initial();
    setState(current);
  }

  useEffect(() => {
    if (!key) return;
    if (cache.has(key)) {
      setState({ key, status: 'success', data: cache.get(key) as T });
      return;
    }
    let cancelled = false;
    let promise = pending.get(key) as Promise<T> | undefined;
    if (!promise) {
      promise = fetcher();
      pending.set(key, promise);
    }
    promise.then(
      (data) => {
        cache.set(key, data);
        pending.delete(key);
        if (!cancelled) setState({ key, status: 'success', data });
      },
      (error: unknown) => {
        pending.delete(key);
        if (!cancelled) setState({ key, status: 'error', error });
      },
    );
    return () => {
      cancelled = true;
    };
    // fetcher is intentionally excluded: the key identifies the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce]);

  const reload = useCallback(() => {
    if (key) cache.delete(key);
    setNonce((n) => n + 1);
  }, [key]);

  return { ...current, reload };
}
