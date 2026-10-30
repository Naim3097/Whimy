import { describe, expect, it } from 'vitest';
import { products } from '../data/mock/products';
import type { Category, ColourFamily, Colourway, Product } from '../domain/types';
import {
  applyFilters,
  cardImages,
  computeFacets,
  EMPTY_FILTERS,
  filtersFromParams,
  filtersToParams,
  productPath,
  relatedProducts,
  searchProducts,
  sortCards,
  toListingCards,
} from './catalog';

/* Test-local fixtures: Petals with a sold-out size, plus demo styles that exercise
   sold-out, multi-category and EU 41 paths the live catalogue no longer has. */
const realPetals = products.find((p) => p.id === 'petals-heels')!;
const petals: Product = {
  ...realPetals,
  colourways: realPetals.colourways.map((c) => (c.id === 'blush-pink' ? { ...c, stock: { ...c.stock, 36: 0 } } : c)),
};

function style(id: string, name: string, category: Category, family: ColourFamily, stock: Colourway['stock'], tags: string[], amount = 19900): Product {
  return {
    id,
    slug: id,
    name,
    kind: 'sample',
    collectionIds: ['samples'],
    category,
    heel: { band: 'mid', provenance: 'mock' },
    price: { amount, provenance: 'mock' },
    shortDescription: name,
    description: [],
    specs: [],
    colourways: [{ id: `${id}-colour`, name, family, swatch: { base: '#000', deep: '#000', tint: '#fff' }, images: [], stock }],
    sizes: [35, 36, 37, 38, 39, 40, 41],
    sizeProvenance: 'mock',
    tags,
    occasions: [],
    featured: false,
    releasedAt: '2026-01-01',
    seo: { title: name, description: name },
  };
}

const range = (qty: number): Colourway['stock'] => ({ 35: qty, 36: qty, 37: qty, 38: qty, 39: qty, 40: qty });
const catalog: Product[] = [
  petals,
  style('rosette-pump', 'Rosette Pump', 'pumps', 'pink', range(4), ['pump', 'pink', 'patent'], 18900),
  style('gilded-bow-slingback', 'Gilded Bow Slingback', 'slingbacks', 'metallic', range(0), ['slingback', 'gold'], 24900),
  style('teh-tarik-mule', 'Teh Tarik Mule', 'mules', 'brown', range(5), ['mule', 'tan'], 16900),
  style('radio-slingback', 'Radio Slingback', 'slingbacks', 'brown', range(3), ['slingback', 'two-tone'], 20900),
  style('ivory-vow-slingback', 'Ivory Vow Slingback', 'slingbacks', 'neutral', range(5), ['slingback', 'ivory', 'kitten heel'], 21900),
  style('cherry-bow-flat', 'Cherry Bow Flat', 'flats', 'red', { ...range(5), 41: 2 }, ['flat', 'red'], 13900),
];

describe('listing cards', () => {
  it('expands Petals Heels into one card per colourway when asked', () => {
    const petals = products.filter((p) => p.id === 'petals-heels');
    expect(toListingCards(petals)).toHaveLength(1);
    expect(toListingCards(petals, true).map((c) => c.colourway.id)).toEqual(['rich-brown', 'blush-pink', 'sage-green']);
  });

  it('puts the card image first and keeps the lead for the hover', () => {
    for (const colourway of realPetals.colourways) {
      expect(cardImages(colourway)).toEqual({ primary: colourway.cardImage, secondary: colourway.images[0] });
    }
  });

  it('gives every Petals colour a card cut from the one group photograph, so the cards share a ground', () => {
    const sources = realPetals.colourways.map((c) => c.cardImage?.credit?.url);
    expect(new Set(sources).size).toBe(1);
    expect(realPetals.colourways.every((c) => c.cardImage && c.images.includes(c.cardImage))).toBe(true);
  });

  it('links sample styles under /preview/catalogue and Petals under /products', () => {
    const sample = products.find((p) => p.kind === 'sample')!;
    expect(productPath(sample, sample.colourways[0].id)).toBe(`/preview/catalogue/${sample.slug}?colour=${sample.colourways[0].id}`);
    expect(productPath(realPetals)).toBe('/products/petals-heels');
  });
});

describe('filters', () => {
  const cards = toListingCards(catalog);

  it('only matches sizes that are actually in stock in a matching colour', () => {
    const result = applyFilters(cards, { ...EMPTY_FILTERS, colours: ['pink'], sizes: [36] });
    // Blush Pink EU 36 is sold out in the fixture, so only the Rosette Pump remains.
    expect(result.map((c) => c.product.id)).toEqual(['rosette-pump']);
  });

  it('switches a multi-colour card to the colourway that matches the colour filter', () => {
    const [card] = applyFilters(cards, { ...EMPTY_FILTERS, colours: ['green'] });
    expect(card.product.id).toBe('petals-heels');
    expect(card.colourway.id).toBe('sage-green');
  });

  it('excludes sold-out products when "in stock only" is on', () => {
    const ids = applyFilters(cards, { ...EMPTY_FILTERS, inStockOnly: true }).map((c) => c.product.id);
    expect(ids).not.toContain('gilded-bow-slingback');
  });

  it('computes facet counts with the other filters applied', () => {
    const facets = computeFacets(cards, { ...EMPTY_FILTERS, colours: ['brown'] });
    expect(facets.categories.find((f) => f.value === 'mules')?.count).toBe(1);
    expect(facets.sizes.some((f) => f.value === 41)).toBe(false);
  });

  it('round-trips filters through URL params', () => {
    const filters = { ...EMPTY_FILTERS, colours: ['pink' as const], sizes: [37 as const], inStockOnly: true };
    expect(filtersFromParams(filtersToParams(filters, new URLSearchParams()))).toEqual(filters);
  });
});

describe('sorting', () => {
  it('orders by price and keeps the real Whimy product first when featured', () => {
    const cards = toListingCards(catalog);
    const asc = sortCards(cards, 'price-asc').map((c) => c.product.price.amount);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(sortCards(cards, 'featured')[0].product.id).toBe('petals-heels');
  });
});

describe('search', () => {
  it('is case-insensitive and partial', () => {
    expect(searchProducts(catalog, 'PiNk').map((h) => h.product.id)).toEqual(expect.arrayContaining(['petals-heels', 'rosette-pump']));
    expect(searchProducts(catalog, 'sling').length).toBeGreaterThanOrEqual(4);
  });

  it('requires every word to match and returns the matching colourway', () => {
    const hits = searchProducts(catalog, 'choco kitten');
    expect(hits).toHaveLength(1);
    expect(hits[0].colourway.id).toBe('rich-brown');
  });

  it('returns nothing for blank or unmatched queries', () => {
    expect(searchProducts(catalog, '   ')).toEqual([]);
    expect(searchProducts(catalog, 'zzzz')).toEqual([]);
  });
});

describe('recommendations', () => {
  it('never recommends the current product', () => {
    expect(relatedProducts(catalog, petals).map((p) => p.id)).not.toContain('petals-heels');
  });
});
