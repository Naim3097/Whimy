/**
 * Central image registry.
 *
 * Every image the storefront shows is defined here, so swapping in new
 * photography is a one-line change:
 *   1. run scripts/process-images.mjs on the new source files
 *   2. point the relevant entry at its manifest key.
 *
 * - `origin: 'whimy'`  Whimy's own photos (public Instagram, used with permission for this pitch).
 *   Each carries its `world` (DESIGN.md §5), the dominant colour from the manifest and its
 *   sharpness cap: floor(sourceWidth / 1.25). Six are served from AI upscales of the
 *   Instagram files (scripts/upscaled-images.mjs); they and their crops carry `upscaledFrom`.
 * - `origin: 'concept'` AI-generated visuals made for this preview (homepage B's campaign),
 *   always marked as such.
 * - `origin: 'stock'` licensed stock photographs standing in on a brand surface (homepage B's
 *   KL scene), downloaded and graded by scripts/stock-images.mjs, always marked as such.
 * - `origin: 'sample'` Unsplash photos (Unsplash License) for the demo listings on
 *   /preview/catalogue and /preview/catalogue/:slug only. Hotlinked at runtime, as
 *   Unsplash's guidelines require; never downloaded or bundled.
 */
import type { ImageSource, ImageWorld } from '../domain/types';
import manifest from './whimy-image-manifest.json';
import conceptManifestJson from './concept-image-manifest.json';
import stockManifestJson from './stock-image-manifest.json';

type ManifestEntry = {
  width: number;
  height: number;
  dominant: string;
  sizes: { file: string; width: number; height: number }[];
  /** A crop's source photograph (scripts/derive-crops.mjs). */
  from?: string;
  /** The size of Whimy's original, when the files come from an upscaled master. */
  upscaledFrom?: { width: number; height: number };
  /** The size of the generated original, when the file is an AI outpaint that widened its frame. */
  extendedFrom?: { width: number; height: number };
};
export const whimyManifest = manifest as Record<string, ManifestEntry>;

/** The rendered CSS width never exceeds the source width divided by this. */
export const SHARPNESS_RATIO = 1.25;

const instagram = (path: string) => `https://www.instagram.com/whimy.official/${path}/`;

function whimy(key: string, world: ImageWorld, alt: string, postUrl: string, extra: Partial<ImageSource> = {}): ImageSource {
  const entry = whimyManifest[key];
  if (!entry) throw new Error(`Missing Whimy image in manifest: ${key}`);
  const sizes = [...entry.sizes].sort((a, b) => a.width - b.width);
  const largest = sizes[sizes.length - 1];
  const upscaledFrom = entry.upscaledFrom ?? (entry.from ? whimyManifest[entry.from]?.upscaledFrom : undefined);
  return {
    key,
    src: `/images/whimy/${largest.file}`,
    srcSet: sizes.map((s) => `/images/whimy/${s.file} ${s.width}w`).join(', '),
    width: entry.width,
    height: entry.height,
    alt,
    origin: 'whimy',
    world,
    dominant: entry.dominant,
    maxCssWidth: Math.floor(entry.width / SHARPNESS_RATIO),
    credit: { name: 'Whimy (@whimy.official)', url: postUrl, source: 'Instagram' },
    ...(upscaledFrom ? { upscaledFrom } : null),
    ...extra,
  };
}

const UNSPLASH_WIDTHS = [480, 800, 1200];

/**
 * A hotlinked Unsplash photo, cropped to 4:5 around a focal point set by hand
 * (imgix `crop=focalpoint`). Never `crop=entropy`.
 */
function unsplash(
  key: string,
  photoId: string,
  alt: string,
  credit: { handle: string; slug: string },
  focus: { x: number; y: number },
): ImageSource {
  const url = (w: number) =>
    `https://images.unsplash.com/${photoId}?auto=format&fit=crop&crop=focalpoint&fp-x=${focus.x / 100}&fp-y=${focus.y / 100}&w=${w}&h=${Math.round(w * 1.25)}&q=72`;
  const largest = UNSPLASH_WIDTHS[UNSPLASH_WIDTHS.length - 1];
  return {
    key,
    src: url(800),
    srcSet: UNSPLASH_WIDTHS.map((w) => `${url(w)} ${w}w`).join(', '),
    width: 800,
    height: 1000,
    alt,
    focus,
    origin: 'sample',
    world: 'sample',
    maxCssWidth: Math.floor(largest / SHARPNESS_RATIO),
    credit: {
      name: `@${credit.handle}`,
      url: `https://unsplash.com/photos/${credit.slug}`,
      source: 'Unsplash',
    },
  };
}

