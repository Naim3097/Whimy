import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Outlet, ScrollRestoration, useLocation, useNavigationType } from 'react-router';
import { conceptOfPath } from '../../config/concepts';
import { useActiveConcept, useRememberConcept } from '../../hooks/useConcept';
import { CartDrawer } from '../cart/CartDrawer';
import { Toasts } from '../ui/Toasts';
import { AboutPreviewDialog } from './AboutPreviewDialog';
import { ConceptBar } from './ConceptBar';
import { CheckoutFooter, Footer } from './Footer';
import { CheckoutHeader, Header } from './Header';
import { MobileNav } from './MobileNav';
import { SearchDialog } from './SearchDialog';
import styles from './Layout.module.css';

const HEADINGS = 'h1, h2, h3';
/** How long a page that is still loading its data gets to render its h1. */
const HEADING_WAIT_MS = 1500;

/** The heading that names where a link landed: the #target's own heading, else the page h1. */
function landingHeading(main: HTMLElement, hash: string): HTMLElement | null {
  const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
  if (target) return target.matches(HEADINGS) ? target : (target.querySelector<HTMLElement>(HEADINGS) ?? target);
  return main.querySelector<HTMLElement>('h1');
}

/**
 * When a link opens another page (not Back/Forward, not a ?colour= swap or a
 * same-page #jump), focus moves to the new page's h1, or to the heading of the
 * #section it opened at, and the page title is announced. It waits for any
 * dialog closing on the way to hand focus back, and for a page still loading
 * its data to render the heading; after that it settles on <main>.
 */
function useRouteFocus(main: RefObject<HTMLElement | null>): string {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const [announcement, setAnnouncement] = useState('');
  // The path focus last settled for; an unchanged path (first render, Strict Mode's rerun) does nothing.
  const settledPath = useRef(pathname);

  useEffect(() => {
    if (settledPath.current === pathname) return;
    settledPath.current = pathname;
    if (navigationType === 'POP') return;

    const started = performance.now();
    let frame = requestAnimationFrame(function land() {
      const root = main.current;
      const dialogOpen = document.querySelector('dialog[open]') != null;
      const heading = root && !dialogOpen ? landingHeading(root, hash) : null;
      if (!heading && performance.now() - started < HEADING_WAIT_MS) {
        frame = requestAnimationFrame(land);
        return;
      }
      // A dialog still open owns focus; leave it there.
      if (dialogOpen || !root) return;
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        // Taken by script, not by Tab: no control ring (Layout.module.css), until it is left.
        heading.setAttribute('data-route-focus', '');
        heading.addEventListener('blur', () => heading.removeAttribute('data-route-focus'), { once: true });
      }
      (heading ?? root).focus({ preventScroll: true });
      setAnnouncement(document.title);
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return announcement;
}

export function Layout() {
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const announcement = useRouteFocus(mainRef);
  useRememberConcept();
  const concept = useActiveConcept();
  // The concept's chrome sizes are tokens on :root (tokens.css: A's 50px header, B's 26px bar).
  // A layout effect, so the first paint already has them.
  useLayoutEffect(() => {
    document.documentElement.dataset.concept = concept;
  }, [concept]);
  // Checkout is distraction-free: the wordmark, "Back to bag" and the small print.
  const checkout = pathname === '/checkout';
  const home = conceptOfPath(pathname);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {/* Header, page and footer fill at least the window, so the footer never floats above paper. */}
      <div className={styles.shell}>
        {checkout ? (
          <CheckoutHeader />
        ) : (
          <>
            <ConceptBar />
            {/* B's homepage opens with its campaign under a clear header, as Jimmy Choo's does. */}
            <Header overlay={home === 'b'} />
          </>
        )}
        <main id="main" ref={mainRef} tabIndex={-1} className={styles.main}>
          <Outlet />
        </main>
        {/* Next bloom holds the Petals list on its own page. */}
        {checkout ? <CheckoutFooter /> : <Footer showList={pathname !== '/next-bloom'} flush={home === 'b'} />}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <CartDrawer />
      <SearchDialog />
      <MobileNav />
      <AboutPreviewDialog />
      <Toasts />
      {/* Every full page load starts with the key "default"; key those entries by URL so a load
          never inherits another page's scroll position (main.tsx clears it for fresh loads, so only
          a reload or back/forward restores it). Later entries keep per-entry keys. */}
      <ScrollRestoration getKey={(location) => (location.key === 'default' ? location.pathname + location.search : location.key)} />
    </>
  );
}
