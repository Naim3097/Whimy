/**
 * Pure checkout rules: delivery region, shipping options, promo codes, totals
 * and what each step needs before it counts as done.
 */
import type { Address, ContactDetails, Money, OrderTotals, PaymentSelection, PromoOutcome, ShippingMethod, ShippingRegion } from '../domain/types';
import { EAST_MALAYSIA_STATES, paymentOptions, promoRules, shippingMethods } from '../data/mock/commerce';
import type { ResolvedLine } from './cart';
import { formatMoney, percentOf } from './money';
import { hasErrors, validateAddress, validateContact } from './validation';

export function regionFor(address: Pick<Address, 'country' | 'state'>): ShippingRegion {
  if (address.country === 'SG') return 'singapore';
  return EAST_MALAYSIA_STATES.has(address.state) ? 'east' : 'west';
}

export function shippingOptionsFor(region: ShippingRegion): ShippingMethod[] {
  return shippingMethods.filter((m) => m.region === region);
}

export function shippingCost(method: ShippingMethod | undefined, discountedSubtotal: Money, freeShipping: boolean): Money {
  if (!method) return 0;
  if (freeShipping && method.id.endsWith('standard')) return 0;
  if (method.freeFrom != null && discountedSubtotal >= method.freeFrom) return 0;
  return method.price;
}

export interface PromoEvaluation {
  outcome: PromoOutcome;
  discount: Money;
  freeShipping: boolean;
}

export function evaluatePromo(rawCode: string, lines: ResolvedLine[], subtotal: Money): PromoEvaluation {
  const code = rawCode.trim().toUpperCase();
  const rule = promoRules.find((r) => r.code === code);
  const none = { discount: 0, freeShipping: false };
  if (!code) return { outcome: { status: 'invalid', code, message: 'Enter a promo code.' }, ...none };
  if (!rule) return { outcome: { status: 'invalid', code, message: `“${code}” isn’t a valid code.` }, ...none };
  if (rule.expired) return { outcome: { status: 'expired', code, message: `“${code}” has expired.` }, ...none };
  if (rule.minSubtotal && subtotal < rule.minSubtotal) {
    return {
      outcome: { status: 'ineligible', code, message: `Add ${formatMoney(rule.minSubtotal - subtotal)} more to use ${code}.` },
      ...none,
    };
  }
  if (rule.minPetalsPairs) {
    const petalsColours = new Set(lines.filter((l) => l.productId === 'petals-heels' && l.status !== 'unavailable').map((l) => l.colourId));
    if (petalsColours.size < rule.minPetalsPairs) {
      return { outcome: { status: 'ineligible', code, message: `${code} needs all three Petals colours in your bag.` }, ...none };
    }
  }
  const outcome: PromoOutcome = { status: 'applied', code, label: rule.label };
  if (rule.kind === 'free-shipping') return { outcome, discount: 0, freeShipping: true };
  const discount = rule.kind === 'percent' ? percentOf(subtotal, rule.value) : Math.min(rule.value, subtotal);
  return { outcome, discount, freeShipping: false };
}

export function computeTotals(subtotal: Money, discount: Money, shipping: Money): OrderTotals {
  const safeDiscount = Math.min(discount, subtotal);
  return { subtotal, discount: safeDiscount, shipping, total: subtotal - safeDiscount + shipping };
}

/** Lowest standard rate for a region, used for "estimated shipping" before an address exists. */
export function estimateShipping(region: ShippingRegion, discountedSubtotal: Money): Money {
  const standard = shippingOptionsFor(region).find((m) => m.id.endsWith('standard'));
  return shippingCost(standard, discountedSubtotal, false);
}

/** The draft fields the Contact, Delivery and Payment steps check. */
export interface StepDraft {
  contact: ContactDetails;
  address: Address;
  shippingMethodId: string | null;
  payment: PaymentSelection | null;
}

/** A message per field, keyed as the checkout's error summary lists them. */
export type StepErrors = Record<string, string>;

/**
 * What stops Contact (0), Delivery (1) or Payment (2) from counting as done.
 * Review's one check, the terms, stays on the page beside its checkbox.
 */
export function stepErrors(step: number, draft: StepDraft): StepErrors {
  if (step === 0) return validateContact(draft.contact, draft.address.country) as StepErrors;
  if (step === 1) {
    const found = validateAddress(draft.address) as StepErrors;
    const region = regionFor(draft.address);
    const served = shippingMethods.some((m) => m.id === draft.shippingMethodId && m.region === region);
    return served ? found : { ...found, shipping: 'Choose a delivery option.' };
  }
  if (step === 2) {
    if (!draft.payment) return { payment: 'Choose a payment method.' };
    const option = paymentOptions.find((o) => o.id === draft.payment?.method);
    if (option?.providers && !draft.payment.provider) return { provider: draft.payment.method === 'fpx' ? 'Choose your bank.' : 'Choose your e-wallet.' };
  }
  return {};
}

/**
 * How far a saved draft really got. A done step can be edited and the page
 * reloaded without Continue, so each one is checked again: progress stops
 * just before the first that no longer passes.
 */
export function stillCompleted(draft: StepDraft & { completed: number }): number {
  for (let i = 0; i <= draft.completed; i++) {
    if (hasErrors(stepErrors(i, draft))) return i - 1;
  }
  return draft.completed;
}

/**
 * Where Continue on a step leads once it passes: the first step after it that
 * is not both done and still passing. Editing Contact with Delivery and
 * Payment done goes straight back to Review, not through each of them again.
 */
export function stepAfter(step: number, draft: StepDraft & { completed: number }): number {
  const completed = Math.max(draft.completed, step);
  for (let i = step + 1; i <= completed; i++) {
    if (hasErrors(stepErrors(i, draft))) return i;
  }
  return completed + 1;
}
