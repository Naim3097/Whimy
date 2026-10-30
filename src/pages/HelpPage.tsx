import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { site } from '../config/site';
import { helpAnchors } from '../data/content';
import { shippingMethods } from '../data/mock/commerce';
import type { ShippingRegion } from '../domain/types';
import { SizeFit } from '../components/help/SizeTable';
import { StagePrice } from '../components/layout/StagePrice';
import { ProvenanceMark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import { formatMoney } from '../lib/money';
import { useCatalog } from '../state/catalog';
import { ExternalLink, UtilityPage } from './InfoPages';
import styles from './HelpPage.module.css';

const SECTIONS = [
  { id: helpAnchors.sizeFit, label: 'Size & fit' },
  { id: helpAnchors.delivery, label: 'Delivery' },
  { id: helpAnchors.exchanges, label: 'Exchanges' },
  { id: helpAnchors.care, label: 'Care' },
  { id: helpAnchors.faq, label: 'FAQ' },
  { id: helpAnchors.contact, label: 'Contact' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const REGION: Record<ShippingRegion, { name: string; detail?: string }> = {
  west: { name: 'West Malaysia' },
  east: { name: 'East Malaysia', detail: 'Sabah, Sarawak and Labuan' },
  singapore: { name: 'Singapore' },
};

const nick = (name: string) => <span className={styles.nick}>{name}</span>;

/** The same price the product page shows for the launch stage: the sample price, or "Price to be announced". */
function PetalsPrice() {
  const petals = useCatalog().productById('petals-heels');
  return petals ? (
    <>
      <StagePrice product={petals} />.
    </>
  ) : null;
}

const FAQS: { q: string; a: ReactNode }[] = [
  {
    q: 'What is the Petals Collection?',
    a: 'Whimy’s first collection. Petals Heels are a pointed satin slingback on a kitten heel, with a layered organza flower at the toe.',
  },
  {
    q: 'Which colours are there?',
    a: (
      <>
        Three: Rich Brown ({nick('choco')}), Blush Pink ({nick('strawberry')}) and Sage Green ({nick('kiwi')}).
      </>
    ),
  },
  {
    q: 'How much are Petals Heels?',
    a: <PetalsPrice />,
  },
  {
    q: 'When do they launch?',
    a: 'The launch date is to be announced. Follow @whimy.official to hear first.',
  },
  {
    q: 'Which sizes are there?',
    a: (
      <>
        EU 35 to 40.
        <ProvenanceMark kind="tbc" /> Foot lengths are under{' '}
        <a href={`#${helpAnchors.sizeFit}`} className="link">
          Size & fit
        </a>
        .
      </>
    ),
  },
  {
    q: 'How high is the heel?',
    a: (
      <>
        It’s a kitten heel. The exact height is to be confirmed.
        <ProvenanceMark kind="tbc" />
      </>
    ),
  },
  {
    q: 'Is the flower detachable?',
    a: (
      <>
        To be confirmed.
        <ProvenanceMark kind="tbc" />
      </>
    ),
  },
  {
    q: 'Where can I buy them?',
    a: (
      <>
        Here, and Petals Heels are also coming to <ExternalLink href={site.tiktokShopUrl}>TikTok Shop</ExternalLink>.
      </>
    ),
  },
  {
    q: 'Do you deliver to East Malaysia and Singapore?',
    a: (
      <>
        Rates and times for West Malaysia, East Malaysia and Singapore are under{' '}
        <a href={`#${helpAnchors.delivery}`} className="link">
          Delivery
        </a>
        .
        <ProvenanceMark kind="sample" />
      </>
    ),
  },
  {
    q: 'Can I exchange my size?',
    a: (
      <>
        One size exchange within 14 days.
        <ProvenanceMark kind="sample" /> See{' '}
        <a href={`#${helpAnchors.exchanges}`} className="link">
          Exchanges
        </a>
        .
      </>
    ),
  },
  {
    q: 'How can I pay?',
    a: (
      <>
        FPX online banking, DuitNow QR, Touch ’n Go eWallet, GrabPay, Boost, Visa and Mastercard.
        <ProvenanceMark kind="sample" />
      </>
    ),
  },
  {
    q: 'How do I care for satin?',
    a: (
      <>
        Care notes are to be confirmed.
        <ProvenanceMark kind="tbc" /> See{' '}
        <a href={`#${helpAnchors.care}`} className="link">
          Care
        </a>
        .
      </>
    ),
  },
];

/**
 * Help, on one page: a sticky section index (a select on phones) beside
 * Size & fit, Delivery, Exchanges, Care, FAQ and Contact. Old routes
 * (/size-guide, /shipping, /returns, /faq, /contact) land on the anchors.
 */
export function HelpPage() {
  usePageMeta('Help', 'Size & fit, delivery, exchanges, care, questions and how to reach Whimy.');
  const { hash } = useLocation();
  const navigate = useNavigate();
  const current = hash.slice(1);

  const jump = (id: SectionId) => {
    navigate({ hash: id });
    // The router scrolls to the anchor; move focus with it so the next Tab starts there.
    requestAnimationFrame(() => document.getElementById(`${id}-title`)?.focus({ preventScroll: true }));
  };

  return (
    <UtilityPage title="Help">
      <div className={`grid ${styles.layout}`}>
        <div className={`field ${styles.jump}`}>
          <label htmlFor="help-jump" className="field-label">
            Jump to
          </label>
          <select
            id="help-jump"
            className="select"
            value={SECTIONS.some((s) => s.id === current) ? current : ''}
            onChange={(e) => e.target.value && jump(e.target.value as SectionId)}
          >
            <option value="" disabled>
              Choose a section
            </option>
            {SECTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <nav className={styles.index} aria-label="Help sections">
          <ul className={styles.indexList}>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="link-quiet" aria-current={current === s.id ? 'true' : undefined}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.content}>
          <Section id={helpAnchors.sizeFit} title="Size & fit">
            <SizeFit />
          </Section>

          <Section id={helpAnchors.delivery} title="Delivery">
            <table className={styles.table}>
              <caption className={styles.tableCaption}>
                Rates and delivery times
                <ProvenanceMark kind="sample" />
              </caption>
              <thead>
                <tr>
                  <th scope="col">Delivery to</th>
                  <th scope="col">Service</th>
                  <th scope="col">Time</th>
                  <th scope="col">Cost</th>
                </tr>
              </thead>
              <tbody>
                {shippingMethods.map((m) => (
                  <tr key={m.id}>
                    <th scope="row">
                      {REGION[m.region].name}
                      {REGION[m.region].detail && <span className={styles.cellNote}>{REGION[m.region].detail}</span>}
                    </th>
                    <td>
                      {m.label}
                      <span className={styles.cellNote}>{m.carrier}</span>
                    </td>
                    <td>{m.eta}</td>
                    <td className="num">
                      {formatMoney(m.price)}
                      {m.freeFrom != null && <span className={styles.cellNote}>Free from {formatMoney(m.freeFrom)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className={styles.facts}>
              <div>
                <dt>Festive cut-offs</dt>
                <dd className="muted">To be announced</dd>
              </div>
            </dl>
          </Section>

          <Section id={helpAnchors.exchanges} title="Exchanges">
            <div className={styles.prose}>
              <p>
                One size exchange within 14 days of delivery, for unworn pairs in their original box.
                <ProvenanceMark kind="sample" />
              </p>
              <p>Defective items are always put right.</p>
            </div>
          </Section>

          <Section id={helpAnchors.care} title="Care">
            <div className={styles.prose}>
              <p>
                Care notes for the satin upper and the organza flower are to be confirmed.
                <ProvenanceMark kind="tbc" />
              </p>
            </div>
          </Section>

          <Section id={helpAnchors.faq} title="FAQ">
            <div className="accordion">
              {FAQS.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p className={styles.answer}>{f.a}</p>
                </details>
              ))}
            </div>
          </Section>

          <Section id={helpAnchors.contact} title="Contact">
            <ul className={`rows ${styles.contact}`}>
              <li>
                <span className={styles.channel}>Instagram</span>
                <ExternalLink href={site.social.instagram}>Message @whimy.official</ExternalLink>
              </li>
              <li>
                <span className={styles.channel}>TikTok</span>
                <ExternalLink href={site.social.tiktok}>Message @whimy.official</ExternalLink>
              </li>
              <li>
                <span className={styles.channel}>Threads</span>
                <ExternalLink href={site.social.threads}>Message @whimy.official</ExternalLink>
              </li>
              <li>
                <span className={styles.channel}>Email</span>
                <span>
                  <span className="muted">Not yet published</span>
                  <ProvenanceMark kind="tbc" />
                </span>
              </li>
              <li>
                <span className={styles.channel}>WhatsApp</span>
                <span>
                  <span className="muted">Not yet published</span>
                  <ProvenanceMark kind="tbc" />
                </span>
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </UtilityPage>
  );
}

function Section({ id, title, children }: { id: SectionId; title: string; children: ReactNode }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.title} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
}
