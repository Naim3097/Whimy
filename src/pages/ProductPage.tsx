import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { flushSync } from 'react-dom';
import { Link, Navigate, useLocation, useMatch, useNavigate, useParams, useSearchParams } from 'react-router';
import { site } from '../config/site';
import type { Colourway, Product, ShippingMethod, Size } from '../domain/types';
import { whimyImages } from '../data/assets';
import { helpAnchors } from '../data/content';
import { shippingMethods } from '../data/mock/commerce';
import { usePageMeta, usePrefersReducedMotion } from '../hooks/dom';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useResource } from '../hooks/useResource';
import { defaultColourway, getColourway, isColourwayAvailable, sizeStock } from '../lib/catalog';
import { launchCopy, type LaunchCopy } from '../lib/launch';
import { formatMoney, instalments } from '../lib/money';
import { isValidEmail, isValidPhone } from '../lib/validation';
import { services } from '../services';
import { useCart } from '../state/cart';
import { useUI } from '../state/ui';
import { useWishlist } from '../state/wishlist';
import { accentVars } from '../components/product/accent';
import { ColourSwatches } from '../components/product/ColourSwatches';
import { ColourNote, LEAD_SIZES, leadImage, ProductGallery } from '../components/product/ProductGallery';
import { SetRow } from '../components/product/SetBuilder';
import { SizeGuideDialog } from '../components/product/SizeGuide';
import { SizeSelector } from '../components/product/SizeSelector';
import { SET_ID } from '../components/layout/nav';
import { Img } from '../components/ui/Img';
import { Price } from '../components/ui/Price';
import { Mark, ProvenanceMark } from '../components/ui/ProvenanceMark';
import { NotFoundContent } from './NotFoundPage';
import styles from './ProductPage.module.css';

/**
 * Petals lives at /products/:slug. A sample style lives at
 * /preview/catalogue/:slug, the only place its stock photograph may appear;
 * each address sends the other kind on to its own.
 */
export function ProductPage() {
  const { slug = '' } = useParams();
  const { search } = useLocation();
  const inPreview = useMatch('/preview/catalogue/:slug') != null;
  const { data: product, status } = useResource(`product:${slug}`, () => services.catalog.getProduct(slug));

  if (status === 'loading' || status === 'idle') return <ProductSkeleton />;
  if (!product) return <ProductMissing />;
  const sample = product.kind === 'sample';
  if (sample !== inPreview) {
    return <Navigate replace to={`${sample ? '/preview/catalogue' : '/products'}/${product.slug}${search}`} />;
  }
  return <ProductView key={product.id} product={product} />;
}

function ProductMissing() {
  usePageMeta('Pair not found');
  return <NotFoundContent title="We couldn’t find that pair." />;
}

