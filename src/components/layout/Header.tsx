import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { concepts } from '../../config/concepts';
import { useActiveConcept } from '../../hooks/useConcept';
import { useCart } from '../../state/cart';
import { useUI } from '../../state/ui';
import { useWishlist } from '../../state/wishlist';
import { Icon } from '../ui/Icon';
import styles from './Header.module.css';

interface ScrollState {
  /** The page has moved: the hairline shows. */
  moved: boolean;
  /** Past most of the first screen, where B's campaign sits. */
  pastCampaign: boolean;
  /** B only: hidden while the shopper scrolls down, back on any scroll up (Jimmy Choo). */
  hidden: boolean;
}

/** Reads the scroll once per frame and re-renders only when one of the three flags changes. */
function useHeaderScroll(hides: boolean): ScrollState {
  const [state, setState] = useState<ScrollState>({ moved: false, pastCampaign: false, hidden: false });
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const down = y > last + 2;
      const up = y < last - 2;
      if (down || up) last = y;
      setState((s) => {
        const next = {
          moved: y > 8,
          pastCampaign: y > window.innerHeight * 0.7,
          hidden: hides && y > 160 ? (down ? true : up ? false : s.hidden) : false,
        };
        return next.moved === s.moved && next.pastCampaign === s.pastCampaign && next.hidden === s.hidden ? s : next;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [hides]);
  return state;
}

/** "whimy" in Fell Roman, lowercase like Whimy's embroidered wordmark patch. */
function Wordmark() {
  return (
    <span className={styles.wordmark} aria-hidden="true">
      whimy
    </span>
  );
}

/**
 * One header in two skins, both after their reference:
 * - A (Christy Ng): the menu glyph · the wordmark · search and bag glyphs; always solid paper.
 * - B (Jimmy Choo): glyphs with their words (Menu, Search · Saved, Account, Bag). On B's
 *   homepage it lies transparent over the campaign and turns solid once the page moves.
 * The menu is the same left drawer in both, on every width, as on both reference sites.
 */
export function Header({ overlay = false }: { overlay?: boolean }) {
  const { count, openDrawer } = useCart();
  const wishlist = useWishlist();
  const { setSearchOpen, setNavOpen } = useUI();
  const concept = useActiveConcept();
  const { moved, pastCampaign, hidden } = useHeaderScroll(concept === 'b');
  const clear = overlay && !pastCampaign;

  return (
    <header
      className={styles.header}
      data-concept={concept}
      data-clear={clear || undefined}
      data-lined={(!clear && moved) || undefined}
      data-hidden={hidden || undefined}
    >
      <div className={`wrap ${styles.bar}`}>
        <div className={styles.start}>
          <button type="button" className={styles.tool} aria-haspopup="dialog" onClick={() => setNavOpen(true)}>
            <Icon name="menu" />
            <span className={styles.label}>Menu</span>
          </button>
          {concept === 'b' && (
            <button type="button" className={styles.tool} aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
              <Icon name="search" />
              <span className={styles.label}>Search</span>
            </button>
          )}
        </div>

        <Link to={concepts[concept].home} className={styles.home}>
          <Wordmark />
          <span className="sr-only">Whimy, home</span>
        </Link>

        <div className={styles.end}>
          {concept === 'a' && (
            <button type="button" className={styles.tool} aria-haspopup="dialog" onClick={() => setSearchOpen(true)}>
              <Icon name="search" />
              <span className={styles.label}>Search</span>
            </button>
          )}
          {concept === 'b' && (
            <>
              <Link to="/saved" className={styles.tool}>
                <Icon name="heart" />
                <span className={styles.label}>
                  Saved<span className="sr-only"> ({wishlist.count})</span>
                </span>
              </Link>
              <Link to="/account" className={`${styles.tool} ${styles.wideOnly}`}>
                <Icon name="user" />
                <span className={styles.label}>Account</span>
              </Link>
            </>
          )}
          <button type="button" className={`${styles.tool} ${styles.bag}`} aria-haspopup="dialog" onClick={openDrawer}>
            <Icon name="bag" />
            <span className={styles.label}>Bag</span>
            <span className={`num ${styles.count}`} data-empty={count === 0 || undefined}>
              {count}
            </span>
            <span className="sr-only">{count === 1 ? ' item' : ' items'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Checkout keeps only the way home and the way back. */
export function CheckoutHeader() {
  const concept = useActiveConcept();
  return (
    <header className={styles.header} data-concept={concept} data-lined="">
      <div className={`wrap--checkout ${styles.bar}`}>
        <div className={styles.start}>
          <Link to="/bag" className={styles.back}>
            Back to bag
          </Link>
        </div>
        <Link to={concepts[concept].home} className={styles.home}>
          <Wordmark />
          <span className="sr-only">Whimy, home</span>
        </Link>
        <div className={styles.end} />
      </div>
    </header>
  );
}
