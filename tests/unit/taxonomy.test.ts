import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_META, DATASET_IDS } from '../../src/lib/taxonomy';

describe('R-02 taxonomy', () => {
  it('AC-02-1 CATEGORIES has the 7 slugs in order', () => {
    expect([...CATEGORIES]).toEqual(['connectome', 'simulation', 'body', 'demo', 'tool', 'media', 'crypto']);
  });

  it('AC-02-2 every category has EN/JA labels and a JSON-LD type', () => {
    for (const slug of CATEGORIES) {
      const meta = CATEGORY_META[slug];
      expect(meta.label.en.length).toBeGreaterThan(0);
      expect(meta.label.ja.length).toBeGreaterThan(0);
      expect(['Dataset', 'SoftwareSourceCode', 'Article', 'WebPage']).toContain(meta.jsonLdType);
    }
    expect(CATEGORY_META.connectome.jsonLdType).toBe('Dataset');
    expect(CATEGORY_META.media.jsonLdType).toBe('Article');
    expect(CATEGORY_META.crypto.jsonLdType).toBe('WebPage');
  });

  it('AC-02-3 only crypto carries a bilingual notice', () => {
    expect(CATEGORY_META.crypto.notice?.en).toMatch(/information only/i);
    expect(CATEGORY_META.crypto.notice?.ja).toContain('情報提供のみ');
    for (const slug of CATEGORIES.filter((s) => s !== 'crypto')) {
      expect(CATEGORY_META[slug].notice).toBeUndefined();
    }
  });

  it('AC-02-4 DATASET_IDS contains the known connectomes', () => {
    for (const id of ['malecns', 'flywire-fafb', 'hemibrain', 'manc', 'banc', 'fanc', 'optic-lobe', 'larval']) {
      expect(DATASET_IDS).toContain(id);
    }
  });
});
