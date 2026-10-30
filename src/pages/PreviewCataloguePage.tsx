import { useMemo } from 'react';
import { usePageMeta } from '../hooks/dom';
import { toListingCards } from '../lib/catalog';
import { useCatalog } from '../state/catalog';
import { CatalogueListing } from '../components/product/Filters';
import styles from './PreviewCataloguePage.module.css';

/**
 * /preview/catalogue, reached only from About this preview: how a larger range
 * would browse, with the Petals colours beside sample styles. It keeps search,
 * facets and sorting demonstrable without stock shoes on any brand page.
 */
export function PreviewCataloguePage() {
  usePageMeta('Preview catalogue', 'How a larger Whimy range would browse, with sample styles marked as samples.');
  const { products, ready } = useCatalog();
  const cards = useMemo(
    () => toListingCards([...products.filter((p) => p.kind === 'whimy'), ...products.filter((p) => p.kind === 'sample')], true),
    [products],
  );

  return (
    <div className={`wrap ${styles.page}`}>
      <meta name="robots" content="noindex" />
      <header className={styles.head}>
        <h1 className="t-title">Preview catalogue</h1>
        <p className="t-body muted measure">
          This preview shows how a larger range would browse: Petals Heels beside sample styles, each marked, that are not Whimy products.
        </p>
      </header>

      {ready ? <CatalogueListing cards={cards} /> : <div className={styles.pending} aria-busy="true" />}
    </div>
  );
}
