import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { site } from '../config/site';
import { whimyImages, type WhimyImageKey } from '../data/assets';
import { letter, timeline, type TimelineEntry } from '../data/content';
import type { ImageSource } from '../domain/types';
import { SET_HREF } from '../components/layout/nav';
import { Figure } from '../components/ui/Figure';
import { Img } from '../components/ui/Img';
import { Mark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import { ExternalLink } from './InfoPages';
import styles from './StoryPage.module.css';

const colour = (id: 'rich-brown' | 'blush-pink' | 'sage-green') => `/products/petals-heels?colour=${id}`;
const ratio = (image: ImageSource) => String(image.height / image.width);

/** Photographs shown in the lookbook; the timeline points back to them instead of repeating them. */
const IN_LOOKBOOK: WhimyImageKey[] = ['greenScalePlay', 'brownScalePlay', 'brownSkyLegs', 'pinkReveal', 'groupThreeColours', 'pairsGrid'];
/** Graphic posts: never content, shown only as 160px archive thumbnails here. */
const THUMBNAILS: WhimyImageKey[] = ['pointePretty', 'klPatches', 'saveTheDate', 'guessTeaser'];

function Nick({ children }: { children: ReactNode }) {
  return <span className={styles.nick}>{children}</span>;
}

/** A caption is the focusable link to the colour shown; the picture above it is a pointer shortcut. */
function CaptionLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="link-quiet">
      {children}
      {'\u00a0'}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

/** A no-break space, so the arrow keeps its gap inside inline-flex links and never wraps alone. */
const Arrow = () => <span aria-hidden="true">{'\u00a0'}↗</span>;

/**
 * /story: Whimy in its own words and pictures. The letter, every real
 * photograph once (scale, horizon and reveal pairs), the first ten days on
 * Instagram, and a KL sign-off.
 */
export function StoryPage() {
  usePageMeta('Story', 'Whimy, in its own words and pictures: the Dear Whimy Babes letter, the Petals lookbook and the first ten days.');
  return (
    <article className={styles.story}>
      <h1 className="sr-only">Our story</h1>
      <Letter />
      <Lookbook />
      <FirstTenDays />
      <SignOff />
    </article>
  );
}

/** The whole letter card, as type beside the photograph of it. The homepage links here (#letter). */
function Letter() {
  const last = letter.paragraphs.length - 1;
  return (
    <section id="letter" className={`wrap grid ${styles.letter}`} aria-labelledby="letter-title">
      <Figure
        image={whimyImages.bwLetter}
        sizes="(min-width: 1024px) min(52vw, 819px), (min-width: 768px) 78vw, 100vw"
        priority
        className={styles.letterFigure}
        caption={
          <>
            The letter card, posted {letter.date} ·{' '}
            <ExternalLink href={letter.sourceUrl} className="link-quiet">
              View on Instagram
              <Arrow />
            </ExternalLink>
          </>
        }
      />
      <div className={styles.letterText}>
        <h2 id="letter-title" className={`v-2 ${styles.salutation}`}>
          {letter.salutation}
        </h2>
        <div className={`letter ${styles.letterBody}`}>
          {letter.paragraphs.map((paragraph, i) => (
            <p key={paragraph}>
              {paragraph}
              {i === last && <Mark provenance={letter.provenance} />}
            </p>
          ))}
        </div>
        <p className={styles.signature}>
          <span className={styles.signatureWord}>{letter.signOff}</span>
        </p>
      </div>
    </section>
  );
}

function Lookbook() {
  const { greenScalePlay, brownScalePlay, brownSkyLegs, pinkReveal, groupThreeColours, pairsGrid } = whimyImages;
  const horizonVars = {
    '--big-ratio': ratio(brownSkyLegs),
    '--big-horizon': String(brownSkyLegs.horizon ?? 0),
    '--small-ratio': ratio(pinkReveal),
    '--small-horizon': String(pinkReveal.horizon ?? 0),
  } as CSSProperties;
  const revealVars = {
    '--g-ratio': ratio(groupThreeColours),
    '--g-horizon': String(groupThreeColours.horizon ?? 0),
  } as CSSProperties;

  return (
    <section id="lookbook" className={`wrap ${styles.lookbook}`} aria-labelledby="lookbook-title">
      {/* Scale: the giant heel big, its sister frame small. */}
      <div className={`grid ${styles.scalePair}`}>
        <div className={styles.lookbookHead}>
          <h2 id="lookbook-title" className="sc">
            the lookbook
          </h2>
          <blockquote className={styles.quote} cite={letter.sourceUrl}>
            <p className="v-1">“Every girl deserves a pair of heels that feels like it was just made for her.”</p>
            <ExternalLink href={letter.sourceUrl} className={`link t-cap ${styles.source}`}>
              on Instagram
              <Arrow />
            </ExternalLink>
          </blockquote>
        </div>
        <Figure
          image={greenScalePlay}
          sizes="(min-width: 1024px) min(52vw, 844px), (min-width: 768px) 62vw, 100vw"
          href={colour('sage-green')}
          className={styles.scaleBig}
          caption={
            <CaptionLink to={colour('sage-green')}>
              <Nick>kiwi</Nick> · Sage Green, on set
            </CaptionLink>
          }
        />
        <Figure
          image={brownScalePlay}
          sizes="(min-width: 1024px) 24vw, (min-width: 768px) 34vw, 60vw"
          href={colour('rich-brown')}
          className={styles.scaleSmall}
          caption={
            <CaptionLink to={colour('rich-brown')}>
              <Nick>choco</Nick> · Rich Brown, on set
            </CaptionLink>
          }
        />
      </div>

      {/* Horizon: both turf lines on one y, joined by a 1px turf rule. */}
      <div className={styles.horizon}>
        <div className={styles.horizonRow} style={horizonVars}>
          <Figure
            image={brownSkyLegs}
            sizes="(min-width: 1024px) min(52vw, 704px), (min-width: 768px) 58vw, 62vw"
            href={colour('rich-brown')}
            className={styles.horizonBig}
            caption={
              <CaptionLink to={colour('rich-brown')}>
                <Nick>choco</Nick> · Rich Brown, on the painted sky
              </CaptionLink>
            }
          />
          <span className={styles.turf} aria-hidden="true" />
          <Figure
            image={pinkReveal}
            sizes="(min-width: 1024px) min(24vw, 360px), 34vw"
            href={colour('blush-pink')}
            className={styles.horizonSmall}
            caption={
              <CaptionLink to={colour('blush-pink')}>
                <Nick>strawberry</Nick> · Blush Pink, on the grass
              </CaptionLink>
            }
          />
        </div>
      </div>

      {/* Reveal: the black-and-white pairs, then all three in colour. The small frame hangs from the group's horizon. */}
      <div className={`grid ${styles.reveal}`} style={revealVars}>
        <Figure
          image={pairsGrid}
          sizes="(min-width: 1024px) 24vw, (min-width: 768px) 34vw, 50vw"
          href="/shop/petals-collection"
          className={styles.revealSmall}
          imgClassName={styles.multiply}
          caption={<CaptionLink to="/shop/petals-collection">The pairs in black and white, from the 28 Oct reel</CaptionLink>}
        />
        <Figure
          image={groupThreeColours}
          sizes="(min-width: 1024px) min(52vw, 729px), (min-width: 768px) 54vw, 100vw"
          href={SET_HREF}
          className={styles.revealBig}
          caption={
            <CaptionLink to={SET_HREF}>
              <Nick>all three</Nick> · Rich Brown, Blush Pink and Sage Green, on the grass
            </CaptionLink>
          }
        />
      </div>
    </section>
  );
}

/** Groups the 13 posts by day, keeping their order. */
function byDay(entries: TimelineEntry[]) {
  const days: { date: string; iso: string; entries: TimelineEntry[] }[] = [];
  for (const entry of entries) {
    const day = days.find((d) => d.iso === entry.iso);
    if (day) day.entries.push(entry);
    else days.push({ date: entry.date, iso: entry.iso, entries: [entry] });
  }
  return days;
}

function FirstTenDays() {
  return (
    <section className={`wrap grid ${styles.days}`} aria-labelledby="days-title">
      <header className={styles.daysHead}>
        <h2 id="days-title" className="v-3">
          The first ten days
        </h2>
        <p className="t-small muted">19 to 28 October 2026, on Instagram.</p>
      </header>
      <ol className={`rows ${styles.dayList}`}>
        {byDay(timeline).map((day) => (
          <li key={day.iso} className={styles.day}>
            <time dateTime={day.iso} className={`num ${styles.date}`}>
              {day.date}
            </time>
            <ul className={styles.posts}>
              {day.entries.map((entry) => (
                <Post key={entry.url} entry={entry} />
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Post({ entry }: { entry: TimelineEntry }) {
  const thumbnail = entry.image && THUMBNAILS.includes(entry.image) ? whimyImages[entry.image] : null;
  return (
    <li className={styles.post}>
      <div>
        <p className={styles.postLine}>{entry.line}</p>
        <p className={`t-small ${styles.postLinks}`}>
          <ExternalLink href={entry.url}>
            View on Instagram
            <Arrow />
          </ExternalLink>
          {entry.image === 'bwLetter' && (
            <a href="#letter" className="link-quiet">
              Read the letter
            </a>
          )}
          {entry.image && IN_LOOKBOOK.includes(entry.image) && (
            <a href="#lookbook" className="link-quiet">
              In the lookbook
            </a>
          )}
        </p>
      </div>
      {thumbnail && <Figure image={thumbnail} sizes="160px" className={styles.thumb} />}
    </li>
  );
}

function SignOff() {
  return (
    <section className={`wrap grid ${styles.signOff}`} aria-labelledby="signoff-title">
      <Img image={whimyImages.patchesTrio} sizes="(min-width: 1024px) 320px, (min-width: 768px) 30vw, 72vw" className={styles.postcard} />
      <div className={styles.signOffText}>
        <h2 id="signoff-title" className={`sc ${styles.kl}`}>
          from kuala lumpur
        </h2>
        <p className="v-2">the heels of that girl next door</p>
        <div className={styles.actions}>
          <Link to="/shop/petals-collection" className="btn btn--lg">
            Shop Petals Heels
          </Link>
          <ExternalLink href={site.social.instagram}>
            @whimy.official on Instagram
            <Arrow />
          </ExternalLink>
        </div>
      </div>
    </section>
  );
}
