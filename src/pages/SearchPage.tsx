import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { helpAnchors } from '../data/content';
import { ProductRow } from '../components/cart/ProductRow';
import { ProductGrid } from '../components/product/ProductCard';
import { usePageMeta } from '../hooks/dom';
import { useRecentSearches } from '../hooks/useRecentlyViewed';
import { useResource } from '../hooks/useResource';
import { searchProducts, type ListingCard, type SearchHit } from '../lib/catalog';
import { services } from '../services';
import { UtilityPage } from './InfoPages';
import styles from './SearchPage.module.css';

interface Suggestion {
  label: string;
  to: string;
  /** Colour nicknames are always set in the italic voice. */
  nick?: boolean;
}

const POPULAR: Suggestion[] = [
  { label: 'choco', to: '/search?q=choco', nick: true },
  { label: 'strawberry', to: '/search?q=strawberry', nick: true },
  { label: 'kiwi', to: '/search?q=kiwi', nick: true },
  { label: 'size guide', to: `/help#${helpAnchors.sizeFit}` },
  { label: 'delivery', to: `/help#${helpAnchors.delivery}` },
  { label: 'exchanges', to: `/help#${helpAnchors.exchanges}` },
];

const HELP_TOPICS: { label: string; hash: string; terms: string[] }[] = [
  { label: 'Size & fit', hash: helpAnchors.sizeFit, terms: ['size', 'sizes', 'sizing', 'fit', 'eu', 'measure', 'foot length', 'guide', 'chart', 'heel height'] },
  { label: 'Delivery', hash: helpAnchors.delivery, terms: ['delivery', 'deliver', 'shipping', 'ship', 'courier', 'postage', 'east malaysia', 'sabah', 'sarawak', 'labuan', 'singapore'] },
  { label: 'Exchanges', hash: helpAnchors.exchanges, terms: ['exchange', 'exchanges', 'return', 'returns', 'refund', 'swap', 'defective', 'faulty'] },
  { label: 'Care', hash: helpAnchors.care, terms: ['care', 'clean', 'cleaning', 'satin', 'organza'] },
  { label: 'FAQ', hash: helpAnchors.faq, terms: ['faq', 'question', 'questions', 'price', 'pay', 'payment', 'fpx', 'launch', 'tiktok', 'flower'] },
  { label: 'Contact', hash: helpAnchors.contact, terms: ['contact', 'email', 'whatsapp', 'instagram', 'dm', 'message', 'threads'] },
];

const tokensOf = (query: string) => query.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

/** Help sections whose words start with any token of the query ("deliv" finds Delivery). */
function helpHits(query: string) {
  const tokens = tokensOf(query).filter((t) => t.length >= 2);
  return HELP_TOPICS.filter((topic) =>
    topic.terms.some((term) => term.split(' ').some((word) => tokens.some((t) => (t.length >= 3 ? word.startsWith(t) : word === t)))),
  );
}

/**
 * One card per matching colour. A search hit names the product's best colour;
 * a query that matches the product itself ("petals") equally matches every
 * colour, so each colour gets its card. Sample styles never show here.
 */
function toCards(hits: SearchHit[], query: string): ListingCard[] {
  return hits
    .filter((hit) => hit.product.kind !== 'sample')
    .flatMap((hit) => {
      const matching = hit.product.colourways.filter(
        (c) => searchProducts([{ ...hit.product, colourways: [c] }], query)[0]?.score === hit.score,
      );
      return (matching.length ? matching : [hit.colourway]).map((colourway) => ({
        key: `${hit.product.id}:${colourway.id}`,
        product: hit.product,
        colourway,
        colourLocked: true,
      }));
    });
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const [input, setInput] = useState(q);
  const [shownQ, setShownQ] = useState(q);
  const { terms, remember } = useRecentSearches();
  const { data: hits, status } = useResource(q ? `search:${q.toLowerCase()}` : null, () => services.catalog.search(q));

  usePageMeta(q ? `Search: ${q}` : 'Search');
  // A new query from the URL (back, a suggestion link) refills the field.
  if (q !== shownQ) {
    setShownQ(q);
    setInput(q);
  }

  const submit = (term: string) => {
    const clean = term.trim();
    if (clean) remember(clean);
    setParams(clean ? { q: clean } : {});
  };

  const cards = status === 'success' ? toCards(hits, q) : [];
  const help = q ? helpHits(q) : [];
  const total = cards.length + help.length;

  return (
    <UtilityPage title="Search">
      <form
        role="search"
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
      >
        <label htmlFor="search-page-input" className="sr-only">
          Search Whimy
        </label>
        <input
          id="search-page-input"
          className={styles.input}
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search colours, sizes, delivery…"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit" className={styles.submit}>
          Search
        </button>
      </form>

      {!q ? (
        <div className={styles.suggest}>
          <SuggestionList title="Popular" items={POPULAR} />
          {terms.length > 0 && <SuggestionList title="Recent searches" items={terms.map((t) => ({ label: t, to: `/search?q=${encodeURIComponent(t)}` }))} />}
        </div>
      ) : status !== 'success' ? (
        <p className="muted" aria-live="polite">
          Searching…
        </p>
      ) : (
        <div className={styles.results}>
          {total > 0 && (
            <p className="t-small muted num" aria-live="polite">
              {total} {total === 1 ? 'result' : 'results'} for “{q}”
            </p>
          )}

          {cards.length === 0 && help.length === 0 ? (
            <>
              <p className={styles.none} aria-live="polite">
                Nothing called that yet. Try{' '}
                <Link to="/products/petals-heels?colour=rich-brown" className="link">
                  <span className={styles.nick}>choco</span>
                </Link>
                ,{' '}
                <Link to="/products/petals-heels?colour=blush-pink" className="link">
                  <span className={styles.nick}>strawberry</span>
                </Link>{' '}
                or{' '}
                <Link to="/products/petals-heels?colour=sage-green" className="link">
                  <span className={styles.nick}>kiwi</span>
                </Link>
                .
              </p>
              <SuggestionList title="Or try" items={POPULAR.slice(3)} />
            </>
          ) : cards.length === 0 ? (
            <p className={styles.none}>No styles called “{q}”.</p>
          ) : (
            <section aria-labelledby="styles-title" className={cards.length <= 3 ? 'grid' : undefined}>
              <h2 id="styles-title" className="sr-only">
                Styles
              </h2>
              {/* A short list reads as rows, like the bag; the card grid starts at four. */}
              {cards.length <= 3 ? (
                <ul role="list" className={styles.rows}>
                  {cards.map((card) => (
                    <ProductRow key={card.key} product={card.product} colourway={card.colourway} />
                  ))}
                </ul>
              ) : (
                <ProductGrid cards={cards} priorityCount={2} />
              )}
            </section>
          )}

          {help.length > 0 && (
            <section aria-labelledby="help-hits-title" className={styles.help}>
              <h2 id="help-hits-title" className={styles.h2}>
                In Help
              </h2>
              <ul className="rows">
                {help.map((topic) => (
                  <li key={topic.hash}>
                    <Link to={`/help#${topic.hash}`} className={`link-quiet ${styles.helpLink}`}>
                      {topic.label}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </UtilityPage>
  );
}

function SuggestionList({ title, items }: { title: string; items: Suggestion[] }) {
  return (
    <section>
      <h2 className={styles.h2}>{title}</h2>
      <ul className={styles.inline}>
        {items.map((item) => (
          <li key={item.label}>
            <Link to={item.to} className="link">
              {item.nick ? <span className={styles.nick}>{item.label}</span> : item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
