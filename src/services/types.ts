/**
 * Data-access contracts. UI code depends only on these interfaces.
 * Today they are implemented by `src/services/mock`; a future adapter
 * (Shopify Storefront API, Medusa, a custom API…) implements the same
 * interfaces and is selected in `src/services/index.ts`.
 */
import type { Collection, Order, OrderDraft, Product } from '../domain/types';
import type { SearchHit } from '../lib/catalog';

export interface CatalogService {
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  listCollections(): Promise<Collection[]>;
  getCollection(slug: string): Promise<Collection | null>;
  search(query: string): Promise<SearchHit[]>;
  getRecommendations(productId: string, limit?: number): Promise<Product[]>;
}

export class OrderError extends Error {
  readonly code: 'payment-declined' | 'out-of-stock' | 'invalid';
  constructor(code: OrderError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

export interface OrderService {
  /** Must be idempotent on `draft.idempotencyKey`. */
  submitOrder(draft: OrderDraft): Promise<Order>;
  getOrder(reference: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
}

export interface NewsletterService {
  subscribe(input: { email: string; whatsapp?: string; interest?: string }): Promise<{ status: 'subscribed' | 'already-subscribed' }>;
}

export interface ContactService {
  send(input: { name: string; email: string; topic: string; message: string }): Promise<{ reference: string }>;
}

export interface Services {
  catalog: CatalogService;
  orders: OrderService;
  newsletter: NewsletterService;
  contact: ContactService;
}
