import { describe, expect, it } from 'vitest';
import { parseGithubRepo, updateStars } from '../../scripts/refresh-stars.mjs';

const entries = [
  { id: 'a', name: 'A', repoUrl: 'https://github.com/o/a', stars: 1, starsUpdatedAt: '2026-01-01', tags: ['x'] },
  { id: 'b', name: 'B', url: 'https://example.com', tags: [] },
  { id: 'c', name: 'C', repoUrl: 'https://github.com/o/c/', stars: 5 },
  { id: 'd', name: 'D', repoUrl: 'https://gitlab.com/o/d' },
];

const fetchFn = async (url: string) => {
  if (url.endsWith('/repos/o/a')) return { ok: true, json: async () => ({ stargazers_count: 42 }) };
  if (url.endsWith('/repos/o/c')) return { ok: false, status: 404, json: async () => ({}) };
  throw new Error(`unexpected ${url}`);
};

describe('R-09 refresh-stars', () => {
  it('parseGithubRepo extracts owner/repo and ignores non-GitHub URLs', () => {
    expect(parseGithubRepo('https://github.com/o/a')).toBe('o/a');
    expect(parseGithubRepo('https://github.com/o/c/')).toBe('o/c');
    expect(parseGithubRepo('https://github.com/o/c/tree/main/x')).toBe('o/c');
    expect(parseGithubRepo('https://gitlab.com/o/d')).toBeNull();
    expect(parseGithubRepo(undefined)).toBeNull();
  });

  it('AC-09-1 updates only stars/starsUpdatedAt of successful GitHub entries and keeps key order', async () => {
    const { entries: out, updated, skipped } = await updateStars(entries, fetchFn as never, '2026-09-12');
    expect(updated).toEqual(['a']);
    expect(skipped.sort()).toEqual(['c']);
    expect(out[0]).toEqual({ id: 'a', name: 'A', repoUrl: 'https://github.com/o/a', stars: 42, starsUpdatedAt: '2026-09-12', tags: ['x'] });
    expect(Object.keys(out[0])).toEqual(['id', 'name', 'repoUrl', 'stars', 'starsUpdatedAt', 'tags']);
    expect(out[1]).toEqual(entries[1]);
    expect(out[2]).toEqual(entries[2]);
    expect(out[3]).toEqual(entries[3]);
    // input not mutated
    expect(entries[0].stars).toBe(1);
  });

  it('AC-09-2 keeps the entry when stargazers_count is not a non-negative integer', async () => {
    const mk = (v: unknown) => async () => ({ ok: true, json: async () => ({ stargazers_count: v }) });
    for (const v of [null, 'x', -1, 1.5, undefined, false]) {
      const { entries: out, skipped } = await updateStars([entries[0]], mk(v) as never, '2026-09-12');
      expect(out[0], String(v)).toEqual(entries[0]);
      expect(skipped).toEqual(['a']);
    }
  });

  it('appends stars/starsUpdatedAt before sourceRefs when the entry had none', async () => {
    const e = [{ id: 'n', repoUrl: 'https://github.com/o/a', description_en: 'x', sourceRefs: ['https://x'] }];
    const { entries: out } = await updateStars(e, fetchFn as never, '2026-09-12');
    expect(Object.keys(out[0])).toEqual(['id', 'repoUrl', 'description_en', 'stars', 'starsUpdatedAt', 'sourceRefs']);
  });
});
