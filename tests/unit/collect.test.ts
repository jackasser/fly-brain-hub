import { describe, expect, it } from 'vitest';
import {
  SEARCH_TERMS,
  SEARCH_TOPICS,
  STAR_SWEEP_TERMS,
  buildSearchUrls,
  candidatesFromItems,
  collect,
  existingUrls,
  readmeUrl,
  searchQueries,
  selectCandidates,
} from '../../scripts/collect-candidates.mjs';
import { appendEntries, validateEntries } from '../../scripts/add-entries.mjs';

const item = (fullName: string, over: Record<string, unknown> = {}) => ({
  full_name: fullName,
  html_url: `https://github.com/${fullName}`,
  description: 'a fly connectome thing',
  created_at: '2026-09-18T00:00:00Z',
  pushed_at: '2026-09-18T01:00:00Z',
  stargazers_count: 0,
  language: 'Python',
  license: { spdx_id: 'MIT' },
  homepage: '',
  fork: false,
  topics: [],
  ...over,
});

const existing = [
  { id: 'a', url: 'https://example.com/a', repoUrl: 'https://github.com/o/a' },
  { id: 'b', url: 'https://github.com/O/B/' },
];

describe('R-22 collect-candidates', () => {
  it('AC-22-1 buildSearchUrls covers every term and topic, pins created:>= and sweeps by stars', () => {
    const urls = buildSearchUrls('2026-09-17');
    expect(urls.length).toBeGreaterThanOrEqual(SEARCH_TERMS.length + SEARCH_TOPICS.length);
    for (const u of urls) {
      expect(u).toContain('https://api.github.com/search/repositories?');
      expect(decodeURIComponent(u)).toContain('created:>=2026-09-17');
    }
    // URLSearchParams writes spaces as "+", so undo that before matching the terms
    const decoded = urls.map((u) => decodeURIComponent(u.replace(/\+/g, ' ')));
    for (const term of SEARCH_TERMS) expect(decoded.some((u) => u.includes(term))).toBe(true);
    for (const topic of SEARCH_TOPICS) expect(decoded.some((u) => u.includes(`topic:${topic}`))).toBe(true);
    expect(decoded.some((u) => u.includes('sort=stars'))).toBe(true);
  });

  it('existingUrls lowercases url and repoUrl and strips trailing slashes', () => {
    const set = existingUrls(existing);
    expect(set.has('https://github.com/o/a')).toBe(true);
    expect(set.has('https://github.com/o/b')).toBe(true);
    expect(set.has('https://example.com/a')).toBe(true);
    expect(set.has('https://github.com/o/c')).toBe(false);
  });

  it('AC-22-2 selectCandidates drops forks, listed repos and duplicates, ordered by stars', () => {
    const items = [
      item('o/a'), // already listed via repoUrl
      item('O/b'), // already listed via url, different case
      item('o/c', { stargazers_count: 3 }),
      item('o/c', { stargazers_count: 3 }), // duplicate full_name
      item('o/d', { fork: true }),
      item('o/e', { stargazers_count: 9 }),
    ];
    const out = selectCandidates(items, existingUrls(existing));
    expect(out.map((c) => c.fullName)).toEqual(['o/e', 'o/c']);
    expect(out[0].stars).toBe(9);
    expect(out[0].license).toBe('MIT');
    expect(out[0].url).toBe('https://github.com/o/e');
  });

  it('readmeUrl points at the raw host so it costs no API quota', () => {
    expect(readmeUrl('o/a')).toBe('https://raw.githubusercontent.com/o/a/HEAD/README.md');
  });

  it('AC-22-3 collect only calls the search API, never per-repo endpoints', async () => {
    const called: string[] = [];
    const fetchFn = async (url: string) => {
      called.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: [item('o/new', { stargazers_count: 2 })] }),
      };
    };
    const { candidates } = await collect({ fetchFn: fetchFn as never, since: '2026-09-17', entries: existing });
    expect(called.length).toBeGreaterThan(0);
    for (const url of called) expect(url.startsWith('https://api.github.com/search/repositories?')).toBe(true);
    expect(called.some((u) => /api\.github\.com\/repos\//.test(u))).toBe(false);
    expect(candidates.map((c) => c.fullName)).toEqual(['o/new']);
  });

  it('AC-22-6 searchQueries exposes the same sweep as plain query strings for another transport', () => {
    const queries = searchQueries('2026-09-21', { starSince: '2026-09-16' });
    expect(queries.length).toBe(SEARCH_TERMS.length + SEARCH_TOPICS.length + STAR_SWEEP_TERMS.length);
    for (const entry of queries) {
      expect(entry.q).toContain('created:>=');
      expect(entry.order).toBe('desc');
    }
    for (const term of SEARCH_TERMS) expect(queries.some((e) => e.q.startsWith(`${term} `))).toBe(true);
    for (const topic of SEARCH_TOPICS) expect(queries.some((e) => e.q.startsWith(`topic:${topic} `))).toBe(true);
    const starSweep = queries.filter((e) => e.sort === 'stars');
    expect(starSweep.length).toBe(STAR_SWEEP_TERMS.length);
    for (const entry of starSweep) expect(entry.q).toContain('created:>=2026-09-16');
    // the direct-API path is built from exactly these queries
    expect(buildSearchUrls('2026-09-21', { starSince: '2026-09-16' }).length).toBe(queries.length);
  });

  it('AC-22-7 candidatesFromItems matches the API path for the same items', async () => {
    const items = [item('o/a'), item('o/keep', { stargazers_count: 5 }), item('o/fork', { fork: true })];
    const offline = candidatesFromItems(items, existing);
    const fetchFn = async () => ({ ok: true, status: 200, json: async () => ({ items }) });
    const { candidates } = await collect({ fetchFn: fetchFn as never, since: '2026-09-17', entries: existing });
    expect(offline.map((c) => c.fullName)).toEqual(['o/keep']);
    expect(offline).toEqual(candidates);
  });

  it('collect keeps going when one search request fails', async () => {
    let n = 0;
    const fetchFn = async () => {
      n += 1;
      if (n === 1) return { ok: false, status: 403, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => ({ items: [item('o/new')] }) };
    };
    const { candidates, errors } = await collect({ fetchFn: fetchFn as never, since: '2026-09-17', entries: existing });
    expect(errors.length).toBe(1);
    expect(candidates.map((c) => c.fullName)).toEqual(['o/new']);
  });
});

