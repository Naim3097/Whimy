import type { Product } from '../../domain/types';
import { launchCopy } from '../../lib/launch';
import { useUI } from '../../state/ui';
import { Price } from '../ui/Price';

/** A product's price with its mark, or "Price to be announced" while Whimy's launch is a waitlist. */
export function StagePrice({ product, className }: { product: Product; className?: string }) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  if (product.kind === 'whimy' && !copy.showPrice) return <span className={className}>{copy.priceLabel}</span>;
  return <Price amount={product.price.amount} provenance={product.price.provenance} className={className} />;
}
