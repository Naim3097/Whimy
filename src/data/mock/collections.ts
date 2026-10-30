import type { Collection } from '../../domain/types';

/**
 * Shop collections. Only real Whimy products belong to them: sample styles
 * live on /preview/catalogue and never reach a /shop page.
 */
export const collections: Collection[] = [
  {
    id: 'petals',
    slug: 'petals-collection',
    name: 'Petals Collection',
    description: 'Whimy’s first collection: one pointed satin slingback in Rich Brown, Blush Pink and Sage Green.',
    expandColourways: true,
    match: { collectionId: 'petals' },
  },
  {
    id: 'all',
    slug: 'all',
    name: 'Shop all',
    description: 'Every Whimy style.',
    expandColourways: true,
    // Real products carry the 'all' collection id; `match.all` would also pull in sample styles.
    match: { collectionId: 'all' },
  },
];
