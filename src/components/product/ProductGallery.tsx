import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { Colourway, ImageSource, Product } from '../../domain/types';
import { whimyImages } from '../../data/assets';
import { timeline } from '../../data/content';
import { usePrefersReducedMotion } from '../../hooks/dom';
import { Img } from '../ui/Img';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './ProductGallery.module.css';

/** Rendered width of the lead and full-width frames (also used to warm other colours' leads). */
export const LEAD_SIZES = '(min-width: 1530px) 704px, (min-width: 1024px) 46vw, (min-width: 768px) 50vw, 100vw';
const HALF_SIZES = '(min-width: 1530px) 348px, (min-width: 1024px) 23vw, (min-width: 768px) 50vw, 100vw';

type Shape = 'lead' | 'half';

interface Frame {
  key: string;
  image: ImageSource;
  /** lead: full width, a fixed 3:4 on desktop (native 4:5 for a sample); half: a 4:5 frame in the 2-up row. Every frame is 4:5 in the strip. */
  shape: Shape;
  /** Factual line: the caption of every frame but the desktop lead, and the zoom caption. */
  label: string;
  /** A sample style's stock photograph (/preview/catalogue only), captioned "sample image". */
  sample?: boolean;
}

/** Captions come from the post each photograph was published in (content.ts), never written for it. */
function describe(image: ImageSource): string {
  return timeline.find((post) => post.image && whimyImages[post.image].key === image.key)?.line ?? image.alt;
}

/**
 * Frames per colour: the colour's own photographs (a lead, then 2-up rows),
 * then the photograph of all three, so a colour change swaps the whole stack.
 * A row left half-empty is completed by the black-and-white still life. A
 * sample style (on /preview/catalogue only) shows its one stock photograph.
 */
function framesFor(product: Product, colourway: Colourway): Frame[] {
  const frame = (image: ImageSource, shape: Shape, extra?: Partial<Frame>): Frame => ({
    key: image.key,
    image,
    shape,
    label: describe(image),
    ...extra,
  });
  const [own, ...more] = colourway.images;
  if (product.kind === 'sample') {
    return own ? [frame(own, 'lead', { label: `${product.name} in ${colourway.name}`, sample: true })] : [];
  }
  const frames: Frame[] = [];
  if (own) frames.push(frame(own, 'lead'));
  frames.push(...more.map((image) => frame(image, 'half')));
  if (product.colourways.length > 1) frames.push(frame(whimyImages.groupThreeColours, 'half'));
  if (frames.filter((f) => f.shape === 'half').length % 2) frames.push(frame(whimyImages.bwLetter, 'half'));
  return frames;
}

/** The image a colour's gallery opens on, so the page can fetch it before a colour change. */
// eslint-disable-next-line react/only-export-components -- shares framesFor with the gallery it describes
export function leadImage(product: Product, colourway: Colourway): ImageSource | undefined {
  return framesFor(product, colourway)[0]?.image;
}

/**
 * The colour's verified note in Fell italic, with its source. The gallery
 * shows it under the lead on desktop; below 1024px the buy box shows it.
 */
export function ColourNote({ note, className }: { note: NonNullable<Colourway['note']>; className?: string }) {
  return (
    <span className={`${styles.colourNote} ${className ?? ''}`}>
      <span className={`v-1 ${styles.note}`}>“{note.text}”</span>
      {note.sourceUrl && (
        <a className={`link ${styles.source}`} href={note.sourceUrl} target="_blank" rel="noreferrer">
          Whimy on Instagram<span aria-hidden="true">{'\u00a0'}↗</span>
          <span className="sr-only"> (opens in new tab)</span>
        </a>
      )}
    </span>
  );
}

interface Props {
  product: Product;
  colourway: Colourway;
}

/**
 * Desktop: a stack (the lead, then a 2-up row of 4:5 frames). Below 1024px: a
 * scroll-snap strip with a counter under each frame. Any frame opens the zoom
 * dialog. Colour changes are cross-faded by the page (a view transition).
 */
