export type Locale = 'en' | 'ja';

export const CATEGORIES = ['connectome', 'simulation', 'body', 'demo', 'tool', 'media', 'crypto'] as const;
export type Category = (typeof CATEGORIES)[number];

export const DATASET_IDS = [
  'malecns',
  'flywire-fafb',
  'hemibrain',
  'manc',
  'banc',
  'fanc',
  'optic-lobe',
  'larval',
] as const;
export type DatasetId = (typeof DATASET_IDS)[number];

export type JsonLdType = 'Dataset' | 'SoftwareSourceCode' | 'Article' | 'WebPage';

export interface CategoryMeta {
  label: Record<Locale, string>;
  blurb: Record<Locale, string>;
  jsonLdType: JsonLdType;
  notice?: Record<Locale, string>;
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  connectome: {
    label: { en: 'Datasets & Connectomes', ja: 'データセット・コネクトーム' },
    blurb: {
      en: 'Synapse-resolution wiring diagrams of fly brains and nerve cords, and where to download them.',
      ja: 'ハエの脳・神経索のシナプス解像度の配線図と、その入手先。',
    },
    jsonLdType: 'Dataset',
  },
  simulation: {
    label: { en: 'Simulation & Emulation', ja: 'シミュレーション' },
    blurb: {
      en: 'Whole-brain spiking models that run the connectome as a network.',
      ja: 'コネクトームをネットワークとして動かす全脳スパイキングモデル。',
    },
    jsonLdType: 'SoftwareSourceCode',
  },
  body: {
    label: { en: 'Body Models & Physics', ja: '身体モデル・物理' },
    blurb: {
      en: 'Physics-simulated fly bodies that a brain model can drive.',
      ja: '脳モデルが動かせる、物理シミュレーション上のハエの身体。',
    },
    jsonLdType: 'SoftwareSourceCode',
  },
  demo: {
    label: { en: 'Demos & Games', ja: 'デモ・ゲーム' },
    blurb: {
      en: 'The "fly brain can play X" wave: games, desktop pets, music and other experiments.',
      ja: '「ハエ脳が X をやる」の波。ゲーム、デスクトップペット、音楽などの実験。',
    },
    jsonLdType: 'SoftwareSourceCode',
  },
  tool: {
    label: { en: 'Tools & Libraries', ja: 'ツール・ライブラリ' },
    blurb: {
      en: 'APIs, libraries and browsers for querying and visualising connectome data.',
      ja: 'コネクトームデータを問い合わせ・可視化するための API・ライブラリ・ブラウザ。',
    },
    jsonLdType: 'SoftwareSourceCode',
  },
  media: {
    label: { en: 'Media & Explainers', ja: '解説・報道' },
    blurb: {
      en: 'Articles, reports and reference pages that explain the field.',
      ja: 'この分野を解説する記事・レポート・参照ページ。',
    },
    jsonLdType: 'Article',
  },
  crypto: {
    label: { en: 'Crypto (informational)', ja: '暗号資産（情報のみ）' },
    blurb: {
      en: 'Token experiments wired to a fly brain. Listed so the record is complete, nothing more.',
      ja: 'ハエ脳につないだトークン実験。記録として載せているだけ。',
    },
    jsonLdType: 'WebPage',
    notice: {
      en: 'Listed for information only. No endorsement, no referral links.',
      ja: '情報提供のみ。推奨・紹介リンクはありません。',
    },
  },
};

export const DATASET_LABELS: Record<DatasetId, string> = {
  malecns: 'MaleCNS',
  'flywire-fafb': 'FlyWire (FAFB)',
  hemibrain: 'hemibrain',
  manc: 'MANC',
  banc: 'BANC',
  fanc: 'FANC',
  'optic-lobe': 'Optic lobe',
  larval: 'Larval CNS',
};

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
