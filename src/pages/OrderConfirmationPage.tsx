import { Link, useParams } from 'react-router';
import { Totals } from '../components/cart/Totals';
import { paymentLabel } from '../components/checkout/payment';
import { SummaryLines } from '../components/checkout/SummaryLines';
import { toSummaryLine } from '../components/checkout/summaryLine';
import { ProvenanceMark } from '../components/ui/ProvenanceMark';
import { usePageMeta } from '../hooks/dom';
import { useResource } from '../hooks/useResource';
import { formatMoney } from '../lib/money';
import { addressLines } from '../lib/validation';
import { services } from '../services';
import { useCatalog } from '../state/catalog';
import styles from './OrderConfirmationPage.module.css';

export function OrderConfirmationPage() {
  const { reference = '' } = useParams();
  const { data: order, status } = useResource(`order:${reference}`, () => services.orders.getOrder(reference));
  const { productById } = useCatalog();
  usePageMeta(order ? `Order ${order.reference}` : 'Order');

  if (status !== 'success') {
    return (
      <div className={`wrap--utility ${styles.page}`}>
        <div className={`skeleton ${styles.loading}`} aria-busy="true" aria-label="Loading your order" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`wrap--utility ${styles.page}`}>
        <h1 className="t-title">We couldn’t find that order.</h1>
        <p className={`t-body muted ${styles.intro}`}>Check the link, or find your orders in your account.</p>
        <p className={styles.links}>
          <Link to="/account" className="link">
            Your account
          </Link>
          <span aria-hidden="true">·</span>
          <Link to="/shop/petals-collection" className="link">
            Back to shop
          </Link>
        </p>
      </div>
    );
  }

  const firstName = order.address.fullName.trim().split(/\s+/)[0];

  return (
    <div className={`wrap--utility ${styles.page}`}>
      <div className={`grid ${styles.layout}`}>
        <div className={styles.main}>
          <h1 className="v-3">Dear {firstName},</h1>
          <p className={`t-lead ${styles.thanks}`}>
            thank you. Your order <span className="num">{order.reference}</span> is in.
          </p>

          <section className={styles.next} aria-labelledby="next-title">
            <h2 id="next-title" className="t-ui">
              What happens next
            </h2>
            <ul role="list" className="rows">
              <li>
                Your confirmation email goes to {order.contact.email}.
                <ProvenanceMark kind="sample" />
              </li>
              <li>
                We’ll email you again when your order is dispatched.
                <ProvenanceMark kind="sample" />
              </li>
              <li>
                Estimated delivery: {order.shippingEta} ({order.shippingMethodLabel})
                <ProvenanceMark kind="sample" />
              </li>
            </ul>
          </section>

          <p className={styles.links}>
            <Link to="/story#letter" className="link">
              Read the letter
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/shop/petals-collection" className="link">
              Back to shop
            </Link>
          </p>
          <p className="t-small muted">Preview only. Nothing is charged.</p>
        </div>

        <aside className={styles.summary} aria-labelledby="order-summary">
          <h2 id="order-summary" className="t-ui">
            Your order
          </h2>
          <SummaryLines lines={order.lines.map((l) => toSummaryLine(l, productById(l.productId)))} />
          <Totals totals={order.totals} code={order.promoCode} delivery={<span className="num">{order.totals.shipping === 0 ? 'Free' : formatMoney(order.totals.shipping)}</span>} />
          <dl className={styles.details}>
            <div>
              <dt>Delivering to</dt>
              <dd>
                <address className={styles.address}>
                  {addressLines(order.address).map((line, i) => (
                    <span key={i}>{line}</span>
                  ))}
                </address>
              </dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {paymentLabel(order.payment)}
                {order.payment.method === 'fpx' && order.payment.provider ? ` · ${order.payment.provider}` : ''}
              </dd>
            </div>
            {order.giftNote && (
              <div>
                <dt>Letter card</dt>
                <dd className={`letter ${styles.note}`}>{order.giftNote}</dd>
              </div>
            )}
            <div>
              <dt>Placed</dt>
              <dd>{new Date(order.placedAt).toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' })}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
