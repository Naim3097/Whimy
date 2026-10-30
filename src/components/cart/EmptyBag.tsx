import { ColourExits } from './ColourExits';
import styles from './EmptyBag.module.css';

/** "Your bag is empty.", then the three colours as the way back in. Used by the drawer, /bag and checkout. */
export function EmptyBag({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className={styles.empty}>
      <p className="v-1">Your bag is empty.</p>
      <ColourExits onNavigate={onNavigate} />
    </div>
  );
}
