export type SlotName = 'leaderboard' | 'infeed' | 'sidebar';

export type AdEnv = Partial<
  Record<
    | 'PUBLIC_ADSENSE_CLIENT'
    | 'PUBLIC_ADSENSE_SLOT_LEADERBOARD'
    | 'PUBLIC_ADSENSE_SLOT_INFEED'
    | 'PUBLIC_ADSENSE_INFEED_LAYOUT_KEY'
    | 'PUBLIC_ADSENSE_SLOT_SIDEBAR',
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

export function isAdsEnabled(env: AdEnv): boolean {
  return Boolean(env.PUBLIC_ADSENSE_CLIENT && env.PUBLIC_ADSENSE_CLIENT.trim() !== '');
}

export function resolveSlot(name: SlotName, env: AdEnv): ResolvedSlot {
  const client = env.PUBLIC_ADSENSE_CLIENT ?? '';
  switch (name) {
    case 'leaderboard':
      return { client, slot: env.PUBLIC_ADSENSE_SLOT_LEADERBOARD ?? '', layoutKey: undefined, format: 'auto' };
    case 'infeed':
      return {
        client,
        slot: env.PUBLIC_ADSENSE_SLOT_INFEED ?? '',
        layoutKey: env.PUBLIC_ADSENSE_INFEED_LAYOUT_KEY || undefined,
        format: 'fluid',
      };
    case 'sidebar':
      return { client, slot: env.PUBLIC_ADSENSE_SLOT_SIDEBAR ?? '', layoutKey: undefined, format: 'auto' };
  }
}
