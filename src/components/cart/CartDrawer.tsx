import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import type { Colourway, Product } from '../../domain/types';
import { SET_CODE } from '../../data/mock/commerce';
import type { ResolvedLine } from '../../lib/cart';
import { computeTotals } from '../../lib/checkout';
import { getColourway } from '../../lib/catalog';
import { formatMoney } from '../../lib/money';
import { useCart } from '../../state/cart';
import { usePromo } from '../../state/checkout';
import { paymentPreview } from '../checkout/payment';
import { Dialog } from '../ui/Dialog';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import { CartLines, useBagRemoval } from './CartLines';
import { deliveryRow, DeliveryThreshold } from './DeliveryThreshold';
import { EmptyBag } from './EmptyBag';
import { petalsColoursIn, PETALS_ID } from './petals';
import { SetNudge } from './SetNudge';
import { PromoCodeForm, Totals } from './Totals';
import styles from './CartDrawer.module.css';

/**
 * The bag drawer. Each opening mounts a fresh view, so a code changed on /bag
 * or at checkout is always what the drawer shows, and an undo row lasts only
 * until the drawer closes.
 */
export function CartDrawer() {
  const { drawerOpen, closeDrawer, addedKeys } = useCart();
  const location = useLocation();

  useEffect(() => closeDrawer(), [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // "Added: …" names what went into the bag since the drawer last closed (one pair, or a whole set).
  const [visit, setVisit] = useState({
    open: drawerOpen,
    count: 0,
    added: [] as string[],
  });
  if (visit.open !== drawerOpen) {
    setVisit(drawerOpen ? { open: true, count: visit.count + 1, added: addedKeys } : { ...visit, open: false });
  }

  return <BagDrawer key={visit.count} added={visit.added} />;
}

interface AddedPair {
  line: ResolvedLine;
  product: Product;
  colourway: Colourway;
}

/** The lines behind the added keys, and whether they are one pair of every Petals colour (the set builder's add). */
function addedPairs(keys: string[], lines: ResolvedLine[]) {
  const pairs: AddedPair[] = keys.flatMap((key) => {
    const line = lines.find((l) => l.key === key);
    const colourway = line?.product && getColourway(line.product, line.colourId);
    return line?.product && colourway ? [{ line, product: line.product, colourway }] : [];
  });
  const petals = pairs.length > 0 && pairs.every((p) => p.product.id === PETALS_ID) ? pairs[0].product : undefined;
  const wholeSet = petals != null && pairs.length === petals.colourways.length && petalsColoursIn(pairs.map((p) => p.line)).size === petals.colourways.length;
  return { pairs, wholeSet };
}

/**
 * A quick confirmation: the lines, the set offer, Delivery and Total. Codes
 * are typed on /bag and at checkout; here an applied code shows with its
 * Remove, and with all three colours in, PETALS3 is one tap away.
 */
function BagDrawer({ added }: { added: string[] }) {
  const { resolved, count, subtotal, blocked, drawerOpen, closeDrawer } = useCart();
  const promo = usePromo(resolved, subtotal);
  const removal = useBagRemoval();
  const navigate = useNavigate();
  const { pairs, wholeSet } = addedPairs(added, resolved);

  // The set builder quotes the set at its PETALS3 price, so a whole set goes in with the
  // code, and the Added line says so. Once, as the drawer opens; never over a code she chose herself.
  useEffect(() => {
    if (wholeSet && !promo.code) promo.apply(SET_CODE);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const discount = promo.active?.discount ?? 0;
  const totals = computeTotals(subtotal, discount, 0);
  const freeWithCode = promo.active?.freeShipping ? promo.active.outcome.code : null;
  const empty = resolved.length === 0;

  const footer = empty ? null : (
    <div className={styles.foot}>
      <p className="t-cap muted">
        {paymentPreview}
        <ProvenanceMark kind="sample" />
      </p>
      <button
        type="button"
        className="btn btn--lg btn--block"
        disabled={blocked}
        onClick={() => {
          closeDrawer();
          navigate('/checkout');
        }}
      >
        <span>
          Checkout · <span className="num">{formatMoney(totals.total)}</span>
        </span>
      </button>
      <Link to="/bag" className={`link t-small ${styles.viewBag}`} onClick={closeDrawer}>
        View bag
      </Link>
    </div>
  );

  return (
    <Dialog
      open={drawerOpen}
      onClose={closeDrawer}
      title={
        <>
          Bag (<span className="num">{count}</span>)
        </>
      }
      variant="drawer"
      className={styles.bag}
      footer={footer}
    >
      {empty ? (
        <div className={styles.emptyBody}>
          {/* Removing the last pair keeps its undo row above the empty bag. */}
          {removal.removed && <CartLines lines={resolved} removal={removal} onNavigate={closeDrawer} className={styles.lastUndo} />}
          <EmptyBag onNavigate={closeDrawer} />
        </div>
      ) : (
        <div className={styles.body}>
          <AddedLine pairs={pairs} wholeSet={wholeSet} setApplied={promo.active?.outcome.code === SET_CODE} />
          <CartLines lines={resolved} removal={removal} onNavigate={closeDrawer} className={styles.lines} />
          <div className={styles.extras}>
            <SetNudge onNavigate={closeDrawer} />
            <div className={styles.sums}>
              <DeliveryThreshold amount={subtotal - discount} freeWithCode={freeWithCode} />
              <Totals compact totals={totals} code={promo.active?.outcome.code} delivery={deliveryRow(subtotal - discount, freeWithCode)} />
              <PromoCodeForm
                outcome={promo.evaluation?.outcome ?? null}
                onApply={promo.apply}
                onRemove={promo.remove}
                offerSet={petalsColoursIn(resolved).size === 3}
                entry={false}
              />
            </div>
            {blocked && (
              <p className={`t-small ${styles.blocked}`} role="alert">
                Something in your bag needs attention before checkout.
              </p>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
}

/**
 * "Added: Petals Heels, *strawberry* · Blush Pink, EU 38", or for the set
 * "Added: Petals Heels, *all three*, EU 37 · PETALS3 applied".
 */
function AddedLine({ pairs, wholeSet, setApplied }: { pairs: AddedPair[]; wholeSet: boolean; setApplied: boolean }) {
  if (pairs.length === 0) return null;
  const sizes = new Set(pairs.map((p) => p.line.size));
  const size = sizes.size === 1 ? `EU ${pairs[0].line.size}` : '';
  const applied = setApplied ? `${SET_CODE} applied` : '';

  return (
    <p className={styles.added} role="status">
      Added:{' '}
      {wholeSet ? (
        <>
          {pairs[0].product.name}, <span className="v-0">all three</span>
          {(size || applied) && (
            <>
              ,{' '}
              <span className="nowrap">
                {size}
                {size && applied && ' · '}
                {applied}
              </span>
            </>
          )}
        </>
      ) : (
        pairs.map(({ line, product, colourway }, i) => (
          <span key={line.key}>
            {i > 0 && (i === pairs.length - 1 ? ' and ' : ', ')}
            {product.name},{' '}
            <span className="nowrap">
              {colourway.nickname && (
                <>
                  <span className="v-0">{colourway.nickname}</span> ·{' '}
                </>
              )}
              {colourway.name}
            </span>
            , EU {line.size}
          </span>
        ))
      )}
    </p>
  );
}
