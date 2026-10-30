import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import type { Colourway, ImageSource, Product } from '../domain/types';
import { whimyImages as w } from '../data/assets';
import { helpAnchors, timeline } from '../data/content';
import { usePageMeta } from '../hooks/dom';
import { useCarousel } from '../hooks/useCarousel';
import { useResource } from '../hooks/useResource';
import { cardImages, productPath } from '../lib/catalog';
import { launchCopy } from '../lib/launch';
import { services } from '../services';
import { useUI } from '../state/ui';
import { COLLECTION_HREF, NEXT_BLOOM_HREF } from '../components/layout/nav';
import { Img } from '../components/ui/Img';
import { Price } from '../components/ui/Price';
import { site } from '../config/site';
import styles from './HomeA.module.css';

/*
 * Concept A, after Christy Ng (christyng.com, studied October 2026):
 * a product slideshow, four tall doors that widen on hover, the product row on
 * a pale band, a pair of editorial panels with white box buttons, then two
 * inset panels (posts, where to find us) before the rose footer.
 * Every photograph is Whimy's own; the copy is Whimy's or factual.
 */

const PETALS = 'petals-heels';

interface Slide {
  colourId: string;
  /** Verified names, so the slide never waits for the catalogue. */
  name: string;
  nickname: string;
  image: ImageSource;
  /** The crop for a near-square half: the shoe, and the girl where she fits. */
  position: string;
  /** The crop for a tablet's tall, narrow half (768–1023px, about 60% of the width): the shoe first. */
  narrow: string;
  /** Which side the photograph takes on wide screens; the caption box sits in the other half. */
  side: 'start' | 'end';
  /** One of Whimy's own lines about the colour, in the Fell italic. */
  line: string;
  /** The colourway's own satin behind the caption, and the type that reads on it. */
  ground: string;
  ink: string;
  /** What the dots sit on, bottom-right: the field, or the photograph's dark grass. (Phones: the field.) */
  controlsInk: string;
}

const SLIDES: Slide[] = [
  {
    colourId: 'rich-brown',
    name: 'Rich Brown',
    nickname: 'choco',
    image: w.brownScalePlay,
    position: '50% 100%',
    narrow: '72% 100%',
    side: 'start',
    line: 'the main character (so far).',
    ground: 'var(--swatch-choco)',
    ink: 'var(--paper)',
    controlsInk: 'var(--paper)',
  },
  {
    colourId: 'blush-pink',
    name: 'Blush Pink',
    nickname: 'strawberry',
    image: w.pinkReveal,
    position: '50% 45%',
    narrow: '12% 45%',
    side: 'end',
    line: 'every girl needs a hint of pink in her wardrobe.',
    ground: 'var(--swatch-strawberry)',
    ink: 'var(--ink)',
    controlsInk: 'var(--paper)',
  },
  {
    colourId: 'sage-green',
    name: 'Sage Green',
    nickname: 'kiwi',
    image: w.greenScalePlay,
    position: '50% 25%',
    narrow: '20% 25%',
    side: 'start',
    line: 'the third bloom.',
    ground: 'var(--swatch-kiwi)',
    ink: 'var(--ink)',
    controlsInk: 'var(--ink)',
  },
];

const HERO_SIZES = '(min-width: 768px) 50vw, 100vw';

