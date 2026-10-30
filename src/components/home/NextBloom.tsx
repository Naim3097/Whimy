import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { whimyImages } from '../../data/assets';
import { nextBloomOptions, nextBloomSourceUrl } from '../../data/content';
import { persistentStorage, STORAGE_KEYS } from '../../lib/storage';
import { isValidEmail } from '../../lib/validation';
import { services } from '../../services';
import { Figure } from '../ui/Figure';
import styles from './NextBloom.module.css';

const image = whimyImages.pairsGrid;

/** The vote stays on this device: a sample of how the feature works, listed in About this preview. */
function readVote(): string | null {
  try {
    const value = persistentStorage.read<unknown>(STORAGE_KEYS.bloomVotes, null);
    return typeof value === 'string' && nextBloomOptions.includes(value) ? value : null;
  } catch {
    return null;
  }
}

function saveVote(value: string) {
  try {
    persistentStorage.write(STORAGE_KEYS.bloomVotes, value);
  } catch {
    // A lost vote must never break the page.
  }
}

type JoinStatus = 'idle' | 'sending' | 'done' | 'already';

/** Stable, so it runs once when the confirmation replaces the form. */
const focusOnMount = (el: HTMLElement | null) => {
  el?.focus();
};

/**
 * Next bloom: which colour followers asked for, as text radios, and the
 * launch list. `moment` is homepage moment 5, the page's centred closing
 * card; `page` is the same at page scale for /next-bloom, with the question
 * as the page's h1 and its own page spacing.
 *
 * The form keeps the ids `petals-list` / `petals-list-email`: the cover's
 * waitlist button jumps to them.
 */
export function NextBloom({ variant = 'moment' }: { variant?: 'moment' | 'page' }) {
  const page = variant === 'page';
  const Heading = page ? 'h1' : 'h2';
  const ids = useId();
  const headingId = `${ids}-question`;
  const errorId = `${ids}-error`;

  const [vote, setVote] = useState<string | null>(readVote);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<JoinStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const choose = (value: string) => {
    setVote(value);
    saveVote(value);
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (!isValidEmail(email)) {
      setError('Enter an email like name@example.com.');
      return;
    }
    setError(null);
    setStatus('sending');
    try {
      const res = await services.newsletter.subscribe({ email, interest: vote ? `next-bloom: ${vote}` : 'next-bloom' });
      setStatus(res.status === 'subscribed' ? 'done' : 'already');
    } catch {
      setStatus('idle');
      setError('That didn’t go through. Please try again.');
    }
  };

  return (
    <section className={`wrap grid ${styles.nextBloom} ${page ? styles.page : styles.moment}`} aria-labelledby={headingId}>
      <Figure
        image={image}
        sizes={page ? '(min-width: 1440px) 512px, (min-width: 1024px) 37vw, (min-width: 768px) 45vw, 64vw' : '(min-width: 1024px) 360px, (min-width: 768px) 320px, 64vw'}
        caption={'The pairs before the colours, from the 28 Oct reel.'}
        className={styles.figure}
        imgClassName={styles.pairs}
      />

      <div className={styles.content}>
        {/* The feature's name: on the homepage the moment opens on it, not on a second "which colour" prompt. */}
        {!page && <p className={`sc ${styles.label}`}>next bloom</p>}
        <Heading id={headingId} className={page ? 'v-3' : `v-1 ${styles.question}`}>
          which colour should bloom next?
        </Heading>

        <fieldset className={styles.options} aria-labelledby={headingId}>
          {nextBloomOptions.map((option) => (
            <label key={option} className={styles.option}>
              <input
                type="radio"
                className="sr-only"
                name={`${ids}-vote`}
                value={option}
                checked={vote === option}
                onChange={() => choose(option)}
              />
              <span className={styles.optionText}>{option}</span>
            </label>
          ))}
        </fieldset>
        {/* Always in the tree, so the first vote is announced; empty until there is one. */}
        <p className={styles.voted} role="status">
          {vote && `Your vote: ${vote}.`}
        </p>
        <p className="caption">
          Asked for by Whimy Babes on our{' '}
          <a href={nextBloomSourceUrl} target="_blank" rel="noreferrer" className="link-quiet">
            guess-the-colour post<span className="sr-only"> on Instagram (opens in a new tab)</span>
          </a>
          .
        </p>

        {status === 'done' || status === 'already' ? (
          // Focus follows the form it replaces, so keyboard users don't land back at the top.
          <p id="petals-list" className={styles.joined} role="status" tabIndex={-1} ref={focusOnMount}>
            {status === 'done' ? 'You’re on the list.' : 'You’re already on the list.'}
          </p>
        ) : (
          <form id="petals-list" className={styles.join} onSubmit={join} noValidate>
            <div className="field">
              <label htmlFor="petals-list-email" className="field-label">
                Email address
              </label>
              <div className={styles.joinRow}>
                <input
                  id="petals-list-email"
                  type="email"
                  className="input"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                />
                <button type="submit" className={`btn btn--secondary ${styles.joinButton}`} aria-busy={status === 'sending' || undefined}>
                  {status === 'sending' ? 'Joining…' : 'Join the list'}
                </button>
              </div>
              {error && (
                <p id={errorId} className="field-error" role="alert">
                  {error}
                </p>
              )}
            </div>
            <p className={`caption ${styles.pdpa}`}>
              We’ll only email you about Whimy launches.{' '}
              <Link to="/privacy" className="link-quiet">
                Privacy notice (EN / BM)
              </Link>
              .
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
