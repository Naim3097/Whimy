import { useState } from 'react';
import { Link, useViewTransitionState } from 'react-router';
import type { Colourway, Product } from '../../domain/types';
import { cardImages, isColourwayAvailable, productPath, type ListingCard } from '../../lib/catalog';
import { launchCopy } from '../../lib/launch';
import { useUI } from '../../state/ui';
import { Img } from '../ui/Img';
import { Price } from '../ui/Price';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './ProductCard.module.css';

/** A card's link: Petals under /products, a sample style under /preview/catalogue. */
// eslint-disable-next-line react/only-export-components -- shared href builder, kept beside the cards that use it
export function productHref(product: Pick<Product, 'slug' | 'kind'>, colourId?: string) {
  return productPath(product, colourId);
}

// Listings run the full page width (`.wrap`): four up from 1024px, three on tablets, two on phones.
const CARD_SIZES = '(min-width: 1024px) 23vw, (min-width: 768px) 31vw, 47vw';

/** The launch stage only governs Whimy's own products; sample styles always show their sample price. */
function useShowsPrice(product: Product) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  return { showPrice: product.kind !== 'whimy' || copy.showPrice, priceLabel: copy.priceLabel };
}

/** Row 3: at most one quiet line. Never scarcity, badges or sale words. */
function cardNote(card: ListingCard, colourway: Colourway, showPrice: boolean): string | null {
  if (!isColourwayAvailable(colourway)) return 'Sold out: notify me';
  if (!showPrice) return 'Coming soon';
  if (!card.colourLocked && card.product.colourways.length > 1) return `${card.product.colourways.length} colours`;
  return null;
}

interface ProductCardProps {
  card: ListingCard;
  priority?: boolean;
  sizes?: string;
  /** The hover cross-fade to the second photograph. The grid turns it off unless every card has one. */
  hoverSwap?: boolean;
}

/**
 * A product in a real list (search, Saved, account, the preview catalogue):
 * the photograph with nothing on it, then name and price, colour, and at most
 * one quiet note. The name is the link; the image is a pointer-only twin.
 */
export function ProductCard({ card, priority, sizes = CARD_SIZES, hoverSwap = true }: ProductCardProps) {
  const { product, colourway } = card;
  const href = productHref(product, colourway.id);
  const [clicked, setClicked] = useState(false);
  const transitioning = useViewTransitionState(productPath(product));
  const { showPrice } = useShowsPrice(product);
  const { primary, secondary } = cardImages(colourway);
  const note = cardNote(card, colourway, showPrice);
  const sampleImage = primary?.origin === 'sample';
  const onClick = () => setClicked(true);

  return (
    <article className={styles.card}>
      <Link
        to={href}
        viewTransition
        className={styles.media}
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClick}
        style={clicked && transitioning ? { viewTransitionName: 'product-hero' } : undefined}
      >
        {primary && <Img image={primary} sizes={sizes} priority={priority} fill className={styles.img} alt="" />}
        {hoverSwap && secondary && <Img image={secondary} sizes={sizes} fill className={`${styles.img} ${styles.second}`} alt="" />}
      </Link>

      <div className={styles.body}>
        <div className={styles.row}>
          <h3 className={`t-ui ${styles.name}`}>
            <Link to={href} viewTransition className={styles.nameLink} onClick={onClick}>
              {product.name}
              <span className="sr-only">, {colourway.name}</span>
            </Link>
          </h3>
          {showPrice && (
            <Price className={`t-ui ${styles.price}`} amount={product.price.amount} provenance={product.price.provenance} compareAt={product.price.compareAt} />
          )}
        </div>
        <p className={styles.colour}>
          {colourway.nickname && <span className="v-0">{colourway.nickname}</span>}{' '}
          <span className={`t-small muted ${colourway.nickname ? styles.official : ''}`}>{colourway.name}</span>
        </p>
        {note && <p className="t-small muted">{note}</p>}
        {sampleImage && (
          <p className={`caption ${styles.origin}`}>
            <ProvenanceMark kind="sample-image" />
          </p>
        )}
      </div>
    </article>
  );
}

interface ProductGridProps {
  cards: ListingCard[];
  /** 4-up from 1024px (the default), or 3-up for narrower pages such as search. */
  columns?: 3 | 4;
  sizes?: string;
  /** How many cards at the top load eagerly. */
  priorityCount?: number;
}

/** The only card grid: 4-up (or 3-up), 3-up on tablets, 2-up on phones. */
export function ProductGrid({ cards, columns = 4, sizes, priorityCount = 0 }: ProductGridProps) {
  const gridSizes = sizes ?? (columns === 3 ? '(min-width: 1280px) 390px, (min-width: 768px) 31vw, 47vw' : CARD_SIZES);
  // One hover behaviour per grid: a lone card that cross-fades among still ones reads as a glitch.
  const hoverSwap = cards.every((c) => cardImages(c.colourway).secondary);
  return (
    <ul role="list" className={`${styles.grid} ${columns === 3 ? styles.three : ''}`}>
      {cards.map((card, i) => (
        <li key={card.key}>
          <ProductCard card={card} sizes={gridSizes} priority={i < priorityCount} hoverSwap={hoverSwap} />
        </li>
      ))}
    </ul>
  );
}

interface MiniCardProps {
  product: Product;
  colourway: Colourway;
  /** Runs before navigation, e.g. to close the sheet the card sits in. */
  onNavigate?: () => void;
  className?: string;
}

/**
 * The small row card for the search sheet, the Shop panel and bag suggestions:
 * a 64 × 80 thumbnail, then the name, the colour and the price. One link.
 */
export function MiniCard({ product, colourway, onNavigate, className }: MiniCardProps) {
  const { showPrice, priceLabel } = useShowsPrice(product);
  const image = colourway.images[0];

  return (
    <div className={`${styles.mini} ${className ?? ''}`}>
      {image && <Img image={image} sizes="64px" className={styles.thumb} alt="" />}
      <div className={styles.miniBody}>
        <Link to={productHref(product, colourway.id)} className={`t-ui ${styles.miniName}`} onClick={onNavigate}>
          {product.name}
          <span className="sr-only">, {colourway.name}</span>
        </Link>
        <p className={styles.colour}>
          {colourway.nickname && <span className="v-0">{colourway.nickname}</span>}{' '}
          <span className={`t-small muted ${colourway.nickname ? styles.official : ''}`}>{colourway.name}</span>
        </p>
        <p className="t-small">
          {showPrice ? (
            <Price amount={product.price.amount} provenance={product.price.provenance} compareAt={product.price.compareAt} />
          ) : (
            <span className="muted">{priceLabel}</span>
          )}
        </p>
      </div>
    </div>
  );
}
