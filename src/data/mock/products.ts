/**
 * Catalogue data.
 *
 * - `petals-heels` is Whimy's real (and only) product. Facts come from
 *   Whimy-Research-Report.md; anything Whimy has not published (price, sizes,
 *   heel height, stock) carries an `assumption` or `mock` provenance.
 *   Stock is neutral (every size available) until Whimy shares real numbers;
 *   sold-out paths are covered by test fixtures.
 * - Every `kind: 'sample'` product is a demo listing for /preview/catalogue,
 *   chosen so it cannot be mistaken for Petals. None is a Whimy product.
 */
import type { Colourway, Product, ProductSpec, Size } from '../../domain/types';
import { sampleImages as s, whimyImages as w } from '../assets';

const SIZES: Size[] = [35, 36, 37, 38, 39, 40];

/** Every size available. Real stock levels are not published. */
const neutralStock = (): Colourway['stock'] => Object.fromEntries(SIZES.map((size) => [size, 10]));

const sampleSpecs = (rows: [string, string][]): ProductSpec[] =>
  rows.map(([label, value]) => ({ label, value, provenance: 'mock' as const }));

const sampleSeo = (name: string) => ({
  title: `${name} (sample)`,
  description: 'A sample style that shows how the Whimy catalogue will browse.',
});

