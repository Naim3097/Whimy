import { whimyImages } from '../../data/assets';
import styles from './Brand.module.css';

/**
 * The W coin (Whimy's own embroidered patch, until vector logos arrive) beside
 * "whimy" in Fell Roman. Decorative: the caller supplies the link and its
 * visually hidden "Whimy, home" text.
 */
export function Lockup({ size = 'header', className }: { size?: 'header' | 'compact'; className?: string }) {
  const coin = whimyImages.monogramCoin;
  return (
    <span className={`${styles.lockup} ${size === 'compact' ? styles.compact : ''} ${className ?? ''}`} aria-hidden="true">
      <img
        className={styles.coin}
        src={coin.src}
        srcSet={coin.srcSet}
        sizes={size === 'compact' ? '28px' : '32px'}
        width={coin.width}
        height={coin.height}
        alt=""
        decoding="async"
      />
      <span className={styles.word}>whimy</span>
    </span>
  );
}
