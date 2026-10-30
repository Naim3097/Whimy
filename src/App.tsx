import type { ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { persistentStorage, type StorageAdapter } from './lib/storage';
import { routes } from './routes';
import { CartProvider } from './state/cart';
import { CatalogProvider } from './state/catalog';
import { UIProvider } from './state/ui';
import { WishlistProvider } from './state/wishlist';

const router = createBrowserRouter(routes);

/**
 * Every piece of shopping state sits above the router, so moving between the
 * two homepage concepts (or any page) never resets the bag, Saved or the UI.
 */
export function AppProviders({ children, storage = persistentStorage }: { children: ReactNode; storage?: StorageAdapter }) {
  return (
    <UIProvider storage={storage}>
      <CatalogProvider>
        <WishlistProvider storage={storage}>
          <CartProvider storage={storage}>{children}</CartProvider>
        </WishlistProvider>
      </CatalogProvider>
    </UIProvider>
  );
}

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
