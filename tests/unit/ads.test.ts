import { describe, expect, it } from 'vitest';
import { isAdsEnabled, resolveSlot } from '../../src/lib/ads';

describe('R-07 ads', () => {
  it('AC-07-1 isAdsEnabled depends on PUBLIC_ADSENSE_CLIENT', () => {
    expect(isAdsEnabled({ PUBLIC_ADSENSE_CLIENT: '' })).toBe(false);
    expect(isAdsEnabled({})).toBe(false);
    expect(isAdsEnabled({ PUBLIC_ADSENSE_CLIENT: 'ca-pub-1' })).toBe(true);
  });

  it('AC-07-2 resolveSlot returns client, slot, layoutKey and format', () => {
    const env = {
      PUBLIC_ADSENSE_CLIENT: 'ca-pub-1',
      PUBLIC_ADSENSE_SLOT_LEADERBOARD: '111',
      PUBLIC_ADSENSE_SLOT_INFEED: '222',
      PUBLIC_ADSENSE_INFEED_LAYOUT_KEY: '-fb+5w+4e-db+86',
      PUBLIC_ADSENSE_SLOT_SIDEBAR: '333',
    };
    expect(resolveSlot('leaderboard', env)).toEqual({
      client: 'ca-pub-1',
      slot: '111',
      layoutKey: undefined,
      format: 'auto',
    });
    expect(resolveSlot('infeed', env)).toEqual({
      client: 'ca-pub-1',
      slot: '222',
      layoutKey: '-fb+5w+4e-db+86',
      format: 'fluid',
    });
    expect(resolveSlot('sidebar', env)).toEqual({
      client: 'ca-pub-1',
      slot: '333',
      layoutKey: undefined,
      format: 'auto',
    });
  });
});
