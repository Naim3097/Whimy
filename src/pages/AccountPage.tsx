import { useState } from 'react';
import { Link } from 'react-router';
import type { Order } from '../domain/types';
import { chipStyle } from '../components/cart/petals';
import { MiniCard } from '../components/product/ProductCard';
import { Price } from '../components/ui/Price';
import { usePageMeta } from '../hooks/dom';
import { useResource } from '../hooks/useResource';
import { getColourway } from '../lib/catalog';
import { addressLines, formatPhone } from '../lib/validation';
import { services } from '../services';
import { useCatalog } from '../state/catalog';
import { useWishlist } from '../state/wishlist';
import { UtilityPage } from './InfoPages';
import styles from './AccountPage.module.css';

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
const pairs = (n: number) => `${n} ${n === 1 ? 'pair' : 'pairs'}`;

/**
 * Account without sign-in: orders placed in this browser, saved pairs and
 * the details from the latest order, in three plain sections.
 */
export function AccountPage() {
  usePageMeta('Account');
  const [mountedAt] = useState(() => Date.now());
  const { data: orders, status } = useResource(`orders:list:${mountedAt}`, () => services.orders.listOrders());

  return (
    <UtilityPage title="Account" intro="In this preview, your account lives in this browser: orders, saved pairs and details stay on this device.">
      <div className={`grid ${styles.layout}`}>
        <section className={styles.orders} aria-labelledby="orders-title">
          <h2 id="orders-title" className={styles.h2}>
            Orders
          </h2>
          {status !== 'success' ? (
            <p className="muted" aria-busy="true">
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <div className={styles.empty}>
              <p>No orders yet.</p>
              <Link to="/shop/petals-collection" className="btn">
                Shop Petals Heels
              </Link>
            </div>
          ) : (
            <ul className="rows">
              {orders.map((order) => (
                <OrderRow key={order.reference} order={order} />
              ))}
            </ul>
          )}
        </section>

        <div className={styles.side}>
          <SavedSummary />
          <section aria-labelledby="details-title">
            <h2 id="details-title" className={styles.h2}>
              Details
            </h2>
            {status === 'success' && orders[0] ? (
              <Details order={orders[0]} />
            ) : (
              <p className="muted measure">Your name, email and delivery address are asked for at checkout. No password needed.</p>
            )}
          </section>
        </div>
      </div>
    </UtilityPage>
  );
}

/** The reference, the date and count, then which colours: a chip and *nickname* per colour. */
function OrderRow({ order }: { order: Order }) {
  const { productById } = useCatalog();
  const count = order.lines.reduce((n, l) => n + l.quantity, 0);
  const colours = order.lines.flatMap((line) => {
    const product = productById(line.productId);
    const colourway = product && getColourway(product, line.colourId);
    return colourway ? [{ key: `${line.productId}:${line.colourId}:${line.size}`, colourway }] : [];
  });
  const named = colours.filter((c, i) => colours.findIndex((o) => o.colourway.id === c.colourway.id) === i);

  return (
    <li className={styles.order}>
      <div className={styles.orderMain}>
        <Link to={`/order/${order.reference}`} className={`link-quiet num ${styles.reference}`}>
          {order.reference}
        </Link>
        <span className="t-small muted">
          {dateLabel(order.placedAt)} · {pairs(count)}
        </span>
        {named.length > 0 && (
          <p className={styles.colours}>
            {named.map(({ key, colourway }) => (
              <span key={key} className={styles.colourTag}>
                <span className="chip" style={chipStyle(colourway)} aria-hidden="true" />
                {colourway.nickname ? <span className="v-0">{colourway.nickname}</span> : <span className="t-small">{colourway.name}</span>}
                {colourway.nickname && <span className="sr-only">, {colourway.name}</span>}
              </span>
            ))}
          </p>
        )}
      </div>
      <Price amount={order.totals.total} provenance="mock" className={styles.total} />
    </li>
  );
}

function SavedSummary() {
  const { items } = useWishlist();
  const { productById } = useCatalog();
  // Sample styles live only in the preview catalogue; Saved lists real Whimy pairs.
  const saved = items
    .map((item) => {
      const product = productById(item.productId);
      const colourway = product && getColourway(product, item.colourId);
      return product && colourway && product.kind === 'whimy' ? { product, colourway } : null;
    })
    .filter((x) => x !== null);

  return (
    <section aria-labelledby="saved-title">
      <h2 id="saved-title" className={styles.h2}>
        Saved
      </h2>
      {saved.length === 0 ? (
        <p className="muted">Nothing saved yet.</p>
      ) : (
        <>
          <ul role="list" className={styles.savedList}>
            {saved.slice(0, 3).map(({ product, colourway }) => (
              <li key={`${product.id}:${colourway.id}`}>
                <MiniCard product={product} colourway={colourway} />
              </li>
            ))}
          </ul>
          <Link to="/saved" className={`link ${styles.more}`}>
            View saved ({saved.length})
          </Link>
        </>
      )}
    </section>
  );
}

function Details({ order }: { order: Order }) {
  const { contact, address } = order;
  // The name has its own line above; the rest reads like an envelope.
  const lines = addressLines({ ...address, fullName: '' });

  return (
    <div className={styles.details}>
      <p className={styles.name}>{address.fullName}</p>
      <p>{contact.email}</p>
      {contact.phone && <p className="num">{formatPhone(contact.phone)}</p>}
      <address className={styles.address}>
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </address>
      <p className="t-small muted">From your order on {dateLabel(order.placedAt)}, kept on this device only.</p>
    </div>
  );
}
