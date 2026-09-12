import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { projectSchema, type Project } from '../../src/lib/schema';
import { DATASET_IDS } from '../../src/lib/taxonomy';

const raw = JSON.parse(readFileSync(new URL('../../src/data/projects.json', import.meta.url), 'utf8')) as unknown[];

describe('R-01 projects.json', () => {
  const parsed: Project[] = raw.map((entry) => projectSchema.parse(entry));

  it('AC-01-6a every entry passes the schema', () => {
    expect(parsed.length).toBe(raw.length);
    expect(parsed.length).toBeGreaterThan(0);
  });

  it('AC-01-6b ids are unique', () => {
    const ids = parsed.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('AC-01-6c every dataset reference points at a connectome entry', () => {
    const connectomeIds = new Set(parsed.filter((p) => p.category === 'connectome').map((p) => p.id));
    for (const p of parsed) {
      for (const d of p.datasets) {
        expect(connectomeIds.has(d), `${p.id} references ${d}`).toBe(true);
      }
    }
  });

  it('AC-01-6d every DATASET_IDS value is backed by a connectome entry', () => {
    const connectomeIds = new Set(parsed.filter((p) => p.category === 'connectome').map((p) => p.id));
    const missing = DATASET_IDS.filter((d) => !connectomeIds.has(d));
    expect(missing).toEqual([]);
  });

  it('region is omitted rather than filled with a placeholder', () => {
    for (const p of parsed) if (p.region) expect(p.region, p.id).not.toMatch(/^(intl|unknown|n\/a|-)$/i);
  });

  it('AC-01-7 crypto entries carry no referral-style query parameters', () => {
    const suspicious = /[?&](ref|aff|affiliate|invite|referral|r)=/i;
    for (const p of parsed.filter((p) => p.category === 'crypto')) {
      for (const u of [p.url, p.repoUrl, ...p.sourceRefs].filter(Boolean) as string[]) {
        expect(u, `${p.id}: ${u}`).not.toMatch(suspicious);
      }
    }
  });

  it('descriptions are not copied verbatim from each other', () => {
    for (const p of parsed) {
      expect(p.description_en).not.toBe(p.description_ja);
    }
  });
});
