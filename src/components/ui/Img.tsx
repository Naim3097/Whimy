import { useState, type CSSProperties, type SyntheticEvent } from 'react';
import type { ImageSource } from '../../domain/types';
import styles from './Img.module.css';

interface ImgProps {
  image: ImageSource;
  /** Accurate rendered widths, so phones never fetch more than they show. */
  sizes: string;
  /** Lands on the image box. The photograph always fills the box (object-fit: cover). */
  className?: string;
  /** Above the fold: eager, high fetch priority, no fade. */
  priority?: boolean;
  /**
   * Load now at normal priority: for slides waiting off-screen in a carousel
   * track, which lazy loading would otherwise leave blank until they slide in.
   */
  eager?: boolean;
  /** Override alt (e.g. empty for a decorative duplicate). */
  alt?: string;
  style?: CSSProperties;
  /**
   * Fill the container even past the sharpness cap. Only for edge-to-edge
   * layouts (hero panels, product tiles), where a capped box would leave a gap.
   */
  fill?: boolean;
  /** object-position for this placement, overriding the image's own focal point. */
  position?: string;
  /**
   * Art direction: a second image for the same place, framed for wider screens,
   * used where `media` matches (a <picture> source). `image` stays the fallback.
   */
  wide?: { image: ImageSource; media: string; sizes: string };
}

const worldGround: Record<NonNullable<ImageSource['world']>, string> = {
  scale: 'var(--studio)',
  sample: 'var(--studio)',
  sky: 'var(--sky)',
  still: 'var(--ivory)',
  graphic: 'var(--ivory)',
  brand: 'var(--ivory)',
};

function groundFor(image: ImageSource): string {
  if (image.dominant) return image.dominant;
  if (image.key === 'group-three-colours') return 'var(--turf)';
  return image.world ? worldGround[image.world] : 'var(--ivory)';
}

const warned = new Set<string>();

function warnIfStretched(image: ImageSource, img: HTMLImageElement) {
  const cap = image.maxCssWidth;
  const box = img.parentElement;
  const container = box?.parentElement;
  if (!cap || !box || !container || warned.has(image.key)) return;
  const width = container.getBoundingClientRect().width;
  if (box.getBoundingClientRect().width >= cap - 0.5 && width > cap + 1) {
    warned.add(image.key);
    console.warn(`[Img] ${image.key} is held at its ${cap}px cap; its container is ${Math.round(width)}px wide.`);
  }
}

/**
 * Whimy photographs, shown untouched: never wider than floor(source / 1.25),
 * on their dominant (or world) colour while loading, faded in once decoded.
 * A failed load retries once with the plain src (a different file from the
 * srcset pick); if that fails too, the box becomes a quiet studio-grey frame
 * with a small Fell SC label, never a broken-image icon.
 */
export function Img({ image, sizes, className, priority, eager, alt, style, fill, position, wide }: ImgProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [retriedSrc, setRetriedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const label = alt ?? image.alt;
  const retrying = retriedSrc === image.src;

  const boxStyle = {
    '--img-ground': groundFor(image),
    '--img-ratio': `${image.width} / ${image.height}`,
    ...style,
    ...(image.maxCssWidth && !fill ? { maxInlineSize: `${image.maxCssWidth}px` } : null),
  } as CSSProperties;

  if (failedSrc === image.src) {
    return (
      <span
        className={`${styles.box} ${styles.failed} ${className ?? ''}`}
        style={boxStyle}
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
      >
        <span className={`sc ${styles.failedText}`} aria-hidden="true">
          {image.origin === 'sample' ? 'sample image' : 'image to come'}
        </span>
      </span>
    );
  }

  const onLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    setLoadedSrc(image.src);
    if (import.meta.env.DEV && !fill) warnIfStretched(image, e.currentTarget);
  };

  const img = (
    <img
      key={retrying ? 'retry' : 'first'}
      className={styles.img}
      data-shown={priority || loadedSrc === image.src ? '' : undefined}
      src={image.src}
      srcSet={retrying ? undefined : image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={label}
      loading={priority || eager ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      style={position ? { objectPosition: position } : image.focus ? { objectPosition: `${image.focus.x}% ${image.focus.y}%` } : undefined}
      onLoad={onLoad}
      onError={() => (retrying ? setFailedSrc(image.src) : setRetriedSrc(image.src))}
    />
  );

  return (
    <span className={`${styles.box} ${className ?? ''}`} style={boxStyle}>
      {/* A retry keeps the art direction: each frame retries with its own plain file. */}
      {wide ? (
        <picture className={styles.picture}>
          <source
            media={wide.media}
            srcSet={retrying ? wide.image.src : wide.image.srcSet}
            sizes={retrying ? undefined : wide.sizes}
            width={wide.image.width}
            height={wide.image.height}
          />
          {img}
        </picture>
      ) : (
        img
      )}
    </span>
  );
}
