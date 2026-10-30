import type { Product, Size } from '../../domain/types';
import { SizeFit } from '../help/SizeTable';
import { Dialog } from '../ui/Dialog';
import styles from './SizeGuide.module.css';

interface SizeGuideProps {
  open: boolean;
  onClose: () => void;
  highlight?: Size | null;
  /** The style on the page: its own sizes, and the Petals heel note only for Petals. */
  product: Product;
}

/** The PDP's "Size guide" drawer: the same Size & fit block as Help, with the chosen size marked. */
export function SizeGuideDialog({ open, onClose, highlight, product }: SizeGuideProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Size guide" variant="drawer">
      <div className={styles.body}>
        <SizeFit
          highlight={highlight}
          name={product.name}
          sizes={product.sizes}
          sizeProvenance={product.sizeProvenance}
          heelNote={product.kind === 'whimy'}
        />
      </div>
    </Dialog>
  );
}
