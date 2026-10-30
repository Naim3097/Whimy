import { useId, useRef, useState } from 'react';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import styles from './LetterCard.module.css';

export const LETTER_MAX = 150;
const OPENING = 'Dear ';

/**
 * Whimy's gifting signature: a "Dear …" letter card, written in the letter's
 * own Fell Roman. Ticking the box opens three lines, already begun.
 */
export function LetterCard({ note, onChange }: { note: string; onChange: (note: string) => void }) {
  const id = useId();
  const area = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(note !== '');
  const shown = open || note !== '';

  const toggle = (checked: boolean) => {
    setOpen(checked);
    if (!checked) {
      onChange('');
      return;
    }
    if (!note) onChange(OPENING);
    requestAnimationFrame(() => {
      const el = area.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  return (
    <div className={styles.card}>
      <p className={styles.toggle}>
        <label className="check">
          <input type="checkbox" checked={shown} onChange={(e) => toggle(e.target.checked)} />
          <span>Add a ‘Dear …’ letter card</span>
        </label>
        <ProvenanceMark kind="tbc" />
      </p>
      {shown && (
        <div className={styles.field}>
          <label htmlFor={`${id}-note`} className="sr-only">
            Letter card message
          </label>
          <textarea
            id={`${id}-note`}
            ref={area}
            className={`textarea ${styles.note}`}
            rows={3}
            maxLength={LETTER_MAX}
            value={note}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={`${id}-count`}
            spellCheck
          />
          <p id={`${id}-count`} className={`t-cap muted num ${styles.count}`}>
            {LETTER_MAX - note.length} characters left
          </p>
        </div>
      )}
    </div>
  );
}
