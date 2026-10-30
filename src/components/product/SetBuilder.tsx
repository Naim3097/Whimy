import { useId, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import type { Colourway, Product, Size } from '../../domain/types';
import { SET_CODE, SET_PERCENT, setPrice } from '../../data/mock/commerce';
import { sizeStock } from '../../lib/catalog';
import { launchCopy } from '../../lib/launch';
import { formatMoney } from '../../lib/money';
import { useCart } from '../../state/cart';
import { useUI } from '../../state/ui';
import { Dialog } from '../ui/Dialog';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './SetBuilder.module.css';

const chipStyle = (c: Colourway) => ({ '--chip': c.swatch.base }) as CSSProperties;
const nickname = (c: Colourway) => c.nickname ?? c.name.toLowerCase();

/** "RM 507.45 with PETALS3 sample", or the waitlist's price label. */
export function SetPrice({ product }: { product: Product }) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  if (!copy.showPrice) return <span className="muted">{copy.priceLabel}</span>;
  return (
    <span>
      <span className="num">{formatMoney(setPrice(product))}</span> with {SET_CODE}
      <ProvenanceMark kind="sample" />
    </span>
  );
}

interface SetRowProps {
  product: Product;
  buttonLabel?: string;
  /** "all three: choco, strawberry, kiwi". Off where a heading above already names the set. */
  showName?: boolean;
  /** Anchor for links to the set (the footer's and menu's "all three"). */
  id?: string;
}

/**
 * The set, as one hairline row: three chips, "all three: choco, strawberry,
 * kiwi", the PETALS3 price and a secondary button that opens the set builder.
 */
export function SetRow({ product, buttonLabel = 'Add the set', showName = true, id }: SetRowProps) {
  const [open, setOpen] = useState(false);
  const { launchStage } = useUI();
  const canBuy = launchCopy(launchStage).showPrice;

  return (
    <div id={id} className={styles.frame}>
      <div className={styles.row}>
        <span className={styles.chips} aria-hidden="true">
          {product.colourways.map((c) => (
            <span key={c.id} className="chip" style={chipStyle(c)} />
          ))}
        </span>
        {showName && (
          <p className={styles.name}>
            <span className="v-0">all three</span>: {product.colourways.map(nickname).join(', ')}
          </p>
        )}
        <p className={styles.price}>
          <SetPrice product={product} />
        </p>
        {canBuy && (
          <>
            <button type="button" className={`btn btn--secondary ${styles.action}`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
              {buttonLabel}
            </button>
            <SetBuilderDialog product={product} open={open} onClose={() => setOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * One size per colour, and the add: every colour needs a size; a size already
 * chosen elsewhere (e.g. on the PDP) is preselected where it is in stock.
 * `add` returns true when at least one pair went into the bag.
 */
function useSetSizes(product: Product, initialSize?: Size | null) {
  const cart = useCart();
  const { notify } = useUI();
  const [picked, setPicked] = useState<Record<string, Size>>({});
  const [missing, setMissing] = useState<string[]>([]);

  const sizeFor = (c: Colourway): Size | null =>
    picked[c.id] ?? (initialSize != null && sizeStock(c, initialSize) > 0 ? initialSize : null);

  const pick = (colourId: string, size: Size) => {
    setPicked((p) => ({ ...p, [colourId]: size }));
    setMissing((m) => m.filter((id) => id !== colourId));
  };

  const add = (form: HTMLFormElement | null): boolean => {
    const unsized = product.colourways.filter((c) => !sizeFor(c)).map((c) => c.id);
    if (unsized.length) {
      setMissing(unsized);
      form?.querySelector<HTMLInputElement>(`[data-colour="${unsized[0]}"] input:not(:disabled)`)?.focus();
      return false;
    }
    const failed = product.colourways.filter((c) => !cart.add({ productId: product.id, colourId: c.id, size: sizeFor(c)! }, 1).ok);
    if (failed.length === product.colourways.length) {
      notify({ tone: 'error', message: 'None of the three could be added in those sizes. Try another size.' });
      return false;
    }
    if (failed.length) {
      notify({ tone: 'error', message: `${failed.map((c) => c.name).join(' and ')} couldn’t be added in that size.` });
    }
    return true;
  };

  return { sizeFor, pick, missing, add };
}

interface SetFieldsProps {
  product: Product;
  /** Prefix for the radio groups' names and the error ids. */
  name: string;
  sizeFor: (c: Colourway) => Size | null;
  pick: (colourId: string, size: Size) => void;
  missing: string[];
}

/**
 * One fieldset per colour: chip, *nickname* · Official Name, then the size
 * squares. Narrow (phones, the drawer) the label sits above squares that share
 * the width; from 480px the label sits beside six 48px squares.
 */
function SetFields({ product, name, sizeFor, pick, missing }: SetFieldsProps) {
  return (
    <div className={styles.fields}>
      {product.colourways.map((c) => {
        const chosen = sizeFor(c);
        const errorId = `${name}-${c.id}-error`;
        const isMissing = missing.includes(c.id);
        return (
          <fieldset
            key={c.id}
            className={styles.colour}
            data-colour={c.id}
            aria-describedby={isMissing ? errorId : undefined}
            aria-invalid={isMissing ? true : undefined}
          >
            <legend className="sr-only">
              {nickname(c)}, {c.name}: size (EU)
            </legend>
            <p className={styles.legend} aria-hidden="true">
              <span className="chip" style={chipStyle(c)} />
              <span className="v-0">{nickname(c)}</span>
              <span className="t-small muted">· {c.name}</span>
            </p>
            <div className={styles.sizes} style={{ '--count': product.sizes.length } as CSSProperties}>
              {product.sizes.map((size) => {
                const out = sizeStock(c, size) <= 0;
                return (
                  <label key={size} className={styles.size} data-out={out || undefined}>
                    <input
                      type="radio"
                      className="sr-only"
                      name={`${name}-${c.id}`}
                      value={size}
                      checked={chosen === size}
                      disabled={out}
                      onChange={() => pick(c.id, size)}
                    />
                    <span aria-hidden="true">{size}</span>
                    <span className="sr-only">
                      EU {size}
                      {out ? ', sold out' : ''}
                    </span>
                  </label>
                );
              })}
            </div>
            {isMissing && (
              <p id={errorId} className={`field-error ${styles.error}`}>
                Choose a size
              </p>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}

interface SetBuilderDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  /** A size already chosen elsewhere (e.g. on the PDP), preselected where it is available. */
  initialSize?: Size | null;
}

/** One size row per colour; adds one pair of each to the bag. */
export function SetBuilderDialog({ product, open, onClose, initialSize }: SetBuilderDialogProps) {
  const cart = useCart();
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const { sizeFor, pick, missing, add } = useSetSizes(product, initialSize);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!add(formRef.current)) return;
    onClose();
    cart.openDrawer();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Build your set"
      variant="drawer"
      footer={
        <div className={styles.foot}>
          <p className={styles.total}>
            <span>All three</span>
            <SetPrice product={product} />
          </p>
          <button type="submit" form={formId} className="btn btn--lg btn--block">
            Add all three to bag
          </button>
        </div>
      }
    >
      <form id={formId} ref={formRef} className={styles.body} onSubmit={submit} noValidate>
        <p className="t-small muted">
          One pair in each colour, each in its own size. Enter {SET_CODE} at checkout for {SET_PERCENT}% off a bag with all three colours
          <ProvenanceMark kind="sample" />.
        </p>
        <SetFields product={product} name={formId} sizeFor={sizeFor} pick={pick} missing={missing} />
      </form>
    </Dialog>
  );
}
