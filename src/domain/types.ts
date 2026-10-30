/**
 * Domain model for the Whimy storefront.
 *
 * These types are deliberately backend-agnostic: the mock services in
 * `src/services/mock` return them today, and a real commerce API adapter
 * should map its responses onto the same shapes.
 */

/** Where a piece of information comes from. Drives the provenance marks in the UI. */
export type Provenance =
  /** Seen on an official Whimy channel (see Whimy-Research-Report.md). */
  | 'verified'
  /** A reasonable design assumption that Whimy still needs to confirm. */
  | 'assumption'
  /** A demo value that stands in until Whimy supplies the real one. */
  | 'mock';

/** Amounts are stored in sen (1/100 MYR) to avoid floating-point drift. */
export type Money = number;

export type ColourFamily =
  | 'brown'
  | 'pink'
  | 'green'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'black'
  | 'neutral'
  | 'metallic'
  | 'blue';

export type Category = 'slingbacks' | 'pumps' | 'mules' | 'flats' | 'strappy';

export type HeelBand = 'flat' | 'kitten' | 'mid' | 'high';

/** EU sizing is the local norm for Malaysian women's footwear. */
export type Size = 35 | 36 | 37 | 38 | 39 | 40 | 41;

/**
 * The photographic world an image belongs to (DESIGN.md §5). It decides where
 * the image may appear and which loading ground it paints.
 */
export type ImageWorld = 'scale' | 'sky' | 'still' | 'graphic' | 'brand' | 'sample';

export interface ImageSource {
  /** Stable key into the central asset registry (`src/data/assets.ts`). */
  key: string;
  src: string;
  srcSet?: string;
  width: number;
  height: number;
  alt: string;
  /** Focal point (0–100) used for object-position. */
  focus?: { x: number; y: number };
  /**
   * `whimy` = Whimy's own photography; `sample` = a stock image standing in for a demo listing;
   * `concept` = an AI concept visual made for this preview (always `aiGenerated`); `stock` = a licensed
   * stock photograph standing in on a brand surface (always marked `stock photo`).
   */
  origin: 'whimy' | 'sample' | 'concept' | 'stock';
  world: ImageWorld;
  /** Dominant colour (hex) from scripts/process-images.mjs, painted while the image loads. */
  dominant?: string;
  /** Clean negative space where type may sit, in percent of the image box. */
  textSafe?: { x: number; y: number; w: number; h: number };
  /** The turf line of a painted-sky photo, as a 0–1 fraction of its height. */
  horizon?: number;
  /** Sharpness cap in CSS px: floor(sourceWidth / 1.25). */
  maxCssWidth?: number;
  credit?: { name: string; url: string; source: string };
  /** Set when the platform labelled the image as AI-generated. */
  aiGenerated?: boolean;
  /**
   * Set when the files were made from an AI upscale of Whimy's smaller original
   * (scripts/upscaled-images.mjs): that original's size. Crops inherit it from their source.
   */
  upscaledFrom?: { width: number; height: number };
  /** Set when an AI outpaint widened the frame of a generated original (concept visuals): that original's size. */
  extendedFrom?: { width: number; height: number };
}

export interface Colourway {
  id: string;
  name: string;
  /** Whimy's playful nickname for the colour, e.g. "choco". */
  nickname?: string;
  family: ColourFamily;
  /** Swatch colours: base satin tone, deep tone for text, light tint for backgrounds. */
  swatch: { base: string; deep: string; tint: string };
  images: ImageSource[];
  /**
   * The product card's photograph, when one of `images` shows the shoe larger
   * than the lead does (DESIGN.md §10: the shoe fills at least 35% of the card).
   * Packshots replace it later. Defaults to `images[0]`.
   */
  cardImage?: ImageSource;
  /** Stock on hand per size. 0 = sold out. Missing size = not produced. */
  stock: Partial<Record<Size, number>>;
  /** Short brand-voice note about this colour. */
  note?: { text: string; provenance: Provenance; sourceUrl?: string };
  badges?: ProductBadge[];
}

export type ProductBadge = 'new' | 'fan-favourite' | 'low-stock' | 'sold-out' | 'sample';

export interface ProductSpec {
  label: string;
  value: string;
  provenance: Provenance;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** `whimy` = a real Whimy product; `sample` = demo listing used to show catalogue features. */
  kind: 'whimy' | 'sample';
  collectionIds: string[];
  category: Category;
  heel: { band: HeelBand; heightCm?: number; provenance: Provenance };
  price: { amount: Money; compareAt?: Money; provenance: Provenance };
  shortDescription: string;
  description: string[];
  specs: ProductSpec[];
  colourways: Colourway[];
  sizes: Size[];
  sizeProvenance: Provenance;
  tags: string[];
  occasions: string[];
  featured: boolean;
  /** ISO date used for "newest" sorting. */
  releasedAt: string;
  seo: { title: string; description: string };
}

export interface Collection {
  id: string;
  slug: string;
  name: string;
  eyebrow?: string;
  description: string;
  hero?: ImageSource;
  /** Show one card per colourway instead of one card per product. */
  expandColourways?: boolean;
  /** Filter rule that decides membership. */
  match: { collectionId?: string; categories?: Category[]; all?: boolean };
}

/** A single purchasable unit: one product in one colour and one size. */
export interface VariantRef {
  productId: string;
  colourId: string;
  size: Size;
}

export interface CartLine extends VariantRef {
  /** Stable key: product:colour:size. */
  key: string;
  quantity: number;
  addedAt: number;
}

export interface WishlistItem {
  productId: string;
  colourId: string;
  addedAt: number;
}

export type ShippingRegion = 'west' | 'east' | 'singapore';

export interface ShippingMethod {
  id: string;
  label: string;
  region: ShippingRegion;
  carrier: string;
  eta: string;
  price: Money;
  /** Order subtotal (after discounts) from which this method is free. */
  freeFrom?: Money;
}

export type PromoOutcome =
  | { status: 'applied'; code: string; label: string }
  | { status: 'invalid'; code: string; message: string }
  | { status: 'expired'; code: string; message: string }
  | { status: 'ineligible'; code: string; message: string };

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  postcode: string;
  city: string;
  state: string;
  country: 'MY' | 'SG';
}

export interface ContactDetails {
  email: string;
  phone: string;
  marketingOptIn: boolean;
}

export type PaymentMethodId = 'fpx' | 'ewallet' | 'duitnow' | 'card' | 'atome';

export interface PaymentSelection {
  method: PaymentMethodId;
  /** Bank for FPX, wallet for e-wallets. */
  provider?: string;
}

export interface OrderTotals {
  subtotal: Money;
  discount: Money;
  shipping: Money;
  total: Money;
}

export interface OrderLine extends VariantRef {
  name: string;
  colourName: string;
  unitPrice: Money;
  quantity: number;
  image?: ImageSource;
}

export interface OrderDraft {
  lines: OrderLine[];
  contact: ContactDetails;
  address: Address;
  shippingMethodId: string;
  payment: PaymentSelection;
  promoCode?: string;
  giftNote?: string;
  totals: OrderTotals;
  /** Client-generated key so a retried submission never creates two orders. */
  idempotencyKey: string;
}

export interface Order extends Omit<OrderDraft, 'idempotencyKey'> {
  reference: string;
  placedAt: string;
  shippingMethodLabel: string;
  shippingEta: string;
  /** Always true in this phase: no real order or payment exists. */
  simulated: true;
}
