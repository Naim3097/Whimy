import { useMemo } from 'react';
import { useParams } from 'react-router';
import type { Collection } from '../domain/types';
import { usePageMeta } from '../hooks/dom';
import { useResource } from '../hooks/useResource';
import { productInCollection, toListingCards, type ListingCard } from '../lib/catalog';
import { services } from '../services';
import { CatalogueListing } from '../components/product/Filters';
import { NotFoundContent } from './NotFoundPage';
import styles from './CollectionPage.module.css';

/** Whimy's own line for its first collection; other collections use their description. */
const INTROS: Record<string, string> = {
  petals: 'petals, satin, pointe. One kitten heel in three colours.',
};

/**
 * /shop/:slug, as both reference sites list a category: a centred title, one
 * bar of filters and sort, then the grid with one card per colour. Each card
 * opens its own colour on the product page.
 */
export function CollectionPage() {
  const { slug = 'petals-collection' } = useParams();
  const { data: collection, status } = useResource(`collection:${slug}`, () => services.catalog.getCollection(slug));
  const { data: products } = useResource('catalog:all-products', () => services.catalog.listProducts());

  const cards = useMemo(
    () => (collection && products ? toListingCards(products.filter((p) => productInCollection(p, collection)), collection.expandColourways) : null),
    [collection, products],
  );

  if (status === 'success' && !collection) return <Missing />;
  if (!collection || !cards) return <div className={styles.pending} aria-busy="true" />;
  return <Listing collection={collection} cards={cards} />;
}

function Missing() {
  usePageMeta('Page not found');
  return <NotFoundContent />;
}

function Listing({ collection, cards }: { collection: Collection; cards: ListingCard[] }) {
  usePageMeta(collection.name, collection.description);
  return (
    <div className={styles.page}>
      <header className={`wrap ${styles.head}`}>
        <h1 className={styles.title}>{collection.name}</h1>
        <p className={styles.intro}>{INTROS[collection.id] ?? collection.description}</p>
      </header>
      <div className="wrap">
        <CatalogueListing cards={cards} />
      </div>
    </div>
  );
}
