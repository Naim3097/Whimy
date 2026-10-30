import { useId, useRef, useState, type CSSProperties, type FormEvent, type RefObject } from 'react';
import type { Colourway, Provenance, Size } from '../../domain/types';
import { sizeStock } from '../../lib/catalog';
import { isValidEmail } from '../../lib/validation';
import { services } from '../../services';
import { Mark } from '../ui/ProvenanceMark';
import styles from './SizeSelector.module.css';

interface Props {
  sizes: Size[];
  colourway: Colourway;
  selected: Size | null;
  onChange: (size: Size) => void;
  onOpenGuide?: () => void;
  error?: string;
  /** Provenance of the size range and stock: adds the sample or tbc mark after "Size (EU)". */
  provenance?: Provenance;
  /** Older callers: the same as `provenance="assumption"`. */
  provisional?: boolean;
  /** Product name. When given, unavailable sizes offer an inline "Notify me" email field. */
  notifyFor?: string;
}

const list = (sizes: Size[], word: 'and' | 'or') => sizes.map((s) => `EU ${s}`).join(` ${word} `);

/**
 * Size picker modelled per colourway: availability changes with the selected
 * colour. Native radios keep arrow keys and screen-reader semantics. Unavailable
 * sizes are struck through; "Notify me" below the row takes their email. Stock
 * counts are never shown (DESIGN.md: no scarcity copy).
 */
export function SizeSelector({ sizes, colourway, selected, onChange, onOpenGuide, error, provenance, provisional, notifyFor }: Props) {
  const name = useId();
  const errorId = `${name}-error`;
  const rangeProvenance = provenance ?? (provisional ? 'assumption' : undefined);
  const out = sizes.filter((s) => sizeStock(colourway, s) <= 0);
  const [notifySizes, setNotifySizes] = useState<Size[] | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const openNotify = (only?: Size) => {
    setNotifySizes(only ? [only] : out);
    requestAnimationFrame(() => emailRef.current?.focus());
  };
  const notifying = notifySizes?.filter((s) => out.includes(s)) ?? [];

  return (
    <>
      <fieldset className={styles.group} aria-describedby={error ? errorId : undefined} aria-invalid={error ? true : undefined}>
        <legend className={styles.legend}>
          Size (EU)
          <Mark provenance={rangeProvenance} />
        </legend>
        {onOpenGuide && (
          <button type="button" className={`link ${styles.guide}`} aria-haspopup="dialog" onClick={onOpenGuide}>
            Size guide
          </button>
        )}
        <div className={styles.grid} style={{ '--sizes': sizes.length } as CSSProperties}>
          {sizes.map((size) => {
            const unavailable = sizeStock(colourway, size) <= 0;
            return (
              <label
                key={size}
                className={styles.size}
                data-out={unavailable || undefined}
                data-notify={unavailable && notifyFor ? '' : undefined}
                // A disabled radio ignores clicks; on a struck size a click opens Notify me instead.
                onClick={unavailable && notifyFor ? () => openNotify(size) : undefined}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={name}
                  value={size}
                  checked={selected === size}
                  disabled={unavailable}
                  onChange={() => onChange(size)}
                />
                <span aria-hidden="true">{size}</span>
                <span className="sr-only">
                  EU {size}
                  {unavailable ? ', sold out' : ''}
                </span>
              </label>
            );
          })}
        </div>
        {error && (
          <p id={errorId} className={`field-error ${styles.message}`}>
            {error}
          </p>
        )}
      </fieldset>

      {notifyFor && out.length > 0 && (
        <div className={styles.notify}>
          <p className="t-small muted">
            {list(out, 'and')} {out.length > 1 ? 'are' : 'is'} unavailable in {colourway.name}.{' '}
            {!notifying.length && (
              <button type="button" className="link" onClick={() => openNotify()}>
                Notify me
              </button>
            )}
          </p>
          {notifying.length > 0 && (
            <NotifyForm
              key={`${colourway.id}-${notifying.join('-')}`}
              productName={notifyFor}
              colourway={colourway}
              sizes={notifying}
              inputRef={emailRef}
            />
          )}
        </div>
      )}
    </>
  );
}

interface NotifyFormProps {
  productName: string;
  colourway: Colourway;
  sizes: Size[];
  inputRef: RefObject<HTMLInputElement | null>;
}

function NotifyForm({ productName, colourway, sizes, inputRef }: NotifyFormProps) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const what = `${list(sizes, 'or')} in ${colourway.name}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError(email.trim() ? 'Enter an email like name@example.com.' : 'Enter your email address.');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setState('sending');
    try {
      await services.newsletter.subscribe({ email, interest: `restock: ${productName}, ${what}` });
      setState('done');
    } catch {
      setState('idle');
      setError('That didn’t go through. Please try again.');
    }
  };

  if (state === 'done') {
    return (
      <p className={`t-small ${styles.done}`} role="status">
        Thanks. We’ll email you if {what} comes back.
      </p>
    );
  }

  return (
    <form className={`field ${styles.notifyForm}`} onSubmit={submit} noValidate>
      <label className="field-label" htmlFor={id}>
        Email me if {what} comes back
      </label>
      <div className={styles.notifyRow}>
        <input
          ref={inputRef}
          id={id}
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button type="submit" className="btn btn--secondary" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Notify me'}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </form>
  );
}
