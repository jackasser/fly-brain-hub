import type { Locale } from './taxonomy';

export type SlotName = 'leaderboard' | 'infeed' | 'sidebar';

export type AdEnv = Partial<
  Record<
    | 'PUBLIC_ADSENSE_CLIENT'
    | 'PUBLIC_ADSENSE_SLOT_LEADERBOARD'
    | 'PUBLIC_ADSENSE_SLOT_INFEED'
    | 'PUBLIC_ADSENSE_INFEED_LAYOUT_KEY'
    | 'PUBLIC_ADSENSE_SLOT_SIDEBAR'
    | 'PUBLIC_AD_INQUIRY_URL'
    | 'PUBLIC_AD_INQUIRY_URL_JA',
    string | undefined
  >
>;

export interface ResolvedSlot {
  client: string;
  slot: string;
  layoutKey: string | undefined;
  format: 'auto' | 'fluid';
}

/** Cards between in-feed ad units on list pages. */
export const INFEED_EVERY = 6;

/** Reserved heights so placeholders do not shift layout when real ads arrive. */
export const SLOT_MIN_HEIGHT: Record<SlotName, number> = {
  leaderboard: 90,
  infeed: 120,
  sidebar: 250,
};

const clean = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);

export function isAdsEnabled(env: AdEnv): boolean {
  return clean(env.PUBLIC_ADSENSE_CLIENT) !== undefined;
}

/**
 * Fully configured ad unit for `name`, or null when its slot id (and, for in-feed,
 * the layout key) is missing. A null slot must not be rendered: AdSense rejects empty units.
 */
export function resolveSlot(name: SlotName, env: AdEnv): ResolvedSlot | null {
  const client = clean(env.PUBLIC_ADSENSE_CLIENT) ?? '';
  switch (name) {
    case 'leaderboard': {
      const slot = clean(env.PUBLIC_ADSENSE_SLOT_LEADERBOARD);
      return slot ? { client, slot, layoutKey: undefined, format: 'auto' } : null;
    }
    case 'infeed': {
      const slot = clean(env.PUBLIC_ADSENSE_SLOT_INFEED);
      const layoutKey = clean(env.PUBLIC_ADSENSE_INFEED_LAYOUT_KEY);
      return slot && layoutKey ? { client, slot, layoutKey, format: 'fluid' } : null;
    }
    case 'sidebar': {
      const slot = clean(env.PUBLIC_ADSENSE_SLOT_SIDEBAR);
      return slot ? { client, slot, layoutKey: undefined, format: 'auto' } : null;
    }
  }
}

export interface HouseAd {
  /** Where "advertise here" sends the visitor. Linked, never embedded. */
  inquiryUrl: string;
}

/**
 * R-15: what to show in a slot that AdSense is not filling yet.
 * Null once AdSense is configured (the slot belongs to the real ad) and null until
 * an https inquiry URL is set for this locale.
 *
 * Japanese pages prefer the Japanese form and fall back to the default one; English pages
 * only ever use the default, so a Japanese-only setup never sends an English visitor to a
 * form they cannot read.
 */
export function houseAd(env: AdEnv, locale: Locale = 'en'): HouseAd | null {
  if (isAdsEnabled(env)) return null;
  const fallback = clean(env.PUBLIC_AD_INQUIRY_URL);
  const url = locale === 'ja' ? (clean(env.PUBLIC_AD_INQUIRY_URL_JA) ?? fallback) : fallback;
  if (!url || !/^https:\/\//i.test(url)) return null;
  return { inquiryUrl: url };
}
