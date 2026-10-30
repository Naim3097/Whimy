import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router';
import type { Address, ContactDetails, OrderDraft } from '../domain/types';
import { MALAYSIAN_STATES, shippingMethods } from '../data/mock/commerce';
import { usePageMeta } from '../hooks/dom';
import { getColourway } from '../lib/catalog';
import { computeTotals, regionFor, shippingCost, shippingOptionsFor, stepAfter, stepErrors, stillCompleted } from '../lib/checkout';
import { formatMoney, instalments } from '../lib/money';
import { addressLines, formatPhone, hasErrors, normalisePhone, phoneCountry, validateAddress, validateContact } from '../lib/validation';
import { OrderError, services } from '../services';
import { useCart } from '../state/cart';
import { useCatalog } from '../state/catalog';
import { useCheckoutDraft, usePromo } from '../state/checkout';
import { EmptyBag } from '../components/cart/EmptyBag';
import { LetterCard } from '../components/cart/LetterCard';
import { petalsColoursIn } from '../components/cart/petals';
import { PromoCodeForm, Totals } from '../components/cart/Totals';
import { fpxBanks, isRowSelected, paymentLabel, paymentRows, selectionFor } from '../components/checkout/payment';
import { SummaryLines } from '../components/checkout/SummaryLines';
import { toSummaryLine } from '../components/checkout/summaryLine';
import { ProvenanceMark } from '../components/ui/ProvenanceMark';
import styles from './CheckoutPage.module.css';

const STEPS = ['Contact', 'Delivery', 'Payment', 'Review'] as const;

/** The order fields appear on the page, so the error summary lists them in that order. */
const FIELD_ORDER = ['email', 'phone', 'state', 'shipping', 'fullName', 'line1', 'postcode', 'city', 'payment', 'provider', 'terms'];

const REGION_NAMES = { west: 'West Malaysia', east: 'East Malaysia', singapore: 'Singapore' } as const;

function newKey() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Moves focus to the field an error-summary link names (fieldsets focus their first control). */
function focusField(e: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id);
  const control = target?.matches('input, select, textarea') ? target : target?.querySelector<HTMLElement>('input:not(:disabled), select, textarea');
  if (!control) return;
  e.preventDefault();
  control.focus();
}

type Errors = Record<string, string>;