describe('R-22 add-entries', () => {
  const listed = [
    { id: 'a', url: 'https://example.com/a', repoUrl: 'https://github.com/o/a' },
  ];
  const good = {
    id: 'fresh-one',
    name: 'Fresh One',
    url: 'https://github.com/o/fresh',
    repoUrl: 'https://github.com/o/fresh',
    category: 'tool',
    tags: [],
    datasets: [],
    org: 'o',
    date: '2026-09-20',
    addedAt: '2026-09-21',
    description_en: 'x'.repeat(120),
    description_ja: 'y'.repeat(60),
    sourceRefs: ['https://github.com/o/fresh'],
  };

  it('AC-22-4 validateEntries accepts a well-formed entry', () => {
    expect(validateEntries([good], listed)).toEqual([]);
  });

  it('AC-22-4 validateEntries catches duplicate ids and urls, including against each other', () => {
    expect(validateEntries([{ ...good, id: 'a' }], listed).join(' ')).toContain('id');
    expect(validateEntries([{ ...good, url: 'https://github.com/O/A' }], listed).join(' ')).toContain('url');
    expect(validateEntries([good, { ...good, id: 'other' }], listed).join(' ')).toContain('url');
    expect(validateEntries([good, { ...good, url: 'https://github.com/o/other', repoUrl: undefined }], listed).join(' ')).toContain('id');
  });

  it('AC-22-4 validateEntries catches missing keys, description lengths and a bad addedAt', () => {
    const { description_en: _omit, ...missing } = good;
    expect(validateEntries([missing], listed).join(' ')).toContain('description_en');
    expect(validateEntries([{ ...good, description_en: 'short' }], listed).join(' ')).toContain('description_en');
    expect(validateEntries([{ ...good, description_en: 'x'.repeat(601) }], listed).join(' ')).toContain('description_en');
    expect(validateEntries([{ ...good, description_ja: 'y'.repeat(601) }], listed).join(' ')).toContain('description_ja');
    expect(validateEntries([{ ...good, addedAt: '2026-9-21' }], listed).join(' ')).toContain('addedAt');
    expect(validateEntries([{ ...good, id: 'Bad_Id' }], listed).join(' ')).toContain('id');
  });

  it('AC-22-5 appendEntries adds to the end without touching what is there', () => {
    const before = JSON.parse(JSON.stringify(listed));
    const out = appendEntries(listed, [good]);
    expect(out.length).toBe(listed.length + 1);
    expect(out.slice(0, listed.length)).toEqual(before);
    expect(out[out.length - 1]).toEqual(good);
    expect(listed).toEqual(before);
  });
});
