/**
 * Local mock implementations of every service. Nothing leaves the browser:
 * no network calls, no payments, no emails. Orders are simulated and stored
 * in localStorage so the confirmation and "My Whimy" pages can show them.
 */
import type { Order, OrderDraft, Product } from '../../domain/types';
import { collections } from '../../data/mock/collections';
import { products } from '../../data/mock/products';
import { shippingMethods } from '../../data/mock/commerce';
import { getColourway, relatedProducts, searchProducts, sizeStock } from '../../lib/catalog';
import { persistentStorage, STORAGE_KEYS, type StorageAdapter } from '../../lib/storage';
import { OrderError, type Services } from '../types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function orderReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `WHM-${suffix}`;
}

export function createMockServices(options: { latencyMs: number; storage?: StorageAdapter; catalog?: Product[] }): Services {
  const { latencyMs, storage = persistentStorage, catalog = products } = options;
  const delay = () => wait(latencyMs);
  const inflight = new Map<string, Promise<Order>>();

  const readOrders = () => storage.read<Order[]>(STORAGE_KEYS.orders, []);

  return {
    catalog: {
      async listProducts() {
        await delay();
        return catalog;
      },
      async getProduct(slug) {
        await delay();
        return catalog.find((p) => p.slug === slug) ?? null;
      },
      async listCollections() {
        await delay();
        return collections;
      },
      async getCollection(slug) {
        await delay();
        return collections.find((c) => c.slug === slug) ?? null;
      },
      async search(query) {
        await delay();
        return searchProducts(catalog, query);
      },
      async getRecommendations(productId, limit = 4) {
        await delay();
        const product = catalog.find((p) => p.id === productId);
        return product ? relatedProducts(catalog, product, limit) : [];
      },
    },

    orders: {
      submitOrder(draft: OrderDraft) {
        const existing = inflight.get(draft.idempotencyKey);
        if (existing) return existing;
        const attempt = (async () => {
          await wait(Math.max(latencyMs, 900));
          // Re-validate stock "server-side".
          for (const line of draft.lines) {
            const product = catalog.find((p) => p.id === line.productId);
            const colourway = product && getColourway(product, line.colourId);
            if (!colourway || sizeStock(colourway, line.size) < line.quantity) {
              throw new OrderError('out-of-stock', `${line.name} (${line.colourName}, EU ${line.size}) no longer has enough stock.`);
            }
          }
          // Simulated decline path so the error state can be demonstrated.
          if (draft.contact.email.toLowerCase().includes('decline')) {
            throw new OrderError('payment-declined', 'The payment was declined. Choose another way to pay and try again.');
          }
          const method = shippingMethods.find((m) => m.id === draft.shippingMethodId);
          const { idempotencyKey: _key, ...rest } = draft;
          const order: Order = {
            ...rest,
            reference: orderReference(),
            placedAt: new Date().toISOString(),
            shippingMethodLabel: method ? `${method.label} · ${method.carrier}` : 'Delivery',
            shippingEta: method?.eta ?? '',
            simulated: true,
          };
          storage.write(STORAGE_KEYS.orders, [order, ...readOrders()].slice(0, 20));
          return order;
        })();
        inflight.set(draft.idempotencyKey, attempt);
        attempt.catch(() => inflight.delete(draft.idempotencyKey));
        return attempt;
      },
      async getOrder(reference) {
        await delay();
        return readOrders().find((o) => o.reference === reference) ?? null;
      },
      async listOrders() {
        await delay();
        return readOrders();
      },
    },

    newsletter: {
      async subscribe({ email }) {
        await delay();
        const list = storage.read<string[]>(STORAGE_KEYS.newsletter, []);
        const normalised = email.trim().toLowerCase();
        if (list.includes(normalised)) return { status: 'already-subscribed' };
        storage.write(STORAGE_KEYS.newsletter, [...list, normalised]);
        return { status: 'subscribed' };
      },
    },

    contact: {
      async send() {
        await wait(Math.max(latencyMs, 600));
        return { reference: `MSG-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
      },
    },
  };
}
