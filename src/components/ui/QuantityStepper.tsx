import { Icon } from './Icon';
import styles from './QuantityStepper.module.css';

interface Props {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
}

export function QuantityStepper({ value, min = 1, max, onChange, label, size = 'md', disabled }: Props) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div className={`${styles.stepper} ${size === 'sm' ? styles.sm : ''}`} role="group" aria-label={label}>
      <button type="button" className={styles.btn} onClick={() => onChange(value - 1)} disabled={disabled || atMin} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Icon name="minus" />
      </button>
      <output className={styles.value} aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </output>
      <button type="button" className={styles.btn} onClick={() => onChange(value + 1)} disabled={disabled || atMax} aria-label={`Increase ${label.toLowerCase()}`}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
