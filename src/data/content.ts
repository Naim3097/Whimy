/**
 * Brand copy and records taken from Whimy's public channels
 * (Whimy-Research-Report.md §1.2, §2.2 and §8.1). Nothing here is written for
 * Whimy: lines are quoted or describe a post factually.
 */
import type { Provenance } from '../domain/types';
import type { WhimyImageKey } from './assets';

/**
 * The "Dear Whimy Babes" letter card, transcribed in full from the card in
 * Whimy's 22 Oct photograph (bw-letter). The card is set in capitals and
 * centred, so case and paragraph breaks are ours: one sentence per paragraph,
 * in Whimy's lowercase voice. Only the card's obvious typos are normalised
 * ("girss", "paste colours", "femines beautiful"). The wording is still to be
 * confirmed by Whimy, hence `assumption`. paragraphs[0] is the homepage excerpt.
 */
export const letter = {
  salutation: 'Dear Whimy Babes,',
  paragraphs: [
    'the heels were made with love, inspired by the beauty of femininity, and crafted with a little piece of our hearts in every detail.',
    'this collection was created for the girls who find magic in the little things, the softness of pastel colours, the delicate charm of a flower, and the quiet confidence of feminine beauty.',
    'each pair is a gentle reminder that femininity can be soft yet captivating, delicate yet unforgettable.',
  ],
  signOff: 'whimy',
  date: '22 Oct',
  sourceUrl: 'https://www.instagram.com/whimy.official/p/DeyaoGBh7th/',
  provenance: 'assumption' as Provenance,
};

export interface TimelineEntry {
  /** Display date, as Whimy's posts give it. */
  date: string;
  /** ISO date for <time datetime>. */
  iso: string;
  kind: 'image' | 'reel';
  /** One factual line describing the post. */
  line: string;
  /** Registry key of the post's image, where we have it. */
  image?: WhimyImageKey;
  url: string;
  /** Instagram labelled this post as AI content. */
  aiGenerated?: boolean;
}

/** Whimy's first 13 Instagram posts, 19–28 Oct 2026 (verified). */
export const timeline: TimelineEntry[] = [
  {
    date: '19 Oct',
    iso: '2026-10-19',
    kind: 'image',
    line: 'The first teaser: “Something Pointe & Pretty is walking into this city”.',
    image: 'pointePretty',
    url: 'https://www.instagram.com/whimy.official/p/Deq-Rn1BhC1/',
  },
  {
    date: '19 Oct',
    iso: '2026-10-19',
    kind: 'image',
    line: 'A Kuala Lumpur street and the Petronas Towers, with three embroidered Whimy patches.',
    image: 'klPatches',
    url: 'https://www.instagram.com/whimy.official/p/DerFhP_BqCj/',
  },
  {
    date: '21 Oct',
    iso: '2026-10-21',
    kind: 'reel',
    line: 'A colour-guess mood reel: olives, pink satin, green apples and black-and-white heels.',
    url: 'https://www.instagram.com/whimy.official/reel/Dex_MAOBjfV/',
  },
  {
    date: '22 Oct',
    iso: '2026-10-22',
    kind: 'image',
    line: 'A black-and-white still life of the heels with the “Dear Whimy Babes” letter.',
    image: 'bwLetter',
    url: 'https://www.instagram.com/whimy.official/p/DeyaoGBh7th/',
  },
  {
    date: '22 Oct',
    iso: '2026-10-22',
    kind: 'image',
    line: 'Save the date: a card reading “Petals Collection, An October to Remember”.',
    image: 'saveTheDate',
    url: 'https://www.instagram.com/whimy.official/p/DeyvOHFh5m1/',
    aiGenerated: true,
  },
  {
    date: '25 Oct',
    iso: '2026-10-25',
    kind: 'image',
    line: 'Rich Brown revealed: a giant leg beside a tiny model.',
    image: 'brownScalePlay',
    url: 'https://www.instagram.com/whimy.official/p/De6pYuvByDS/',
  },
  {
    date: '26 Oct',
    iso: '2026-10-26',
    kind: 'image',
    line: 'Rich Brown on foot, legs up against a painted sky.',
    image: 'brownSkyLegs',
    url: 'https://www.instagram.com/whimy.official/p/De84331h-nT/',
  },
  {
    date: '26 Oct',
    iso: '2026-10-26',
    kind: 'image',
    line: 'Blush Pink revealed: the model on grass under a painted sky, with striped cushions.',
    image: 'pinkReveal',
    url: 'https://www.instagram.com/whimy.official/p/De9NB7nBX2t/',
  },
  {
    date: '26 Oct',
    iso: '2026-10-26',
    kind: 'reel',
    line: 'A reel of choco and strawberry close-ups, with the model on grass.',
    url: 'https://www.instagram.com/whimy.official/reel/De-plsmh6FQ/',
  },
  {
    date: '26 Oct',
    iso: '2026-10-26',
    kind: 'image',
    line: '“Guess our third colour”, on a luggage tag, with the whimy insole in view.',
    image: 'guessTeaser',
    url: 'https://www.instagram.com/whimy.official/p/De_O9JiBKvR/',
  },
  {
    date: '27 Oct',
    iso: '2026-10-27',
    kind: 'image',
    line: 'Sage Green revealed: the model seated on a giant heel.',
    image: 'greenScalePlay',
    url: 'https://www.instagram.com/whimy.official/p/De_zrsfhksk/',
  },
  {
    date: '27 Oct',
    iso: '2026-10-27',
    kind: 'image',
    line: 'All three colours together on the grass.',
    image: 'groupThreeColours',
    url: 'https://www.instagram.com/whimy.official/p/DfABft1hyCJ/',
  },
  {
    date: '28 Oct',
    iso: '2026-10-28',
    kind: 'reel',
    line: 'A grid of pairs turning from black and white to colour: “which colour are you claiming?”',
    image: 'pairsGrid',
    url: 'https://www.instagram.com/whimy.official/reel/DfCVEakvJqn/',
  },
];

/** Colours followers asked for under the 26 Oct guess-the-colour post (verified). Green is already Sage Green. */
export const nextBloomOptions: string[] = ['red', 'silver', 'white', 'pearl nude', 'purple'];
export const nextBloomSourceUrl = 'https://www.instagram.com/whimy.official/p/De_O9JiBKvR/';

/** Section ids on /help. Old routes (/size-guide, /shipping, …) redirect to these. */
export const helpAnchors = {
  sizeFit: 'size-fit',
  delivery: 'delivery',
  exchanges: 'exchanges',
  care: 'care',
  faq: 'faq',
  contact: 'contact',
} as const;
