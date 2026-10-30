import { ColourLine } from '../cart/ColourLine';
import { Img } from '../ui/Img';
import { Price } from '../ui/Price';
import type { SummaryLineData } from './summaryLine';
import styles from './SummaryLines.module.css';

/** Order summary lines: a 64px thumbnail, the colour in words and "× 1" as text. */
export function SummaryLines({ lines }: { lines: SummaryLineData[] }) {
  return (
    <ul role="list" className={styles.lines}>
      {lines.map((l) => (
        <li key={l.key} className={styles.line}>
          {/* Sample styles keep their stand-in photographs on /preview/catalogue. */}
          {l.image?.origin === 'whimy' ? (
            <Img image={l.image} sizes="64px" alt="" className={styles.thumb} />
          ) : (
            <span className={`${styles.thumb} ${styles.blank}`} />
          )}
          <div className={styles.text}>
            <p className={styles.head}>
              <span className="t-ui">{l.name}</span>
              <Price amount={l.amount} provenance={l.provenance} className={styles.price} />
            </p>
            <ColourLine nickname={l.nickname} name={l.colourName} swatch={l.swatch} details={[`EU ${l.size}`, `× ${l.quantity}`]} />
          </div>
        </li>
      ))}
    </ul>
  );
}
