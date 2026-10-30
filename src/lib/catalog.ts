/**
 * Pure catalogue logic: availability, collection membership, filtering,
 * sorting and search. No React, no I/O — easy to unit test and to reuse
 * server-side once a real backend exists.
 */
import type { Category, Collection, ColourFamily, Colourway, HeelBand, ImageSource, Product, Size } from '../domain/types';

export const LOW_STOCK_THRESHOLD = 3;

export type StockState = 'in' | 'low' | 'out';

/**
 * Where a product lives: Petals at /products/:slug, a sample style at
 * /preview/catalogue/:slug (the only address its stock photograph may appear).
 */
export function productPath(product: Pick<Product, 'slug' | 'kind'>, colourId?: string | null): string {
  const base = product.kind === 'sample' ? '/preview/catalogue' : '/products';
  return `${base}/${product.slug}${colourId ? `?colour=${colourId}` : ''}`;
}

/**
 * A card's two photographs: the colourway's `cardImage` (else its lead), then
 * the next distinct image, which only a hover reveals.
 */
export function cardImages(colourway: Colourway): { primary?: ImageSource; secondary?: ImageSource } {
  const primary = colourway.cardImage ?? colourway.images[0];
  return { primary, secondary: colourway.images.find((image) => image !== primary) };
}

export function getColourway(product: Product, colourId?: string | null): Colourway | undefined {
  return product.colourways.find((c) => c.id === colourId);
}

export function sizeStock(colourway: Colourway, size: Size): number {
  return colourway.stock[size] ?? 0;
}

export function stockState(colourway: Colourway, size: Size): StockState {
  const qty = sizeStock(colourway, size);
  if (qty <= 0) return 'out';
  return qty <= LOW_STOCK_THRESHOLD ? 'low' : 'in';
}

export function isColourwayAvailable(colourway: Colourway): boolean {
  return Object.values(colourway.stock).some((q) => (q ?? 0) > 0);
}

export function isProductAvailable(product: Product): boolean {
  return product.colourways.some(isColourwayAvailable);
}

/** First in-stock colourway, falling back to the first one. */
export function defaultColourway(product: Product): Colourway {
  return product.colourways.find(isColourwayAvailable) ?? product.colourways[0];
}