/* ------------------------------------------------------------------ */
/* Whimy's own photography                                             */
/* ------------------------------------------------------------------ */

export const whimyImages = {
  /* scale: the cover and giant moments only */
  greenScalePlay: whimy(
    'green-scale-play',
    'scale',
    'Campaign image: a model in a lime faux-fur jacket seated on an oversized Sage Green Petals Heel.',
    instagram('p/De_zrsfhksk'),
    { focus: { x: 45, y: 50 }, textSafe: { x: 59, y: 4, w: 37, h: 35 } },
  ),
  brownScalePlay: whimy(
    'brown-scale-play',
    'scale',
    'Campaign image: an oversized leg wearing the Rich Brown Petals Heel beside a model in a lime faux-fur jacket.',
    instagram('p/De6pYuvByDS'),
    { focus: { x: 55, y: 78 } },
  ),

  /* sky: the painted-sky set: colour stories, PDP lead frames */
  brownSkyLegs: whimy(
    'brown-sky-legs',
    'sky',
    'Legs raised against a painted blue sky, wearing Rich Brown Petals Heels with organza flowers.',
    instagram('p/De84331h-nT'),
    { focus: { x: 55, y: 35 }, horizon: 0.684 },
  ),
  pinkReveal: whimy(
    'pink-reveal',
    'sky',
    'Model lying on grass with her legs resting on striped pink cushions, wearing Blush Pink Petals Heels.',
    instagram('p/De9NB7nBX2t'),
    { focus: { x: 30, y: 45 }, horizon: 0.7 },
  ),
  groupThreeColours: whimy(
    'group-three-colours',
    'sky',
    'Petals Heels in all three colours on grass under a painted sky: Rich Brown worn, Sage Green held up beside its pair, and Blush Pink resting in front.',
    instagram('p/DfABft1hyCJ'),
    { focus: { x: 50, y: 62 }, horizon: 0.33 },
  ),

  /*
   * Crops cut by scripts/derive-crops.mjs. The three "grass" crops come from the
   * group photograph, so the product tiles share one light and one ground; the
   * "giant" crops are the scale-play reveals closed in on the shoe.
   */
  chocoGrass: whimy(
    'choco-grass',
    'sky',
    'A Rich Brown Petals Heel worn on the grass under grey wide-leg trousers, its organza flower at the toe.',
    instagram('p/DfABft1hyCJ'),
  ),
  strawberryGrass: whimy(
    'strawberry-grass',
    'sky',
    'A Blush Pink Petals Heel on the grass, its layered organza flower at the toe, the other of the pair behind it.',
    instagram('p/DfABft1hyCJ'),
  ),
  kiwiGrass: whimy(
    'kiwi-grass',
    'sky',
    'A Sage Green Petals Heel standing on the grass, its organza flower at the toe and its slingback strap behind.',
    instagram('p/DfABft1hyCJ'),
  ),
  strawberrySky: whimy(
    'strawberry-sky',
    'sky',
    'Legs raised against a painted sky in Blush Pink Petals Heels, beside striped pink cushions.',
    instagram('p/De9NB7nBX2t'),
  ),
  chocoGiant: whimy(
    'choco-giant',
    'scale',
    'An oversized foot in a Rich Brown Petals Heel, with a tiny model kicking up her heel in the same pair.',
    instagram('p/De6pYuvByDS'),
  ),
  kiwiGiant: whimy(
    'kiwi-giant',
    'scale',
    'An oversized Sage Green Petals Heel with its organza flower and pin buckle; a model sits on it in the same heels.',
    instagram('p/De_zrsfhksk'),
  ),

  /* still: the letter, Next bloom, the PDP shape frame */
  bwLetter: whimy(
    'bw-letter',
    'still',
    'Black-and-white photograph of Petals Heels pairs beside the “Dear Whimy Babes” letter card.',
    instagram('p/DeyaoGBh7th'),
    { focus: { x: 55, y: 50 } },
  ),
  pairsGrid: whimy(
    'pairs-grid',
    'still',
    'Black-and-white grid of Petals Heels pairs seen from above, before the colours were revealed.',
    instagram('reel/DfCVEakvJqn'),
  ),

  /* graphic: never content, only 160px thumbnails in the Story timeline */
  pointePretty: whimy(
    'pointe-pretty',
    'graphic',
    'Typographic teaser reading “Something Pointe & Pretty is walking into this city”.',
    instagram('p/Deq-Rn1BhC1'),
  ),
  klPatches: whimy(
    'kl-patches',
    'graphic',
    'Embroidered Whimy patches (wordmark, W monogram and KL flower) over a Kuala Lumpur street with the Petronas Towers.',
    instagram('p/DerFhP_BqCj'),
    { focus: { x: 50, y: 60 } },
  ),
  saveTheDate: whimy(
    'save-the-date',
    'graphic',
    'A lace-gloved hand holding a card reading “Petals Collection, An October to Remember”. AI-generated visual, labelled as AI content on Instagram.',
    instagram('p/DeyvOHFh5m1'),
    { aiGenerated: true },
  ),
  guessTeaser: whimy(
    'guess-teaser',
    'graphic',
    'Teaser image: “Guess our third Petals Heels colour” over Rich Brown and Blush Pink heels, the whimy logo printed on the insole.',
    instagram('p/De_O9JiBKvR'),
    { focus: { x: 50, y: 40 } },
  ),

  /* brand marks: header lockup, footer postcard, letter sign-off */
  monogramCoin: whimy('monogram-coin', 'brand', 'Whimy W monogram, embroidered coin patch.', instagram('p/DerFhP_BqCj')),
  klFlower: whimy('kl-flower', 'brand', 'Whimy’s embroidered KL flower patch.', instagram('p/DerFhP_BqCj')),
  patchesTrio: whimy(
    'patches-trio',
    'brand',
    'Whimy embroidered patches: the whimy wordmark, the W monogram coin and the KL flower.',
    instagram('p/DerFhP_BqCj'),
  ),
  insoleDetail: whimy('insole-detail', 'brand', 'Close-up of the whimy logo printed on a Rich Brown insole.', instagram('p/De_O9JiBKvR')),
} satisfies Record<string, ImageSource>;

