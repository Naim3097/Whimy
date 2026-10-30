import { Navigate, type RouteObject } from 'react-router';
import { Layout } from './components/layout/Layout';
import { concepts } from './config/concepts';
import { helpAnchors } from './data/content';
import { CollectionPage } from './pages/CollectionPage';
import { HomeB } from './pages/HomeB';
import { NotFoundPage, RouteError } from './pages/NotFoundPage';
import { ProductPage } from './pages/ProductPage';

/** Old and short URLs land on their new home; `replace` keeps them out of history. */
const redirect = (path: string, to: string): RouteObject => ({ path, element: <Navigate replace to={to} /> });

/** Secondary routes are code-split so the homepage and product page load first. */
const info = (page: 'privacy' | 'terms' | 'credits'): RouteObject => ({
  path: page,
  lazy: async () => {
    const { InfoPage } = await import('./pages/InfoPages');
    return { Component: () => <InfoPage page={page} /> };
  },
});

/** The whole route table, shared by the browser router (App.tsx) and the route tests. */
export const routes: RouteObject[] = [
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      // The two homepage concepts share every other route, the catalogue and the bag. B is the
      // root; B's old path, from links already shared, lands on it.
      { index: true, element: <HomeB /> },
      { path: concepts.a.home.slice(1), lazy: async () => ({ Component: (await import('./pages/HomeA')).HomeA }) },
      redirect('home-jimmy-choo', concepts.b.home),
      redirect('shop', '/shop/petals-collection'),
      { path: 'shop/:slug', element: <CollectionPage /> },
      { path: 'products/:slug', element: <ProductPage /> },
      { path: 'search', lazy: async () => ({ Component: (await import('./pages/SearchPage')).SearchPage }) },
      { path: 'bag', lazy: async () => ({ Component: (await import('./pages/CartPage')).CartPage }) },
      redirect('cart', '/bag'),
      { path: 'saved', lazy: async () => ({ Component: (await import('./pages/WishlistPage')).WishlistPage }) },
      redirect('wishlist', '/saved'),
      { path: 'checkout', lazy: async () => ({ Component: (await import('./pages/CheckoutPage')).CheckoutPage }) },
      { path: 'order/:reference', lazy: async () => ({ Component: (await import('./pages/OrderConfirmationPage')).OrderConfirmationPage }) },
      { path: 'account', lazy: async () => ({ Component: (await import('./pages/AccountPage')).AccountPage }) },
      { path: 'story', lazy: async () => ({ Component: (await import('./pages/StoryPage')).StoryPage }) },
      redirect('about', '/story'),
      { path: 'help', lazy: async () => ({ Component: (await import('./pages/HelpPage')).HelpPage }) },
      redirect('size-guide', `/help#${helpAnchors.sizeFit}`),
      redirect('shipping', `/help#${helpAnchors.delivery}`),
      redirect('returns', `/help#${helpAnchors.exchanges}`),
      redirect('faq', `/help#${helpAnchors.faq}`),
      redirect('contact', `/help#${helpAnchors.contact}`),
      { path: 'next-bloom', lazy: async () => ({ Component: (await import('./pages/NextBloomPage')).NextBloomPage }) },
      info('privacy'),
      info('terms'),
      info('credits'),
      { path: 'preview/catalogue', lazy: async () => ({ Component: (await import('./pages/PreviewCataloguePage')).PreviewCataloguePage }) },
      // Sample styles: the only address where their stock photographs appear (ProductPage redirects between the two).
      { path: 'preview/catalogue/:slug', element: <ProductPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
