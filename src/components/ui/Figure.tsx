import type { ReactNode } from 'react';
import { Link } from 'react-router';
import type { ImageSource } from '../../domain/types';
import { Img } from './Img';
import { ProvenanceMark } from './ProvenanceMark';
import styles from './Figure.module.css';

interface FigureProps {
  image: ImageSource;
  sizes: string;
  /** Usually names the colour shown and links to it: the caption carries the real link. */
  caption?: ReactNode;
  /** Makes the picture a pointer target for the same destination as the caption link. */
  href?: string;
  priority?: boolean;
  /** 4/5 is the only allowed crop of a portrait (cover panels, PDP 2-up, cards). */
  ratio?: 'native' | '4/5';
  className?: string;
  imgClassName?: string;
}

/**
 * An editorial photograph with its 12px caption. The figure shares the
 * image's resolution cap, so the caption always lines up with the picture.
 */
export function Figure({ image, sizes, caption, href, priority, ratio = 'native', className, imgClassName }: FigureProps) {
  const sample = image.origin === 'sample';
  const hasCaption = caption != null || sample || image.aiGenerated;
  const imgClass = [ratio === '4/5' ? styles.portrait : '', imgClassName ?? ''].filter(Boolean).join(' ');

  return (
    <figure
      className={`${styles.figure} ${className ?? ''}`}
      style={image.maxCssWidth ? { maxInlineSize: `${image.maxCssWidth}px` } : undefined}
    >
      <span className={styles.media}>
        <Img image={image} sizes={sizes} priority={priority} className={imgClass || undefined} />
        {href && (
          // A pointer shortcut only: keyboard and screen-reader users reach the caption link instead.
          <Link to={href} className={styles.hit} aria-hidden="true" tabIndex={-1} />
        )}
      </span>
      {hasCaption && (
        <figcaption className="caption">
          {caption}
          {sample && <ProvenanceMark kind="sample-image" standalone={caption == null} />}
          {image.aiGenerated && (
            <span>{caption != null ? ' · ' : ''}AI-generated visual, labelled “AI content” on Instagram</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