export type WhimyImageKey = keyof typeof whimyImages;

/* ------------------------------------------------------------------ */
/* AI concept visuals: homepage B's campaign only                      */
/* ------------------------------------------------------------------ */

/**
 * AI-generated visuals made for this preview (scripts/concept-images.mjs), kept
 * apart from Whimy's photographs: their own folder, manifest and origin. The model
 * and the meadow are generated; the heels are an impression of Petals Heels in
 * Rich Brown, so wherever one shows, it carries the `AI visual` mark.
 */
export const conceptManifest = conceptManifestJson as Record<string, ManifestEntry>;

function concept(key: string, alt: string, extra: Partial<ImageSource> = {}): ImageSource {
  const entry = conceptManifest[key];
  if (!entry) throw new Error(`Missing concept image in manifest: ${key}`);
  const sizes = [...entry.sizes].sort((a, b) => a.width - b.width);
  return {
    key,
    src: `/images/concept/${sizes[sizes.length - 1].file}`,
    srcSet: sizes.map((s) => `/images/concept/${s.file} ${s.width}w`).join(', '),
    width: entry.width,
    height: entry.height,
    alt,
    origin: 'concept',
    world: 'sky',
    dominant: entry.dominant,
    maxCssWidth: Math.floor(entry.width / SHARPNESS_RATIO),
    aiGenerated: true,
    ...(entry.upscaledFrom ? { upscaledFrom: entry.upscaledFrom } : null),
    ...(entry.extendedFrom ? { extendedFrom: entry.extendedFrom } : null),
    ...extra,
  };
}

const MEADOW_ALT =
  'AI concept visual: a smiling model in a lime faux-fur jacket and a sheer sage skirt reclines on a pale quilt in a clover meadow under a blue sky, wearing Rich Brown slingbacks with organza flowers.';

export const conceptImages = {
  /** 16:9, for 1024px and up. A separate generation of the same scene as the tall one. */
  meadowWide: concept('meadow-wide', MEADOW_ALT),
  /** 4:5, for phones and tablets. */
  meadowTall: concept('meadow-tall', MEADOW_ALT),

  /*
   * Packshots for homepage B's strip: 4:5 on a warm ivory sweep, light from the left.
   * Impressions of Petals Heels, close but not exact (the real Rich Brown insole is dark
   * brown, the real straps are lined in black, the flowers are a little smaller).
   */
  packshotRichBrown: concept(
    'packshot-rich-brown',
    'AI concept visual: a Rich Brown satin slingback with a pointed toe, a sheer brown organza flower and a slim heel, on an ivory backdrop.',
  ),
  packshotBlushPink: concept(
    'packshot-blush-pink',
    'AI concept visual: a Blush Pink satin slingback with a pointed toe, a sheer pink organza flower and a slim heel, on an ivory backdrop.',
  ),
  packshotSageGreen: concept(
    'packshot-sage-green',
    'AI concept visual: a Sage Green satin slingback with a pointed toe, a sheer green organza flower and a slim heel, on an ivory backdrop.',
  ),
  packshotTrio: concept(
    'packshot-trio',
    'AI concept visual: slingbacks in Rich Brown, Blush Pink and Sage Green with organza flowers, the pink one raised on a pale stone, on an ivory backdrop.',
  ),
} satisfies Record<string, ImageSource>;