function ProductSkeleton() {
  return (
    <div className={`wrap grid ${styles.top}`} aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className={`skeleton ${styles.gallery} ${styles.skeletonMedia}`} />
      <div className={`${styles.buy} ${styles.skeletonInfo}`}>
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}

/**
 * A colour change cross-fades as a 200ms view transition where supported; elsewhere,
 * and in a background tab (where the browser would abort it), it is instant. A
 * transition cut short by the next change still applies its update, so its rejected
 * `ready` promise is expected and dropped. While the fade runs the browser sends
 * every click to the root element, so a quick second click (another colour, a size)
 * is caught there and replayed on whatever sits under the pointer once it ends.
 */
function crossFade(update: () => void, reducedMotion: boolean) {
  if (reducedMotion || typeof document.startViewTransition !== 'function' || document.visibilityState !== 'visible') {
    update();
    return;
  }
  const root = document.documentElement;
  const missed: { x: number; y: number }[] = [];
  const catchClick = (e: MouseEvent) => {
    if (e.target === root) missed.push({ x: e.clientX, y: e.clientY });
  };
  root.addEventListener('click', catchClick);
  root.dataset.transition = 'colour';
  const done = () => {
    delete root.dataset.transition;
    root.removeEventListener('click', catchClick);
    for (const { x, y } of missed) (document.elementFromPoint(x, y) as HTMLElement | null)?.click();
  };
  const transition = document.startViewTransition(update);
  transition.ready.catch(() => {});
  transition.finished.then(done, done);
}

/**
 * The buy box sticks 24px under the header. When it is taller than the window
 * it sticks by its bottom edge instead, so every line of it stays reachable.
 */
function useFitSticky(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
      const room = window.innerHeight - el.offsetHeight - 24;
      el.style.setProperty('--buy-top', `${Math.min(header + 24, room)}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [ref]);
}

const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 56;

/**
 * True once the element has scrolled up behind the header. Measured on every
 * scroll, resize and page-height change (once per frame), so a jump straight
 * to the top or bottom can't leave it stale the way a crossing observer can.
 */
function useScrolledPast(ref: RefObject<HTMLElement | null>) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let header = headerHeight();
    let frame = 0;
    const check = () => {
      frame = 0;
      setPast(el.getBoundingClientRect().bottom < header);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const resize = () => {
      header = headerHeight();
      schedule();
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(document.body);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    check();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
    };
  }, [ref]);
  return past;
}

/**
 * Desktop only: a colour chosen deep in the stack, once the lead fills less
 * than the top half of the window, brings the new lead back up beside the buy
 * box. It runs inside the cross-fade, so the jump is covered. A shallower
 * scroll keeps its place, and the swatch stays under the pointer. Phones keep
 * their place too: there the swatches sit below the strip.
 */
function bringLeadIntoView(gallery: HTMLElement | null) {
  const lead = gallery?.querySelector('li');
  if (!gallery || !lead || !window.matchMedia('(min-width: 1024px)').matches) return;
  const header = headerHeight();
  if (lead.getBoundingClientRect().bottom > header + (window.innerHeight - header) / 2) return;
  window.scrollTo({ top: window.scrollY + gallery.getBoundingClientRect().top - header - 24, behavior: 'instant' });
}

const colourLabel = (colourway: Colourway) => (colourway.nickname ? `${colourway.nickname} · ${colourway.name}` : colourway.name);

function ProductView({ product }: { product: Product }) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { launchStage, notify } = useUI();
  const cart = useCart();
  const wishlist = useWishlist();
  const { record } = useRecentlyViewed();
  const reducedMotion = usePrefersReducedMotion();
  const copy = launchCopy(launchStage);
  const isPetals = product.kind === 'whimy';
  // Preview-live sells (Add to bag); the waitlist stage collects interest instead.
  const buying = copy.showPrice;

  // ?colour= first, then the first colour.
  const paramColour = params.get('colour');
  const [colourId, setColourId] = useState(() => (getColourway(product, paramColour) ?? defaultColourway(product)).id);
  const [seenParam, setSeenParam] = useState(paramColour);
  if (paramColour !== seenParam) {
    // A link to another colour of this product (the Shop panel, search) arrives as a new ?colour=.
    setSeenParam(paramColour);
    const linked = getColourway(product, paramColour);
    if (linked) setColourId(linked.id);
  }
  const colourway = getColourway(product, colourId) ?? defaultColourway(product);

  const [size, setSize] = useState<Size | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [variantMessage, setVariantMessage] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [joined, setJoined] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const warmed = useRef(false);

  usePageMeta(product.seo.title, product.seo.description);
  useEffect(() => record(product.id), [product.id, record]);

  // A link to the set (#all-three) lands before the product has loaded; scroll once the row exists.
  const { hash } = useLocation();
  useEffect(() => {
    if (hash !== `#${SET_ID}`) return;
    document.getElementById(SET_ID)?.scrollIntoView({ block: 'center', behavior: reducedMotion ? 'auto' : 'smooth' });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFitSticky(buyRef);
  const pastAction = useScrolledPast(actionRef);

  const saved = wishlist.has(product.id, colourway.id);
  const colourAvailable = isColourwayAvailable(colourway);

  const changeColour = (id: string) => {
    const next = getColourway(product, id);
    if (!next || next.id === colourway.id) return;
    const dropSize = size != null && sizeStock(next, size) <= 0;
    const nextParams = new URLSearchParams(params);
    nextParams.set('colour', next.id);
    crossFade(() => {
      flushSync(() => {
        setColourId(next.id);
        setSeenParam(next.id);
        if (dropSize) setSize(null);
        setVariantMessage(dropSize ? `EU ${size} is unavailable in ${next.name}. Choose another size.` : '');
      });
      bringLeadIntoView(galleryRef.current);
      // Only after the old frame is captured, so the router's re-render can't pre-empt the cross-fade.
      setParams(nextParams, { replace: true, preventScrollReset: true });
    }, reducedMotion);
  };

  // On first intent to change colour, fetch the other colours' lead frames so the cross-fade has them.
  const warmLeads = () => {
    if (warmed.current) return;
    warmed.current = true;
    for (const c of product.colourways) {
      const lead = leadImage(product, c);
      if (!lead || lead.origin !== 'whimy' || c.id === colourway.id) continue;
      const img = new Image();
      img.sizes = LEAD_SIZES;
      if (lead.srcSet) img.srcset = lead.srcSet;
      img.src = lead.src;
    }
  };

  const chooseSize = (next: Size) => {
    setSize(next);
    setSizeError(null);
    setVariantMessage('');
  };

  const focusSizes = (scroll: boolean) => {
    const group = sizeRef.current;
    if (!group) return;
    if (scroll) group.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    group.querySelector<HTMLInputElement>('input[type="radio"]:not(:disabled)')?.focus({ preventScroll: scroll });
  };

  const addToBag = (from: 'buy-box' | 'bar') => {
    if (!size) {
      if (from === 'buy-box') setSizeError('Choose a size');
      focusSizes(from === 'bar');
      return;
    }
    const result = cart.add({ productId: product.id, colourId: colourway.id, size }, 1);
    if (!result.ok) {
      notify({ tone: 'error', message: `Your bag already holds the most we can sell of EU ${size} in ${colourway.name}.` });
      return;
    }
    cart.openDrawer();
  };

  // Saved lives under Account (§7), so saving says where to find it; the toast region announces it.
  const toggleSave = () => {
    const nowSaved = wishlist.toggle(product.id, colourway.id);
    setSaveMessage(nowSaved ? '' : 'Removed from Saved.');
    if (nowSaved) {
      notify({
        message: `Saved: ${product.name}, ${colourLabel(colourway)}. Find it under Account.`,
        action: { label: 'View saved', onClick: () => navigate('/saved') },
      });
    }
  };

  const toJoinList = () => {
    const field = emailRef.current;
    if (!field) return;
    field.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
  };

  const barShown = pastAction && !cart.drawerOpen && !guideOpen && (buying ? colourAvailable : !joined);

  return (
    <div>
      <div className={`wrap grid ${styles.top}`} data-kind={product.kind}>
        <div ref={galleryRef} className={styles.gallery}>
          <ProductGallery product={product} colourway={colourway} />
        </div>

        {/* Two columns on tablets (who it is | choosing it); one column elsewhere, where the wrappers fall away. */}
        <div ref={buyRef} className={styles.buy} data-kind={product.kind}>
          <div className={styles.identity}>
            <nav aria-label="Breadcrumb" className={styles.crumbs}>
              <ol role="list">
                <li>
                  <Link to={isPetals ? '/shop/petals-collection' : '/preview/catalogue'} className="link-quiet">
                    {isPetals ? 'Petals Collection' : 'Preview catalogue'}
                  </Link>
                </li>
                <li aria-current="page">{product.name}</li>
              </ol>
            </nav>

            <h1 className={`t-title ${styles.title}`}>{product.name}</h1>
            <p className={styles.colourName}>
              {colourway.nickname && <span className="v-2">{colourway.nickname}</span>}
              <span className={styles.official}>
                {colourway.nickname && '· '}
                {colourway.name}
              </span>
            </p>

            {copy.showPrice ? (
              <>
                <p className={styles.price}>
                  <Price amount={product.price.amount} provenance={product.price.provenance} compareAt={product.price.compareAt} />
                </p>
                {site.payments.atome && (
                  <p className={`t-small muted ${styles.atome}`}>
                    or 3 payments of <span className="num">{formatMoney(instalments(product.price.amount, 3)[0])}</span> with Atome
                    <ProvenanceMark kind="sample" />
                  </p>
                )}
              </>
            ) : (
              <p className={styles.price}>{copy.priceLabel}</p>
            )}

            <p className={styles.description}>{product.shortDescription}</p>

            {colourway.note && <ColourNote note={colourway.note} className={styles.buyNote} />}
          </div>

          <hr className={styles.rule} />

          <div className={styles.choose}>
            <div onPointerEnter={warmLeads} onFocus={warmLeads}>
              <ColourSwatches colourways={product.colourways} selectedId={colourway.id} onChange={changeColour} name="pdp" />
            </div>

            <div ref={sizeRef} className={styles.sizes}>
              <SizeSelector
                sizes={product.sizes}
                colourway={colourway}
                selected={size}
                onChange={chooseSize}
                onOpenGuide={() => setGuideOpen(true)}
                error={sizeError ?? undefined}
                provenance={product.sizeProvenance}
                notifyFor={product.name}
              />
              {isPetals && (
                <p className={`t-small muted ${styles.fit}`}>
                  Fit notes
                  <ProvenanceMark kind="tbc" />. We’ll publish them before launch.
                </p>
              )}
            </div>

            <p className="sr-only" aria-live="polite">
              {variantMessage}
            </p>

            <div ref={actionRef} className={styles.action}>
              {buying ? (
                <button
                  type="button"
                  className="btn btn--lg btn--block"
                  onClick={() => addToBag('buy-box')}
                  disabled={!colourAvailable}
                >
                  {!colourAvailable ? `Sold out in ${colourway.name}` : size ? `${copy.primaryCta} · EU ${size}` : 'Choose a size'}
                </button>
              ) : (
                <JoinList
                  product={product}
                  colourway={colourway}
                  size={size}
                  copy={copy}
                  emailRef={emailRef}
                  onJoined={() => setJoined(true)}
                />
              )}
            </div>

            <div className={styles.textRow}>
              <button type="button" className={`link ${styles.textAction}`} onClick={toggleSave}>
                {saved ? 'Saved' : 'Save'}
              </button>
              <span className="sr-only" aria-live="polite">
                {saveMessage}
              </span>
              {isPetals && (
                <>
                  <span className={styles.dot} aria-hidden="true">
                    ·
                  </span>
                  <a className={`link ${styles.textAction}`} href={site.tiktokShopUrl} target="_blank" rel="noreferrer">
                    {copy.tiktokLine}
                    <span aria-hidden="true">{'\u00a0'}↗</span>
                    <span className="sr-only"> (opens in new tab)</span>
                  </a>
                </>
              )}
            </div>

            <ul role="list" className={styles.reassure}>
              <li>
                Delivery across Malaysia and Singapore: West 2–4, East 5–8 working days
                <ProvenanceMark kind="sample" />
              </li>
              <li>
                One size exchange within 14 days
                <ProvenanceMark kind="sample" />
              </li>
              <li>
                Questions? Message{' '}
                <a className="link" href={site.social.instagram} target="_blank" rel="noreferrer">
                  @whimy.official<span className="sr-only"> on Instagram (opens in new tab)</span>
                </a>
              </li>
            </ul>
          </div>

          <ProductDetails product={product} />
        </div>
      </div>

      <div className={`wrap ${styles.after}`}>
        {isPetals ? (
          <>
            <SetRow product={product} id={SET_ID} />
            <p className="t-small muted">No reviews yet. Reviews open after the first pairs ship.</p>
            <p>
              <Link to="/story" className="link t-ui">
                Read the story
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="t-small muted">A sample style, not a Whimy product. It shows how the catalogue will browse.</p>
            <p>
              <Link to="/preview/catalogue" className="link t-ui">
                Back to the preview catalogue
              </Link>
            </p>
          </>
        )}
      </div>

      <div className={styles.bar} data-shown={barShown || undefined} style={accentVars(colourway)}>
        <div className={styles.barInfo}>
          <p className={styles.barColour}>
            <span className={`chip ${styles.barChip}`} aria-hidden="true" />
            {colourway.nickname ? <span className="v-0">{colourway.nickname}</span> : colourway.name}
            {size && <span className="num"> · EU {size}</span>}
          </p>
          <p className="t-small muted">
            {copy.showPrice ? <Price amount={product.price.amount} provenance={product.price.provenance} /> : copy.priceLabel}
          </p>
        </div>
        <button type="button" className="btn" onClick={buying ? () => addToBag('bar') : toJoinList}>
          {buying ? (size ? copy.primaryCta : 'Choose size') : 'Join the list'}
        </button>
      </div>

      <SizeGuideDialog open={guideOpen} onClose={() => setGuideOpen(false)} highlight={size} product={product} />
    </div>
  );
}

const REGION: Record<ShippingMethod['region'], string> = {
  west: 'West Malaysia',
  east: 'East Malaysia',
  singapore: 'Singapore',
};

function deliveryLine(method: ShippingMethod) {
  const where = method.id === 'west-express' ? 'Klang Valley express' : REGION[method.region];
  const eta = method.eta.charAt(0).toLowerCase() + method.eta.slice(1);
  const free = method.freeFrom ? `, free from ${formatMoney(method.freeFrom)}` : '';
  return `${where}: ${eta}, ${formatMoney(method.price)}${free}`;
}

/** Item 12: native disclosures. Petals carries the fixed Details & fit fields plus care and the box. */
function ProductDetails({ product }: { product: Product }) {
  const isPetals = product.kind === 'whimy';
  return (
    <div className={`accordion ${styles.details}`}>
      <details>
        <summary>{isPetals ? 'Details & fit' : 'Details'}</summary>
        <dl className={styles.specs}>
          {product.specs.map((spec) => (
            <div key={spec.label} className={styles.spec}>
              <dt>{spec.label}</dt>
              <dd>
                {spec.value}
                <Mark provenance={spec.provenance} />
                {isPetals && spec.label === 'Footbed' && (
                  <Img image={whimyImages.insoleDetail} sizes="120px" className={styles.insole} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </details>

      <details>
        <summary>Delivery & exchanges</summary>
        <div className={styles.panel}>
          <ul role="list" className={styles.panelList}>
            {shippingMethods.map((method) => (
              <li key={method.id}>
                {deliveryLine(method)}
                <ProvenanceMark kind="sample" />
              </li>
            ))}
          </ul>
          <p className="t-small">
            <Link to={`/help#${helpAnchors.delivery}`} className="link">
              Delivery
            </Link>{' '}
            and{' '}
            <Link to={`/help#${helpAnchors.exchanges}`} className="link">
              exchanges
            </Link>{' '}
            in Help
          </p>
        </div>
      </details>

      {isPetals && (
        <details>
          <summary>Care</summary>
          <div className={styles.panel}>
            <ul role="list" className={styles.panelList}>
              <li>Satin: keep it dry, and lift marks gently with a soft, dry cloth.</li>
              <li>Organza flower: reshape the petals with your fingertips, away from heat and perfume.</li>
            </ul>
            <p className="t-small muted">
              Care notes
              <ProvenanceMark kind="tbc" /> ·{' '}
              <Link to={`/help#${helpAnchors.care}`} className="link">
                Care in Help
              </Link>
            </p>
          </div>
        </details>
      )}

      {isPetals && (
        <details>
          <summary>The box & letter card</summary>
          <div className={styles.panel}>
            <p>
              Box and letter card details
              <ProvenanceMark kind="tbc" />
            </p>
          </div>
        </details>
      )}
    </div>
  );
}

interface JoinListProps {
  product: Product;
  colourway: Colourway;
  size: Size | null;
  copy: LaunchCopy;
  emailRef: RefObject<HTMLInputElement | null>;
  onJoined: () => void;
}

/** Waitlist stage: the primary action becomes an inline sign-up that keeps the chosen colour and size. */
function JoinList({ product, colourway, size, copy, emailRef, onJoined }: JoinListProps) {
  const id = useId();
  const whatsappRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'subscribed' | 'already-subscribed' | null>(null);
  const preference = `${colourway.name}${size ? `, EU ${size}` : ''}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!isValidEmail(email)) next.email = 'Enter an email like name@example.com.';
    if (whatsapp.trim() && !isValidPhone(whatsapp, 'MY') && !isValidPhone(whatsapp, 'SG')) {
      next.whatsapp = 'Enter a Malaysian or Singapore number, e.g. 012-345 6789.';
    }
    setErrors(next);
    if (next.email) {
      emailRef.current?.focus();
      return;
    }
    if (next.whatsapp) {
      whatsappRef.current?.focus();
      return;
    }
    setSending(true);
    try {
      const res = await services.newsletter.subscribe({
        email,
        whatsapp: whatsapp.trim() || undefined,
        interest: `${product.name}: ${preference}`,
      });
      setResult(res.status);
      onJoined();
    } catch {
      setErrors({ email: 'That didn’t go through. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  if (result) {
    return (
      <p className={styles.joined} role="status">
        {result === 'already-subscribed' ? 'You’re already on the list.' : 'You’re on the list.'}
      </p>
    );
  }

  return (
    <form className={styles.join} onSubmit={submit} noValidate>
      <p className="t-small muted">
        {size ? `Your preference: ${preference}.` : `Your preference: ${preference}. Add a size above if you know it.`}
      </p>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-email`}>
          Email
        </label>
        <input
          ref={emailRef}
          id={`${id}-email`}
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${id}-email-error` : undefined}
        />
        {errors.email && (
          <p id={`${id}-email-error`} className="field-error">
            {errors.email}
          </p>
        )}
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-whatsapp`}>
          WhatsApp <span className={styles.optional}>(optional)</span>
        </label>
        <input
          ref={whatsappRef}
          id={`${id}-whatsapp`}
          className="input"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          aria-invalid={errors.whatsapp ? true : undefined}
          aria-describedby={errors.whatsapp ? `${id}-whatsapp-error` : undefined}
        />
        {errors.whatsapp && (
          <p id={`${id}-whatsapp-error`} className="field-error">
            {errors.whatsapp}
          </p>
        )}
      </div>
      <button type="submit" className="btn btn--lg btn--block" disabled={sending}>
        {sending ? 'Joining…' : copy.primaryCta}
      </button>
      <p className="t-cap muted">
        We’ll only contact you about Whimy launches.{' '}
        <Link to="/privacy" className="link">
          Privacy notice (EN / BM)
        </Link>
      </p>
    </form>
  );
}
