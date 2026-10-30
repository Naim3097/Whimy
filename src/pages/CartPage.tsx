import { useNavigate } from 'react-router';
import { CartLineSkeleton } from '../components/cart/CartLineItem';
import { CartLines, useBagRemoval } from '../components/cart/CartLines';
import { deliveryRow, DeliveryThreshold } from '../components/cart/DeliveryThreshold';
import { EmptyBag } from '../components/cart/EmptyBag';
import { LetterCard } from '../components/cart/LetterCard';
import { useLetterNote } from '../components/cart/letterNote';
import { petalsColoursIn } from '../components/cart/petals';
import { SetNudge } from '../components/cart/SetNudge';
import { PromoCodeForm, Totals } from '../components/cart/Totals';
import { paymentPreview } from '../components/checkout/payment';
import { ProvenanceMark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import { computeTotals } from '../lib/checkout';
import { formatMoney } from '../lib/money';
import { useCart } from '../state/cart';
import { usePromo } from '../state/checkout';
import styles from './CartPage.module.css';

/**
 * /bag: the lines in cols 1–7 with the set offer and letter card under them,
 * the summary on ivory in cols 9–12. Below 1024 the summary comes straight
 * after the lines, so Checkout is reached before the extras.
 */
export function CartPage() {
  usePageMeta('Bag');
  const { lines, resolved, subtotal, blocked, ready } = useCart();
  const promo = usePromo(resolved, subtotal);
  const [note, setNote] = useLetterNote();
  const removal = useBagRemoval();
  const navigate = useNavigate();

  const discount = promo.active?.discount ?? 0;
  const totals = computeTotals(subtotal, discount, 0);
  const freeWithCode = promo.active?.freeShipping ? promo.active.outcome.code : null;

  // Until the catalogue resolves the lines, hold the final layout so nothing jumps.
  if (!ready && lines.length > 0) {
    return (
      <div className={`wrap--utility ${styles.page}`}>
        <h1 className={`t-title ${styles.title}`}>Bag</h1>
        <div className={`grid ${styles.layout}`} aria-busy="true">
          <ul role="list" className={`${styles.items} ${styles.lines}`}>
            {lines.map((line) => (
              <CartLineSkeleton key={line.key} />
            ))}
          </ul>
          <div className={`skeleton ${styles.summary} ${styles.pendingSummary}`} />
        </div>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className={`wrap--utility ${styles.page}`}>
        <h1 className={`t-title ${styles.title}`}>Bag</h1>
        {/* Removing the last pair keeps its undo row above the empty bag. */}
        {removal.removed && <CartLines lines={resolved} removal={removal} className={styles.lastUndo} />}
        <EmptyBag />
      </div>
    );
  }

  return (
    <div className={`wrap--utility ${styles.page}`}>
      <h1 className={`t-title ${styles.title}`}>Bag</h1>

      <div className={`grid ${styles.layout}`}>
        <section className={styles.items} aria-labelledby="bag-items">
          <h2 id="bag-items" className="sr-only">
            Items
          </h2>
          <CartLines lines={resolved} removal={removal} />
        </section>

        <aside className={styles.summary} aria-labelledby="bag-summary">
          <h2 id="bag-summary" className="sr-only">
            Summary
          </h2>
          <DeliveryThreshold amount={subtotal - discount} freeWithCode={freeWithCode} />
          <div className={styles.sums}>
            <Totals totals={totals} code={promo.active?.outcome.code} delivery={deliveryRow(subtotal - discount, freeWithCode)} />
            <PromoCodeForm
              outcome={promo.evaluation?.outcome ?? null}
              onApply={promo.apply}
              onRemove={promo.remove}
              offerSet={petalsColoursIn(resolved).size === 3}
            />
          </div>
          <p className="t-cap muted">
            {paymentPreview}
            <ProvenanceMark kind="sample" />
          </p>
          {blocked && (
            <p className={`t-small ${styles.blocked}`} role="alert">
              Something in your bag needs attention before checkout.
            </p>
          )}
          <button type="button" className="btn btn--lg btn--block" disabled={blocked} onClick={() => navigate('/checkout')}>
            <span>
              Checkout · <span className="num">{formatMoney(totals.total)}</span>
            </span>
          </button>
        </aside>

        <div className={styles.extras}>
          <SetNudge />
          <div className={styles.letter}>
            <LetterCard note={note} onChange={setNote} />
          </div>
        </div>
      </div>
    </div>
  );
}
