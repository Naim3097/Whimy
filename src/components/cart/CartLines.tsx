import { useEffect, useId, useRef, useState } from 'react';
import type { ResolvedLine } from '../../lib/cart';
import { getColourway } from '../../lib/catalog';
import { useCart, type RemovedLine } from '../../state/cart';
import { useCatalog } from '../../state/catalog';
import { CartLineItem } from './CartLineItem';
import styles from './CartLines.module.css';

/** Where focus goes after the list changes: the undo row, or a restored line's Remove. */
type FocusTarget = { to: 'undo' } | { to: 'line'; key: string };

/**
 * Removal with an inline undo, for the drawer and /bag. The removed line is
 * swapped for one row, "Removed: … Undo", in the same place, and focus moves to
 * Undo; Undo puts the line back where it was, with focus on its Remove. Only the
 * latest removal waits for undo. A toast can't carry this: inside the open
 * drawer everything outside the modal is inert.
 */
export function useBagRemoval() {
  const { remove, restore } = useCart();
  const [removed, setRemoved] = useState<RemovedLine | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);

  return {
    removed,
    focus,
    focused: () => setFocus(null),
    remove: (key: string) => {
      const taken = remove(key);
      if (!taken) return;
      setRemoved(taken);
      setFocus({ to: 'undo' });
    },
    undo: () => {
      if (!removed) return;
      restore(removed);
      setRemoved(null);
      setFocus({ to: 'line', key: removed.line.key });
    },
  };
}

export type BagRemoval = ReturnType<typeof useBagRemoval>;

interface CartLinesProps {
  lines: ResolvedLine[];
  removal: BagRemoval;
  onNavigate?: () => void;
  className?: string;
}

/** The bag's lines between hairlines, with the undo row standing in for a removed line. */
export function CartLines({ lines, removal, onNavigate, className }: CartLinesProps) {
  const list = useRef<HTMLUListElement>(null);
  const { removed, focus } = removal;

  useEffect(() => {
    if (!focus) return;
    const target =
      focus.to === 'undo'
        ? list.current?.querySelector<HTMLElement>('[data-undo]')
        : [...(list.current?.querySelectorAll<HTMLElement>('[data-line]') ?? [])]
            .find((li) => li.dataset.line === focus.key)
            ?.querySelector<HTMLElement>('[data-remove]');
    if (!target) return;
    target.focus();
    removal.focused();
  });

  const items = lines.map((line) => <CartLineItem key={line.key} line={line} onRemove={removal.remove} onNavigate={onNavigate} />);
  if (removed) {
    items.splice(Math.min(removed.index, items.length), 0, <UndoRow key={`undo:${removed.line.key}`} removed={removed} onUndo={removal.undo} />);
  }

  return (
    <ul ref={list} role="list" aria-label="Items in your bag" className={`${styles.lines} ${className ?? ''}`}>
      {items}
    </ul>
  );
}

/** "Removed: Petals Heels, choco · Rich Brown, EU 37. Undo" */
function UndoRow({ removed, onUndo }: { removed: RemovedLine; onUndo: () => void }) {
  const id = useId();
  const product = useCatalog().productById(removed.line.productId);
  const colourway = product && getColourway(product, removed.line.colourId);

  return (
    <li className={styles.undo}>
      <p id={id} className={styles.message}>
        Removed: {product?.name ?? 'item'}
        {colourway && (
          <>
            ,{' '}
            <span className="nowrap">
              {colourway.nickname && (
                <>
                  <span className="v-0">{colourway.nickname}</span> ·{' '}
                </>
              )}
              {colourway.name}
            </span>
          </>
        )}
        , EU {removed.line.size}.
      </p>
      <button type="button" className={`link t-ui ${styles.action}`} data-undo aria-describedby={id} onClick={onUndo}>
        Undo
      </button>
    </li>
  );
}
