import type { CSSProperties } from 'react';
import type { Colourway, Product } from '../../domain/types';
import type { ResolvedLine } from '../../lib/cart';
import { productPath } from '../../lib/catalog';

/** Whimy's one real product; the set nudge and the empty bag point to its colours. */
export const PETALS_ID = 'petals-heels';

/** A bag line's link: Petals under /products, a sample style under /preview/catalogue. */
export const colourHref = (product: Product, colourId: string) => productPath(product, colourId);

/** "choco", or the official name in lowercase for colours without a nickname. */
export const nicknameOf = (colourway: Colourway) => colourway.nickname ?? colourway.name.toLowerCase();

/** Fills a global `.chip` with the colourway's swatch. */
export const chipStyle = (colourway: Colourway) => ({ '--chip': colourway.swatch.base }) as CSSProperties;

/** The Petals colours in the bag that can be bought (sold-out or missing lines don't count towards the set). */
export function petalsColoursIn(lines: ResolvedLine[]): Set<string> {
  return new Set(lines.filter((l) => l.productId === PETALS_ID && l.status !== 'unavailable' && l.status !== 'missing').map((l) => l.colourId));
}
