import { useId, type CSSProperties } from 'react';
import type { Colourway } from '../../domain/types';
import { isColourwayAvailable } from '../../lib/catalog';
import styles from './ColourSwatches.module.css';

interface Props {
  colourways: Colourway[];
  selectedId: string;
  onChange: (colourId: string) => void;
  /** Group label; the selected colour's official name follows it ("Colour: Rich Brown"). */
  legend?: string;
  name?: string;
}

/**
 * Fabric-cut swatches on native radio inputs, so arrow keys, touch and screen
 * readers work out of the box. Selection is shown by an ink outline and named
 * in the legend, never by colour alone. Colours sold out in every size are struck and disabled.
 */
export function ColourSwatches({ colourways, selectedId, onChange, legend = 'Colour', name }: Props) {
  const groupName = useId() + (name ?? 'colour');
  const selected = colourways.find((c) => c.id === selectedId);
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        {legend}
        {selected && `: ${selected.name}`}
      </legend>
      <div className={styles.options}>
        {colourways.map((c) => {
          const available = isColourwayAvailable(c);
          return (
            <label key={c.id} className={styles.option} data-out={!available || undefined}>
              <input
                type="radio"
                className="sr-only"
                name={groupName}
                value={c.id}
                checked={c.id === selectedId}
                disabled={!available}
                onChange={() => onChange(c.id)}
              />
              <span className={styles.cut} style={{ '--cut': c.swatch.base } as CSSProperties} aria-hidden="true" />
              <span className="sr-only">
                {c.nickname ? `${c.nickname}, ` : ''}
                {c.name}
                {!available && ', sold out'}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