export const products: Product[] = [
  {
    id: 'petals-heels',
    slug: 'petals-heels',
    name: 'Petals Heels',
    kind: 'whimy',
    // 'all' marks real Whimy products for the Shop all collection; sample styles never carry it.
    collectionIds: ['petals', 'all'],
    category: 'slingbacks',
    heel: { band: 'kitten', provenance: 'assumption' },
    price: { amount: 19900, provenance: 'mock' },
    shortDescription: 'A pointed satin slingback on a kitten heel, finished with a layered organza flower at the toe.',
    description: [
      'A pointed satin slingback on a kitten heel, finished with a layered organza flower at the toe.',
      'In Rich Brown (choco), Blush Pink (strawberry) and Sage Green (kiwi).',
    ],
    specs: [
      { label: 'Upper', value: 'Satin', provenance: 'verified' },
      { label: 'Toe', value: 'Pointed', provenance: 'verified' },
      { label: 'Fastening', value: 'Slingback strap, silver-tone pin buckle', provenance: 'verified' },
      { label: 'Flower', value: 'Layered organza', provenance: 'verified' },
      { label: 'Footbed', value: 'Printed “whimy”', provenance: 'verified' },
      { label: 'Heel', value: 'Kitten heel, exact height', provenance: 'assumption' },
      { label: 'Sizes', value: 'EU 35–40', provenance: 'assumption' },
      { label: 'Lining & outsole', value: 'Materials', provenance: 'assumption' },
      { label: 'Based in', value: 'Kuala Lumpur, Malaysia', provenance: 'verified' },
    ],
    colourways: [
      {
        id: 'rich-brown',
        name: 'Rich Brown',
        nickname: 'choco',
        family: 'brown',
        swatch: { base: '#744630', deep: '#3E2316', tint: '#EFE3D9' },
        // A lead, then two of the colour's own frames; every colour has the same count.
        images: [w.brownSkyLegs, w.brownScalePlay, w.chocoGrass],
        // Cards and tiles use the three crops of the group photograph: one light, one ground.
        cardImage: w.chocoGrass,
        stock: neutralStock(),
        note: {
          text: 'it seems like our rich brown has been the main character (so far) — OBSESSED! is an understatement.',
          provenance: 'verified',
          sourceUrl: 'https://www.instagram.com/whimy.official/p/De84331h-nT/',
        },
        badges: ['fan-favourite'],
      },
      {
        id: 'blush-pink',
        name: 'Blush Pink',
        nickname: 'strawberry',
        family: 'pink',
        swatch: { base: '#F1C2C5', deep: '#9A3F50', tint: '#FBEAEB' },
        images: [w.pinkReveal, w.strawberrySky, w.strawberryGrass],
        cardImage: w.strawberryGrass,
        stock: neutralStock(),
        note: {
          text: 'at the end of the day, every girl needs a hint of pink in her wardrobe.',
          provenance: 'verified',
          sourceUrl: 'https://www.instagram.com/whimy.official/p/De9NB7nBX2t/',
        },
        badges: ['new'],
      },
      {
        id: 'sage-green',
        name: 'Sage Green',
        nickname: 'kiwi',
        family: 'green',
        swatch: { base: '#B4BC80', deep: '#535A2B', tint: '#EEF0DD' },
        images: [w.greenScalePlay, w.kiwiGiant, w.kiwiGrass],
        cardImage: w.kiwiGrass,
        stock: neutralStock(),
        note: {
          text: 'Effortlessly chic, beautifully understated, and made to turn heads with every step.',
          provenance: 'verified',
          sourceUrl: 'https://www.instagram.com/whimy.official/p/De_zrsfhksk/',
        },
        badges: ['new'],
      },
    ],
    sizes: SIZES,
    sizeProvenance: 'assumption',
    tags: ['petals', 'satin', 'slingback', 'kitten heel', 'flower', 'organza', 'pointed', 'choco', 'strawberry', 'kiwi'],
    occasions: ['Office', 'Brunch', 'Kenduri & weddings', 'Date night'],
    featured: true,
    // All three colours were first shown together on 27 Oct (verified).
    releasedAt: '2026-10-27',
    seo: {
      title: 'Petals Heels: satin slingback kitten heels | Whimy',
      description: 'Pointed satin slingbacks with a layered organza flower, in Rich Brown, Blush Pink and Sage Green. From Whimy, based in Kuala Lumpur.',
    },
  },

  /* ---------------------------- Sample listings ---------------------------- */
  // Each name and description says only what its photograph shows (DESIGN.md §5).
  {
    id: 'cross-strap-block-heel',
    slug: 'cross-strap-block-heel',
    name: 'Cross-strap block heel',
    kind: 'sample',
    collectionIds: ['samples'],
    category: 'pumps',
    heel: { band: 'mid', heightCm: 6, provenance: 'mock' },
    price: { amount: 16900, provenance: 'mock' },
    shortDescription: 'A black cross-strap shoe on a woven block heel.',
    description: [
      'A sample style, not a Whimy product.',
      'A black cross-strap shoe with an ankle buckle, on a block heel wrapped in a black-and-white woven pattern.',
    ],
    specs: sampleSpecs([['Upper', 'Leather-look'], ['Heel', '6 cm block, woven'], ['Toe', 'Round'], ['Fastening', 'Ankle buckle']]),
    colourways: [
      {
        id: 'black',
        name: 'Black',
        family: 'black',
        swatch: { base: '#1F1C1A', deep: '#1F1C1A', tint: '#E9E6E1' },
        images: [s.crossStrapBlockHeel],
        stock: { 35: 4, 36: 6, 37: 8, 38: 7, 39: 5, 40: 3 },
      },
    ],
    sizes: SIZES,
    sizeProvenance: 'mock',
    tags: ['block heel', 'black', 'cross strap', 'woven', 'ankle strap'],
    occasions: ['Office', 'Weekend'],
    featured: true,
    releasedAt: '2026-09-28',
    seo: sampleSeo('Cross-strap block heel'),
  },
  {
    id: 'strappy-sandal',
    slug: 'strappy-sandal',
    name: 'Strappy sandal',
    kind: 'sample',
    collectionIds: ['samples'],
    category: 'strappy',
    heel: { band: 'high', heightCm: 10, provenance: 'mock' },
    price: { amount: 17900, provenance: 'mock' },
    shortDescription: 'A black patent sandal with three thin straps on a slim high heel.',
    description: ['A sample style, not a Whimy product.', 'A black patent sandal with three thin straps and a back zip, on a slim high heel.'],
    specs: sampleSpecs([['Upper', 'Patent leather-look'], ['Heel', '10 cm stiletto'], ['Toe', 'Open'], ['Fastening', 'Back zip']]),
    colourways: [
      {
        id: 'black-patent',
        name: 'Black patent',
        family: 'black',
        swatch: { base: '#151312', deep: '#151312', tint: '#E9E6E1' },
        images: [s.strappySandal],
        stock: { 35: 2, 36: 4, 37: 6, 38: 5, 39: 3, 40: 2 },
      },
    ],
    sizes: SIZES,
    sizeProvenance: 'mock',
    tags: ['sandal', 'strappy', 'black', 'patent', 'stiletto'],
    occasions: ['Date night', 'Weekend'],
    featured: true,
    releasedAt: '2026-09-12',
    seo: sampleSeo('Strappy sandal'),
  },
  {
    id: 'block-heel-slide',
    slug: 'block-heel-slide',
    name: 'Block-heel slide',
    kind: 'sample',
    collectionIds: ['samples'],
    category: 'mules',
    heel: { band: 'mid', heightCm: 6, provenance: 'mock' },
    price: { amount: 13900, provenance: 'mock' },
    shortDescription: 'A black suede slide with a wide elastic band on a block heel.',
    description: ['A sample style, not a Whimy product.', 'A black suede slide with a wide elastic band and a square open toe, on a low block heel.'],
    specs: sampleSpecs([['Upper', 'Suede-look, elastic band'], ['Heel', '6 cm block'], ['Toe', 'Square, open']]),
    colourways: [
      {
        id: 'black-suede',
        name: 'Black suede',
        family: 'black',
        swatch: { base: '#2A2725', deep: '#2A2725', tint: '#E9E6E1' },
        images: [s.blockHeelSlide],
        stock: { 35: 3, 36: 6, 37: 8, 38: 7, 39: 4, 40: 2 },
      },
    ],
    sizes: SIZES,
    sizeProvenance: 'mock',
    tags: ['slide', 'mule', 'black', 'suede', 'block heel', 'slip-on', 'everyday'],
    occasions: ['Office', 'Weekend'],
    featured: false,
    releasedAt: '2026-08-30',
    seo: sampleSeo('Block-heel slide'),
  },
  {
    id: 'ankle-strap-block-heel',
    slug: 'ankle-strap-block-heel',
    name: 'Ankle-strap block heel',
    kind: 'sample',
    collectionIds: ['samples'],
    category: 'pumps',
    heel: { band: 'mid', heightCm: 5, provenance: 'mock' },
    price: { amount: 15900, provenance: 'mock' },
    shortDescription: 'A red suede shoe with crossed ankle straps on a block heel.',
    description: ['A sample style, not a Whimy product.', 'A red suede shoe with crossed straps that buckle at the ankle, on a block heel.'],
    specs: sampleSpecs([['Upper', 'Suede-look'], ['Heel', '5 cm block'], ['Toe', 'Almond'], ['Fastening', 'Ankle buckle']]),
    colourways: [
      {
        id: 'red-suede',
        name: 'Red suede',
        family: 'red',
        swatch: { base: '#D7262B', deep: '#7A1216', tint: '#F8E1E0' },
        images: [s.ankleStrapBlockHeel],
        // EU 39 is sold out so the catalogue can show an unavailable size.
        stock: { 35: 2, 36: 4, 37: 5, 38: 3, 39: 0, 40: 1 },
      },
    ],
    sizes: SIZES,
    sizeProvenance: 'mock',
    tags: ['block heel', 'red', 'suede', 'ankle strap', 'cross strap'],
    occasions: ['Brunch', 'Date night'],
    featured: false,
    releasedAt: '2026-07-18',
    seo: sampleSeo('Ankle-strap block heel'),
  },
];
