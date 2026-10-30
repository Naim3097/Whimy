import { useId } from 'react';
import { SET_CODE, SET_PERCENT } from '../../data/mock/commerce';
import { launchCopy } from '../../lib/launch';
import { useCart } from '../../state/cart';
import { useCatalog } from '../../state/catalog';
import { useUI } from '../../state/ui';
import { MiniCard } from '../product/ProductCard';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import { PETALS_ID, petalsColoursIn } from './petals';
import styles from './SetNudge.module.css';

/**
 * While the bag holds one or two of the three Petals colours: one line, "Make
 * it all three: 15% off with PETALS3", and a mini card for each missing colour.
 * A card opens its colour, where she chooses a size; nothing is added from
 * here. With all three in, the code itself is offered by PromoCodeForm instead.
 */
export function SetNudge({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const id = useId();
  const { resolved } = useCart();
  const { productById } = useCatalog();
  const { launchStage } = useUI();
  const petals = productById(PETALS_ID);
  if (!petals || !launchCopy(launchStage).showPrice) return null;

  const inBag = petalsColoursIn(resolved);
  const missing = petals.colourways.filter((c) => !inBag.has(c.id));
  if (inBag.size === 0 || missing.length === 0) return null;

  return (
    <div role="group" className={`${styles.nudge} ${className ?? ''}`} aria-labelledby={id}>
      <p id={id} className={`t-small ${styles.line}`}>
        Make it all three:{' '}
        <span className="nowrap">
          {SET_PERCENT}% off with {SET_CODE}
          <ProvenanceMark kind="sample" />
        </span>
      </p>
      <ul role="list" className={styles.cards}>
        {missing.map((c) => (
          <li key={c.id} className={styles.offer}>
            <MiniCard product={petals} colourway={c} onNavigate={onNavigate} className={styles.card} />
            {/* Part of the card's link, which covers the whole row; says what the link leads to. */}
            <span className={`t-small ${styles.cta}`}>Choose a size</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
