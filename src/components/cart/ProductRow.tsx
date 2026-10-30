import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { Colourway, Product } from '../../domain/types';
import { launchCopy } from '../../lib/launch';
import { useUI } from '../../state/ui';
import { Img } from '../ui/Img';
import { Price } from '../ui/Price';
import { ColourLine } from './ColourLine';
import { colourHref } from './petals';
import styles from './ProductRow.module.css';

interface ProductRowProps {
  product: Product;
  colourway: Colourway;
  /** A second row of text actions (Saved: size, Add to bag, Remove). */
  actions?: ReactNode;
}

/**
 * A short list's row, drawn like a bag line: a 72 × 90 thumbnail, the name
 * with the price on its right, chip + *nickname* · Official Name across the
 * full width, and optional actions beneath. Search uses it for three results
 * or fewer; Saved always does.
 */
export function ProductRow({ product, colourway, actions }: ProductRowProps) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  const showPrice = product.kind !== 'whimy' || copy.showPrice;
  const href = colourHref(product, colourway.id);
  const image = colourway.images[0];

  return (
    <li className={styles.row} data-row={`${product.id}:${colourway.id}`}>
      <Link to={href} className={styles.thumb} tabIndex={-1} aria-hidden="true">
        {/* Stand-in photographs stay on /preview/catalogue. */}
        {image?.origin === 'whimy' ? <Img image={image} sizes="72px" alt="" className={styles.photo} /> : <span className={styles.blank} />}
      </Link>
      <h3 className={`t-ui ${styles.name}`}>
        <Link to={href} className="link-quiet" data-name>
          {product.name}
          <span className="sr-only">, {colourway.name}</span>
        </Link>
      </h3>
      <p className={styles.price}>
        {showPrice ? <Price amount={product.price.amount} provenance={product.price.provenance} /> : <span className="t-small muted">{copy.priceLabel}</span>}
      </p>
      <ColourLine nickname={colourway.nickname} name={colourway.name} swatch={colourway.swatch.base} className={styles.colour} />
      {actions && <div className={styles.actions}>{actions}</div>}
    </li>
  );
}
