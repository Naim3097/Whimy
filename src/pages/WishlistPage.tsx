import { useEffect, useId, useRef, useState } from 'react';
import type { Size } from '../domain/types';
import { ColourExits } from '../components/cart/ColourExits';
import { ProductRow } from '../components/cart/ProductRow';
import { Mark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import { getColourway, sizeStock, type ListingCard } from '../lib/catalog';
import { launchCopy } from '../lib/launch';
import { useCart } from '../state/cart';
import { useCatalog } from '../state/catalog';
import { useUI } from '../state/ui';
import { useWishlist } from '../state/wishlist';
import { UtilityPage } from './InfoPages';
import styles from './WishlistPage.module.css';

/**
 * /saved: the pairs saved in this browser, newest first, as bag-style rows,
 * each with a size and Add to bag, so a saved colour is one step from the bag.
 * (Only Whimy's own pairs can be saved, so the list never outgrows rows.)
 */
export function WishlistPage() {
  usePageMeta('Saved');
  const wishlist = useWishlist();
  const { productById, ready } = useCatalog();
  const list = useRef<HTMLUListElement>(null);
  const countRef = useRef<HTMLHeadingElement>(null);
  const emptyRef = useRef<HTMLParagraphElement>(null);
  const [focusNext, setFocusNext] = useState<string | null>(null);

  // Sample styles live only in the preview catalogue; Saved lists real Whimy pairs.
  const cards: ListingCard[] = wishlist.items.flatMap((item) => {
    const product = productById(item.productId);
    const colourway = product && getColourway(product, item.colourId);
    return product && colourway && product.kind === 'whimy'
      ? [{ key: `${product.id}:${colourway.id}`, product, colourway, colourLocked: true }]
      : [];
  });

  // After a removal, focus the next row's name (or the previous one's), or the empty state.
  useEffect(() => {
    if (!focusNext) return;
    setFocusNext(null);
    if (focusNext === 'empty') return emptyRef.current?.focus();
    const row = [...(list.current?.querySelectorAll<HTMLElement>('[data-row]') ?? [])].find((li) => li.dataset.row === focusNext);
    (row?.querySelector<HTMLElement>('[data-name]') ?? countRef.current)?.focus();
  }, [focusNext]);

  const remove = (index: number) => {
    const card = cards[index];
    const neighbour = cards[index + 1] ?? cards[index - 1];
    wishlist.remove(card.product.id, card.colourway.id);
    setFocusNext(neighbour ? neighbour.key : 'empty');
  };

  return (
    <UtilityPage title="Saved">
      {!ready && wishlist.count > 0 ? (
        <p className="muted" aria-busy="true">
          Loading your saved pairs…
        </p>
      ) : cards.length === 0 ? (
        <div className={styles.empty}>
          <p ref={emptyRef} tabIndex={-1} className="v-1">
            Nothing saved yet.
          </p>
          <ColourExits />
        </div>
      ) : (
        <div className="grid">
          <div className={styles.saved}>
            <h2 ref={countRef} tabIndex={-1} className={`t-small muted num ${styles.count}`} aria-live="polite">
              {cards.length} saved {cards.length === 1 ? 'pair' : 'pairs'}
            </h2>
            <ul ref={list} role="list" className={styles.rows}>
              {cards.map((card, i) => (
                <ProductRow key={card.key} product={card.product} colourway={card.colourway} actions={<SavedActions card={card} onRemove={() => remove(i)} />} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </UtilityPage>
  );
}

/** EU size, Add to bag and Remove under a saved row. Adding opens the bag drawer, as everywhere else. */
function SavedActions({ card, onRemove }: { card: ListingCard; onRemove: () => void }) {
  const { product, colourway } = card;
  const id = useId();
  const cart = useCart();
  const { launchStage } = useUI();
  const [size, setSize] = useState<Size | null>(null);
  const [error, setError] = useState<string | null>(null);
  const select = useRef<HTMLSelectElement>(null);
  const canBuy = launchCopy(launchStage).showPrice;

  const add = () => {
    if (size == null) {
      setError('Choose a size');
      select.current?.focus();
      return;
    }
    if (!cart.add({ productId: product.id, colourId: colourway.id, size }, 1).ok) {
      setError(`Your bag already holds the most we can sell of EU ${size} in ${colourway.name}.`);
      return;
    }
    setError(null);
    cart.openDrawer();
  };

  return (
    <div className={styles.actions}>
      {canBuy && (
        <>
          <label htmlFor={`${id}-size`} className={`field-label ${styles.sizeLabel}`}>
            Size (EU)
            <Mark provenance={product.sizeProvenance} />
          </label>
          <select
            ref={select}
            id={`${id}-size`}
            className={`select ${styles.size}`}
            value={size ?? ''}
            onChange={(e) => {
              setSize(e.target.value ? (Number(e.target.value) as Size) : null);
              setError(null);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          >
            <option value="">Choose…</option>
            {product.sizes.map((s) => {
              const out = sizeStock(colourway, s) <= 0;
              return (
                <option key={s} value={s} disabled={out}>
                  {s}
                  {out ? ' (sold out)' : ''}
                </option>
              );
            })}
          </select>
          <button type="button" className={`link t-ui ${styles.action}`} onClick={add}>
            Add to bag<span className="sr-only">: {product.name}, {colourway.name}</span>
          </button>
        </>
      )}
      <button type="button" className={`link t-small ${styles.action}`} onClick={onRemove}>
        Remove<span className="sr-only">{` ${product.name}, ${colourway.name}`}</span>
      </button>
      {error && (
        <p id={`${id}-error`} className={`field-error ${styles.error}`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
