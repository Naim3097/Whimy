import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { Collection, Product } from '../domain/types';
import { useResource } from '../hooks/useResource';
import { services } from '../services';

interface CatalogContextValue {
  products: Product[];
  collections: Collection[];
  ready: boolean;
  productById: (id: string) => Product | undefined;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/**
 * Loads the (small) catalogue once for app-wide needs: cart resolution,
 * search suggestions, navigation. Pages still fetch their own detail data
 * through `services.catalog`, mirroring how a real API would be used.
 */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const productsRes = useResource('catalog:all-products', () => services.catalog.listProducts());
  const collectionsRes = useResource('catalog:collections', () => services.catalog.listCollections());

  const value = useMemo<CatalogContextValue>(() => {
    const products = productsRes.data ?? [];
    return {
      products,
      collections: collectionsRes.data ?? [],
      ready: productsRes.status === 'success' && collectionsRes.status === 'success',
      productById: (id) => products.find((p) => p.id === id),
    };
  }, [productsRes.data, productsRes.status, collectionsRes.data, collectionsRes.status]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside <CatalogProvider>');
  return ctx;
}
