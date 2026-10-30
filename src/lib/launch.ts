/**
 * Launch stage: the single place that turns `site.launchStage` (or the stage
 * chosen in About this preview) into storefront copy.
 */
export type LaunchStage = 'preview-live' | 'waitlist';

export const LAUNCH_STAGES: readonly LaunchStage[] = ['preview-live', 'waitlist'];

export interface LaunchCopy {
  /** Label of the primary product action. */
  primaryCta: string;
  /** False while the price is unannounced: show `priceLabel` instead of a Price. */
  showPrice: boolean;
  /** Text shown in place of the price, or null when the price is shown. */
  priceLabel: string | null;
  /** The bar above the header: A's announcement, and the first of B's messages while waiting. */
  announcement: string;
  tiktokLine: string;
}

const TIKTOK_LINE = 'Also coming to TikTok Shop';

export function isLaunchStage(value: unknown): value is LaunchStage {
  return typeof value === 'string' && (LAUNCH_STAGES as readonly string[]).includes(value);
}

export function launchCopy(stage: LaunchStage): LaunchCopy {
  if (stage === 'waitlist') {
    return {
      primaryCta: 'Join the Petals list',
      showPrice: false,
      priceLabel: 'Price to be announced',
      announcement: 'Launch date to be announced: join the list',
      tiktokLine: TIKTOK_LINE,
    };
  }
  return {
    primaryCta: 'Add to bag',
    showPrice: true,
    priceLabel: null,
    announcement: 'Shop the Petals Collection',
    tiktokLine: TIKTOK_LINE,
  };
}
