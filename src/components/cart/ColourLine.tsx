import type { CSSProperties, ReactNode } from 'react';
import styles from './ColourLine.module.css';

interface ColourLineProps {
  /** "choco"; sample styles have none. */
  nickname?: string;
  /** The official name, "Rich Brown". */
  name: string;
  /** The chip's colour. */
  swatch?: string;
  /** What follows the colour, each part whole: "EU 37", "× 1". */
  details?: ReactNode[];
  className?: string;
}

/**
 * chip + *choco* · Rich Brown · EU 37, the colour line of every commerce row.
 * The colour and its official name stay together; when the line runs out of
 * room the details wrap whole onto the next line, which never opens with "·".
 */
export function ColourLine({ nickname, name, swatch, details = [], className }: ColourLineProps) {
  return (
    <p className={`${styles.line} ${className ?? ''}`}>
      <span className={styles.colour}>
        {swatch && <span className="chip" style={{ '--chip': swatch } as CSSProperties} aria-hidden="true" />}
        {nickname && <span className="v-0">{nickname}</span>}
        <span className={`t-small muted ${nickname ? styles.part : ''}`}>{name}</span>
      </span>
      {details.map((detail, i) => (
        <span key={i} className={`t-small muted ${styles.part}`}>
          {detail}
        </span>
      ))}
    </p>
  );
}