/* ------------------------------------------------------------------ */
/* Stock photographs on brand surfaces                                 */
/* ------------------------------------------------------------------ */

/**
 * Licensed stock photographs that stand in where Whimy has no photograph of its own
 * (scripts/stock-images.mjs: downloaded originals, lightly graded to sit with the
 * meadow and the satin film). Kept apart from Whimy's files and always marked
 * `stock photo` where they show.
 */
export const stockManifest = stockManifestJson as Record<string, ManifestEntry>;

function stock(key: string, alt: string, credit: { name: string; url: string }): ImageSource {
  const entry = stockManifest[key];
  if (!entry) throw new Error(`Missing stock image in manifest: ${key}`);
  const sizes = [...entry.sizes].sort((a, b) => a.width - b.width);
  return {
    key,
    src: `/images/stock/${sizes[sizes.length - 1].file}`,
    srcSet: sizes.map((s) => `/images/stock/${s.file} ${s.width}w`).join(', '),
    width: entry.width,
    height: entry.height,
    alt,
    origin: 'stock',
    world: 'sky',
    dominant: entry.dominant,
    maxCssWidth: Math.floor(entry.width / SHARPNESS_RATIO),
    credit: { ...credit, source: 'Unsplash' },
  };
}

export const stockImages = {
  /** Homepage B's Kuala Lumpur scene. Neil Daftary, Unsplash License. */
  klccTowers: stock(
    'klcc-towers',
    'The Petronas Twin Towers in Kuala Lumpur, seen from below against a pale blue sky, framed by palm fronds (stock photograph)',
    { name: 'Neil Daftary', url: 'https://unsplash.com/photos/a-couple-of-tall-buildings-sitting-next-to-each-other-BzowgDuuHME' },
  ),
} satisfies Record<string, ImageSource>;

/* ------------------------------------------------------------------ */
/* Sample imagery (Unsplash License): /preview/catalogue only          */
/* ------------------------------------------------------------------ */

/*
 * One photographer's studio series (engin akyurt, September 2026): the same
 * light seamless, softbox and lens, so the four read as one set. The singles
 * are side profiles with the toe to the left; nothing is pointed, pastel,
 * satin or floral, so none can be mistaken for Petals.
 */
export const sampleImages = {
  crossStrapBlockHeel: unsplash(
    'sample-cross-strap-block-heel',
    'photo-1789110519420-21e30de24a82',
    'A single black cross-strap shoe in side profile, its block heel wrapped in a black-and-white woven pattern, on white (sample image)',
    { handle: 'enginakyurt', slug: 'black-high-heel-with-geometric-pattern-Hgt-pfNS49k' },
    { x: 50, y: 30 },
  ),
  strappySandal: unsplash(
    'sample-strappy-sandal',
    'photo-1789110519274-5613cdc02fb2',
    'A single black patent sandal with three thin straps and a slim high heel, in side profile on white (sample image)',
    { handle: 'enginakyurt', slug: 'black-patent-leather-high-heel-sandal-9x91x_fbP80' },
    { x: 50, y: 42 },
  ),
  blockHeelSlide: unsplash(
    'sample-block-heel-slide',
    'photo-1789110519446-77822570546e',
    'A pair of black suede slides with a wide elastic band and low block heels, on white (sample image)',
    { handle: 'enginakyurt', slug: 'black-suede-slide-sandals-2ZwsVw2_ZxM' },
    { x: 50, y: 44 },
  ),
  ankleStrapBlockHeel: unsplash(
    'sample-ankle-strap-block-heel',
    'photo-1789110520044-578a2abd6bec',
    'A pair of red suede shoes with crossed ankle straps and block heels, on white (sample image)',
    { handle: 'enginakyurt', slug: 'red-suede-block-heel-shoes-U-tYtwjanvk' },
    { x: 50, y: 36 },
  ),
} satisfies Record<string, ImageSource>;

export const allImages: ImageSource[] = [
  ...Object.values(whimyImages),
  ...Object.values(conceptImages),
  ...Object.values(stockImages),
  ...Object.values(sampleImages),
];
