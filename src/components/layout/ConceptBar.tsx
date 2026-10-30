import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { conceptOfPath } from '../../config/concepts';
import { helpAnchors } from '../../data/content';
import { usePrefersReducedMotion } from '../../hooks/dom';
import { useActiveConcept } from '../../hooks/useConcept';
import { launchCopy } from '../../lib/launch';
import { useUI } from '../../state/ui';
import { Icon } from '../ui/Icon';
import { ConceptSwitch } from './ConceptSwitch';
import { COLLECTION_HREF, NEXT_BLOOM_HREF } from './nav';
import styles from './ConceptBar.module.css';

interface Message {
  text: string;
  to: string;
}

const ROTATE_MS = 5000;

/** The line above the header: A's rose announcement, or B's dark utility bar. */
export function ConceptBar() {
  const { launchStage } = useUI();
  const concept = useActiveConcept();
  const { pathname } = useLocation();
  // On the two homepages the bar also carries the presentation switch (from 768px).
  const home = conceptOfPath(pathname);
  const presenting = home ? <ConceptSwitch current={home} className={styles.switch} /> : null;
  const waitlist = launchStage === 'waitlist';
  const lead: Message = { text: launchCopy(launchStage).announcement, to: waitlist ? NEXT_BLOOM_HREF : COLLECTION_HREF };

  if (concept === 'a') {
    return (
      <div className={styles.a} role="region" aria-label="Announcement">
        <Link to={lead.to} className={styles.aLink}>
          {lead.text}
        </Link>
        {presenting}
      </div>
    );
  }

  // Each message fits the 244px slot of a 320px phone (12px Franklin), so none ellipsises.
  return (
    <UtilityBar
      presenting={presenting}
      messages={[
        waitlist ? lead : { text: 'The Petals Collection in three colours', to: COLLECTION_HREF },
        { text: 'Which colour should bloom next? Vote', to: NEXT_BLOOM_HREF },
        { text: 'Size, delivery and exchanges: see Help', to: '/help' },
      ]}
    />
  );
}

/**
 * Jimmy Choo's utility bar: a link at the start, one rotating message in the
 * middle, the market at the end. The message turns every 5s, holds while it
 * is hovered or focused, and stops once "Next" or "Stop" is used ("Resume"
 * starts it again). With reduced motion it never turns on its own. All the
 * messages share one slot as wide as the longest, so the Next arrow never moves
 * and the slot only takes the room the two ends leave it. A message brought in
 * by Next is announced; the timer's turns stay silent.
 */
function UtilityBar({ messages, presenting }: { messages: Message[]; presenting: ReactNode }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [announced, setAnnounced] = useState('');
  const reducedMotion = usePrefersReducedMotion();
  const rotating = !stopped && !reducedMotion && messages.length > 1;

  useEffect(() => {
    if (!rotating || held) return;
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % messages.length);
      // Emptied (which is not read out), so the next press of Next always changes the text.
      setAnnounced('');
    }, ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [index, rotating, held, messages.length]);

  const current = index % messages.length;

  return (
    <div
      className={styles.b}
      role="region"
      aria-label="Site messages"
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false);
      }}
    >
      <div className={`wrap ${styles.bRow}`}>
        <Link to={`/help#${helpAnchors.delivery}`} className={`${styles.side} ${styles.sideLink}`}>
          Delivery &amp; exchanges
        </Link>

        <div className={styles.centre}>
          <div className={styles.messages}>
            {messages.map((m, i) => (
              // The others hold the slot's width, unseen and out of reach.
              <Link key={m.text} to={m.to} className={styles.message} data-current={i === current || undefined} aria-hidden={i !== current || undefined} tabIndex={i === current ? undefined : -1}>
                {m.text}
              </Link>
            ))}
          </div>
          {messages.length > 1 && (
            <button
              type="button"
              className={styles.next}
              onClick={() => {
                const next = (current + 1) % messages.length;
                setStopped(true);
                setIndex(next);
                setAnnounced(messages[next].text);
              }}
            >
              <Icon name="chevronRight" />
              <span className="sr-only">Next message</span>
            </button>
          )}
          {messages.length > 1 && !reducedMotion && (
            <button type="button" className={styles.stop} onClick={() => setStopped((s) => !s)}>
              {stopped ? 'Resume rotating messages' : 'Stop rotating messages'}
            </button>
          )}
          <p className="sr-only" role="status">
            {announced}
          </p>
        </div>

        <span className={`${styles.side} ${styles.end}`}>
          {presenting}
          <span className={styles.market}>Malaysia (RM)</span>
        </span>
      </div>
    </div>
  );
}
