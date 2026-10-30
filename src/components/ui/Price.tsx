import type { Money, Provenance } from '../../domain/types';
import { formatMoney } from '../../lib/money';
import { Mark } from './ProvenanceMark';

interface PriceProps {
  amount: Money;
  /** Required: every price says whether Whimy has confirmed it. */
  provenance: Provenance;
  /** A was-price, shown only when the price is verified. */
  compareAt?: Money;
  className?: string;
}

export function Price({ amount, provenance, compareAt, className }: PriceProps) {
  if ((import.meta.env.DEV || import.meta.env.MODE === 'test') && provenance == null) {
    throw new Error(`Price ${formatMoney(amount)} rendered without a provenance (verified, assumption or mock).`);
  }
  const reduced = provenance === 'verified' && compareAt != null && compareAt > amount;

  return (
    <span className={`num ${className ?? ''}`}>
      {reduced && <span className="sr-only">Now </span>}
      <span className="nowrap">{formatMoney(amount)}</span>
      <Mark provenance={provenance} />
      {reduced && (
        <>
          {' '}
          <span className="sr-only">, was </span>
          <s className="muted">{formatMoney(compareAt)}</s>
        </>
      )}
    </span>
  );
}
