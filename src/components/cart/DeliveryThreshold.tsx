import type { ReactNode } from 'react';
import type { Money } from '../../domain/types';
import { shippingMethods } from '../../data/mock/commerce';
import { formatMoney } from '../../lib/money';
import { ProvenanceMark } from '../ui/ProvenanceMark';

const standard = shippingMethods.find((m) => m.id === 'west-standard');
const threshold = standard?.freeFrom;
const cheapest = Math.min(...shippingMethods.map((m) => m.price));

/**
 * What the bag's Delivery row says before an address exists. Free delivery is
 * said once, here: "Free" with a free-delivery code (the applied code names it),
 * "Free in West Malaysia" once the threshold is met, otherwise "From RM 8.00".
 */
export function deliveryRow(amount: Money, freeWithCode?: string | null): ReactNode {
  if (freeWithCode) return 'Free';
  if (threshold != null && amount >= threshold) {
    return (
      <span className="nowrap">
        Free in West Malaysia
        <ProvenanceMark kind="sample" />
      </span>
    );
  }
  return (
    <span className="nowrap">
      From <span className="num">{formatMoney(cheapest)}</span>
      <ProvenanceMark kind="sample" />
    </span>
  );
}

/**
 * The free-delivery threshold as one line of text (no meter), shown only while
 * it is still to reach. Once it is met, or a code makes delivery free, the
 * Delivery row says so instead.
 */
export function DeliveryThreshold({ amount, freeWithCode, className }: { amount: Money; freeWithCode?: string | null; className?: string }) {
  if (freeWithCode || threshold == null || amount >= threshold) return null;
  return (
    <p className={`t-small ${className ?? ''}`}>
      <span className="num">{formatMoney(threshold - amount)}</span> away from free West Malaysia{' '}
      <span className="nowrap">
        delivery
        <ProvenanceMark kind="sample" />
      </span>
    </p>
  );
}
