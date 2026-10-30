import type { Money } from '../domain/types';

const formatter = new Intl.NumberFormat('en-MY', {
  style: 'currency',
  currency: 'MYR',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
});

/** Formats sen as "RM 199.00" with a no-break space, so a price never splits (drops the trailing .00 when `compact`). */
export function formatMoney(amount: Money, opts: { compact?: boolean } = {}): string {
  const formatted = formatter.format(amount / 100).replace('MYR', 'RM').replace(/\s/g, '\u00a0');
  return opts.compact ? formatted.replace(/\.00$/, '') : formatted;
}

export function percentOf(amount: Money, percent: number): Money {
  return Math.round((amount * percent) / 100);
}

/** Splits an amount into `n` instalments; the last absorbs rounding. */
export function instalments(amount: Money, n: number): Money[] {
  const base = Math.floor(amount / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? amount - base * (n - 1) : base));
}
