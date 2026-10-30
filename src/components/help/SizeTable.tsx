import type { Provenance, Size } from '../../domain/types';
import { Mark, ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './SizeTable.module.css';

/**
 * Common EU conversions for women's shoes. Whimy has not published its size
 * range or fit, so both columns carry a provenance mark.
 */
const SIZE_CHART: { eu: Size; cm: string }[] = [
  { eu: 35, cm: '22.3' },
  { eu: 36, cm: '23.0' },
  { eu: 37, cm: '23.7' },
  { eu: 38, cm: '24.3' },
  { eu: 39, cm: '25.0' },
  { eu: 40, cm: '25.7' },
  { eu: 41, cm: '26.3' },
];

const PETALS_SIZES: Size[] = [35, 36, 37, 38, 39, 40];

const STEPS = [
  'Stand on a sheet of paper with your heel against a wall. Measure in the evening, when feet are at their largest.',
  'Mark the tip of your longest toe and measure from the wall to the mark in centimetres.',
  'Measure both feet and use the longer one to find your size in the table.',
];

interface SizeFitProps {
  highlight?: Size | null;
  /** The style the table is for. Help and the Petals drawer leave these at Petals Heels. */
  name?: string;
  sizes?: Size[];
  sizeProvenance?: Provenance;
  /** The kitten-heel line belongs to Petals only. */
  heelNote?: boolean;
}

/**
 * Size & fit, shared by the PDP size drawer and Help: a live-text table of
 * EU sizes against foot length, how to measure, and the heel note.
 */
export function SizeFit({ highlight, name = 'Petals Heels', sizes = PETALS_SIZES, sizeProvenance = 'assumption', heelNote = true }: SizeFitProps) {
  const rows = SIZE_CHART.filter((row) => sizes.includes(row.eu));
  return (
    <div className={styles.fit}>
      <table className={styles.table}>
        <caption className="sr-only">{name} sizes, EU, with foot length in centimetres</caption>
        <thead>
          <tr>
            <th scope="col">
              Size (EU)
              <Mark provenance={sizeProvenance} />
            </th>
            <th scope="col">
              Foot length (cm)
              <ProvenanceMark kind="tbc" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.eu} data-highlight={highlight === row.eu || undefined}>
              <th scope="row">
                EU {row.eu}
                {highlight === row.eu && (
                  <span className={styles.yours}>
                    <span className="sr-only">, </span>your size
                  </span>
                )}
              </th>
              <td>{row.cm}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.measure}>
        <h3 className="t-ui">How to measure</h3>
        <ol className={styles.steps}>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      {heelNote && (
        <p className={`t-small ${styles.heel}`}>
          Kitten heel, exact height
          <ProvenanceMark kind="tbc" />
        </p>
      )}
    </div>
  );
}
