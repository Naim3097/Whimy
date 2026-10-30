import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppProviders } from '../App';
import type { CartLine } from '../domain/types';
import { lineKey } from '../lib/cart';
import { createMemoryStorage, sessionStore, STORAGE_KEYS } from '../lib/storage';
import { routes } from '../routes';
import { EMPTY_DRAFT, type CheckoutDraftState } from '../state/checkout';

const variant = { productId: 'petals-heels', colourId: 'blush-pink', size: 37 as const };
const bag: CartLine[] = [{ ...variant, key: lineKey(variant), quantity: 1, addedAt: 0 }];

/** Details that pass every step, as Continue saves them (the phone in E.164). */
const passing = {
  contact: { email: 'ana@example.com', phone: '+60123456789', marketingOptIn: false },
  address: { fullName: 'Ana Lim', line1: '12 Jalan Example', line2: '', postcode: '50450', city: 'Kuala Lumpur', state: 'Kuala Lumpur', country: 'MY' as const },
  shippingMethodId: 'west-standard',
  payment: { method: 'card' as const },
};

/** Checkout with one pair in the bag and, optionally, a draft saved earlier in the session. */
async function renderCheckout(draft?: Partial<CheckoutDraftState>) {
  if (draft) sessionStore.write(STORAGE_KEYS.checkoutDraft, { ...EMPTY_DRAFT, ...draft });
  const storage = createMemoryStorage();
  storage.write(STORAGE_KEYS.cart, bag);
  const router = createMemoryRouter(routes, { initialEntries: ['/checkout'] });
  render(
    <AppProviders storage={storage}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  // The route is code-split and the bag waits for the catalogue.
  await screen.findByRole('region', { name: /^Step 1 of 4/ }, { timeout: 5000 });
}

const savedDraft = () => sessionStore.read<CheckoutDraftState | null>(STORAGE_KEYS.checkoutDraft, null);

/** A step's heading, e.g. "Step 1 of 4: Contact (completed)". jsdom drops the spaces at the hidden spans' edges. */
const stepHeading = (n: number, title: string, completed = false) =>
  screen.getByRole('heading', { name: new RegExp(`^Step ${n} of 4: ?${title}${completed ? ' ?\\(completed\\)' : ''}$`) });

/** Presses Continue and waits for the error summary to take focus. */
async function continueWithErrors(button: string) {
  await userEvent.click(screen.getByRole('button', { name: button }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
}

afterEach(() => sessionStore.remove(STORAGE_KEYS.checkoutDraft));

describe('checkout by keyboard', () => {
  it('marks the required fields and continues on Enter', async () => {
    await renderCheckout();
    const email = screen.getByLabelText('Email');
    const phone = screen.getByLabelText('Mobile number');
    expect(email).toBeRequired();
    expect(phone).toBeRequired();
    expect(screen.getByRole('checkbox', { name: /new colours/ })).not.toBeRequired();
    expect(screen.getByRole('button', { name: 'Continue to delivery' })).toHaveAttribute('type', 'submit');

    await userEvent.type(email, 'ana@example.com');
    await userEvent.type(phone, '012-345 6789{Enter}');

    await waitFor(() => expect(stepHeading(2, 'Delivery')).toHaveFocus());
    expect(stepHeading(1, 'Contact', true)).toBeInTheDocument();
    for (const label of ['State', 'Full name', 'Address', 'Postcode', 'Town or city']) expect(screen.getByLabelText(label)).toBeRequired();
    expect(screen.getByLabelText(/^Apartment/)).not.toBeRequired();
  });
});

describe('the error summary', () => {
  it('sends the delivery link to the state until there are options, then to the first option', async () => {
    await renderCheckout({ contact: passing.contact, completed: 0 });
    await continueWithErrors('Continue to payment');

    const group = document.getElementById('f-shipping');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-describedby', 'err-shipping');

    const link = () => screen.getByRole('link', { name: 'Choose a delivery option.' });
    expect(link()).toHaveAttribute('href', '#f-state');
    await userEvent.click(link());
    expect(screen.getByLabelText('State')).toHaveFocus();

    await userEvent.selectOptions(screen.getByLabelText('State'), 'Selangor');
    expect(link()).toHaveAttribute('href', '#f-shipping');
    await userEvent.click(link());
    expect(screen.getByRole('radio', { name: /^Standard delivery/ })).toHaveFocus();
  });

  it('marks the payment group invalid and links to its first option', async () => {
    await renderCheckout({ ...passing, payment: null, completed: 1 });
    await continueWithErrors('Continue to review');

    const group = document.getElementById('f-payment');
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-describedby', 'err-payment');
    await userEvent.click(screen.getByRole('link', { name: 'Choose a payment method.' }));
    expect(screen.getByRole('radio', { name: 'FPX online banking' })).toHaveFocus();
  });

  it('closes an open order summary, which would cover it on a phone', async () => {
    await renderCheckout();
    const toggle = screen.getByRole('button', { name: /order summary/ });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await continueWithErrors('Continue to delivery');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('lands a wallet with no provider (an older draft) on the payment options', async () => {
    await renderCheckout({ ...passing, payment: { method: 'ewallet' }, completed: 1 });
    await continueWithErrors('Continue to review');

    await userEvent.click(screen.getByRole('link', { name: 'Choose your e-wallet.' }));
    expect(screen.getByRole('radio', { name: 'FPX online banking' })).toHaveFocus();
  });
});

describe('a draft restored after a reload', () => {
  it('reopens a done step whose details were changed without Continue', async () => {
    await renderCheckout({ ...passing, contact: { ...passing.contact, email: 'decline.test@' }, completed: 2 });

    expect(stepHeading(1, 'Contact')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('decline.test@');
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument();
    expect(savedDraft()?.completed).toBe(-1);
  });

  it('keeps its place when every done step still passes', async () => {
    await renderCheckout({ ...passing, completed: 2 });

    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(3);
    expect(savedDraft()?.completed).toBe(2);
  });
});

describe('within one visit', () => {
  it('keeps a done step open, with its errors, when Edit would leave it half-changed', async () => {
    await renderCheckout({ ...passing, completed: 2 });
    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    const email = screen.getByLabelText('Email');
    await userEvent.clear(email);
    await userEvent.type(email, 'ana@');

    await userEvent.click(screen.getByRole('button', { name: 'Edit delivery' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
    expect(screen.getByLabelText('Email')).toHaveValue('ana@');
    expect(screen.getByRole('link', { name: /^Enter an email/ })).toBeInTheDocument();
  });

  it('never places the order from Enter on a Review checkbox', async () => {
    await renderCheckout({ ...passing, completed: 2 });
    const place = screen.getByRole('button', { name: /^Place order/ });
    expect(place).toHaveAttribute('type', 'button');
    const terms = screen.getByRole('checkbox', { name: /terms of sale/ });
    await userEvent.click(terms);
    expect(terms).toBeChecked();
    await userEvent.keyboard('{Enter}');
    expect(place).toHaveTextContent(/^Place order/);
    expect(place).not.toHaveAttribute('aria-busy', 'true');
  });

  it('goes back to Review from an edited step when the steps after it are done', async () => {
    await renderCheckout({ ...passing, completed: 2 });
    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    // The stored E.164 number, as people write it.
    expect(screen.getByLabelText('Mobile number')).toHaveValue('+60 12-345 6789');
    const email = screen.getByLabelText('Email');
    await userEvent.clear(email);
    await userEvent.type(email, 'mia@example.com');

    await userEvent.click(screen.getByRole('button', { name: 'Continue to review' }));
    await waitFor(() => expect(stepHeading(4, 'Review')).toHaveFocus());
    expect(screen.getAllByRole('button', { name: /^Edit / })).toHaveLength(3);
    expect(savedDraft()?.contact).toMatchObject({ email: 'mia@example.com', phone: '+60123456789' });
  });

  it('names the step Continue opens', async () => {
    await renderCheckout({ ...passing, completed: 2 });
    await userEvent.click(screen.getByRole('button', { name: 'Edit delivery' }));
    expect(screen.getByRole('button', { name: 'Continue to review' })).toBeInTheDocument();
    // Another region drops the delivery option, and with it every step marked done after Contact.
    await userEvent.selectOptions(screen.getByLabelText('State'), 'Sabah');
    expect(screen.getByRole('button', { name: 'Continue to payment' })).toBeInTheDocument();
  });

  it('stores the number as E.164 again when Contact is left by Edit', async () => {
    await renderCheckout({ ...passing, completed: 2 });
    await userEvent.click(screen.getByRole('button', { name: 'Edit contact' }));
    const phone = screen.getByLabelText('Mobile number');
    await userEvent.clear(phone);
    await userEvent.type(phone, '012-987 6543');

    await userEvent.click(screen.getByRole('button', { name: 'Edit payment' }));
    await waitFor(() => expect(stepHeading(3, 'Payment')).toHaveFocus());
    expect(savedDraft()?.contact.phone).toBe('+60129876543');
    expect(screen.getByText('+60 12-987 6543')).toBeInTheDocument();
  });
});

describe('the order summary', () => {
  afterEach(() => vi.restoreAllMocks());

  /** Opens the summary, then tabs through it to the first field. */
  async function tabPastOpenSummary() {
    const toggle = screen.getByRole('button', { name: /order summary/ });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Have a code?' })).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.tab();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    return toggle;
  }

  it('closes below 1024px as focus moves into the steps', async () => {
    await renderCheckout();
    expect(await tabPastOpenSummary()).toHaveAttribute('aria-expanded', 'false');
  });

  it('waits for the click when a button in the steps is pressed', async () => {
    await renderCheckout();
    const toggle = screen.getByRole('button', { name: /order summary/ });
    await userEvent.click(toggle);
    const button = screen.getByRole('button', { name: 'Continue to delivery' });

    // Closing on the press would move the button out from under the pointer before its click.
    // One session, so the release belongs to the press.
    const user = userEvent.setup();
    await user.pointer({ keys: '[MouseLeft>]', target: button });
    expect(button).toHaveFocus();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.pointer({ keys: '[/MouseLeft]', target: button });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus());
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('stays as it is from 1024px, where the panel always shows', async () => {
    // setup.ts matches no query; here the one checkout asks matches.
    const none = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({ ...none(query), matches: query === '(min-width: 1024px)' }));
    await renderCheckout();
    expect(await tabPastOpenSummary()).toHaveAttribute('aria-expanded', 'true');
  });
});
