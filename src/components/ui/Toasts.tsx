import { useEffect, useRef, useState } from 'react';
import { useUI, type Toast } from '../../state/ui';
import styles from './Toasts.module.css';

const DISMISS_AFTER = 4000;

/**
 * Toast region rendered as a manual popover, so it sits in the browser's top
 * layer and stays visible above open dialogs and drawers.
 */
export function Toasts() {
  const { toasts, dismiss } = useUI();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.showPopover !== 'function') return;
    try {
      // Re-show to move the region to the top of the top-layer stack (above any modal opened since).
      if (el.matches(':popover-open')) el.hidePopover();
      if (toasts.length) el.showPopover();
    } catch {
      /* Popover API unavailable: region still renders in normal flow. */
    }
  }, [toasts]);

  return (
    <div ref={ref} popover="manual" className={styles.region} role="status" aria-live="polite" aria-relevant="additions">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

/** Dismisses itself after 4s; hovering or focusing it holds the clock. */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(DISMISS_AFTER);
  const paused = hovered || focused;

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [paused, toast.id, onDismiss]);

  return (
    <div
      className={`${styles.toast} ${toast.tone === 'error' ? styles.error : ''}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false);
      }}
    >
      <p className={styles.message}>{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className={`link ${styles.action}`}
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button type="button" className={`link-quiet ${styles.close}`} onClick={() => onDismiss(toast.id)}>
        Close
      </button>
    </div>
  );
}
