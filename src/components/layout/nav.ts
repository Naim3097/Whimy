/**
 * The site chrome's links: one list each, shared by the header, the Shop
 * panel, the mobile menu, search and the footer (DESIGN.md §7).
 */
import type { Colourway, Product } from '../../domain/types';
import { site } from '../../config/site';
import { helpAnchors } from '../../data/content';
import { productPath } from '../../lib/catalog';
import { useCatalog } from '../../state/catalog';
import { PETALS_ID } from '../cart/petals';

export interface NavLinkItem {
  label: string;
  to: string;
}

export const COLLECTION_HREF = '/shop/petals-collection';
/** The set (all three colours) is bought from its row on the product page. */
export const SET_ID = 'all-three';
export const SET_HREF = `/products/petals-heels#${SET_ID}`;
export const NEXT_BLOOM_HREF = '/next-bloom';

const help = (label: string, anchor: string): NavLinkItem => ({ label, to: `/help#${anchor}` });

export const helpLinks: NavLinkItem[] = [
  help('Size & fit', helpAnchors.sizeFit),
  help('Delivery', helpAnchors.delivery),
  help('Exchanges', helpAnchors.exchanges),
  help('Care', helpAnchors.care),
  help('FAQ', helpAnchors.faq),
  help('Contact', helpAnchors.contact),
];

/** The Shop panel's "Before you buy" column. */
export const beforeYouBuy = helpLinks.slice(0, 4);

export const socialLinks = [
  { label: 'Instagram', href: site.social.instagram },
  { label: 'TikTok', href: site.social.tiktok },
  { label: 'Threads', href: site.social.threads },
];

export const colourHref = (product: Product, colourway: Colourway) => productPath(product, colourway.id);

export const nicknameOf = (colourway: Colourway) => colourway.nickname ?? colourway.name.toLowerCase();

/** Petals Heels from the loaded catalogue; undefined until it arrives. */
export function usePetals(): Product | undefined {
  const { productById } = useCatalog();
  return productById(PETALS_ID);
}

/* Search ------------------------------------------------------------- */

/** Popular searches that are colour names (SearchPage submits these as queries). */
export const POPULAR_SEARCHES = ['choco', 'strawberry', 'kiwi'];

/** The Help half of "Popular": choco · strawberry · kiwi · size guide · delivery · exchanges. */
export const popularHelp: NavLinkItem[] = [
  help('size guide', helpAnchors.sizeFit),
  help('delivery', helpAnchors.delivery),
  help('exchanges', helpAnchors.exchanges),
];

const helpTerms: Record<keyof typeof helpAnchors, string[]> = {
  sizeFit: ['size', 'sizing', 'size guide', 'fit', 'measure', 'eu', 'cm', 'foot', 'length', 'heel height', 'kitten'],
  delivery: ['delivery', 'shipping', 'postage', 'courier', 'east malaysia', 'west malaysia', 'sabah', 'sarawak', 'singapore'],
  exchanges: ['exchange', 'exchanges', 'return', 'returns', 'refund', 'swap', 'defective'],
  care: ['care', 'clean', 'cleaning', 'satin', 'organza', 'storage'],
  faq: ['faq', 'question', 'questions', 'launch', 'tiktok', 'payment', 'pay', 'fpx', 'duitnow'],
  contact: ['contact', 'email', 'whatsapp', 'instagram', 'threads', 'dm', 'message'],
};

const helpByKey: Record<keyof typeof helpAnchors, NavLinkItem> = {
  sizeFit: helpLinks[0],
  delivery: helpLinks[1],
  exchanges: helpLinks[2],
  care: helpLinks[3],
  faq: helpLinks[4],
  contact: helpLinks[5],
};

/** Help sections whose name or topics start with any word of the query (two letters or more). */
export function helpHits(query: string): NavLinkItem[] {
  const tokens = query.toLowerCase().split(/[^a-z0-9&]+/).filter((t) => t.length > 1);
  if (!tokens.length) return [];
  const keys = Object.keys(helpTerms) as (keyof typeof helpAnchors)[];
  return keys
    .filter((key) => {
      const words = [helpByKey[key].label.toLowerCase(), ...helpTerms[key]].flatMap((w) => w.split(/\s+/));
      return tokens.some((t) => words.some((w) => w.startsWith(t)));
    })
    .map((key) => helpByKey[key]);
}
