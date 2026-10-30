/**
 * The two homepage concepts shown to Whimy. They share every shop page, the
 * catalogue and the bag; only the homepage and the chrome (bar, header,
 * footer) change. The concept last visited is remembered, so a shopper who
 * entered through A keeps A's header and footer all the way to checkout.
 * B is the default: the site's root and the chrome a first visit wears.
 * Paths never name the reference sites.
 */
export type ConceptId = 'a' | 'b';

export interface Concept {
  id: ConceptId;
  /** Where the concept's homepage lives. */
  home: string;
  /** Short label for the switcher. */
  label: string;
  /** The live site the concept was studied from. */
  reference: { name: string; url: string };
}

export const concepts: Record<ConceptId, Concept> = {
  a: {
    id: 'a',
    home: '/concept-a',
    label: 'Concept A',
    reference: { name: 'Christy Ng', url: 'https://www.christyng.com/' },
  },
  b: {
    id: 'b',
    home: '/',
    label: 'Concept B',
    reference: { name: 'Jimmy Choo', url: 'https://www.jimmychoo.com/en/home?geoip=geoip' },
  },
};

export const isConceptId = (value: unknown): value is ConceptId => value === 'a' || value === 'b';

/** The concept a path belongs to, when the path is one of the two homepages. */
export function conceptOfPath(pathname: string): ConceptId | null {
  if (pathname === concepts.a.home) return 'a';
  if (pathname === concepts.b.home) return 'b';
  return null;
}
