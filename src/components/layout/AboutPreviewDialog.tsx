import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router';
import { concepts } from '../../config/concepts';
import { promoRules } from '../../data/mock/commerce';
import { LAUNCH_STAGES, type LaunchStage } from '../../lib/launch';
import { persistentStorage, sessionStore, STORAGE_KEYS } from '../../lib/storage';
import { useUI } from '../../state/ui';
import { Dialog } from '../ui/Dialog';
import styles from './AboutPreviewDialog.module.css';

const DEMO_CODES = ['PETALS3', 'FREESHIP'];

const stageCopy: Record<LaunchStage, { label: string; hint: string }> = {
  'preview-live': { label: 'Preview live', hint: 'Add to bag, with the sample price.' },
  waitlist: { label: 'Waitlist', hint: 'Join the Petals list; price to be announced.' },
};

const OPEN_QUESTIONS = [
  'Price',
  'Sizes and fit',
  'Heel height',
  'Delivery fees',
  'Exchange policy',
  'Registered name and SSM no.',
  'Launch date',
  'Original photo files',
];

/** Clears everything this preview stores on the device, then starts again from the homepage. */
function resetPreview() {
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      persistentStorage.remove(key);
      sessionStore.remove(key);
    } catch {
      // Blocked storage has nothing to clear.
    }
  }
  window.location.assign('/');
}

/** How long the reset waits for its second press before standing down. */
const CONFIRM_MS = 4000;

/**
 * A quiet text control at the very end, because it wipes the demo: the first
 * press asks, a second press within 4s resets.
 */
function ResetPreview({ id }: { id: string }) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [armed]);

  return (
    <section aria-labelledby={`${id}-start`} className={styles.reset}>
      <h3 id={`${id}-start`} className={styles.title}>
        Start again
      </h3>
      <p id={`${id}-reset`} className={styles.hint}>
        Empties the bag, saved pairs, orders and settings kept on this device.
      </p>
      <p>
        <button
          type="button"
          className={`link ${styles.resetButton}`}
          data-armed={armed || undefined}
          aria-describedby={`${id}-reset`}
          onClick={() => (armed ? resetPreview() : setArmed(true))}
        >
          {armed ? 'Press again to reset' : 'Reset preview data'}
        </button>
      </p>
      <p className="sr-only" aria-live="polite">
        {armed ? 'Press again within 4 seconds to reset the preview data.' : ''}
      </p>
    </section>
  );
}

/**
 * The one place the preview explains itself: what the small marks mean, the
 * launch stage, demo codes, the questions still open for Whimy and, last, a reset.
 */
export function AboutPreviewDialog() {
  const { aboutOpen, setAboutOpen, launchStage, setLaunchStage } = useUI();
  const id = useId();
  const close = () => setAboutOpen(false);
  const codes = promoRules.filter((r) => DEMO_CODES.includes(r.code));

  return (
    <Dialog open={aboutOpen} onClose={close} title="About this preview">
      <div className={styles.body}>
        <p className={styles.intro}>
          This is a preview of the Whimy store. It runs in your browser only: no orders, payments, accounts or emails are created.
        </p>

        <section aria-labelledby={`${id}-concepts`}>
          <h3 id={`${id}-concepts`} className={styles.title}>
            Two homepages
          </h3>
          <ul role="list" className={styles.list}>
            {(['a', 'b'] as const).map((c) => (
              <li key={c}>
                <Link to={concepts[c].home} className="link" onClick={close}>
                  {concepts[c].label}
                </Link>
                <span className={styles.hint}> After {concepts[c].reference.name}.</span>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>Both share the shop, the bag and Saved. The pages after either homepage keep its header and footer.</p>
        </section>

        <section aria-labelledby={`${id}-legend`}>
          <h3 id={`${id}-legend`} className={styles.title}>
            The small marks
          </h3>
          <dl className={styles.legend}>
            <div>
              <dt>
                <span className={styles.mark}>sample</span>
              </dt>
              <dd>A demo value standing in until Whimy confirms it, such as the price, delivery fees and payment methods.</dd>
            </div>
            <div>
              <dt>
                <span className={styles.mark}>tbc</span>
              </dt>
              <dd>Still to be confirmed by Whimy, such as sizes, heel height and the registered business name.</dd>
            </div>
            <div>
              <dt>
                <span className={styles.mark}>sample image</span>
              </dt>
              <dd>A stock photograph of another style, shown only in the preview catalogue. Never a Whimy product.</dd>
            </div>
            <div>
              <dt>
                <span className={styles.mark}>stock footage</span>
              </dt>
              <dd>The satin film in homepage B’s campaign: free stock footage from Mixkit, not filmed by Whimy and not Petals satin.</dd>
            </div>
            <div>
              <dt>
                <span className={styles.mark}>stock photo</span>
              </dt>
              <dd>The Petronas Towers in homepage B’s Kuala Lumpur scene: a free Unsplash photograph, not taken by Whimy.</dd>
            </div>
            <div>
              <dt>
                <span className={styles.mark}>AI visual</span>
              </dt>
              <dd>
                The meadow image in homepage B’s campaign: an AI-generated concept made for this preview. Its model and setting are generated, and its
                heels are an impression of Petals Heels, not a product photograph or Whimy campaign material.
              </dd>
            </div>
            <div>
              <dt>
                <span className={styles.caption}>AI-generated visual</span>
              </dt>
              <dd>Whimy labelled this post as AI content on Instagram.</dd>
            </div>
          </dl>
          <p className={styles.hint}>
            Five of Whimy’s photographs, and the crops cut from them, are shown from AI upscales of the Instagram files.{' '}
            <Link to="/credits" className="link" onClick={close}>
              Image credits
            </Link>{' '}
            lists them.
          </p>
        </section>

        <fieldset>
          <legend className={styles.title}>Launch stage</legend>
          {LAUNCH_STAGES.map((stage) => (
            <label key={stage} className="radio-row">
              <input
                type="radio"
                name={`${id}-stage`}
                value={stage}
                checked={launchStage === stage}
                onChange={() => setLaunchStage(stage)}
              />
              <span className={styles.option}>
                <span>{stageCopy[stage].label}</span>
                <span className={styles.hint}>{stageCopy[stage].hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <section aria-labelledby={`${id}-more`}>
          <h3 id={`${id}-more`} className={styles.title}>
            More to try
          </h3>
          <ul role="list" className={styles.list}>
            <li>
              <Link to="/preview/catalogue" className="link" onClick={close}>
                The future catalogue
              </Link>
              <span className={styles.hint}> Filters and search across sample styles.</span>
            </li>
            {codes.map((r) => (
              <li key={r.code}>
                <code className={styles.code}>{r.code}</code> at checkout: {r.label.charAt(0).toLowerCase() + r.label.slice(1)}.
              </li>
            ))}
            <li>
              An email containing <code className={styles.code}>decline</code> shows a declined payment.
            </li>
            <li>
              <Link to="/credits" className="link" onClick={close}>
                Image credits
              </Link>
            </li>
          </ul>
        </section>

        <section aria-labelledby={`${id}-questions`}>
          <h3 id={`${id}-questions`} className={styles.title}>
            Open questions for Whimy
          </h3>
          <ul role="list" className={styles.questions}>
            {OPEN_QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        {/* Keyed on the dialog's state, so every opening starts disarmed. */}
        <ResetPreview key={String(aboutOpen)} id={id} />
      </div>
    </Dialog>
  );
}
