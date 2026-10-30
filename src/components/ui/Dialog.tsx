import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  variant?: 'drawer' | 'drawer-left' | 'modal';
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Visually hide the heading but keep it as the accessible name. */
  hideTitle?: boolean;
}

/**
 * Accessible dialog/drawer built on the native <dialog> element:
 * focus is trapped and restored by the browser, Esc closes, background is inert.
 * Styled by the dialog-* classes in styles/components.css; children bring their own padding.
 */
export function Dialog({ open, onClose, title, variant = 'modal', children, footer, className, hideTitle }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const classes = ['surface', variant === 'modal' ? 'modal' : 'drawer', variant === 'drawer-left' ? 'drawer--left' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <dialog
      ref={ref}
      className={classes}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={() => open && onClose()}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-frame">
        <div className="dialog-head">
          <h2 id={titleId} className={hideTitle ? 'sr-only' : undefined}>
            {title}
          </h2>
          <button type="button" className="dialog-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer ? <div className="dialog-foot">{footer}</div> : null}
      </div>
    </dialog>
  );
}
