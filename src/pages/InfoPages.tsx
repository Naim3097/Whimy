import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { site } from '../config/site';
import { conceptImages, sampleImages, stockImages, whimyImages } from '../data/assets';
import { helpAnchors, timeline } from '../data/content';
import type { ImageSource } from '../domain/types';
import { ProvenanceMark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import styles from './InfoPages.module.css';

/**
 * The utility template (DESIGN.md §15): Help, Account, Saved, Search,
 * policies and Credits. A small Hanken h1, an optional intro, content at
 * 1200px with text at 62ch. No eyebrow, hero, italic title or notice box.
 */
export function UtilityPage({ title, intro, children, className }: { title: ReactNode; intro?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`wrap--utility ${styles.page} ${className ?? ''}`}>
      <header className={styles.head}>
        <h1 className="t-title">{title}</h1>
        {intro && <p className={`muted measure ${styles.intro}`}>{intro}</p>}
      </header>
      {children}
    </div>
  );
}

/** A link that leaves the site: new tab, announced to screen readers. */
export function ExternalLink({ href, children, className = 'link' }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

type PageKey = 'privacy' | 'terms' | 'credits';

const TITLES: Record<PageKey, string> = {
  privacy: 'Privacy notice',
  terms: 'Terms of sale',
  credits: 'Image credits',
};

export function InfoPage({ page }: { page: PageKey }) {
  usePageMeta(TITLES[page]);
  switch (page) {
    case 'privacy':
      return <Privacy />;
    case 'terms':
      return <Terms />;
    case 'credits':
      return <Credits />;
  }
}

/* ------------------------------------------------------------------ */

/** Registered name, SSM number and address: unpublished, so each carries the tbc mark. */
function BusinessFacts({ labels, unknown }: { labels: [string, string, string]; unknown: string }) {
  return (
    <dl className={styles.facts}>
      {labels.map((label) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>
            <span className="muted">{unknown}</span>
            <ProvenanceMark kind="tbc" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

const instagramHandle = (
  <ExternalLink href={site.social.instagram}>@whimy.official</ExternalLink>
);

function Privacy() {
  return (
    <UtilityPage
      title="Privacy notice"
      intro={
        <>
          How Whimy collects and uses your personal data, under Malaysia’s Personal Data Protection Act 2010.
          <ProvenanceMark kind="sample" />
        </>
      }
    >
      <nav className={`t-small ${styles.languages}`} aria-label="Language">
        <a href="#en" className="link" hrefLang="en">
          English
        </a>
        <span aria-hidden="true">·</span>
        <a href="#bm" className="link" hrefLang="ms">
          Bahasa Malaysia
        </a>
      </nav>

      <section id="en" className={styles.policy} aria-labelledby="privacy-en">
        <h2 id="privacy-en" className={styles.language}>
          English
        </h2>
        <h3>Who we are</h3>
        <p>Whimy is a footwear label based in Kuala Lumpur, Malaysia.</p>
        <BusinessFacts labels={['Registered name', 'SSM no.', 'Business address']} unknown="Not yet published" />
        <h3>What we collect</h3>
        <p>When you place an order or join the Petals list: your name, email address, phone number, delivery address and order details.</p>
        <h3>Why we use it</h3>
        <p>To process and deliver your orders, to answer your questions and, only if you agree, to email you about Whimy launches.</p>
        <h3>Who we share it with</h3>
        <p>Delivery partners and payment providers, only as far as needed to complete your order.</p>
        <h3>Your choices</h3>
        <p>Your contact and delivery details are needed to complete an order. Launch emails are optional, and you can unsubscribe at any time.</p>
        <h3>Access and correction</h3>
        <p>To see or correct the personal data we hold about you, or to withdraw your consent, message {instagramHandle} on Instagram.</p>
        <h3>In your browser</h3>
        <p>
          This site keeps your bag, saved pairs and recent searches in your browser’s local storage. Clearing this site’s data in your
          browser removes them.
        </p>
      </section>

      <section id="bm" lang="ms" className={styles.policy} aria-labelledby="privacy-bm">
        <h2 id="privacy-bm" className={styles.language}>
          Bahasa Malaysia
        </h2>
        <p className={styles.policyIntro}>
          Cara Whimy mengumpul dan menggunakan data peribadi anda, di bawah Akta Perlindungan Data Peribadi 2010.
          <ProvenanceMark kind="sample" />
        </p>
        <h3>Siapa kami</h3>
        <p>Whimy ialah jenama kasut yang berpangkalan di Kuala Lumpur, Malaysia.</p>
        <BusinessFacts labels={['Nama berdaftar', 'No. SSM', 'Alamat perniagaan']} unknown="Belum diterbitkan" />
        <h3>Data yang kami kumpul</h3>
        <p>Apabila anda membuat pesanan atau menyertai senarai Petals: nama, alamat e-mel, nombor telefon, alamat penghantaran dan butiran pesanan anda.</p>
        <h3>Tujuan penggunaan</h3>
        <p>
          Untuk memproses dan menghantar pesanan anda, menjawab pertanyaan anda dan, hanya jika anda bersetuju, menghantar e-mel kepada anda
          tentang pelancaran Whimy.
        </p>
        <h3>Pihak yang menerima data</h3>
        <p>Rakan kongsi penghantaran dan penyedia pembayaran, setakat yang diperlukan untuk melengkapkan pesanan anda.</p>
        <h3>Pilihan anda</h3>
        <p>
          Butiran hubungan dan penghantaran anda diperlukan untuk melengkapkan pesanan. E-mel pelancaran adalah pilihan, dan anda boleh
          berhenti melanggan pada bila-bila masa.
        </p>
        <h3>Akses dan pembetulan</h3>
        <p>
          Untuk melihat atau membetulkan data peribadi anda yang kami simpan, atau untuk menarik balik persetujuan anda, hantarkan mesej
          kepada {instagramHandle} di Instagram.
        </p>
        <h3>Dalam pelayar anda</h3>
        <p>
          Laman ini menyimpan beg, pasangan kasut yang disimpan dan carian terkini anda dalam storan tempatan pelayar anda. Mengosongkan data
          laman ini dalam pelayar anda akan memadamkannya.
        </p>
      </section>
    </UtilityPage>
  );
}

function Terms() {
  return (
    <UtilityPage
      title="Terms of sale"
      intro={
        <>
          The terms that apply when you buy from Whimy online.
          <ProvenanceMark kind="sample" />
        </>
      }
    >
      <div className={styles.policy}>
        <h2>The seller</h2>
        <p>Whimy, based in Kuala Lumpur, Malaysia. Message us on Instagram at {instagramHandle}.</p>
        <BusinessFacts labels={['Registered name', 'SSM no.', 'Business address']} unknown="Not yet published" />
        <h2>Prices and payment</h2>
        <p>Prices are shown in Malaysian Ringgit (RM). The delivery fee is shown before you pay, and the payment methods are listed at checkout.</p>
        <h2>Your order</h2>
        <p>You can review and correct your order before you place it. We confirm every order by email.</p>
        <h2>Delivery</h2>
        <p>
          Rates and estimated times are listed under{' '}
          <Link to={`/help#${helpAnchors.delivery}`} className="link">
            Help, Delivery
          </Link>
          .
        </p>
        <h2>Exchanges and defective items</h2>
        <p>
          One size exchange within 14 days of delivery.
          <ProvenanceMark kind="sample" /> Defective items are always put right, and your rights under the Consumer Protection Act 1999 are
          not affected. See{' '}
          <Link to={`/help#${helpAnchors.exchanges}`} className="link">
            Help, Exchanges
          </Link>
          .
        </p>
        <h2>TikTok Shop</h2>
        <p>Orders placed on TikTok Shop follow TikTok Shop’s own terms.</p>
      </div>
    </UtilityPage>
  );
}

/* ------------------------------------------------------------------ */

/** The date of the post an image comes from, when the timeline records it. */
const postDate = (image: ImageSource) => timeline.find((t) => t.url === image.credit?.url)?.date;

function CreditRow({ image, children }: { image: ImageSource; children: ReactNode }) {
  return (
    <li className={styles.credit}>
      <p className={styles.creditText}>{image.alt}</p>
      <p className={`t-small muted ${styles.creditSource}`}>{children}</p>
    </li>
  );
}

function Credits() {
  const all = Object.values(whimyImages) as ImageSource[];
  const own = all.filter((i) => !i.aiGenerated);
  const ai = all.filter((i) => i.aiGenerated);
  const samples = Object.values(sampleImages) as ImageSource[];

  const instagramCredit = (image: ImageSource) => {
    const date = postDate(image);
    return (
      <>
        {date && <span className="num">{date} · </span>}
        {image.credit && <ExternalLink href={image.credit.url}>Instagram post</ExternalLink>}
        {image.upscaledFrom && <span className="num"> · AI-upscaled from {image.upscaledFrom.width}px wide</span>}
      </>
    );
  };

  return (
    <UtilityPage title="Image credits" intro="Every image on this site, and where it comes from.">
      <div className={styles.credits}>
        <section aria-labelledby="credits-whimy">
          <h2 id="credits-whimy" className={styles.creditsTitle}>
            Whimy
          </h2>
          <p className={`muted measure ${styles.creditsNote}`}>
            Photographs and brand marks from {instagramHandle} on Instagram. Every photograph of Petals Heels on this site is one of these; the meadow visual and the packshots in homepage B’s strip are AI-generated (below).
          </p>
          <p className={`muted measure ${styles.creditsNote}`}>
            Instagram files are small, so six photographs, and the crops cut from them, are shown from AI upscales made for this preview
            (Higgsfield’s 4K upscaler). An upscaler adds fine detail of its own; Whimy’s original camera files should replace them before launch.
          </p>
          <ul className="rows">
            {own.map((image) => (
              <CreditRow key={image.key} image={image}>
                {instagramCredit(image)}
              </CreditRow>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credits-sample">
          <h2 id="credits-sample" className={styles.creditsTitle}>
            Sample image
          </h2>
          <p className={`muted measure ${styles.creditsNote}`}>
            Free photographs under the <ExternalLink href="https://unsplash.com/license">Unsplash License</ExternalLink>, used only for sample
            styles. None of them shows a Whimy product.
          </p>
          <ul className="rows">
            {samples.map((image) => (
              <CreditRow key={image.key} image={image}>
                {image.credit && (
                  <>
                    Photo by <ExternalLink href={image.credit.url}>{image.credit.name}</ExternalLink> on {image.credit.source}
                  </>
                )}
              </CreditRow>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credits-film">
          <h2 id="credits-film" className={styles.creditsTitle}>
            Stock footage
          </h2>
          <p className={`muted measure ${styles.creditsNote}`}>
            Free footage under the <ExternalLink href="https://mixkit.co/license/#videoFree">Mixkit Stock Video Free License</ExternalLink>, used only
            in homepage B’s campaign. It was not filmed by Whimy and does not show Petals satin.
          </p>
          <ul className="rows">
            <li className={styles.credit}>
              <p className={styles.creditText}>Pale blue satin, slowly folding: the film slide in homepage B’s campaign.</p>
              <p className={`t-small muted ${styles.creditSource}`}>
                <ExternalLink href="https://mixkit.co/free-stock-video/close-up-shot-of-a-satin-textured-blue-fabric-51002/">
                  Close up shot of a satin textured blue fabric
                </ExternalLink>{' '}
                on Mixkit · its first 4.4 seconds, played forward and back as a loop
              </p>
            </li>
          </ul>
        </section>

        <section aria-labelledby="credits-stock">
          <h2 id="credits-stock" className={styles.creditsTitle}>
            Stock photograph
          </h2>
          <p className={`muted measure ${styles.creditsNote}`}>
            A free photograph under the <ExternalLink href="https://unsplash.com/license">Unsplash License</ExternalLink>, used only for homepage B’s
            Kuala Lumpur scene. It was not taken by Whimy. Its colour is lightly graded (a little less saturation, a little warmer) to sit with the
            campaign’s sky.
          </p>
          <ul className="rows">
            {(Object.values(stockImages) as ImageSource[]).map((image) => (
              <CreditRow key={image.key} image={image}>
                {image.credit && (
                  <>
                    Photo by <ExternalLink href={image.credit.url}>{image.credit.name}</ExternalLink> on {image.credit.source}
                  </>
                )}
              </CreditRow>
            ))}
          </ul>
        </section>

        <section aria-labelledby="credits-ai">
          <h2 id="credits-ai" className={styles.creditsTitle}>
            AI-generated
          </h2>
          <p className={`muted measure ${styles.creditsNote}`}>
            Whimy’s own AI-generated visual, labelled as AI content on Instagram; and the meadow visual in homepage B’s campaign, generated for this
            preview (two generations of the same scene: the tall one upscaled with Higgsfield’s 4K upscaler, the wide one extended on every side with Higgsfield’s outpainting, so there is more sky above her). Its model and setting are generated, and its heels
            are an impression of Petals Heels in Rich Brown, not a product photograph. It is not Whimy campaign material.
          </p>
          <ul className="rows">
            {ai.map((image) => (
              <CreditRow key={image.key} image={image}>
                {instagramCredit(image)}
              </CreditRow>
            ))}
            <CreditRow image={conceptImages.meadowWide}>
              Generated for this preview · a wide frame from 1024px and a tall one below ·{' '}
              <span className="num">
                wide: AI-extended from {conceptImages.meadowWide.extendedFrom!.width}px wide · tall: AI-upscaled from{' '}
                {conceptImages.meadowTall.upscaledFrom!.width}px wide
              </span>
            </CreditRow>
            {[conceptImages.packshotRichBrown, conceptImages.packshotBlushPink, conceptImages.packshotSageGreen, conceptImages.packshotTrio].map((image) => (
              <CreditRow key={image.key} image={image}>
                Generated for this preview · homepage B’s strip · a close impression of Petals Heels, not a product photograph
              </CreditRow>
            ))}
          </ul>
        </section>
      </div>
    </UtilityPage>
  );
}