export function productInCollection(product: Product, collection: Collection): boolean {
  const { match } = collection;
  if (match.all) return true;
  if (match.collectionId && product.collectionIds.includes(match.collectionId)) return true;
  if (match.categories && match.categories.includes(product.category)) return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* Listing cards                                                       */
/* ------------------------------------------------------------------ */

/** What a product grid renders: a product, shown in a specific colourway. */
export interface ListingCard {
  key: string;
  product: Product;
  colourway: Colourway;
  /** True when the collection expands colourways into separate cards. */
  colourLocked: boolean;
}

export function toListingCards(products: Product[], expandColourways = false): ListingCard[] {
  return products.flatMap((product): ListingCard[] =>
    expandColourways && product.colourways.length > 1
      ? product.colourways.map((colourway) => ({ key: `${product.id}:${colourway.id}`, product, colourway, colourLocked: true }))
      : [{ key: product.id, product, colourway: defaultColourway(product), colourLocked: false }],
  );
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export type PriceBand = 'under-180' | '180-220' | 'over-220';
export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

export interface CatalogFilters {
  colours: ColourFamily[];
  sizes: Size[];
  categories: Category[];
  heels: HeelBand[];
  price: PriceBand[];
  inStockOnly: boolean;
}

export const EMPTY_FILTERS: CatalogFilters = { colours: [], sizes: [], categories: [], heels: [], price: [], inStockOnly: false };

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name A–Z' },
];

export const COLOUR_FAMILY_LABELS: Record<ColourFamily, string> = {
  brown: 'Brown',
  pink: 'Pink',
  green: 'Green',
  purple: 'Purple',
  red: 'Red',
  yellow: 'Yellow',
  black: 'Black',
  neutral: 'Neutral',
  metallic: 'Metallic',
  blue: 'Blue',
};

export const COLOUR_FAMILY_SWATCH: Record<ColourFamily, string> = {
  brown: '#744630',
  pink: '#F1C2C5',
  green: '#B4BC80',
  purple: '#C9B3D6',
  red: '#A8322D',
  yellow: '#E9CF7A',
  black: '#1F1C1A',
  neutral: '#E6D9C6',
  metallic: '#C9C9CF',
  blue: '#9FD8CF',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  slingbacks: 'Slingbacks',
  pumps: 'Pumps',
  mules: 'Mules',
  flats: 'Flats',
  strappy: 'Strappy heels',
};

/** Band names only: Petals Heels' exact height is still to be confirmed, so no centimetres here. */
export const HEEL_LABELS: Record<HeelBand, string> = {
  flat: 'Flat',
  kitten: 'Kitten heel',
  mid: 'Mid heel',
  high: 'High heel',
};

export const PRICE_LABELS: Record<PriceBand, string> = {
  'under-180': 'Under RM180',
  '180-220': 'RM180 – RM220',
  'over-220': 'Over RM220',
};

const ALL_SIZES: Size[] = [35, 36, 37, 38, 39, 40, 41];

function priceBand(amount: number): PriceBand {
  if (amount < 18000) return 'under-180';
  if (amount <= 22000) return '180-220';
  return 'over-220';
}

function colourwaysMatching(card: ListingCard, filters: CatalogFilters): Colourway[] {
  const candidates = card.colourLocked ? [card.colourway] : card.product.colourways;
  return candidates.filter((c) => {
    if (filters.colours.length && !filters.colours.includes(c.family)) return false;
    if (filters.sizes.length && !filters.sizes.some((s) => sizeStock(c, s) > 0)) return false;
    if (filters.inStockOnly && !isColourwayAvailable(c)) return false;
    return true;
  });
}

/**
 * Applies filters. When a colour filter narrows a multi-colour product, the
 * card switches to the first matching colourway so the image matches the filter.
 */
export function applyFilters(cards: ListingCard[], filters: CatalogFilters): ListingCard[] {
  const out: ListingCard[] = [];
  for (const card of cards) {
    const { product } = card;
    if (filters.categories.length && !filters.categories.includes(product.category)) continue;
    if (filters.heels.length && !filters.heels.includes(product.heel.band)) continue;
    if (filters.price.length && !filters.price.includes(priceBand(product.price.amount))) continue;
    const matching = colourwaysMatching(card, filters);
    if (!matching.length) continue;
    const colourway = matching.includes(card.colourway) ? card.colourway : matching[0];
    out.push({ ...card, colourway });
  }
  return out;
}

export function sortCards(cards: ListingCard[], sort: SortKey): ListingCard[] {
  const sorted = [...cards];
  const byFeatured = (a: ListingCard, b: ListingCard) =>
    Number(b.product.kind === 'whimy') - Number(a.product.kind === 'whimy') ||
    Number(b.product.featured) - Number(a.product.featured) ||
    Number(isColourwayAvailable(b.colourway)) - Number(isColourwayAvailable(a.colourway)) ||
    b.product.releasedAt.localeCompare(a.product.releasedAt);
  switch (sort) {
    case 'newest':
      return sorted.sort((a, b) => b.product.releasedAt.localeCompare(a.product.releasedAt) || byFeatured(a, b));
    case 'price-asc':
      return sorted.sort((a, b) => a.product.price.amount - b.product.price.amount || a.product.name.localeCompare(b.product.name));
    case 'price-desc':
      return sorted.sort((a, b) => b.product.price.amount - a.product.price.amount || a.product.name.localeCompare(b.product.name));
    case 'name':
      return sorted.sort((a, b) => a.product.name.localeCompare(b.product.name) || a.colourway.name.localeCompare(b.colourway.name));
    default:
      return sorted.sort(byFeatured);
  }
}

export interface FacetOption<T extends string | number> {
  value: T;
  label: string;
  count: number;
}

export interface Facets {
  colours: FacetOption<ColourFamily>[];
  sizes: FacetOption<Size>[];
  categories: FacetOption<Category>[];
  heels: FacetOption<HeelBand>[];
  price: FacetOption<PriceBand>[];
}

/** Counts for each option, computed with every *other* facet applied. */
export function computeFacets(cards: ListingCard[], filters: CatalogFilters): Facets {
  const without = <K extends keyof CatalogFilters>(key: K) => applyFilters(cards, { ...filters, [key]: Array.isArray(filters[key]) ? [] : filters[key] });
  const count = <T extends string | number>(pool: ListingCard[], options: T[], test: (c: ListingCard, v: T) => boolean, label: (v: T) => string) =>
    options.map((value) => ({ value, label: label(value), count: pool.filter((c) => test(c, value)).length })).filter((o) => o.count > 0);

  const colourPool = without('colours');
  const sizePool = without('sizes');
  const categoryPool = without('categories');
  const heelPool = without('heels');
  const pricePool = without('price');
  return {
    colours: count(colourPool, Object.keys(COLOUR_FAMILY_LABELS) as ColourFamily[], (c, v) => (c.colourLocked ? [c.colourway] : c.product.colourways).some((cw) => cw.family === v), (v) => COLOUR_FAMILY_LABELS[v]),
    sizes: count(sizePool, ALL_SIZES, (c, v) => (c.colourLocked ? [c.colourway] : c.product.colourways).some((cw) => sizeStock(cw, v) > 0), (v) => `EU ${v}`),
    categories: count(categoryPool, Object.keys(CATEGORY_LABELS) as Category[], (c, v) => c.product.category === v, (v) => CATEGORY_LABELS[v]),
    heels: count(heelPool, Object.keys(HEEL_LABELS) as HeelBand[], (c, v) => c.product.heel.band === v, (v) => HEEL_LABELS[v]),
    price: count(pricePool, Object.keys(PRICE_LABELS) as PriceBand[], (c, v) => priceBand(c.product.price.amount) === v, (v) => PRICE_LABELS[v]),
  };
}

export function activeFilterCount(filters: CatalogFilters): number {
  return filters.colours.length + filters.sizes.length + filters.categories.length + filters.heels.length + filters.price.length + (filters.inStockOnly ? 1 : 0);
}

/* URL <-> filters ---------------------------------------------------- */

const list = (params: URLSearchParams, key: string) => params.get(key)?.split(',').filter(Boolean) ?? [];

export function filtersFromParams(params: URLSearchParams): CatalogFilters {
  return {
    colours: list(params, 'colour').filter((v): v is ColourFamily => v in COLOUR_FAMILY_LABELS),
    sizes: list(params, 'size').map(Number).filter((v): v is Size => (ALL_SIZES as number[]).includes(v)),
    categories: list(params, 'style').filter((v): v is Category => v in CATEGORY_LABELS),
    heels: list(params, 'heel').filter((v): v is HeelBand => v in HEEL_LABELS),
    price: list(params, 'price').filter((v): v is PriceBand => v in PRICE_LABELS),
    inStockOnly: params.get('instock') === '1',
  };
}

export function filtersToParams(filters: CatalogFilters, base: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(base);
  const setList = (key: string, values: (string | number)[]) => (values.length ? next.set(key, values.join(',')) : next.delete(key));
  setList('colour', filters.colours);
  setList('size', filters.sizes);
  setList('style', filters.categories);
  setList('heel', filters.heels);
  setList('price', filters.price);
  if (filters.inStockOnly) next.set('instock', '1');
  else next.delete('instock');
  next.delete('page');
  return next;
}

export function sortFromParams(params: URLSearchParams): SortKey {
  const value = params.get('sort');
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as SortKey) : 'featured';
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

export interface SearchHit {
  product: Product;
  colourway: Colourway;
  score: number;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ');
}

/**
 * Case-insensitive, partial, multi-word search. Every query token must match
 * somewhere; matches in the name/colour score higher than tags/description.
 */
export function searchProducts(products: Product[], query: string): SearchHit[] {
  const tokens = normalise(query).split(/\s+/).filter((t) => t.length > 0);
  if (!tokens.length) return [];
  const hits: SearchHit[] = [];
  for (const product of products) {
    const productText = {
      name: normalise(product.name),
      meta: normalise([CATEGORY_LABELS[product.category], product.heel.band, ...product.tags, ...product.occasions].join(' ')),
      body: normalise([product.shortDescription, ...product.description].join(' ')),
    };
    let best: SearchHit | null = null;
    for (const colourway of product.colourways) {
      const colourText = normalise(`${colourway.name} ${colourway.nickname ?? ''} ${COLOUR_FAMILY_LABELS[colourway.family]}`);
      let score = 0;
      let allMatched = true;
      for (const token of tokens) {
        if (productText.name.includes(token)) score += productText.name.split(/\s+/).some((w) => w.startsWith(token)) ? 6 : 4;
        else if (colourText.includes(token)) score += 5;
        else if (productText.meta.includes(token)) score += 3;
        else if (productText.body.includes(token)) score += 1;
        else {
          allMatched = false;
          break;
        }
      }
      if (!allMatched) continue;
      if (product.kind === 'whimy') score += 0.5;
      if (!best || score > best.score) best = { product, colourway, score };
    }
    if (best) hits.push(best);
  }
  return hits.sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name));
}

/** Related products: same category or shared tags, preferring available Whimy pieces. */
export function relatedProducts(all: Product[], product: Product, limit = 4): Product[] {
  return all
    .filter((p) => p.id !== product.id)
    .map((p) => ({
      p,
      score:
        (p.category === product.category ? 3 : 0) +
        p.tags.filter((t) => product.tags.includes(t)).length +
        p.occasions.filter((o) => product.occasions.includes(o)).length * 0.5 +
        (isProductAvailable(p) ? 1 : -2),
    }))
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .slice(0, limit)
    .map((x) => x.p);
}
