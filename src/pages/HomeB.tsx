import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { Link } from 'react-router';
import type { Colourway, ImageSource, Product } from '../domain/types';
import { conceptImages as c, stockImages, whimyImages as w } from '../data/assets';
import { helpAnchors, letter } from '../data/content';
import { useInView, usePageMeta } from '../hooks/dom';
import { useCarousel } from '../hooks/useCarousel';
import { useResource } from '../hooks/useResource';
import { cardImages, productPath } from '../lib/catalog';
import { launchCopy } from '../lib/launch';
import { services } from '../services';
import { useUI } from '../state/ui';
import { COLLECTION_HREF, SET_HREF } from '../components/layout/nav';
import { Icon } from '../components/ui/Icon';
import { Img } from '../components/ui/Img';
import { Price } from '../components/ui/Price';
import { Mark, ProvenanceMark } from '../components/ui/ProvenanceMark';
import styles from './HomeB.module.css';

/*
 * Concept B, after Jimmy Choo (jimmychoo.com, studied October 2026): the
 * campaign under a clear header (a still slide and a film slide, captions
 * bottom-left), a strip of the colours edge to edge, two portrait doors with
 * sticky calls to action, a 50/50 story beside its photograph, one full-bleed
 * scene, then a text-only services row. Type stays small (18/14px); the
 * photographs carry the page.
 */

const PETALS = 'petals-heels';
const colourHref = (colourId: string) => `/products/${PETALS}?colour=${colourId}`;

