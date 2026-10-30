import type { ImageSource, Money, OrderLine, Product, Provenance } from '../../domain/types';
import { getColourway } from '../../lib/catalog';

export interface SummaryLineData {
  key: string;
  name: string;
  nickname?: string;
  colourName: string;
  swatch?: string;
  size: number;
  quantity: number;
  amount: Money;
  provenance: Provenance;
  image?: ImageSource;
}

/** An order line plus what the catalogue knows about its colour and price. */
export function toSummaryLine(line: OrderLine, product: Product | undefined): SummaryLineData {
  const colourway = product ? getColourway(product, line.colourId) : undefined;
  return {
    key: `${line.productId}:${line.colourId}:${line.size}`,
    name: line.name,
    nickname: colourway?.nickname,
    colourName: line.colourName,
    swatch: colourway?.swatch.base,
    size: line.size,
    quantity: line.quantity,
    amount: line.unitPrice * line.quantity,
    // Every price in this catalogue is unconfirmed; assume so if the product has gone.
    provenance: product?.price.provenance ?? 'mock',
    image: line.image,
  };
}
