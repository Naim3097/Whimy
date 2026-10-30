import { useEffect, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { useActiveConcept } from '../../hooks/useConcept';
import { useUI } from '../../state/ui';
import { useWishlist } from '../../state/wishlist';
import { Dialog } from '../ui/Dialog';
import { ConceptSwitch } from './ConceptSwitch';
import { COLLECTION_HREF, colourHref, helpLinks, NEXT_BLOOM_HREF, nicknameOf, SET_HREF, socialLinks, usePetals } from './nav';
import styles from './MobileNav.module.css';

const chip = (colour: string) => ({ '--chip': colour }) as CSSProperties;

/**
 * The menu on every width, as on both reference sites: one drawer from the
 * left, one level, Shop and its colours first. It ends with the homepage
 * concept switch for the client presentation.
 */
export function MobileNav() {
  const { navOpen, setNavOpen, setSearchOpen } = useUI();
  const concept = useActiveConcept();
  const wishlist = useWishlist();
  const petals = usePetals();
  const { pathname, search, hash } = useLocation();

  useEffect(() => setNavOpen(false), [pathname, search, hash, setNavOpen]);

  // The search line hands over to the Search sheet (Popular words, live results). The menu
  // closes first, so the sheet hands focus back to "Menu" when it closes in turn.
  const openSearch = () => {
    setNavOpen(false);
    requestAnimationFrame(() => setSearchOpen(true));
  };

  return (
    <Dialog open={navOpen} onClose={() => setNavOpen(false)} title="Menu" variant="drawer-left">
      <nav
        aria-label="Menu"
        className={styles.nav}
        onClick={(e) => {
          // A link to the page already open changes no route; close for it too. Social links open a new tab.
          if (e.target instanceof Element && e.target.closest('a:not([target])')) setNavOpen(false);
        }}
      >
        {/* Looks like the sheet's field, with the same words, so the tap reads as the field opening. */}
        <button type="button" className={styles.search} aria-haspopup="dialog" onClick={openSearch}>
          Search Whimy
        </button>

        <Link to={COLLECTION_HREF} className={styles.primary}>
          The Petals Collection
        </Link>
        {petals && (
          <ul role="list" className={styles.colours}>
            {petals.colourways.map((c) => (
              <li key={c.id}>
                <Link to={colourHref(petals, c)} className={styles.colour}>
                  <span className={styles.chips} aria-hidden="true">
                    <span className="chip" style={chip(c.swatch.base)} />
                  </span>
                  <span className={styles.nick}>{nicknameOf(c)}</span>
                  <span className={styles.official}>{c.name}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to={SET_HREF} className={styles.colour}>
                <span className={styles.chips} aria-hidden="true">
                  {petals.colourways.map((c) => (
                    <span key={c.id} className="chip" style={chip(c.swatch.base)} />
                  ))}
                </span>
                <span className={styles.nick}>all three</span>
                <span className={styles.official}>The set</span>
              </Link>
            </li>
          </ul>
        )}

        <ul role="list" className={styles.list}>
          <li>
            <Link to={NEXT_BLOOM_HREF} className={styles.primary}>
              Next bloom
            </Link>
          </li>
          <li>
            <Link to="/story" className={styles.primary}>
              Our story
            </Link>
          </li>
          <li>
            <Link to="/help" className={styles.primary}>
              Help
            </Link>
            <ul role="list" className={styles.sub}>
              {helpLinks.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={styles.secondary}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li>
            <Link to="/account" className={styles.primary}>
              Account
            </Link>
          </li>
          <li>
            <Link to="/saved" className={styles.primary}>
              Saved (<span className="num">{wishlist.count}</span>)
            </Link>
          </li>
        </ul>

        <ConceptSwitch current={concept} className={styles.concept} />

        <p className={styles.social}>
          {socialLinks.map((s, i) => (
            <span key={s.href}>
              {i > 0 && <span aria-hidden="true"> · </span>}
              <a href={s.href} target="_blank" rel="noreferrer" className="link-quiet">
                {s.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </span>
          ))}
        </p>
      </nav>
    </Dialog>
  );
}
