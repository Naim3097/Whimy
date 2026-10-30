import { Link } from 'react-router';
import { concepts, type ConceptId } from '../../config/concepts';
import styles from './ConceptSwitch.module.css';

/**
 * For the client presentation only: names the homepage concept on screen and
 * switches to the other. It sits in the bar above the header on the two
 * homepages and in the menu, never over the page. The bag, Saved and every
 * other piece of state are shared, so switching loses nothing.
 */
export function ConceptSwitch({ current, className }: { current: ConceptId; className?: string }) {
  return (
    <nav className={`${styles.switch} ${className ?? ''}`} aria-label="Homepage concepts">
      <span className={styles.label}>Homepage</span>
      <ul role="list" className={styles.options}>
        {(['a', 'b'] as const).map((id) => (
          <li key={id}>
            <Link
              to={concepts[id].home}
              className={styles.option}
              aria-current={id === current ? 'page' : undefined}
              title={`${concepts[id].label}, after ${concepts[id].reference.name}`}
            >
              {id.toUpperCase()}
              <span className="sr-only">: {concepts[id].label}, after {concepts[id].reference.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
