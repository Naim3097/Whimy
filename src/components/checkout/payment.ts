/**
 * How payment methods are presented: one radio row per way of paying, in the
 * order Malaysian shoppers reach for them (DESIGN.md §14). E-wallets are stored
 * as method 'ewallet' with the wallet as provider, so each wallet gets its own row
 * without changing the data in data/mock/commerce.ts.
 */
import type { PaymentMethodId, PaymentSelection } from '../../domain/types';
import { site } from '../../config/site';
import { paymentOptions } from '../../data/mock/commerce';

export interface PaymentRow {
  id: string;
  label: string;
  method: PaymentMethodId;
  /** Set for e-wallet rows: the wallet is the provider. */
  provider?: string;
}

/** Provider names exactly as data/mock/commerce.ts lists them. */
const wallet = (provider: string): PaymentRow => ({ id: `ewallet:${provider}`, label: provider, method: 'ewallet', provider });

export const paymentRows: PaymentRow[] = [
  { id: 'fpx', label: 'FPX online banking', method: 'fpx' },
  { id: 'duitnow', label: 'DuitNow QR', method: 'duitnow' },
  wallet('Touch ’n Go eWallet'),
  wallet('GrabPay'),
  wallet('Boost'),
  { id: 'card', label: 'Visa / Mastercard', method: 'card' },
  ...(site.payments.atome ? [{ id: 'atome', label: 'Atome', method: 'atome' } satisfies PaymentRow] : []),
];

/** Banks offered under FPX. */
export const fpxBanks: string[] = paymentOptions.find((o) => o.id === 'fpx')?.providers ?? [];

/** The one-line payment preview under the bag totals. */
export const paymentPreview = ['FPX', 'DuitNow QR', 'e-wallets', 'cards', ...(site.payments.atome ? ['Atome'] : [])].join(' · ');

export function isRowSelected(row: PaymentRow, selection: PaymentSelection | null | undefined): boolean {
  if (!selection || selection.method !== row.method) return false;
  return row.provider == null || selection.provider === row.provider;
}

export function selectionFor(row: PaymentRow): PaymentSelection {
  return row.provider ? { method: row.method, provider: row.provider } : { method: row.method };
}

/** "FPX online banking", "GrabPay", "Visa / Mastercard". The bank is shown separately. */
export function paymentLabel(selection: PaymentSelection): string {
  if (selection.method === 'ewallet') return selection.provider ?? 'E-wallet';
  return (
    paymentRows.find((r) => r.method === selection.method)?.label ??
    paymentOptions.find((o) => o.id === selection.method)?.label ??
    selection.method
  );
}