export function HomeA() {
  usePageMeta(
    'Whimy · Petals Heels',
    'Petals Heels: pointed satin slingbacks with a layered organza flower, in Rich Brown, Blush Pink and Sage Green. From Whimy, based in Kuala Lumpur.',
  );
  const { data } = useResource(`product:${PETALS}`, () => services.catalog.getProduct(PETALS));
  const petals = data ?? undefined;

  return (
    <div className={styles.home}>
      <h1 className="sr-only">Whimy: Petals Heels, the heels of that girl next door</h1>
      <Hero />
      <Doors />
      <ProductBand product={petals} />
      <EditorialPair />
      <div className={styles.insets}>
        <Posts />
        <Where />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. The slideshow                                                    */
/* ------------------------------------------------------------------ */

/**
 * One slide per colour, as Christy Ng's slideshow gives one per product:
 * the name in capitals, one line, a white box button. Whimy's photographs are
 * portraits, so each fills one half and its colour fills the other, where the
 * caption box sits. Slides move sideways; dots sit bottom-right.
 */
function Hero() {
  const { index, playing, live, goTo, play, pause, handlers, swipe } = useCarousel({ count: SLIDES.length, interval: 5000 });

  return (
    <section
      className={styles.hero}
      aria-roledescription="carousel"
      aria-label="Petals Heels in three colours"
      style={{ '--controls-ink': SLIDES[index].controlsInk, '--field-ink-now': SLIDES[index].ink } as CSSProperties}
      {...handlers}
    >
      {/* First in the reading order, as the carousel pattern asks; drawn bottom-right. */}
      <div className={styles.controls}>
        <button type="button" className={styles.pause} onClick={playing ? pause : play}>
          {playing ? 'Pause' : 'Play'}
          <span className="sr-only"> the slideshow</span>
        </button>
        <ol role="list" className={styles.dots}>
          {SLIDES.map((slide, i) => (
            <li key={slide.colourId}>
              <button type="button" className={styles.dot} aria-current={i === index || undefined} onClick={() => goTo(i)}>
                <span className="sr-only">
                  Show slide {i + 1} of {SLIDES.length}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.track} style={{ '--index': index } as CSSProperties} aria-live={live} {...swipe}>
        {SLIDES.map((slide, i) => {
          const href = `/products/${PETALS}?colour=${slide.colourId}`;
          const active = i === index;
          return (
            <div
              key={slide.colourId}
              className={styles.slide}
              data-side={slide.side}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={!active || undefined}
              inert={!active || undefined}
              style={{ '--field': slide.ground, '--field-ink': slide.ink, '--pos-wide': slide.position, '--pos-narrow': slide.narrow } as CSSProperties}
            >
              <Link to={href} className={styles.heroMedia} tabIndex={-1} aria-hidden="true">
                <Img image={slide.image} sizes={HERO_SIZES} priority={i === 0} eager fill position="var(--slide-pos)" className={styles.heroImg} alt="" />
              </Link>
              <div className={styles.field}>
                <div className={styles.caption}>
                  <h2 className={styles.heroTitle}>
                    Petals Heels <span className="nowrap">in {slide.name}</span>
                  </h2>
                  <p className={styles.heroLine}>{slide.line}</p>
                  <Link to={href} className="btn-box">
                    Shop {slide.nickname}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Four doors                                                       */
/* ------------------------------------------------------------------ */

interface Door {
  title: string;
  cta: string;
  to: string;
  image: ImageSource;
  /** object-position for the narrow, tall crop. */
  focus: string;
}

const DOORS: Door[] = [
  { title: 'The Petals Collection', cta: 'Shop now', to: COLLECTION_HREF, image: w.groupThreeColours, focus: '62% 60%' },
  { title: 'Size & fit', cta: 'Find your size', to: `/help#${helpAnchors.sizeFit}`, image: w.kiwiGiant, focus: '64% 50%' },
  { title: 'Dear Whimy Babes', cta: 'Read the letter', to: '/story#letter', image: w.bwLetter, focus: '45% 50%' },
  { title: 'Next bloom', cta: 'Cast your vote', to: NEXT_BLOOM_HREF, image: w.pairsGrid, focus: '50% 50%' },
];

/**
 * Christy Ng's four category doors: tall, edge to edge, the title top-right.
 * From 1024px a door widens to three parts on hover or focus while the others
 * give way, the photographs re-cropping as they go. Below that, a 2 × 2 grid.
 */
function Doors() {
  return (
    <nav className={styles.doors} aria-label="Ways into Whimy">
      <ul role="list" className={styles.doorList}>
        {DOORS.map((door) => (
          <li key={door.title} className={styles.door}>
            <Link to={door.to} className={styles.doorLink}>
              {/* Eager: the doors' tops and titles show in the first screen, under the slideshow. */}
              <Img image={door.image} sizes="(min-width: 1024px) 50vw, 50vw" fill eager position={door.focus} className={styles.doorImg} alt="" />
              <span className={styles.doorText}>
                <span className={styles.doorTitle}>{door.title}</span>
                <span className={styles.doorCta}>{door.cta}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* 3. The product row on its band                                      */
/* ------------------------------------------------------------------ */

function ProductBand({ product }: { product?: Product }) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  return (
    <section className={styles.band} aria-labelledby="home-a-petals">
      <div className="wrap">
        <header className={styles.bandHead}>
          <h2 id="home-a-petals" className={styles.heading}>
            The Petals Collection
          </h2>
          <p className={styles.subline}>petals, satin, pointe. One kitten heel in three colours.</p>
        </header>
        <ul role="list" className={styles.products} aria-busy={!product || undefined}>
          {product
            ? product.colourways.map((c) => <ProductTile key={c.id} product={product} colourway={c} showPrice={copy.showPrice} priceLabel={copy.priceLabel} />)
            : [0, 1, 2].map((i) => <li key={i} className={`skeleton ${styles.tileSkeleton}`} />)}
        </ul>
        <p className={styles.bandAction}>
          <Link to={COLLECTION_HREF} className="btn-box btn-box--ink">
            View the collection
          </Link>
        </p>
      </div>
    </section>
  );
}

function ProductTile({ product, colourway, showPrice, priceLabel }: { product: Product; colourway: Colourway; showPrice: boolean; priceLabel: string | null }) {
  const href = productPath(product, colourway.id);
  const { primary } = cardImages(colourway);
  return (
    <li className={styles.product}>
      <Link to={href} className={styles.productMedia} tabIndex={-1} aria-hidden="true">
        {primary && <Img image={primary} sizes="(min-width: 1024px) 340px, (min-width: 768px) 30vw, 78vw" fill className={styles.productImg} alt="" />}
      </Link>
      <h3 className={styles.productName}>
        <Link to={href} className={styles.productLink}>
          {product.name}
          <span className="sr-only">, {colourway.name}</span>
        </Link>
      </h3>
      {/* One unbroken line, so the dot never starts or ends a line. */}
      <p className={`nowrap ${styles.productColour}`}>
        <span className="v-0">{colourway.nickname}</span> · {colourway.name}
      </p>
      <p className={styles.productPrice}>
        {showPrice ? <Price amount={product.price.amount} provenance={product.price.provenance} /> : priceLabel}
      </p>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Two editorial panels                                             */
/* ------------------------------------------------------------------ */

/*
 * Whimy's own question from TikTok, "Are you a PINK LOVER or BROWN LOVER?",
 * across two photographs from the same painted-sky set. The shoes fill the
 * top of each, so the titles sit low, on the trousers and the grass.
 */
const PAIR = [
  { title: 'Brown lover', cta: 'Shop choco', to: `/products/${PETALS}?colour=rich-brown`, image: w.brownSkyLegs, focus: '50% 70%' },
  { title: 'Pink lover', cta: 'Shop strawberry', to: `/products/${PETALS}?colour=blush-pink`, image: w.strawberrySky, focus: '55% 70%' },
];

/** Christy Ng's 2 × 2 editorial grid, as one row: a centred title and a white box over each photograph. */
function EditorialPair() {
  return (
    <section className={styles.pair} aria-label="Pink lover or brown lover?">
      {PAIR.map((panel) => (
        <article key={panel.title} className={styles.panel}>
          <Img image={panel.image} sizes="(min-width: 768px) 50vw, 100vw" fill position={panel.focus} className={styles.panelImg} alt="" />
          <div className={styles.panelText}>
            <h2 className={styles.panelTitle}>{panel.title}</h2>
            <Link to={panel.to} className="btn-box">
              {panel.cta}
            </Link>
          </div>
        </article>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5 and 6. Two inset panels: posts, and where to find Whimy           */
/* ------------------------------------------------------------------ */

const POSTS = [
  { iso: '2026-10-19', image: w.pointePretty },
  { iso: '2026-10-22', image: w.saveTheDate },
  { iso: '2026-10-26', image: w.guessTeaser },
];

/** Christy Ng's blog row, filled with Whimy's own first posts (each links to Instagram). */
function Posts() {
  const posts = POSTS.map((p) => ({ ...p, post: timeline.find((t) => t.iso === p.iso && t.image && w[t.image].key === p.image.key) })).filter(
    (p) => p.post,
  );
  return (
    <section className={styles.inset} aria-labelledby="home-a-posts">
      <h2 id="home-a-posts" className={styles.heading}>
        From @whimy.official
      </h2>
      <ul role="list" className={styles.posts}>
        {posts.map(({ post, image }) =>
          post ? (
            <li key={post.url} className={styles.post}>
              {/* Whole, at Instagram's own 4:5, so no post loses its words to a crop. */}
              <Img image={image} sizes="(min-width: 1024px) 360px, (min-width: 768px) 30vw, 100vw" fill className={styles.postImg} alt="" />
              <p className={styles.postDate}>
                <time dateTime={post.iso}>{post.date}</time>
              </p>
              <h3 className={styles.postTitle}>{post.line}</h3>
              {post.aiGenerated && <p className={styles.postNote}>AI-generated visual, labelled by Instagram</p>}
              <a href={post.url} target="_blank" rel="noreferrer" className={styles.readMore}>
                View on Instagram<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ) : null,
        )}
      </ul>
      <p className={styles.bandAction}>
        <a href={site.social.instagram} target="_blank" rel="noreferrer" className="btn-box btn-box--ink">
          Follow us<span className="sr-only"> on Instagram (opens in a new tab)</span>
        </a>
      </p>
    </section>
  );
}

/** Christy Ng's store locator, for a label that has no store yet: where Whimy sells and answers. */
function Where() {
  return (
    <section className={`${styles.inset} ${styles.where}`} aria-labelledby="home-a-where">
      <div className={styles.whereText}>
        <h2 id="home-a-where" className={styles.heading}>
          Where to find Whimy
        </h2>
        <p>
          Whimy is based in Kuala Lumpur and sells online, here and soon on TikTok Shop. Questions about sizing or delivery? Message us on Instagram, TikTok or
          Threads.
        </p>
        <a href={site.tiktokShopUrl} target="_blank" rel="noreferrer" className={styles.readMore}>
          Whimy on TikTok<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      {/* The patch trio whole (wordmark, W coin, KL flower); Concept B's scene keeps the towers. */}
      <Img image={w.klPatches} sizes="(min-width: 1024px) 760px, 100vw" fill position="50% 92%" className={styles.whereImg} />
    </section>
  );
}
