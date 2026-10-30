/**
 * Brand and business information.
 * Every field notes whether it is verified (from Whimy's public channels)
 * or a placeholder Whimy still needs to supply.
 */
import type { LaunchStage } from '../lib/launch';

export const site = {
  name: 'Whimy',
  tagline: 'The heels of that girl next door',
  hashtag: '#lovewhimy',
  communityName: 'Whimy Babes',
  location: { city: 'Kuala Lumpur', country: 'Malaysia', verified: true },
  social: {
    instagram: 'https://www.instagram.com/whimy.official/',
    tiktok: 'https://www.tiktok.com/@whimy.official',
    threads: 'https://www.threads.com/@whimy.official',
  },
  /** Whimy has announced TikTok Shop as a sales channel; no shop URL is public yet, so we link the profile. */
  tiktokShopUrl: 'https://www.tiktok.com/@whimy.official',
  /**
   * `preview-live` is the client demo (add to bag, sample price).
   * Use `waitlist` for any link shared beyond the client. Read only through lib/launch.ts.
   */
  launchStage: 'preview-live' as LaunchStage,
  /** Optional payment methods, off until Whimy confirms them. */
  payments: { atome: false },
  /** Placeholders — not yet published by Whimy. */
  business: {
    legalName: '[Registered business name]',
    ssmNumber: '[SSM no. TBC]',
    address: '[Business address TBC], Kuala Lumpur, Malaysia',
    email: 'hello@[whimy-domain].my',
    whatsapp: '+60 [TBC]',
    verified: false,
  },
} as const;

export const env = {
  /** `mock` is the only implementation in this phase. See README "Backend integration". */
  dataSource: (import.meta.env.VITE_DATA_SOURCE ?? 'mock') as 'mock',
  /** Artificial latency for mock services, to exercise loading states. */
  mockLatencyMs: Number(import.meta.env.VITE_MOCK_LATENCY_MS ?? 160),
};
