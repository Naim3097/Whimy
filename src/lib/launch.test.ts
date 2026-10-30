import { describe, expect, it } from 'vitest';
import { isLaunchStage, launchCopy } from './launch';

describe('launch stage copy', () => {
  it('preview-live sells: Add to bag with the price shown', () => {
    expect(launchCopy('preview-live')).toEqual({
      primaryCta: 'Add to bag',
      showPrice: true,
      priceLabel: null,
      announcement: 'Shop the Petals Collection',
      tiktokLine: 'Also coming to TikTok Shop',
    });
  });

  it('waitlist collects interest: Join the Petals list, price to be announced', () => {
    expect(launchCopy('waitlist')).toEqual({
      primaryCta: 'Join the Petals list',
      showPrice: false,
      priceLabel: 'Price to be announced',
      announcement: 'Launch date to be announced: join the list',
      tiktokLine: 'Also coming to TikTok Shop',
    });
  });

  it('accepts only known stages from storage', () => {
    expect(isLaunchStage('waitlist')).toBe(true);
    expect(isLaunchStage('live')).toBe(false);
    expect(isLaunchStage(null)).toBe(false);
  });
});
