import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { OrderTotals, PromoOutcome } from '../../domain/types';
import { SET_CODE, SET_PERCENT } from '../../data/mock/commerce';
import { formatMoney } from '../../lib/money';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './Totals.module.css';

interface TotalsProps {
  totals: OrderTotals;
  /** The code behind a discount, if one applies. */
  code?: string | null;
  /** What the delivery row says: a fee, "Free" or when it will be known. */
  delivery: ReactNode;
  /** The drawer's short form: the subtotal row only when a saving needs it. */
  compact?: boolean;
  className?: string;
}

/** Subtotal, any saving, delivery and total, tabular between hairlines. */
export function Totals({ totals, code, delivery, compact, className }: TotalsProps) {
  const saving = code === SET_CODE ? 'Bundle saving' : code ? `Saving · ${code}` : 'Saving';
  return (
    <dl className={`${styles.totals} ${className ?? ''}`}>
      {(!compact || totals.discount > 0) && (
        <div className={styles.row}>
          <dt>Subtotal</dt>
          <dd className="num">{formatMoney(totals.subtotal)}</dd>
        </div>
      )}
      {totals.discount > 0 && (
        <div className={styles.row}>
          <dt>{saving}</dt>
          <dd className="num">−{formatMoney(totals.discount)}</dd>
        </div>
      )}
      <div className={styles.row}>
        <dt>Delivery</dt>
        <dd>{delivery}</dd>
      </div>
      <div className={`${styles.row} ${styles.total}`}>
        <dt>Total</dt>
        <dd className="num">{formatMoney(totals.total)}</dd>
      </div>
    </dl>
  );
}

interface PromoFormProps {
  outcome: PromoOutcome | null;
  onApply: (code: string) => void;
  onRemove: () => void;
  /** All three Petals colours are in the bag: offer PETALS3 in one tap (never applied silently). */
  offerSet?: boolean;
  /** False in the drawer: no "Have a code?" (codes are typed on /bag and at checkout), only the offer and an applied code. */
  entry?: boolean;
}

/**
 * "Have a code?", collapsed until asked for. With all three colours in the bag
 * it first offers the set code. Focus follows the change: to the applied code's
 * Remove after applying, back to "Have a code?" (or the offer) after removing.
 */
export function PromoCodeForm({ outcome, onApply, onRemove, offerSet, entry = true }: PromoFormProps) {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const [announced, setAnnounced] = useState<string | null>(null);
  const id = useId();
  const removeRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const offerRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const pending = useRef<'apply' | 'remove' | null>(null);
  const applied = outcome?.status === 'applied' ? outcome : null;
  const error = outcome && outcome.status !== 'applied' ? outcome.message : null;

  // Runs after the render that shows the result of the shopper's own apply or remove.
  useEffect(() => {
    const action = pending.current;
    if (!action) return;
    pending.current = null;
    if (action === 'apply' && applied) {
      removeRef.current?.focus();
      setAnnounced(`${applied.code} applied.`);
    } else if (action === 'remove' && !applied) {
      (toggleRef.current ?? offerRef.current ?? boxRef.current)?.focus();
      setAnnounced('Code removed.');
    }
  });

  const apply = (value: string) => {
    pending.current = 'apply';
    setAnnounced(null);
    onApply(value);
  };

  const remove = () => {
    pending.current = 'remove';
    onRemove();
  };

  const offer = offerSet && applied?.code !== SET_CODE && (
    <p className={`t-small ${styles.offer}`}>
      <span>
        All three are in your bag:{' '}
        <span className="nowrap">
          {SET_PERCENT}% off with {SET_CODE}
          <ProvenanceMark kind="sample" />
        </span>
      </span>
      <button ref={offerRef} type="button" className={`link t-small ${styles.remove}`} onClick={() => apply(SET_CODE)}>
        {applied ? 'Use instead' : 'Apply'}
        <span className="sr-only"> {SET_CODE}</span>
      </button>
    </p>
  );

  const expanded = open || !!error;
  return (
    <div ref={boxRef} tabIndex={-1} className={styles.promo}>
      {offer}
      {applied ? (
        <p className={`t-small ${styles.applied}`}>
          <span>
            <span className={styles.code}>{applied.code}</span> ·{' '}
            <span className="nowrap">
              {applied.label}
              <ProvenanceMark kind="sample" />
            </span>
          </span>
          <button ref={removeRef} type="button" className={`link t-small ${styles.remove}`} onClick={remove}>
            Remove<span className="sr-only"> code {applied.code}</span>
          </button>
        </p>
      ) : (
        entry && (
          <>
            <button
              ref={toggleRef}
              type="button"
              className={`link t-small ${styles.toggle}`}
              aria-expanded={expanded}
              aria-controls={id}
              onClick={() => setOpen((o) => !o)}
            >
              Have a code?
            </button>
            <form
              id={id}
              hidden={!expanded}
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                apply(code);
              }}
              noValidate
            >
              <label htmlFor={`${id}-input`} className="sr-only">
                Code
              </label>
              <input
                id={`${id}-input`}
                className="input"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
              />
              <button type="submit" className="btn btn--secondary">
                Apply
              </button>
            </form>
          </>
        )
      )}
      {/* One live region in every state, so an apply, a removal or an error is announced. */}
      <div aria-live="polite">
        {error && (
          <p id={`${id}-error`} className="field-error">
            {error}
          </p>
        )}
        {!error && announced && <p className="sr-only">{announced}</p>}
      </div>
      {/* Without the form, a stored code that no longer applies needs its own way out. */}
      {!entry && error && (
        <button type="button" className={`link t-small ${styles.toggle}`} onClick={remove}>
          Remove code
        </button>
      )}
    </div>
  );
}