export function ProductGallery({ product, colourway }: Props) {
  const frames = framesFor(product, colourway);
  const count = frames.length;
  const stripRef = useRef<HTMLUListElement>(null);
  const [zoom, setZoom] = useState({ open: false, index: 0 });
  const reducedMotion = usePrefersReducedMotion();

  // A new colour starts the strip at its lead frame, before the new state is painted.
  useLayoutEffect(() => {
    if (stripRef.current) stripRef.current.scrollLeft = 0;
  }, [colourway.id]);

  const step = (delta: 1 | -1) => {
    const strip = stripRef.current;
    if (!strip) return;
    const items = Array.from(strip.children) as HTMLElement[];
    const pitch = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : strip.clientWidth;
    const current = Math.round(strip.scrollLeft / pitch);
    const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
    const next = delta > 0 ? (atEnd ? 0 : current + 1) : current <= 0 ? items.length - 1 : current - 1;
    strip.scrollTo({ left: items[next].offsetLeft - items[0].offsetLeft, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className={styles.gallery}>
      <ul ref={stripRef} role="list" className={styles.frames} aria-label={`${product.name} in ${colourway.name}, ${count} images`}>
        {frames.map((frame, i) => {
          const note = i === 0 ? colourway.note : undefined;
          const sizes = frame.shape === 'half' ? HALF_SIZES : LEAD_SIZES;
          return (
            <li key={frame.key} className={styles.frame} data-shape={frame.shape} data-sample={frame.sample || undefined}>
              <figure className={styles.figure}>
                <div className={styles.media} style={i === 0 ? { viewTransitionName: 'product-hero' } : undefined}>
                  <Img image={frame.image} sizes={sizes} priority={i === 0} className={styles.crop} />
                  <button
                    type="button"
                    className={styles.hit}
                    aria-label={`Enlarge image ${i + 1} of ${count}`}
                    aria-haspopup="dialog"
                    onClick={() => setZoom({ open: true, index: i })}
                  />
                </div>
                <figcaption className={`caption ${styles.caption}`}>
                  {count > 1 && (
                    <span className={`num ${styles.count}`} aria-hidden="true">
                      {i + 1} / {count}
                    </span>
                  )}
                  {note ? (
                    <>
                      <span className={styles.stripLabel}>{frame.label}</span>
                      <ColourNote note={note} className={styles.leadNote} />
                    </>
                  ) : (
                    frame.label
                  )}
                  {frame.sample && <ProvenanceMark kind="sample-image" />}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      {count > 1 && (
        <div className={styles.steps}>
          <button type="button" className={styles.step} onClick={() => step(-1)}>
            Previous<span className="sr-only"> image</span>
          </button>
          <button type="button" className={styles.step} onClick={() => step(1)}>
            Next<span className="sr-only"> image</span>
          </button>
        </div>
      )}

      <ZoomDialog
        frames={frames}
        open={zoom.open}
        index={zoom.index}
        onIndex={(index) => setZoom({ open: true, index })}
        onClose={() => setZoom((z) => ({ ...z, open: false }))}
      />
    </div>
  );
}

interface ZoomProps {
  frames: Frame[];
  open: boolean;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}

/**
 * The whole photograph on paper, fitted to the screen under the bar and never
 * above 1x source, with its caption and an ivory bar of text buttons. Arrow keys step through.
 */
function ZoomDialog({ frames, open, index, onIndex, onClose }: ZoomProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const count = frames.length;
  const position = Math.min(index, count - 1);
  const frame = frames[position];
  const cap = frame?.image.maxCssWidth ?? frame?.image.width;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      closeRef.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = (delta: number) => onIndex((position + delta + count) % count);

  // The figure is one column as wide as the photo can be: the screen, its 1x cap, or the height left under the bar.
  const fit = frame
    ? ({ '--zoom-cap': `${cap}px`, '--zoom-ratio': frame.image.width / frame.image.height } as CSSProperties)
    : undefined;

  return (
    <dialog
      ref={ref}
      className={styles.zoom}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(-1);
        }
      }}
    >
      <div className={styles.zoomBar}>
        <h2 id={titleId} className={`t-small num ${styles.zoomTitle}`}>
          <span className="sr-only">
            Image {position + 1} of {count}
          </span>
          <span aria-hidden="true">
            {position + 1} / {count}
          </span>
        </h2>
        <div className={styles.zoomActions}>
          {count > 1 && (
            <>
              <button type="button" className={styles.zoomButton} onClick={() => go(-1)}>
                Previous
              </button>
              <button type="button" className={styles.zoomButton} onClick={() => go(1)}>
                Next
              </button>
            </>
          )}
          <button ref={closeRef} type="button" className={styles.zoomButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      {frame && (
        <figure className={styles.zoomFigure} style={fit}>
          <Img key={frame.key} image={frame.image} sizes={cap ? `(min-width: ${cap + 64}px) ${cap}px, 100vw` : '100vw'} />
          <figcaption className={`caption ${styles.zoomCaption}`}>
            {frame.label}
            {frame.sample && <ProvenanceMark kind="sample-image" />}
          </figcaption>
        </figure>
      )}
    </dialog>
  );
}
