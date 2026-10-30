import { useId } from 'react';
import { useCatalog } from '../../state/catalog';
import { MiniCard } from '../product/ProductCard';
import { PETALS_ID } from './petals';
import styles from './ColourExits.module.css';

/**
 * The three Petals colours as mini cards (64 × 80 lead photograph, name,
 * *nickname* · Official Name, price): the way back in from an empty bag, an
 * empty Saved list and the 404. Stacked where room is narrow (the drawer,
 * phones), three across from 600px.
 */
export function ColourExits({ heading, onNavigate }: { heading?: string; onNavigate?: () => void }) {
  const id = useId();
  const petals = useCatalog().productById(PETALS_ID);

  return (
    <div className={styles.exits}>
      {heading && (
        <p id={id} className={`t-small muted ${styles.heading}`}>
          {heading}
        </p>
      )}
      <ul
        role="list"
        className={styles.list}
        aria-labelledby={heading ? id : undefined}
        aria-label={heading ? undefined : 'Petals Heels colours'}
        aria-busy={petals ? undefined : true}
      >
        {petals
          ? petals.colourways.map((c) => (
              <li key={c.id}>
                <MiniCard product={petals} colourway={c} onNavigate={onNavigate} />
              </li>
            ))
          : // Held at the cards' height while the catalogue loads, so nothing jumps.
            [0, 1, 2].map((i) => <li key={i} className={styles.ghost} aria-hidden="true" />)}
      </ul>
    </div>
  );
}
