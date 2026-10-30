import type { Provenance } from '../../domain/types';
import { useUI } from '../../state/ui';
import styles from './ProvenanceMark.module.css';

/**
 * `sample-image` is the caption form, used by Figure for stand-in photographs.
 * `stock-footage` marks the stock film in Concept B's campaign, `ai-visual` the
 * AI concept visual on its still slide, `stock-photo` the stock photograph in its KL scene.
 */
export type MarkKind = 'sample' | 'tbc' | 'sample-image' | 'stock-footage' | 'ai-visual' | 'stock-photo';

const text: Record<MarkKind, string> = {
  sample: 'sample',
  tbc: 'tbc',
  'sample-image': 'sample image',
  'stock-footage': 'stock footage',
  'ai-visual': 'AI visual',
  'stock-photo': 'stock photo',
};

/** Each label starts with the visible word, so "click tbc" works for voice control (WCAG 2.5.3). */
const labels: Record<MarkKind, string> = {
  sample: 'sample value, not confirmed by Whimy',
  tbc: 'tbc, to be confirmed by Whimy',
  'sample-image': 'sample image, not a Whimy product',
  'stock-footage': 'stock footage, not filmed by Whimy',
  'ai-visual': 'AI visual, generated for this preview, not a Whimy photograph',
  'stock-photo': 'stock photo, not taken by Whimy',
};

/** mock → sample, assumption → tbc, verified → no mark. */
// eslint-disable-next-line react/only-export-components -- lives beside the mark it chooses
export function markFor(provenance: Provenance | undefined): 'sample' | 'tbc' | null {
  if (provenance === 'mock') return 'sample';
  if (provenance === 'assumption') return 'tbc';
  return null;
}

/**
 * The one on-screen sign that a value is unconfirmed: a small olive word that
 * opens the About this preview legend. A narrow no-break space ties it to the
 * word before it; the space and the button share a nowrap span, because Chrome
 * still breaks between a no-break space and an inline-block button. It stays
 * out of the tab order (the legend is one Tab away in the footer's "About this
 * preview") but keeps its name and its click.
 */
export function ProvenanceMark({
  kind,
  className,
  standalone,
}: {
  kind: MarkKind;
  className?: string;
  /** The mark opens its line (e.g. a caption that is only "sample image"), so no space before it. */
  standalone?: boolean;
}) {
  const { setAboutOpen } = useUI();
  return (
    <span className={standalone ? `${styles.tie} ${styles.standalone}` : styles.tie}>
      {standalone ? null : '\u202f'}
      <button
        type="button"
        tabIndex={-1}
        className={`${styles.mark} ${className ?? ''}`}
        aria-label={labels[kind]}
        onClick={(e) => {
          // Marks can sit inside a card link; open the legend instead of following it.
          e.preventDefault();
          e.stopPropagation();
          setAboutOpen(true);
        }}
      >
        {text[kind]}
      </button>
    </span>
  );
}

/** Renders the mark for a provenance field, or nothing when it is verified. */
export function Mark({ provenance, className }: { provenance: Provenance | undefined; className?: string }) {
  const kind = markFor(provenance);
  return kind ? <ProvenanceMark kind={kind} className={className} /> : null;
}