export function CheckoutPage() {
  usePageMeta('Checkout');
  const cart = useCart();
  const { productById } = useCatalog();
  const { draft, setDraft, reset } = useCheckoutDraft();
  const promo = usePromo(cart.resolved, cart.subtotal);
  const navigate = useNavigate();
  // A done step can be edited and the page reloaded without Continue: on arrival,
  // progress stops before the first saved step that no longer passes, and it opens.
  const [arrived] = useState(() => stillCompleted(draft));
  const [step, setStep] = useState(() => Math.min(arrived + 1, STEPS.length - 1));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code: OrderError['code'] | 'unknown'; message: string } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const idempotencyKey = useRef(newKey());
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const summaryRef = useRef<HTMLDivElement>(null);

  const region = regionFor(draft.address);
  const methods = shippingOptionsFor(region);
  const method = shippingMethods.find((m) => m.id === draft.shippingMethodId && m.region === region);
  const discount = promo.active?.discount ?? 0;
  const shipping = method ? shippingCost(method, cart.subtotal - discount, Boolean(promo.active?.freeShipping)) : 0;
  const totals = computeTotals(cart.subtotal, discount, shipping);

  // The saved draft agrees before the steps first paint, so none shows as done in passing.
  useLayoutEffect(() => {
    if (arrived < draft.completed) setDraft({ completed: arrived });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, for the draft as it arrived
  }, []);

  // A changed address can invalidate the chosen shipping method. Lowered from the
  // latest draft, so it never undoes the check on arrival above.
  useEffect(() => {
    if (draft.shippingMethodId && !method) setDraft((d) => ({ shippingMethodId: null, completed: Math.min(d.completed, 0) }));
  }, [draft.shippingMethodId, method, setDraft]);

  const focusStep = (i: number) => requestAnimationFrame(() => headingRefs.current[i]?.focus());

  const showErrors = (next: Errors) => {
    setErrors(next);
    if (!Object.keys(next).length) return;
    // Below 1024 an open order summary would cover them (from 1024 the panel shows either way).
    setSummaryOpen(false);
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  /**
   * Below 1024 nothing in the steps needs the order summary open over them, so
   * focus moving in closes it, and at once: a scroll that brings the focused
   * element into view is then worked out with the panel gone. A pointer press
   * on a link, button or option is left alone, as its click is still to come:
   * closing first would move the control out from under the pointer.
   */
  const closeSummaryOnFocus = (e: FocusEvent) => {
    if (!summaryOpen || e.target.matches(':is(a, button, select, [type=checkbox], [type=radio]):not(:focus-visible)')) return;
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    flushSync(() => setSummaryOpen(false));
  };

  /**
   * Errors are found on Continue, then drop away live as each field is put
   * right; a field still wrong keeps its message until the next Continue.
   */
  const settle = (found: Errors, keys: string[]) =>
    setErrors((current) => {
      const fixed = keys.filter((k) => k in current && !found[k]);
      if (fixed.length === 0) return current;
      const next = { ...current };
      for (const k of fixed) delete next[k];
      return next;
    });
  const clear = (...keys: string[]) => settle({}, keys);

  const validateStep = (i: number): Errors => {
    if (i < STEPS.length - 1) return stepErrors(i, draft);
    return termsAccepted ? {} : { terms: 'Please agree to the terms of sale to place your order.' };
  };

  // Stored as E.164, in the country the number itself names (a Singapore shopper may not have chosen Singapore delivery yet).
  const storedPhone = () => normalisePhone(draft.contact.phone, phoneCountry(draft.contact.phone, draft.address.country));

  /**
   * Every change of step comes through here. Contact reopens with its stored
   * number written as people write it, and stores it as E.164 again however
   * it is left: by Continue or by another step's Edit.
   */
  const openStep = (i: number) => {
    if (step === 0 && i !== 0) setDraft({ contact: { ...draft.contact, phone: storedPhone() } });
    if (i === 0 && step !== 0) setDraft((d) => ({ contact: { ...d.contact, phone: formatPhone(d.contact.phone) } }));
    setStep(i);
  };

  /** Where Continue on a step goes: past later steps that are done and still pass, so an edit usually returns to Review. */
  const continueTo = (i: number) => Math.min(stepAfter(i, draft), STEPS.length - 1);

  const next = () => {
    const found = validateStep(step);
    if (hasErrors(found)) return showErrors(found);
    setErrors({});
    setDraft((d) => ({ completed: Math.max(d.completed, step) }));
    const to = continueTo(step);
    openStep(to);
    focusStep(to);
  };

  const edit = (i: number) => {
    // Leaving a done step mid-edit would keep it marked done over data that no longer passes:
    // it is checked first, as Continue checks it, and keeps the shopper (and its errors) if not.
    if (step <= draft.completed && i !== step) {
      const found = validateStep(step);
      if (hasErrors(found)) return showErrors(found);
    }
    setErrors({});
    setSubmitError(null);
    openStep(i);
    focusStep(i);
  };

  const lines = useMemo(
    () =>
      cart.resolved
        .filter((l) => l.product && l.status !== 'unavailable' && l.status !== 'missing')
        .map((l) => {
          const colourway = getColourway(l.product!, l.colourId)!;
          return {
            productId: l.productId,
            colourId: l.colourId,
            size: l.size,
            name: l.product!.name,
            colourName: colourway.name,
            unitPrice: l.unitPrice,
            quantity: Math.min(l.quantity, l.available),
            image: colourway.images[0],
          };
        }),
    [cart.resolved],
  );

  const placeOrder = async () => {
    if (submitting) return;
    for (let i = 0; i < STEPS.length; i++) {
      const found = validateStep(i);
      if (hasErrors(found)) {
        if (i !== step) openStep(i);
        showErrors(found);
        return;
      }
    }
    if (!method || !draft.payment) return;
    setSubmitting(true);
    setSubmitError(null);
    const order: OrderDraft = {
      lines,
      // As Continue stores it: a reload with Contact open keeps the number as it was shown there.
      contact: { ...draft.contact, phone: storedPhone() },
      address: draft.address,
      shippingMethodId: method.id,
      payment: draft.payment,
      promoCode: promo.active?.outcome.code,
      giftNote: draft.giftNote.trim() || undefined,
      totals,
      idempotencyKey: idempotencyKey.current,
    };
    try {
      const placed = await services.orders.submitOrder(order);
      cart.clear();
      promo.remove();
      reset();
      navigate(`/order/${placed.reference}`, { replace: true });
    } catch (e) {
      // A failed attempt may be retried with a fresh key.
      idempotencyKey.current = newKey();
      setSubmitError(e instanceof OrderError ? { code: e.code, message: e.message } : { code: 'unknown', message: 'Something went wrong while placing the order. Please try again.' });
      setSubmitting(false);
    }
  };

  if (!cart.ready) {
    return (
      <div className={`wrap--checkout ${styles.page}`}>
        <div className={`skeleton ${styles.loading}`} aria-busy="true" aria-label="Loading checkout" />
      </div>
    );
  }

  if (cart.resolved.length === 0 && !submitting) {
    return (
      <div className={`wrap--checkout ${styles.page}`}>
        <h1 className={`t-title ${styles.title}`}>Checkout</h1>
        <EmptyBag />
      </div>
    );
  }

  const field = (name: string) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  });
  const err = (name: string) =>
    errors[name] ? (
      <p id={`err-${name}`} className="field-error">
        {errors[name]}
      </p>
    ) : null;

  const setContact = (patch: Partial<ContactDetails>) => {
    setDraft((d) => ({ contact: { ...d.contact, ...patch } }));
    settle(validateContact({ ...draft.contact, ...patch }, draft.address.country) as Errors, Object.keys(patch));
  };
  const setAddress = (patch: Partial<Address>) => {
    setDraft((d) => ({ address: { ...d.address, ...patch } }));
    // A new country changes which state and postcode are valid.
    const keys = 'country' in patch ? [...Object.keys(patch), 'state', 'postcode'] : Object.keys(patch);
    settle(validateAddress({ ...draft.address, ...patch }) as Errors, keys);
  };

  const needsState = draft.address.country === 'MY' && !draft.address.state;

  /** Where a summary link sends focus: always a control that is on the page. */
  const targetOf = (key: string) => {
    // There are no delivery options to choose until a state is chosen.
    if (key === 'shipping' && needsState) return 'f-state';
    // Only FPX has a bank select; each wallet is its own row.
    if (key === 'provider' && draft.payment?.method !== 'fpx') return 'f-payment';
    return `f-${key}`;
  };

  const errorEntries = Object.entries(errors).sort(([a], [b]) => {
    const rank = (k: string) => (FIELD_ORDER.includes(k) ? FIELD_ORDER.indexOf(k) : FIELD_ORDER.length);
    return rank(a) - rank(b);
  });
  const errorSummary = errorEntries.length > 0 && (
    <div ref={summaryRef} tabIndex={-1} className={styles.problem} role="alert">
      <p>{errorEntries.length === 1 ? 'Check this field:' : `Check these ${errorEntries.length} fields:`}</p>
      <ul role="list">
        {errorEntries.map(([k, v]) => (
          <li key={k}>
            <a href={`#${targetOf(k)}`} className="link" onClick={(e) => focusField(e, targetOf(k))}>
              {v}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  const stepShell = (i: number, summary: ReactNode, content: ReactNode) => {
    const title = STEPS[i];
    const state = i === step ? 'current' : i <= draft.completed ? 'done' : 'todo';
    return (
      <section className={styles.step} data-state={state} aria-labelledby={`step-${i}`}>
        <div className={styles.stepHead}>
          <h2 id={`step-${i}`} ref={(el) => void (headingRefs.current[i] = el)} tabIndex={-1} className={styles.stepTitle}>
            <span className={styles.stepNo} aria-hidden="true">
              {i + 1}
            </span>
            <span className="sr-only">
              Step {i + 1} of {STEPS.length}:{' '}
            </span>
            {title}
            {state === 'done' && <span className="sr-only"> (completed)</span>}
          </h2>
          {state === 'done' && (
            <button type="button" className={`link t-small ${styles.edit}`} onClick={() => edit(i)} aria-label={`Edit ${title.toLowerCase()}`}>
              Edit
            </button>
          )}
        </div>
        {state === 'done' && summary && <div className={styles.stepSummary}>{summary}</div>}
        {/* A form per step, so Enter in a field does what the step's button does. Our own
            checks and error summary stand in for the browser's bubbles. Review is not a form:
            Enter on its checkboxes (which browsers treat as submitting) must never place the order. */}
        {state === 'current' &&
          (i < STEPS.length - 1 ? (
            <form
              className={styles.stepBody}
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                next();
              }}
            >
              {errorSummary}
              {content}
              <div className={styles.stepActions}>
                <button type="submit" className={`btn btn--lg ${styles.continue}`}>
                  Continue to {STEPS[continueTo(i)].toLowerCase()}
                </button>
              </div>
            </form>
          ) : (
            <div className={styles.stepBody}>
              {errorSummary}
              {content}
            </div>
          ))}
      </section>
    );
  };

  const shippingText = (cost: number) => (cost === 0 ? 'Free' : formatMoney(cost));

  return (
    <div className={`wrap--checkout ${styles.page}`}>
      <header className={styles.head}>
        <h1 className="t-title">Checkout</h1>
        <p className={`t-small ${styles.preview}`}>Preview checkout. No payment is taken.</p>
      </header>

      <div className={`grid ${styles.layout}`}>
        <aside className={styles.summary} data-open={summaryOpen || undefined} aria-labelledby="co-summary">
          <button type="button" className={styles.toggle} aria-expanded={summaryOpen} aria-controls="co-summary-panel" onClick={() => setSummaryOpen((o) => !o)}>
            <span>{summaryOpen ? 'Hide' : 'Show'} order summary</span>
            <span className="num">{formatMoney(totals.total)}</span>
          </button>
          <div id="co-summary-panel" className={styles.panel}>
            <h2 id="co-summary" className={`t-ui ${styles.summaryTitle}`}>
              Order summary
            </h2>
            {cart.blocked && (
              <p className={`t-small ${styles.blocked}`}>
                Something in your bag is unavailable.{' '}
                <Link to="/bag" className="link">
                  Review your bag
                </Link>
              </p>
            )}
            <SummaryLines lines={lines.map((l) => toSummaryLine(l, productById(l.productId)))} />
            <PromoCodeForm
              outcome={promo.evaluation?.outcome ?? null}
              onApply={promo.apply}
              onRemove={promo.remove}
              offerSet={petalsColoursIn(cart.resolved).size === 3}
            />
            <Totals totals={totals} code={promo.active?.outcome.code} delivery={method ? shippingText(shipping) : <span className="muted">Next step</span>} />
          </div>
        </aside>

        <div className={styles.steps} onFocus={closeSummaryOnFocus}>
          {stepShell(
            0,
            <>
              <p>{draft.contact.email}</p>
              <p className="num">{formatPhone(draft.contact.phone)}</p>
            </>,
            <div className={styles.fields}>
              <p className="field-hint">Guest checkout. No account needed.</p>
              <div className="field">
                <label htmlFor="f-email" className="field-label">
                  Email
                </label>
                <input
                  id="f-email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={draft.contact.email}
                  onChange={(e) => setContact({ email: e.target.value })}
                  aria-required="true"
                  {...field('email')}
                />
                {err('email')}
              </div>
              <div className="field">
                <label htmlFor="f-phone" className="field-label">
                  Mobile number
                </label>
                <input
                  id="f-phone"
                  className="input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={draft.contact.phone}
                  onChange={(e) => setContact({ phone: e.target.value })}
                  aria-required="true"
                  aria-invalid={errors.phone ? true : undefined}
                  aria-describedby={errors.phone ? 'phone-hint err-phone' : 'phone-hint'}
                />
                <p className="field-hint" id="phone-hint">
                  For delivery updates, e.g. 012-345 6789 or +65 8123 4567
                </p>
                {err('phone')}
              </div>
              <label className="check">
                <input type="checkbox" checked={draft.contact.marketingOptIn} onChange={(e) => setContact({ marketingOptIn: e.target.checked })} />
                <span>Email me about new colours and restocks.</span>
              </label>
            </div>,
          )}

          {stepShell(
            1,
            <>
              <p>{addressLines(draft.address).join(', ')}</p>
              {method && (
                <p>
                  {method.label} · {method.eta} · <span className="num">{shippingText(shipping)}</span>
                </p>
              )}
            </>,
            <div className={styles.fields}>
              <div className={styles.pair}>
                <div className="field">
                  <label htmlFor="f-country" className="field-label">
                    Country
                  </label>
                  <select
                    id="f-country"
                    className="select"
                    value={draft.address.country}
                    onChange={(e) => setAddress({ country: e.target.value as Address['country'], state: '' })}
                    autoComplete="country"
                  >
                    <option value="MY">Malaysia</option>
                    <option value="SG">Singapore</option>
                  </select>
                </div>
                {draft.address.country === 'MY' && (
                  <div className="field">
                    <label htmlFor="f-state" className="field-label">
                      State
                    </label>
                    <select
                      id="f-state"
                      className="select"
                      value={draft.address.state}
                      onChange={(e) => setAddress({ state: e.target.value })}
                      autoComplete="address-level1"
                      aria-required="true"
                      {...field('state')}
                    >
                      <option value="">Choose…</option>
                      {MALAYSIAN_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {err('state')}
                  </div>
                )}
              </div>

              <fieldset id="f-shipping" {...field('shipping')}>
                <legend className={`field-label ${styles.legend}`}>
                  {needsState ? 'Delivery options' : `Delivery to ${REGION_NAMES[region]}`}
                  <ProvenanceMark kind="sample" />
                </legend>
                {needsState ? (
                  <p className="field-hint">Choose your state to see delivery options and fees.</p>
                ) : (
                  <div className={styles.options}>
                    {methods.map((m) => {
                      const cost = shippingCost(m, cart.subtotal - discount, Boolean(promo.active?.freeShipping));
                      return (
                        <label key={m.id} className="radio-row">
                          <input
                            type="radio"
                            name="shipping"
                            checked={draft.shippingMethodId === m.id}
                            onChange={() => {
                              setDraft({ shippingMethodId: m.id });
                              clear('shipping');
                            }}
                          />
                          <span className={styles.optionText}>
                            <span>{m.label}</span>
                            <span className="t-small muted">
                              {m.carrier} · {m.eta}
                              {m.freeFrom && cost !== 0 ? ` · free from ${formatMoney(m.freeFrom, { compact: true })}` : ''}
                            </span>
                          </span>
                          <span className={`num ${styles.optionPrice}`}>{shippingText(cost)}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
                {err('shipping')}
              </fieldset>

              <div className="field">
                <label htmlFor="f-fullName" className="field-label">
                  Full name
                </label>
                <input
                  id="f-fullName"
                  className="input"
                  autoComplete="name"
                  value={draft.address.fullName}
                  onChange={(e) => setAddress({ fullName: e.target.value })}
                  aria-required="true"
                  {...field('fullName')}
                />
                {err('fullName')}
              </div>
              <div className="field">
                <label htmlFor="f-line1" className="field-label">
                  Address
                </label>
                <input
                  id="f-line1"
                  className="input"
                  autoComplete="address-line1"
                  value={draft.address.line1}
                  onChange={(e) => setAddress({ line1: e.target.value })}
                  aria-required="true"
                  {...field('line1')}
                />
                {err('line1')}
              </div>
              <div className="field">
                <label htmlFor="f-line2" className="field-label">
                  Apartment, unit or building <span className="muted">(optional)</span>
                </label>
                <input id="f-line2" className="input" autoComplete="address-line2" value={draft.address.line2 ?? ''} onChange={(e) => setAddress({ line2: e.target.value })} />
              </div>
              <div className={styles.pair}>
                <div className="field">
                  <label htmlFor="f-postcode" className="field-label">
                    Postcode
                  </label>
                  <input
                    id="f-postcode"
                    className="input"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={draft.address.postcode}
                    onChange={(e) => setAddress({ postcode: e.target.value })}
                    aria-required="true"
                    {...field('postcode')}
                  />
                  {err('postcode')}
                </div>
                <div className="field">
                  <label htmlFor="f-city" className="field-label">
                    Town or city
                  </label>
                  <input
                    id="f-city"
                    className="input"
                    autoComplete="address-level2"
                    value={draft.address.city}
                    onChange={(e) => setAddress({ city: e.target.value })}
                    aria-required="true"
                    {...field('city')}
                  />
                  {err('city')}
                </div>
              </div>
            </div>,
          )}

          {stepShell(
            2,
            draft.payment && (
              <>
                <p>{paymentLabel(draft.payment)}</p>
                {draft.payment.method === 'fpx' && draft.payment.provider && <p>{draft.payment.provider}</p>}
              </>
            ),
            <div className={styles.fields}>
              <fieldset id="f-payment" {...field('payment')}>
                <legend className={`field-label ${styles.legend}`}>
                  Pay with
                  <ProvenanceMark kind="sample" />
                </legend>
                <div className={styles.options}>
                  {paymentRows.map((row) => (
                    <Fragment key={row.id}>
                      <label className="radio-row">
                        <input
                          type="radio"
                          name="payment"
                          checked={isRowSelected(row, draft.payment)}
                          onChange={() => {
                            setDraft({ payment: selectionFor(row) });
                            clear('payment', 'provider');
                          }}
                        />
                        <span className={styles.optionText}>
                          <span>{row.label}</span>
                          {row.method === 'atome' && (
                            <span className="t-small muted">
                              3 instalments of <span className="num">{formatMoney(instalments(totals.total, 3)[0])}</span>
                            </span>
                          )}
                        </span>
                      </label>
                      {row.method === 'fpx' && draft.payment?.method === 'fpx' && (
                        <div className={`field ${styles.inline}`}>
                          <label htmlFor="f-provider" className="field-label">
                            Your bank
                          </label>
                          <select
                            id="f-provider"
                            className="select"
                            value={draft.payment.provider ?? ''}
                            onChange={(e) => {
                              setDraft((d) => ({ payment: { method: d.payment!.method, provider: e.target.value || undefined } }));
                              if (e.target.value) clear('provider');
                            }}
                            aria-required="true"
                            {...field('provider')}
                          >
                            <option value="">Choose…</option>
                            {fpxBanks.map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                          {err('provider')}
                        </div>
                      )}
                    </Fragment>
                  ))}
                </div>
                {err('payment')}
              </fieldset>
            </div>,
          )}

          {stepShell(
            3,
            null,
            <div className={styles.fields}>
              <LetterReview note={draft.giftNote} onChange={(giftNote) => setDraft({ giftNote })} />
              {submitError && (
                <div className={styles.problem} role="alert">
                  <p>{submitError.code === 'payment-declined' ? 'The payment was declined. Choose another way to pay and try again.' : submitError.message}</p>
                  {submitError.code === 'payment-declined' && (
                    <button type="button" className="link" onClick={() => edit(2)}>
                      Change payment method
                    </button>
                  )}
                  {submitError.code === 'out-of-stock' && (
                    <Link to="/bag" className="link">
                      Review your bag
                    </Link>
                  )}
                </div>
              )}
              <div>
                <label className="check" id="f-terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      if (e.target.checked) clear('terms');
                    }}
                    aria-required="true"
                    {...field('terms')}
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" target="_blank" className="link">
                      terms of sale<span className="sr-only"> (opens in a new tab)</span>
                    </Link>{' '}
                    and the{' '}
                    <Link to="/privacy" target="_blank" className="link">
                      privacy notice<span className="sr-only"> (opens in a new tab)</span>
                    </Link>
                    .
                  </span>
                </label>
                {err('terms')}
              </div>
              <div className={styles.place}>
                {/* aria-disabled, not disabled: a disabled button drops keyboard focus to the page.
                    placeOrder ignores a second press while one is under way. */}
                <button type="button" className="btn btn--lg btn--block" onClick={placeOrder} aria-disabled={submitting || undefined} aria-busy={submitting}>
                  {submitting ? (
                    'Placing order…'
                  ) : (
                    <span>
                      Place order · <span className="num">{formatMoney(totals.total)}</span>
                    </span>
                  )}
                </button>
                <p className="t-small muted">Preview only. Nothing is charged.</p>
              </div>
            </div>,
          )}
        </div>
      </div>
    </div>
  );
}

/** The letter card at review: echoed in Fell Roman once written, otherwise offered. */
function LetterReview({ note, onChange }: { note: string; onChange: (note: string) => void }) {
  const written = (value: string) => value.trim() !== '' && value.trim() !== 'Dear';
  const [editing, setEditing] = useState(() => !written(note));

  if (!editing && written(note)) {
    return (
      <div className={styles.letterEcho}>
        <p className="field-label">
          Your letter card
          <ProvenanceMark kind="tbc" />
        </p>
        <p className={`letter ${styles.letterText}`}>{note}</p>
        <button type="button" className={`link t-small ${styles.edit}`} onClick={() => setEditing(true)}>
          Edit letter
        </button>
      </div>
    );
  }
  return <LetterCard note={note} onChange={onChange} />;
}
