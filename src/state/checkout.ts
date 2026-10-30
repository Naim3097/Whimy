import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import type { Address, ContactDetails, PaymentSelection } from '../domain/types';
import { evaluatePromo, type PromoEvaluation } from '../lib/checkout';
import type { ResolvedLine } from '../lib/cart';
import { sessionStore, STORAGE_KEYS } from '../lib/storage';

/** Checkout progress survives a refresh (sessionStorage) but not a new session. */
export interface CheckoutDraftState {
  contact: ContactDetails;
  address: Address;
  shippingMethodId: string | null;
  payment: PaymentSelection | null;
  promoCode: string | null;
  giftNote: string;
  /** Highest step the shopper has completed (0-based). */
  completed: number;
}

export const EMPTY_DRAFT: CheckoutDraftState = {
  contact: { email: '', phone: '', marketingOptIn: false },
  address: { fullName: '', line1: '', line2: '', postcode: '', city: '', state: '', country: 'MY' },
  shippingMethodId: null,
  payment: null,
  promoCode: null,
  giftNote: '',
  completed: -1,
};

const readDraft = () => sessionStore.read<Partial<CheckoutDraftState>>(STORAGE_KEYS.checkoutDraft, {});

export function useCheckoutDraft() {
  const [draft, setDraftState] = useState<CheckoutDraftState>(() => ({ ...EMPTY_DRAFT, ...readDraft() }));

  const setDraft = useCallback((update: Partial<CheckoutDraftState> | ((d: CheckoutDraftState) => Partial<CheckoutDraftState>)) => {
    setDraftState((prev) => {
      const patch = typeof update === 'function' ? update(prev) : update;
      // The promo code is owned by the promo store below; keep whatever it last stored.
      const next = { ...prev, ...patch, promoCode: 'promoCode' in patch ? (patch.promoCode ?? null) : (readDraft().promoCode ?? null) };
      sessionStore.write(STORAGE_KEYS.checkoutDraft, next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    sessionStore.remove(STORAGE_KEYS.checkoutDraft);
    setDraftState(EMPTY_DRAFT);
    notifyPromo();
  }, []);

  return { draft, setDraft, reset };
}

/*
 * The applied promo code, one store for every view: the bag drawer, /bag and
 * checkout all read it, so a code applied in one shows in the others at once.
 * It lives in the checkout draft (`promoCode`), which the order picks up.
 */
const promoListeners = new Set<() => void>();

function notifyPromo() {
  promoListeners.forEach((listener) => listener());
}

function subscribePromo(listener: () => void) {
  promoListeners.add(listener);
  return () => {
    promoListeners.delete(listener);
  };
}

const getPromoCode = () => readDraft().promoCode ?? null;

/**
 * Stores a code without checking it against the bag, for flows that are about
 * to fill the bag themselves: the set builder calls `rememberPromoCode(SET_CODE)`
 * after adding all three, and every bag view then shows the saving. If the bag
 * turns out not to qualify, the code shows its usual "needs all three" message.
 */
export function rememberPromoCode(code: string | null) {
  sessionStore.write(STORAGE_KEYS.checkoutDraft, { ...EMPTY_DRAFT, ...readDraft(), promoCode: code ? code.trim().toUpperCase() : null });
  notifyPromo();
}

/** Promo code shared between the bag drawer, the bag page and checkout. */
export function usePromo(lines: ResolvedLine[], subtotal: number) {
  const code = useSyncExternalStore(subscribePromo, getPromoCode, () => null);
  // A rejected attempt is local to the form it was typed in.
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);

  const evaluation: PromoEvaluation | null = useMemo(() => {
    const target = lastAttempt ?? code;
    return target ? evaluatePromo(target, lines, subtotal) : null;
  }, [code, lastAttempt, lines, subtotal]);

  const apply = (raw: string) => {
    const result = evaluatePromo(raw, lines, subtotal);
    if (result.outcome.status === 'applied') {
      setLastAttempt(null);
      rememberPromoCode(result.outcome.code);
    } else {
      setLastAttempt(raw);
    }
  };

  const remove = () => {
    setLastAttempt(null);
    rememberPromoCode(null);
  };

  // An applied code can become ineligible (e.g. items removed) — surface that.
  const active = evaluation?.outcome.status === 'applied' ? evaluation : null;
  return { evaluation, active, apply, remove, code };
}
