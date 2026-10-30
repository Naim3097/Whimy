import { useRef } from 'react';
import { Link } from 'react-router';
import type { ResolvedLine } from '../../lib/cart';
import { getColourway } from '../../lib/catalog';
import { formatMoney } from '../../lib/money';
import { useCart } from '../../state/cart';
import { MAX_QTY_PER_LINE } from '../../data/mock/commerce';
import { Img } from '../ui/Img';
import { Price } from '../ui/Price';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import { QuantityStepper } from '../ui/QuantityStepper';
import { ColourLine } from './ColourLine';
import { colourHref } from './petals';
import styles from './CartLineItem.module.css';

interface CartLineItemProps {
  line: ResolvedLine;
  /** Takes the line out; the list (CartLines) swaps it for an undo row. */
  onRemove: (key: string) => void;
  onNavigate?: () => void;
}

/**
 * One bag line: a 72 × 90 thumbnail, the name with the price on its right,
 * then chip + nickname + official name and size across the full width (so the
 * colour never squeezes beside the price), a compact quantity control and "Remove".
 */
export function CartLineItem({ line, onRemove, onNavigate }: CartLineItemProps) {
  const { setQuantity, ready } = useCart();
  const actions = useRef<HTMLDivElement>(null);
  const product = line.product;
  const colourway = product ? getColourway(product, line.colourId) : undefined;

  if (!ready) return <CartLineSkeleton />;

  if (!product || !colourway) {
    return (
      <li className={`${styles.line} ${styles.gone}`} data-line={line.key}>
        <p className="t-small muted">This item is no longer available.</p>
        <button type="button" className={`link t-small ${styles.remove}`} data-remove onClick={() => onRemove(line.key)}>
          Remove
        </button>
      </li>
    );
  }

  const href = colourHref(product, colourway.id);
  const image = colourway.images[0];
  const max = Math.max(1, Math.min(line.available, MAX_QTY_PER_LINE));
  const variant = `${product.name}, ${colourway.name}, EU ${line.size}`;

  const changeQuantity = (quantity: number) => {
    // At either end the pressed button disables, which would drop focus to the page: keep it in the control.
    const inControl = actions.current?.contains(document.activeElement);
    setQuantity(line.key, quantity);
    if (inControl && (quantity <= 1 || quantity >= max)) {
      requestAnimationFrame(() => actions.current?.querySelector<HTMLButtonElement>('[role="group"] button:not(:disabled)')?.focus());
    }
  };

  return (
    <li className={styles.line} data-status={line.status} data-line={line.key}>
      <Link to={href} className={styles.thumb} onClick={onNavigate} tabIndex={-1} aria-hidden="true">
        {/* Stand-in photographs stay on /preview/catalogue; sample styles get a plain ground here. */}
        {image?.origin === 'whimy' ? <Img image={image} sizes="72px" alt="" className={styles.photo} /> : <span className={styles.blank} />}
      </Link>

      <h3 className={`t-ui ${styles.name}`}>
        <Link to={href} className="link-quiet" onClick={onNavigate}>
          {product.name}
        </Link>
        {product.kind === 'sample' && <ProvenanceMark kind="sample" />}
      </h3>

      <p className={styles.price}>
        <Price amount={line.lineTotal} provenance={product.price.provenance} />
      </p>

      <div className={styles.detail}>
        <ColourLine nickname={colourway.nickname} name={colourway.name} swatch={colourway.swatch.base} details={[`EU ${line.size}`]} />
        {line.quantity > 1 && line.status !== 'unavailable' && <p className="t-cap muted num">{formatMoney(line.unitPrice)} each</p>}
        {line.status === 'unavailable' && <p className={`t-small ${styles.problem}`}>Sold out in EU {line.size}. Remove it to check out.</p>}
        {line.status === 'reduced' && (
          <p className="t-small">
            {line.available} available in this size.{' '}
            <button type="button" className="link t-small" onClick={() => setQuantity(line.key, line.available)}>
              Update to {line.available}
            </button>
          </p>
        )}
      </div>

      <div ref={actions} className={styles.actions}>
        {line.status !== 'unavailable' && (
          <QuantityStepper size="sm" value={line.quantity} max={max} label={`Quantity, ${variant}`} onChange={changeQuantity} />
        )}
        <button type="button" className={`link t-small ${styles.remove}`} data-remove onClick={() => onRemove(line.key)}>
          Remove<span className="sr-only"> {variant}</span>
        </button>
        {/* Always present, so reaching the cap is announced. */}
        <span className="t-cap muted" aria-live="polite">
          {line.quantity >= MAX_QTY_PER_LINE && (
            <>
              Up to {MAX_QTY_PER_LINE} per size
              <ProvenanceMark kind="sample" />
            </>
          )}
        </span>
      </div>
    </li>
  );
}

/** A loading line the height of a real one, so nothing below it moves when the bag resolves. */
export function CartLineSkeleton() {
  return (
    <li className={styles.line} aria-hidden="true">
      <span className={`${styles.thumb} ${styles.ghost}`} />
      <span className={`skeleton ${styles.pending}`} />
    </li>
  );
}
