import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { Colourway, Product } from '../../domain/types';
import { useRecentSearches } from '../../hooks/useRecentlyViewed';
import { searchProducts } from '../../lib/catalog';
import { persistentStorage, STORAGE_KEYS } from '../../lib/storage';
import { useCatalog } from '../../state/catalog';
import { useUI } from '../../state/ui';
import { Dialog } from '../ui/Dialog';
import { Img } from '../ui/Img';
import { StagePrice } from './StagePrice';
import { colourHref, helpHits, nicknameOf, popularHelp, usePetals, type NavLinkItem } from './nav';
import styles from './SearchDialog.module.css';

// eslint-disable-next-line react/only-export-components -- SearchPage shares the popular terms
export { POPULAR_SEARCHES } from './nav';

const MAX_RESULTS = 4;

function readRecentlyViewed(): string[] {
  try {
    const ids = persistentStorage.read<unknown>(STORAGE_KEYS.recentlyViewed, []);
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** One mini card: 64px square thumbnail, name, *nickname* · colour, price. */
function MiniProduct({ product, colourway, onPick }: { product: Product; colourway: Colourway; onPick: () => void }) {
  return (
    <li className={styles.mini}>
      <Img image={colourway.images[0]} sizes="64px" alt="" className={styles.thumb} />
      <Link to={colourHref(product, colourway)} className={styles.miniLink} onClick={onPick}>
        <span className={styles.miniName}>{product.name}</span>
        <span className={styles.miniColour}>
          {colourway.nickname && <span className={styles.nick}>{colourway.nickname}</span>}{' '}
          <span className={colourway.nickname ? styles.official : undefined}>{colourway.name}</span>
        </span>
      </Link>
      <StagePrice product={product} className={styles.miniPrice} />
    </li>
  );
}

function TextLinks({ links, onPick }: { links: NavLinkItem[]; onPick: () => void }) {
  return (
    <ul role="list" className={styles.words}>
      {links.map((l) => (
        <li key={l.to}>
          <Link to={l.to} className="link" onClick={onPick}>
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** "choco · strawberry · kiwi" as links straight to each colour. */
function ColourLinks({ petals, onPick }: { petals: Product; onPick: () => void }) {
  return petals.colourways.map((c) => (
    <li key={c.id}>
      <Link to={colourHref(petals, c)} className={`link ${styles.nick}`} onClick={onPick}>
        {nicknameOf(c)}
      </Link>
    </li>
  ));
}

/**
 * A top sheet on paper that takes the header's place: one large underlined
 * field on the header's line, then two panes on the Shop panel's columns.
 * Words on the left (Popular, or the Help sections that match) and pairs on the
 * right (recently viewed, or the live mini results). Below 1024 the panes stack,
 * and Popular steps aside while you type. Full height on phones, where the menu opens it.
 */
export function SearchDialog() {
  const { searchOpen, setSearchOpen } = useUI();
  const { products } = useCatalog();
  const petals = usePetals();
  const { remember } = useRecentSearches();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample styles belong to the preview catalogue; elsewhere search shows only Whimy's own.
  const includeSamples = pathname.startsWith('/preview/catalogue');
  const searchable = useMemo(
    () => products.filter((p) => p.kind !== 'sample' || includeSamples),
    [products, includeSamples],
  );

  // Every opening starts from an empty field.
  const [wasOpen, setWasOpen] = useState(searchOpen);
  if (searchOpen !== wasOpen) {
    setWasOpen(searchOpen);
    if (searchOpen) setQuery('');
  }

  useEffect(() => {
    if (!searchOpen) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [searchOpen]);

  const trimmed = query.trim();
  const hits = useMemo(() => (trimmed ? searchProducts(searchable, trimmed) : []), [searchable, trimmed]);
  const help = useMemo(() => helpHits(trimmed), [trimmed]);

  const recent = useMemo(() => {
    if (!searchOpen) return [];
    return readRecentlyViewed()
      .map((id) => searchable.find((p) => p.id === id))
      .filter((p): p is Product => p != null)
      .slice(0, 3)
      .map((product) => ({ product, colourway: product.colourways[0] }));
  }, [searchOpen, searchable]);

  const close = () => setSearchOpen(false);
  const pick = () => {
    if (trimmed) remember(trimmed);
    close();
  };
  const submit = () => {
    if (!trimmed) return;
    remember(trimmed);
    close();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const popular = (
    <section aria-labelledby="search-popular">
      <h3 id="search-popular" className={styles.label}>
        Popular
      </h3>
      <ul role="list" className={styles.words}>
        {petals && <ColourLinks petals={petals} onPick={close} />}
        {popularHelp.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="link" onClick={close}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
  // While typing with no Help match, Popular keeps the left pane on wide screens only.
  const wordsAside = trimmed !== '' && help.length === 0;

  return (
    <Dialog open={searchOpen} onClose={close} title="Search Whimy" className={styles.sheet} hideTitle>
      <div className={`wrap ${styles.inner}`}>
        <div className={styles.bar}>
          <form
            role="search"
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label htmlFor="site-search" className="sr-only">
              Search Whimy
            </label>
            <input
              id="site-search"
              ref={inputRef}
              className={styles.input}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Whimy"
              autoComplete="off"
              enterKeyHint="search"
            />
            {query && (
              <button
                type="button"
                className={styles.barWord}
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
              >
                Clear
              </button>
            )}
          </form>
          <button type="button" className={styles.barWord} onClick={close}>
            Close
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          {!trimmed
            ? ''
            : hits.length || help.length
              ? `${hits.length} ${hits.length === 1 ? 'style' : 'styles'} and ${help.length} Help ${help.length === 1 ? 'section' : 'sections'} found.`
              : 'Nothing called that yet.'}
        </p>

        <div className={styles.panes}>
          <div className={`${styles.pane} ${wordsAside ? styles.wideOnly : ''}`}>
            {help.length > 0 ? (
              <section aria-labelledby="search-help">
                <h3 id="search-help" className={styles.label}>
                  In Help
                </h3>
                <TextLinks links={help} onPick={pick} />
              </section>
            ) : (
              popular
            )}
          </div>

          <div className={`${styles.pane} ${styles.pairs}`}>
            {!trimmed ? (
              recent.length > 0 && (
                <section aria-labelledby="search-recent">
                  <h3 id="search-recent" className={styles.label}>
                    Recently viewed
                  </h3>
                  <ul role="list" className={styles.minis}>
                    {recent.map(({ product, colourway }) => (
                      <MiniProduct key={product.id} product={product} colourway={colourway} onPick={close} />
                    ))}
                  </ul>
                </section>
              )
            ) : hits.length === 0 && help.length === 0 ? (
              <p className={styles.empty}>
                Nothing called that yet. Try{' '}
                {petals ? (
                  petals.colourways.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && (i === petals.colourways.length - 1 ? ' or ' : ', ')}
                      <Link to={colourHref(petals, c)} className={`link ${styles.nick}`} onClick={close}>
                        {nicknameOf(c)}
                      </Link>
                    </span>
                  ))
                ) : (
                  <span className={styles.nick}>choco, strawberry or kiwi</span>
                )}
                .
              </p>
            ) : (
              hits.length > 0 && (
                <>
                  <section aria-labelledby="search-pairs">
                    <h3 id="search-pairs" className={styles.label}>
                      {hits.length === 1 ? '1 style' : `${hits.length} styles`}
                    </h3>
                    <ul role="list" className={styles.minis}>
                      {hits.slice(0, MAX_RESULTS).map((h) => (
                        <MiniProduct key={h.product.id} product={h.product} colourway={h.colourway} onPick={pick} />
                      ))}
                    </ul>
                  </section>
                  <p className={styles.all}>
                    <Link to={`/search?q=${encodeURIComponent(trimmed)}`} className="link" onClick={pick}>
                      See all results for “{trimmed}”
                    </Link>
                  </p>
                </>
              )
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
