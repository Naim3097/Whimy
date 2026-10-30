import { Link, isRouteErrorResponse, useRouteError } from 'react-router';
import { Lockup } from '../components/brand/Brand';
import { ColourExits } from '../components/cart/ColourExits';
import { usePageMeta } from '../hooks/dom';
import { useUI } from '../state/ui';
import styles from './NotFoundPage.module.css';

/**
 * Shared by the 404 route and pages whose record is missing (a product, a
 * collection, an order). The voice line is the heading (the plain title is
 * read first, for screen readers), then the ways back in: the three colours,
 * the collection and search.
 */
export function NotFoundContent({ title = 'Page not found', message }: { title?: string; message?: string }) {
  const { setSearchOpen } = useUI();
  return (
    <div className={`wrap--utility ${styles.page}`}>
      <h1 className="v-2">
        <span className="sr-only">{title}. </span>This page wandered off.
      </h1>
      {message && <p className={`muted measure ${styles.message}`}>{message}</p>}
      <p className={`muted ${styles.try}`}>
        Try a colour,{' '}
        <Link to="/shop/petals-collection" className="link">
          the full Petals Collection
        </Link>
        , or{' '}
        <button type="button" className="link" aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
          search
        </button>
        .
      </p>
      <nav aria-label="Where to next" className={styles.next}>
        <ColourExits />
      </nav>
    </div>
  );
}

export function NotFoundPage() {
  usePageMeta('Page not found');
  return <NotFoundContent />;
}

/** Router-level error boundary. It renders without the layout, so it carries its own way home. */
export function RouteError() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unknown error';
  return (
    <main className={`wrap--utility ${styles.page}`}>
      <a href="/" className={styles.home}>
        <Lockup size="compact" />
        <span className="sr-only">Whimy, home</span>
      </a>
      <h1 className="t-title">Something went wrong.</h1>
      <p className={`measure ${styles.message}`}>Please reload the page.</p>
      <p className="t-small muted">{message}</p>
      <p className={styles.next}>
        <a href="/" className="link">
          Back to the home page
        </a>
      </p>
    </main>
  );
}
