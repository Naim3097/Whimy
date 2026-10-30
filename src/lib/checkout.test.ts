import { describe, expect, it } from 'vitest';
import { products } from '../data/mock/products';
import { shippingMethods } from '../data/mock/commerce';
import { lineKey, resolveLines } from './cart';
import { computeTotals, evaluatePromo, regionFor, shippingCost, stepAfter, stepErrors, stillCompleted, type StepDraft } from './checkout';
import type { CartLine } from '../domain/types';

const line = (colourId: string, quantity = 1): CartLine => {
  const v = { productId: 'petals-heels', colourId, size: 38 as const };
  return { ...v, key: lineKey(v), quantity, addedAt: 0 };
};

describe('delivery region', () => {
  it('routes Sabah, Sarawak and Labuan to East Malaysia and Singapore separately', () => {
    expect(regionFor({ country: 'MY', state: 'Selangor' })).toBe('west');
    expect(regionFor({ country: 'MY', state: 'Sabah' })).toBe('east');
    expect(regionFor({ country: 'MY', state: 'Labuan' })).toBe('east');
    expect(regionFor({ country: 'SG', state: '' })).toBe('singapore');
  });
});

describe('shipping cost', () => {
  const west = shippingMethods.find((m) => m.id === 'west-standard')!;
  const express = shippingMethods.find((m) => m.id === 'west-express')!;
  it('is free above the threshold and otherwise charges the rate', () => {
    expect(shippingCost(west, 14999, false)).toBe(800);
    expect(shippingCost(west, 15000, false)).toBe(0);
  });
  it('only waives standard methods for the free-shipping promo', () => {
    expect(shippingCost(west, 1000, true)).toBe(0);
    expect(shippingCost(express, 1000, true)).toBe(1500);
  });
});

describe('promo codes', () => {
  const one = resolveLines([line('rich-brown')], products);
  const all = resolveLines([line('rich-brown'), line('blush-pink'), line('sage-green')], products);

  it('rejects unknown and expired codes', () => {
    expect(evaluatePromo('nope', one, 19900).outcome.status).toBe('invalid');
    expect(evaluatePromo('oldbloom', one, 19900).outcome.status).toBe('expired');
  });

  it('applies percentage discounts case-insensitively', () => {
    const r = evaluatePromo(' lovewhimy ', one, 19900);
    expect(r.outcome.status).toBe('applied');
    expect(r.discount).toBe(1990);
  });

  it('enforces minimum subtotals', () => {
    expect(evaluatePromo('BLOOM20', one, 12000).outcome.status).toBe('ineligible');
    expect(evaluatePromo('BLOOM20', one, 19900).discount).toBe(2000);
  });

  it('requires all three Petals colourways for PETALS3', () => {
    expect(evaluatePromo('PETALS3', one, 19900).outcome.status).toBe('ineligible');
    expect(evaluatePromo('PETALS3', all, 59700).discount).toBe(8955);
  });

  it('never discounts below zero', () => {
    expect(computeTotals(1000, 5000, 800)).toEqual({ subtotal: 1000, discount: 1000, shipping: 800, total: 800 });
  });
});

describe('checkout steps', () => {
  // As Continue saves them: the phone already in E.164.
  const draft: StepDraft = {
    contact: { email: 'ana@example.com', phone: '+60123456789', marketingOptIn: false },
    address: { fullName: 'Ana Lim', line1: '12 Jalan Example', line2: '', postcode: '50450', city: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'MY' },
    shippingMethodId: 'west-standard',
    payment: { method: 'fpx', provider: 'Maybank2u' },
  };

  it('lists what stops each step', () => {
    expect([0, 1, 2].map((i) => stepErrors(i, draft))).toEqual([{}, {}, {}]);
    expect(stepErrors(0, { ...draft, contact: { ...draft.contact, email: 'ana@' } })).toEqual({ email: 'Enter an email like name@example.com.' });
    // A method saved for another region no longer serves the address.
    expect(stepErrors(1, { ...draft, shippingMethodId: 'sg-standard' })).toEqual({ shipping: 'Choose a delivery option.' });
    expect(stepErrors(2, { ...draft, payment: null })).toEqual({ payment: 'Choose a payment method.' });
    expect(stepErrors(2, { ...draft, payment: { method: 'fpx' } })).toEqual({ provider: 'Choose your bank.' });
  });

  it('stops a saved draft just before the first done step that no longer passes', () => {
    expect(stillCompleted({ ...draft, completed: 2 })).toBe(2);
    expect(stillCompleted({ ...draft, contact: { ...draft.contact, email: 'decline.test@' }, completed: 2 })).toBe(-1);
    expect(stillCompleted({ ...draft, address: { ...draft.address, postcode: '504' }, completed: 2 })).toBe(0);
    expect(stillCompleted({ ...draft, payment: { method: 'fpx' }, completed: 2 })).toBe(1);
    // Steps not yet done are left for Continue to check.
    expect(stillCompleted({ ...draft, payment: null, completed: 1 })).toBe(1);
    expect(stillCompleted({ ...draft, completed: -1 })).toBe(-1);
  });

  it('continues past the later steps that are done and still pass', () => {
    // The first time through, each step leads to the next.
    expect(stepAfter(0, { ...draft, completed: -1 })).toBe(1);
    expect(stepAfter(2, { ...draft, completed: 1 })).toBe(3);
    // Editing an earlier step with the rest done goes straight back to Review…
    expect(stepAfter(0, { ...draft, completed: 2 })).toBe(3);
    expect(stepAfter(1, { ...draft, completed: 2 })).toBe(3);
    // …unless a later step is not done, or no longer passes: that one opens.
    expect(stepAfter(0, { ...draft, completed: 1 })).toBe(2);
    expect(stepAfter(0, { ...draft, payment: { method: 'fpx' }, completed: 2 })).toBe(2);
    // The step being left is not checked here (Continue checks it first), so the button's name holds while it is filled in.
    expect(stepAfter(0, { ...draft, contact: { ...draft.contact, email: 'ana@' }, completed: 2 })).toBe(3);
  });
});
