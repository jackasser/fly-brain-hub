import { describe, expect, it } from 'vitest';
import { houseAd, isAdsEnabled, resolveSlot } from '../../src/lib/ads';

describe('R-07 ads', () => {
  it('AC-07-1 isAdsEnabled depends on PUBLIC_ADSENSE_CLIENT', () => {
    expect(isAdsEnabled({ PUBLIC_ADSENSE_CLIENT: '' })).toBe(false);
    expect(isAdsEnabled({})).toBe(false);
    expect(isAdsEnabled({ PUBLIC_ADSENSE_CLIENT: 'ca-pub-1' })).toBe(true);
  });

  it('AC-07-5 resolveSlot returns null for unconfigured slots', () => {
    const env = { PUBLIC_ADSENSE_CLIENT: 'ca-pub-1', PUBLIC_ADSENSE_SLOT_INFEED: '222' };
    expect(resolveSlot('leaderboard', env)).toBeNull();
    expect(resolveSlot('sidebar', env)).toBeNull();
    expect(resolveSlot('infeed', env)).toBeNull(); // layout key missing
    expect(resolveSlot('infeed', { ...env, PUBLIC_ADSENSE_INFEED_LAYOUT_KEY: ' ' })).toBeNull();
    expect(resolveSlot('leaderboard', { ...env, PUBLIC_ADSENSE_SLOT_LEADERBOARD: '111' })?.slot).toBe('111');
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

describe('R-15 house ad', () => {
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSc-example/viewform';

  it('AC-15-1 stays off until an inquiry URL is configured', () => {
    expect(houseAd({})).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: '' })).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: '   ' })).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: FORM })).toEqual({ inquiryUrl: FORM });
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: `  ${FORM}  ` })).toEqual({ inquiryUrl: FORM });
  });

  it('AC-15-1 refuses anything that is not an https URL', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: 'http://forms.example/x' })).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: 'javascript:alert(1)' })).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: '/contact' })).toBeNull();
  });

  it('AC-15-1 yields the slot to AdSense once that is configured', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: FORM, PUBLIC_ADSENSE_CLIENT: 'ca-pub-1' })).toBeNull();
  });
});

describe('R-15 per-locale inquiry form', () => {
  const EN_FORM = 'https://docs.google.com/forms/d/e/EN/viewform';
  const JA_FORM = 'https://docs.google.com/forms/d/e/JA/viewform';

  it('AC-15-7 the Japanese page prefers the Japanese form', () => {
    const env = { PUBLIC_AD_INQUIRY_URL: EN_FORM, PUBLIC_AD_INQUIRY_URL_JA: JA_FORM };
    expect(houseAd(env, 'ja')).toEqual({ inquiryUrl: JA_FORM });
    expect(houseAd(env, 'en')).toEqual({ inquiryUrl: EN_FORM });
  });

  it('AC-15-7 Japanese falls back to the default when no Japanese form is set', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: EN_FORM }, 'ja')).toEqual({ inquiryUrl: EN_FORM });
  });

  it('AC-15-7 an English visitor is never sent to a Japanese-only form', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL_JA: JA_FORM }, 'en')).toBeNull();
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL_JA: JA_FORM }, 'ja')).toEqual({ inquiryUrl: JA_FORM });
  });

  it('AC-15-7 defaults to the English form when no locale is given', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL: EN_FORM })).toEqual({ inquiryUrl: EN_FORM });
  });

  it('AC-15-1 the Japanese URL must be https too', () => {
    expect(houseAd({ PUBLIC_AD_INQUIRY_URL_JA: 'http://forms.example/ja' }, 'ja')).toBeNull();
  });
});