export function HomeB() {
  usePageMeta(
    'Whimy · Petals Heels',
    'Petals Heels: pointed satin slingbacks with a layered organza flower, in Rich Brown, Blush Pink and Sage Green. From Whimy, based in Kuala Lumpur.',
  );
  const { data } = useResource(`product:${PETALS}`, () => services.catalog.getProduct(PETALS));
  const petals = data ?? undefined;

  return (
    <div className={styles.home}>
      <h1 className="sr-only">Whimy: Petals Heels, the heels of that girl next door</h1>
      <Campaign />
      <Strip product={petals} />
      <Doors />
      <LetterSplit />
      <Scene />
      <Services />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 1. The campaign                                                     */
/* ------------------------------------------------------------------ */

/**
 * Stock footage (Mixkit clip 51002, Mixkit Stock Video Free License): pale blue
 * satin, the painted sky's colour. Only its first 4.4 seconds are used, played
 * forward then back as one seamless 8.7-second loop, because later in the clip a
 * darker fabric crosses where the caption and controls sit. Over every frame, at
 * every width measured (360 to 2560px), ink type holds 4.6:1 or more (the header's
 * too) and the controls 3.2:1 or more. A 16:9 file for wide screens and a 3:4 one
 * cut from its left edge for phones and tablets (scripts/encode-film.mjs).
 */
const FILM = {
  wide: '/video/satin-sky-1280x720.mp4',
  tall: '/video/satin-sky-720x960.mp4',
  poster: '/video/satin-sky-poster.webp',
};
const FILM_SLIDE = 1;
/** Where the meadow's wide frame shows: from 1024px, and on any screen at least 4:5 wide (HomeB.module.css). */
const WIDE_FRAME = '(min-width: 1024px), (min-aspect-ratio: 4/5)';
/** Ink on both: the meadow's sky, where its caption sits, and the pale satin. */
const SLIDE_TONES = ['ink', 'ink'] as const;

/**
 * Jimmy Choo's hero: a still slide and a film slide moving sideways (500ms, 6s
 * each), a caption bottom-left on each, pause and arrows bottom-right, and two
 * bars along the foot that fill over each slide's time. The film plays only
 * while its slide is showing and the campaign is on screen; it has no sound.
 * Touch screens swipe.
 *
 * The still slide is one full-bleed AI concept visual (marked `AI visual`): two
 * generations of the same scene, a 16:9 one from 1024px and a 4:5 one below. Its
 * pale blue sky and quilt meet the satin film at the slide edge; its caption sits
 * in the meadow's sky, in ink (HomeB.module.css has the geometry).
 */
function Campaign() {
  const { index, playing, held, motion, duration, elapsed, live, goTo, next, previous, play, pause, handlers, swipe } = useCarousel({
    count: SLIDE_TONES.length,
    interval: 6000,
    holdOnHover: false,
  });
  const section = useRef<HTMLElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const inView = useInView(section);
  const filmActive = index === FILM_SLIDE;
  const filmPlays = filmActive && motion && inView;
  const moving = playing || filmPlays;

  // The film starts from its first frame, the one its poster shows, whenever its slide arrives.
  useEffect(() => {
    if (filmActive && film.current) film.current.currentTime = 0;
  }, [filmActive]);

  useEffect(() => {
    const video = film.current;
    if (!video) return;
    // A refused autoplay (Low Power Mode, for one) leaves the poster in place. pause() only on a
    // playing film: on one never played it would start loading the file, which preload="none" defers.
    if (filmPlays) video.play().catch(() => {});
    else if (!video.paused) video.pause();
  }, [filmPlays]);

  const slideProps = (i: number) => ({
    className: styles.slide,
    role: 'group',
    'aria-roledescription': 'slide',
    'aria-label': `${i + 1} of ${SLIDE_TONES.length}`,
    'aria-hidden': i !== index || undefined,
    inert: i !== index || undefined,
    'data-tone': SLIDE_TONES[i],
  });

  return (
    <section
      ref={section}
      className={styles.campaign}
      aria-roledescription="carousel"
      aria-label="Petals Heels campaign"
      data-tone={SLIDE_TONES[index]}
      {...handlers}
    >
      <div className={styles.controls}>
        <span className={styles.buttons}>
          <button type="button" className={styles.control} onClick={moving ? pause : play}>
            <Icon name={moving ? 'pause' : 'play'} />
            <span className="sr-only">{moving ? 'Pause' : 'Play'} the campaign</span>
          </button>
          <button type="button" className={`${styles.control} ${styles.arrow}`} onClick={previous}>
            <Icon name="chevronLeft" />
            <span className="sr-only">Previous slide</span>
          </button>
          <button type="button" className={`${styles.control} ${styles.arrow}`} onClick={next}>
            <Icon name="chevronRight" />
            <span className="sr-only">Next slide</span>
          </button>
        </span>
        <ol role="list" className={styles.bars}>
          {SLIDE_TONES.map((tone, i) => (
            <li key={tone}>
              <button type="button" className={styles.bar} aria-current={i === index || undefined} onClick={() => goTo(i)}>
                <BarFill slide={i} current={i === index} playing={playing} running={playing && !held} duration={duration} elapsed={elapsed} />
                <span className="sr-only">
                  Show slide {i + 1} of {SLIDE_TONES.length}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.track} style={{ '--index': index } as CSSProperties} aria-live={live} {...swipe}>
        <div {...slideProps(0)}>
          <Link to={colourHref('rich-brown')} className={styles.campaignPanel} tabIndex={-1} aria-hidden="true">
            <Img
              image={c.meadowTall}
              wide={{ image: c.meadowWide, media: WIDE_FRAME, sizes: '100vw' }}
              sizes="100vw"
              priority
              fill
              position="var(--meadow-pos)"
              className={styles.campaignImg}
              alt=""
            />
          </Link>
          <div className={`${styles.caption} ${styles.skyCaption}`}>
            <h2 className={styles.title}>Petals Heels</h2>
            <p className={styles.line}>
              Rich Brown, out on the clover.
              <ProvenanceMark kind="ai-visual" className={styles.captionMark} />
            </p>
            <Link to={COLLECTION_HREF} className="cta-line">
              Shop Petals Heels
            </Link>
          </div>
        </div>

        <div {...slideProps(FILM_SLIDE)}>
          <Link to={`/products/${PETALS}`} className={styles.filmLink} tabIndex={-1} aria-hidden="true">
            <video ref={film} className={styles.film} muted loop playsInline preload="none" poster={FILM.poster} disablePictureInPicture>
              <source src={FILM.wide} type="video/mp4" media="(min-width: 1024px)" />
              <source src={FILM.tall} type="video/mp4" />
            </video>
          </Link>
          <div className={styles.caption}>
            <h2 className={styles.title}>Satin and organza</h2>
            <p className={styles.line}>
              Pointed satin slingbacks with a layered organza flower at the toe.
              <ProvenanceMark kind="stock-footage" className={styles.captionMark} />
            </p>
            <Link to={`/products/${PETALS}`} className="cta-line">
              Shop now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * A bar's fill: the current slide's grows across its bar over the slide's time,
 * as Jimmy Choo's loading bar does, and holds while the carousel holds. When the
 * slides are not playing, the current bar simply shows full (in CSS).
 */
function BarFill({
  slide,
  current,
  playing,
  running,
  duration,
  elapsed,
}: {
  slide: number;
  current: boolean;
  playing: boolean;
  running: boolean;
  duration: number;
  elapsed: (slide: number) => number;
}) {
  const fill = useRef<HTMLSpanElement>(null);
  const animation = useRef<Animation | null>(null);

  // Layout effects, so a new slide's bar never paints full for a frame before it starts.
  useLayoutEffect(() => {
    const el = fill.current;
    if (!current || !playing || typeof el?.animate !== 'function') return;
    const grow = el.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration, easing: 'linear', fill: 'both' });
    grow.currentTime = elapsed(slide);
    animation.current = grow;
    return () => {
      grow.cancel();
      animation.current = null;
    };
  }, [current, playing, duration, elapsed, slide]);

  useLayoutEffect(() => {
    if (running) animation.current?.play();
    else animation.current?.pause();
  }, [running, current, playing]);

  return <span ref={fill} className={styles.barFill} />;
}

/* ------------------------------------------------------------------ */
/* 2. The strip                                                        */
/* ------------------------------------------------------------------ */

/**
 * Jimmy Choo's product strip: tiles edge to edge with 4px seams. Its tiles
 * carry no words; Whimy's carry the name, the colour and the price, because a
 * shopper choosing between three colours needs them.
 */
/**
 * The strip's packshots: AI concept visuals on one ivory sweep (marked `AI visual` on each
 * tile), in place of crops from the campaign photographs until Whimy's own packshots arrive
 * (PRODUCT-PHOTOGRAPHY.md). A colour without one falls back to its card photograph.
 */
const STRIP_PACKSHOTS: Record<string, ImageSource> = {
  'rich-brown': c.packshotRichBrown,
  'blush-pink': c.packshotBlushPink,
  'sage-green': c.packshotSageGreen,
};
const STRIP_SIZES = '(min-width: 1024px) 25vw, 42vw';

function Strip({ product }: { product?: Product }) {
  const { launchStage } = useUI();
  const copy = launchCopy(launchStage);
  return (
    <section className={styles.strip} aria-labelledby="home-b-strip">
      {/* Jimmy Choo's strip has no visible title; this one heads the tiles' names for screen readers. */}
      <h2 id="home-b-strip" className="sr-only">
        Petals Heels in each colour
      </h2>
      <ul role="list" className={styles.stripList} aria-busy={!product || undefined}>
        {product
          ? [
              ...product.colourways.map((c) => <StripTile key={c.id} product={product} colourway={c} showPrice={copy.showPrice} priceLabel={copy.priceLabel} />),
              <li key="all" className={styles.tile}>
                <Link to={SET_HREF} className={styles.tileMedia} tabIndex={-1} aria-hidden="true">
                  <Img image={c.packshotTrio} sizes={STRIP_SIZES} fill className={styles.tileImg} alt="" />
                </Link>
                <div className={styles.tileText}>
                  <h3 className={styles.tileName}>
                    <Link to={SET_HREF} className={styles.tileLink}>
                      All three
                    </Link>
                  </h3>
                  <p className={styles.tileMeta}>
                    Rich Brown, Blush Pink and Sage Green
                    <ProvenanceMark kind="ai-visual" />
                  </p>
                </div>
              </li>,
            ]
          : [0, 1, 2, 3].map((i) => <li key={i} className={`skeleton ${styles.tileSkeleton}`} />)}
      </ul>
    </section>
  );
}

function StripTile({ product, colourway, showPrice, priceLabel }: { product: Product; colourway: Colourway; showPrice: boolean; priceLabel: string | null }) {
  const href = productPath(product, colourway.id);
  const packshot = STRIP_PACKSHOTS[colourway.id];
  const image = packshot ?? cardImages(colourway).primary;
  return (
    <li className={styles.tile}>
      <Link to={href} className={styles.tileMedia} tabIndex={-1} aria-hidden="true">
        {image && <Img image={image} sizes={STRIP_SIZES} fill className={styles.tileImg} alt="" />}
      </Link>
      <div className={styles.tileText}>
        <h3 className={styles.tileName}>
          <Link to={href} className={styles.tileLink}>
            {product.name}
            <span className="sr-only">, {colourway.name}</span>
          </Link>
        </h3>
        {/* Colour and price on lines of their own: a tile is too narrow on phones for both and a dot between. */}
        <p className={styles.tileMeta}>
          {colourway.name}
          {packshot && <ProvenanceMark kind="ai-visual" />}
        </p>
        <p className={styles.tileMeta}>{showPrice ? <Price amount={product.price.amount} provenance={product.price.provenance} /> : priceLabel}</p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Two doors                                                        */
/* ------------------------------------------------------------------ */

interface Door {
  label: string;
  to: string;
  image: ImageSource;
  position: string;
}

/*
 * The scale-play reveals closed in on the shoe (the whole frames are mostly lime fur, so the
 * choco door read green). Both crops are landscape (about 1.2:1), so in a 4:5 door the picture
 * is drawn about 1.56 times the door's width: hence the sizes below, and a crop aimed at the toe.
 */
const DOOR_SIZES = '(min-width: 768px) 78vw, 156vw';
const DOORS: Door[] = [
  { label: 'Shop choco', to: colourHref('rich-brown'), image: w.chocoGiant, position: '68% 50%' },
  { label: 'Shop kiwi', to: colourHref('sage-green'), image: w.kiwiGiant, position: '35% 50%' },
];

/**
 * Jimmy Choo's 50/50 doors: two 4:5 portraits edge to edge with no headline,
 * only a call to action. The caption is sticky, so the link rides at the
 * bottom of the screen while the tall photograph passes, then lands at its
 * corner; it sits on its own paper ground, so it reads over every part it crosses.
 */
function Doors() {
  return (
    <section className={styles.doors} aria-label="Shop by colour">
      {DOORS.map((door) => (
        <div key={door.label} className={styles.door}>
          <Link to={door.to} className={styles.doorMedia} tabIndex={-1} aria-hidden="true">
            <Img image={door.image} sizes={DOOR_SIZES} fill position={door.position} className={styles.doorImg} alt="" />
          </Link>
          <p className={styles.sticky}>
            <Link to={door.to} className="cta-line">
              {door.label}
            </Link>
          </p>
        </div>
      ))}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. The letter beside its photograph                                 */
/* ------------------------------------------------------------------ */

/** Jimmy Choo's 50/50 showcase, holding Whimy's letter card instead of a carousel. */
function LetterSplit() {
  return (
    <section className={styles.split} aria-labelledby="home-b-letter">
      <div className={styles.splitPanel}>
        <div className={styles.letter}>
          <h2 id="home-b-letter" className={styles.letterTitle}>
            {letter.salutation}
          </h2>
          {letter.paragraphs.slice(0, 2).map((p, i) => (
            <p key={i} className={styles.letterBody}>
              {p}
              {i === 1 && <Mark provenance={letter.provenance} />}
            </p>
          ))}
          <p className={styles.signOff}>{letter.signOff}</p>
        </div>
      </div>
      <div className={styles.door}>
        <Link to="/story#letter" className={styles.doorMedia} tabIndex={-1} aria-hidden="true">
          <Img image={w.bwLetter} sizes="(min-width: 768px) 50vw, 100vw" fill position="50% 50%" className={styles.doorImg} alt="" />
        </Link>
        <p className={styles.sticky}>
          <Link to="/story#letter" className="cta-line">
            Read the letter
          </Link>
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. One full-bleed scene                                             */
/* ------------------------------------------------------------------ */

/**
 * Jimmy Choo's single full-bleed banner: Whimy's launch visual, with nothing laid on it
 * (Jimmy Choo's carries no caption; its busy street would hold none). The 16:9 crop keeps
 * the Petronas towers whole, as Concept A's panel keeps the patches; the words follow below.
 */
function Scene() {
  return (
    <section className={styles.scene} aria-labelledby="home-b-scene">
      {/* A stock photograph (marked): both spires whole at every width, palm fronds above. */}
      <Img image={stockImages.klccTowers} sizes="100vw" fill position="55% 35%" className={styles.sceneImg} />
      <div className={styles.sceneCaption}>
        <h2 id="home-b-scene" className={styles.title}>
          Based in Kuala Lumpur
        </h2>
        <p className={styles.line}>
          Something Pointe &amp; Pretty is walking into this city.
          <ProvenanceMark kind="stock-photo" className={styles.captionMark} />
        </p>
        <Link to="/story" className="cta-line">
          Our story
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Services, in words                                               */
/* ------------------------------------------------------------------ */

const SERVICES = [
  { label: 'Size & fit', to: `/help#${helpAnchors.sizeFit}` },
  { label: 'Delivery', to: `/help#${helpAnchors.delivery}` },
  { label: 'Exchanges', to: `/help#${helpAnchors.exchanges}` },
  { label: 'Satin & organza care', to: `/help#${helpAnchors.care}` },
  { label: 'Questions', to: `/help#${helpAnchors.faq}` },
  { label: 'Message us', to: `/help#${helpAnchors.contact}` },
];

/** Jimmy Choo's "Exclusive Services" row, kept to text, for what a first-time buyer asks. */
function Services() {
  return (
    <nav className={styles.services} aria-labelledby="home-b-services">
      <h2 id="home-b-services" className={styles.servicesTitle}>
        Before you buy
      </h2>
      <ul role="list" className={styles.servicesList} style={{ '--count': SERVICES.length } as CSSProperties}>
        {SERVICES.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className={styles.service}>
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
