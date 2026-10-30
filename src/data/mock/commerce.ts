/**
 * Mock commerce rules: shipping, promo codes, payment options.
 * All values are demo assumptions based on Malaysian norms
 * (see Whimy-Research-Report.md §7) and must be confirmed by Whimy.
 */
import type { Money, PaymentMethodId, Product, ShippingMethod } from '../../domain/types';
import { percentOf } from '../../lib/money';

export const shippingMethods: ShippingMethod[] = [
  { id: 'west-standard', label: 'Standard delivery', region: 'west', carrier: 'J&T Express', eta: '2–4 working days', price: 800, freeFrom: 15000 },
  { id: 'west-express', label: 'Express (Klang Valley next day)', region: 'west', carrier: 'Lalamove / courier', eta: 'Next working day', price: 1500 },
  { id: 'east-standard', label: 'East Malaysia delivery', region: 'east', carrier: 'Pos Laju', eta: '5–8 working days', price: 1800, freeFrom: 25000 },
  { id: 'sg-standard', label: 'Singapore delivery', region: 'singapore', carrier: 'DHL eCommerce', eta: '3–6 working days', price: 3500 },
];

export const MALAYSIAN_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka', 'Negeri Sembilan', 'Pahang',
  'Penang', 'Perak', 'Perlis', 'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu',
] as const;

export const EAST_MALAYSIA_STATES = new Set(['Sabah', 'Sarawak', 'Labuan']);

export interface PromoRule {
  code: string;
  label: string;
  kind: 'percent' | 'fixed' | 'free-shipping';
  value: number;
  minSubtotal?: number;
  /** Requires at least this many Petals Heels in the bag. */
  minPetalsPairs?: number;
  expired?: boolean;
}

/** Demo promo codes (listed in the About this preview dialog). */
export const promoRules: PromoRule[] = [
  { code: 'LOVEWHIMY', label: '10% off your bag', kind: 'percent', value: 10 },
  { code: 'BLOOM20', label: 'RM20 off orders from RM150', kind: 'fixed', value: 2000, minSubtotal: 15000 },
  { code: 'FREESHIP', label: 'Free standard delivery', kind: 'free-shipping', value: 0 },
  { code: 'PETALS3', label: '15% off a bag with all three colours', kind: 'percent', value: 15, minPetalsPairs: 3 },
  { code: 'OLDBLOOM', label: 'Expired code (shows the error state)', kind: 'percent', value: 20, expired: true },
];

/** The set offer: one pair of every Petals colour. */
export const SET_CODE = 'PETALS3';
const setRule = promoRules.find((r) => r.code === SET_CODE);
export const SET_PERCENT = setRule?.kind === 'percent' ? setRule.value : 0;

/** One pair of every colour with the set code applied, rounded the way checkout rounds it (RM 507.45 at RM 199). */
export function setPrice(product: Product): Money {
  const subtotal = product.price.amount * product.colourways.length;
  return subtotal - percentOf(subtotal, SET_PERCENT);
}

export const paymentOptions: { id: PaymentMethodId; label: string; description: string; providers?: string[] }[] = [
  {
    id: 'fpx',
    label: 'FPX online banking',
    description: 'Pay straight from your bank account.',
    providers: ['Maybank2u', 'CIMB Clicks', 'Public Bank', 'RHB Now', 'Hong Leong Connect', 'Bank Islam', 'AmOnline'],
  },
  { id: 'ewallet', label: 'E-wallet', description: 'Touch ’n Go, GrabPay, Boost or ShopeePay.', providers: ['Touch ’n Go eWallet', 'GrabPay', 'Boost', 'ShopeePay'] },
  { id: 'duitnow', label: 'DuitNow QR', description: 'Scan with any banking or e-wallet app.' },
  { id: 'card', label: 'Credit / debit card', description: 'Visa or Mastercard on the gateway’s secure page.' },
  { id: 'atome', label: 'Atome · 3 instalments', description: 'Split into 3 interest-free payments.' },
];

export const MAX_QTY_PER_LINE = 5;
