import { useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { concepts } from '../../config/concepts';
import { site } from '../../config/site';
import { useActiveConcept } from '../../hooks/useConcept';
import { isValidEmail } from '../../lib/validation';
import { services } from '../../services';
import { useUI } from '../../state/ui';
import { Icon, type IconName } from '../ui/Icon';
import { ProvenanceMark } from '../ui/ProvenanceMark';
import { COLLECTION_HREF, colourHref, helpLinks, NEXT_BLOOM_HREF, nicknameOf, SET_HREF, socialLinks, usePetals } from './nav';
import styles from './Footer.module.css';

const PAYMENT_METHODS = ['FPX', 'DuitNow QR', 'Touch ’n Go eWallet', 'GrabPay', 'Boost', 'Visa', 'Mastercard', ...(site.payments.atome ? ['Atome'] : [])];

/**
 * The payment methods, wrapping between methods, never inside one, and never opening or
 * closing a line with "·": each method after the first carries its "·" in a lead that the
 * line's clip hides at a line's start, as the bag's ColourLine does.
 */
function Payments() {
  return (
    <p className={styles.payments}>
      {PAYMENT_METHODS.map((method, i) => (
        <span key={method} className={i ? styles.method : styles.firstMethod}>
          {method}
          {i === PAYMENT_METHODS.length - 1 && <ProvenanceMark kind="sample" className={styles.mark} />}
        </span>
      ))}
    </p>
  );
}
const PRIVACY_LABEL = 'Privacy notice (EN / BM)';
const SOCIAL_ICONS: Record<string, IconName> = { Instagram: 'instagram', TikTok: 'tiktok', Threads: 'threads' };

function Legal() {
  return (
    <p>
      © 2026 Whimy · Registered name and SSM no.
      <ProvenanceMark kind="tbc" className={styles.mark} />
    </p>
  );
}

function AboutButton({ className }: { className?: string }) {
  const { setAboutOpen } = useUI();
  return (
    <button type="button" className={`link-quiet ${className ?? ''}`} aria-haspopup="dialog" onClick={() => setAboutOpen(true)}>
      About this preview
    </button>
  );
}

/** Homepage A / B, for the client presentation: the active concept is marked. */
function ConceptLinks({ className }: { className?: string }) {
  const concept = useActiveConcept();
  return (
    <p className={className}>
      Homepage:{' '}
      {(['a', 'b'] as const).map((id, i) => (
        <span key={id}>
          {i > 0 && ' · '}
          <Link to={concepts[id].home} className={`link-quiet ${styles.concept}`} aria-current={concept === id ? 'true' : undefined}>
            {concepts[id].label}
          </Link>
        </span>
      ))}
    </p>
  );
}

function SocialIcons({ className }: { className?: string }) {
  return (
    <ul role="list" className={className}>
      {socialLinks.map((s) => (
        <li key={s.href}>
          <a href={s.href} target="_blank" rel="noreferrer" className={styles.social}>
            <Icon name={SOCIAL_ICONS[s.label] ?? 'instagram'} />
            <span className="sr-only">Whimy on {s.label} (opens in a new tab)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** "Join the Petals list": the field, its button and the PDPA notice. */
function PetalsList({ title, intro, button }: { title: ReactNode; intro?: ReactNode; button: string }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'already'>('idle');
  const [error, setError] = useState<string | null>(null);

  return (
    <section className={styles.list} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.listTitle}>
        {title}
      </h2>
      {intro && <p className={styles.listIntro}>{intro}</p>}
      {status === 'done' || status === 'already' ? (
        // Focus follows the form it replaces, as on Next bloom.
        <p className={styles.listDone} role="status" tabIndex={-1} ref={(el) => el?.focus()}>
          {status === 'done' ? 'You’re on the list.' : 'You’re already on the list.'}
        </p>
      ) : (
        <form
          className={styles.listForm}
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isValidEmail(email)) {
              setError('Enter an email like name@example.com.');
              return;
            }
            setError(null);
            setStatus('sending');
            try {
              const res = await services.newsletter.subscribe({ email, interest: 'petals-list' });
              setStatus(res.status === 'subscribed' ? 'done' : 'already');
            } catch {
              setStatus('idle');
              setError('That didn’t go through. Please try again.');
            }
          }}
        >
          <label htmlFor={`${id}-email`} className="sr-only">
            Email address
          </label>
          <div className={styles.line}>
            <input
              id={`${id}-email`}
              type="email"
              className={styles.lineInput}
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={`${error ? `${id}-error ` : ''}${id}-pdpa`}
            />
            <button type="submit" className={styles.lineButton} disabled={status === 'sending'}>
              {status === 'sending' ? 'Joining…' : button}
            </button>
          </div>
          {error && (
            <p id={`${id}-error`} className={`field-error ${styles.error}`} role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      <p id={`${id}-pdpa`} className={styles.pdpa}>
        We’ll only email you about Whimy launches.{' '}
        <Link to="/privacy" className="link nowrap">
          {PRIVACY_LABEL}
        </Link>
        .
      </p>
    </section>
  );
}

interface Column {
  heading: string;
  links: { label: ReactNode; to?: string; href?: string; voice?: boolean; key: string }[];
  extra?: ReactNode;
}

function LinkColumn({ column }: { column: Column }) {
  return (
    <div className={styles.column}>
      <h2 className={styles.heading}>{column.heading}</h2>
      <ul role="list">
        {column.links.map((l) => (
          <li key={l.key}>
            {l.href ? (
              <a href={l.href} target="_blank" rel="noreferrer" className={`link-quiet ${styles.item}`}>
                {l.label}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : (
              <Link to={l.to ?? '/'} className={`link-quiet ${styles.item} ${l.voice ? styles.voice : ''}`}>
                {l.label}
              </Link>
            )}
          </li>
        ))}
        {column.extra && <li>{column.extra}</li>}
      </ul>
    </div>
  );
}

function useColumns() {
  const petals = usePetals();
  const help: Column = { heading: 'Help', links: helpLinks.map((l) => ({ label: l.label, to: l.to, key: l.to })) };
  const shop: Column = {
    heading: 'Shop',
    links: [
      { label: 'Petals Collection', to: COLLECTION_HREF, key: 'collection' },
      ...(petals?.colourways.map((c) => ({
        label: (
          <>
            {nicknameOf(c)}
            <span className="sr-only">, {c.name}</span>
          </>
        ),
        to: colourHref(petals, c),
        voice: true,
        key: c.id,
      })) ?? []),
      { label: 'all three', to: SET_HREF, voice: true, key: 'set' },
      { label: 'Next bloom', to: NEXT_BLOOM_HREF, key: 'next' },
    ],
  };
  const whimy: Column = {
    heading: 'Whimy',
    links: [
      { label: 'Our story', to: '/story', key: 'story' },
      { label: 'Account', to: '/account', key: 'account' },
      { label: 'Saved', to: '/saved', key: 'saved' },
      ...socialLinks.map((s) => ({ label: s.label, href: s.href, key: s.href })),
    ],
  };
  const legal: Column = {
    heading: 'Small print',
    links: [
      { label: PRIVACY_LABEL, to: '/privacy', key: 'privacy' },
      { label: 'Terms', to: '/terms', key: 'terms' },
      { label: 'Image credits', to: '/credits', key: 'credits' },
    ],
    extra: <AboutButton className={styles.item} />,
  };
  return { help, shop, whimy, legal };
}

/**
 * Concept A, after Christy Ng: the rose band, three columns (Info, About,
 * Subscribe with the social glyphs), then the payment methods and the legal line.
 */
function FooterA({ showList }: { showList: boolean }) {
  const { help, shop, legal } = useColumns();
  const about: Column = {
    heading: 'About',
    links: [{ label: 'Our story', to: '/story', key: 'story' }, ...legal.links],
    extra: legal.extra,
  };
  return (
    <footer className={styles.footer} data-concept="a">
      <div className={`wrap ${styles.aTop}`}>
        <LinkColumn column={{ ...help, heading: 'Info' }} />
        <LinkColumn column={shop} />
        <LinkColumn column={about} />
        <div className={styles.aSubscribe}>
          {showList ? (
            <PetalsList title="Subscribe" intro="Sign up to the Petals list for launch news." button="Join" />
          ) : (
            <h2 className={styles.heading}>Follow</h2>
          )}
          <SocialIcons className={styles.socials} />
        </div>
      </div>
      <div className="wrap">
        <div className={styles.bottom}>
          <Legal />
          <ConceptLinks />
        </div>
        <Payments />
      </div>
    </footer>
  );
}

/**
 * Concept B, after Jimmy Choo: one pale band. The list invitation and the
 * social glyphs on the left, four link columns on the right, then the market,
 * the concept links and the small print.
 */
function FooterB({ showList, flush }: { showList: boolean; flush: boolean }) {
  const { help, shop, whimy, legal } = useColumns();
  return (
    <footer className={styles.footer} data-concept="b" data-flush={flush || undefined}>
      <div className={`wrap ${styles.bGrid}`}>
        <div className={styles.bInvite}>
          {showList ? (
            <PetalsList
              title="Join the Petals list"
              intro="Hear first when Petals Heels launch, and when the next colour blooms."
              button="Sign up"
            />
          ) : (
            <h2 className={styles.heading}>Follow Whimy</h2>
          )}
          <SocialIcons className={styles.socials} />
        </div>
        <div className={styles.bColumns}>
          <LinkColumn column={help} />
          <LinkColumn column={shop} />
          <LinkColumn column={whimy} />
          <LinkColumn column={legal} />
        </div>
      </div>
      <div className="wrap">
        <div className={styles.bottom}>
          <p>Malaysia (RM)</p>
          <ConceptLinks />
          <Legal />
        </div>
        <Payments />
      </div>
    </footer>
  );
}

/**
 * The sign-off on every page, in the active concept's skin. `flush` drops the
 * space above it where the page already ends on a ruled band (B's services row).
 */
export function Footer({ showList = true, flush = false }: { showList?: boolean; flush?: boolean }) {
  const concept = useActiveConcept();
  return concept === 'a' ? <FooterA showList={showList} /> : <FooterB showList={showList} flush={flush} />;
}

/** Checkout's footer: only the small print. */
export function CheckoutFooter() {
  return (
    <footer className={`${styles.footer} ${styles.minimal}`}>
      <div className={`wrap--checkout ${styles.bottom}`}>
        <Legal />
        <ul role="list" className={styles.inline}>
          <li>
            <Link to="/privacy" className="link-quiet">
              {PRIVACY_LABEL}
            </Link>
          </li>
          <li>
            <Link to="/terms" className="link-quiet">
              Terms
            </Link>
          </li>
          <li>
            <AboutButton />
          </li>
        </ul>
      </div>
    </footer>
  );
}
