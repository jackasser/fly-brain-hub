#!/usr/bin/env node
// R-22: collect fly-connectome repositories published since a given date.
// Writes candidates and their READMEs to a working directory; never touches src/data/projects.json.
// Usage: node scripts/collect-candidates.mjs [--since YYYY-MM-DD] [--out DIR] [--readmes N]
//        GITHUB_TOKEN is used when present (higher search rate limit) but is not required.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const DATA = fileURLToPath(new URL('../src/data/projects.json', import.meta.url));

/** Search terms, kept multilingual: the wave is not English-only. */
export const SEARCH_TERMS = [
  'flywire',
  'malecns',
  '"male cns"',
  'hemibrain',
  '"drosophila connectome"',
  '"fly brain"',
  '"fruit fly brain"',
  '"fly connectome"',
  'neuromechfly',
  'connectome',
  '果蝇',
  '连接组',
  '초파리',
  'ハエ脳',
  'ショウジョウバエ',
];

export const SEARCH_TOPICS = ['flywire', 'connectome', 'drosophila', 'malecns', 'fly-brain'];

/** Terms swept a second time by stars, to catch repos that only became visible later. */
export const STAR_SWEEP_TERMS = ['flywire', 'malecns', '"fly brain"', '"fruit fly"', 'connectome'];

const SEARCH_BASE = 'https://api.github.com/search/repositories';

function searchUrl(q, { sort, perPage = 50 } = {}) {
  const params = new URLSearchParams({ q, per_page: String(perPage) });
  params.set('sort', sort ?? 'updated');
  params.set('order', 'desc');
  return `${SEARCH_BASE}?${params.toString()}`;
}

/**
 * Every search URL for one run.
 * @param {string} since YYYY-MM-DD, inclusive
 * @param {{starSince?: string, perPage?: number}} [opts] starSince widens the star sweep window
 */
export function buildSearchUrls(since, { starSince, perPage = 50 } = {}) {
  const urls = [];
  for (const term of SEARCH_TERMS) urls.push(searchUrl(`${term} created:>=${since}`, { perPage }));
  for (const topic of SEARCH_TOPICS) urls.push(searchUrl(`topic:${topic} created:>=${since}`, { perPage }));
  for (const term of STAR_SWEEP_TERMS) {
    urls.push(searchUrl(`${term} created:>=${starSince ?? since}`, { sort: 'stars', perPage }));
  }
  return urls;
}

const canonical = (url) => (url ? url.replace(/\/+$/, '').toLowerCase() : '');

/** Every url and repoUrl already listed, canonicalised for comparison. */
export function existingUrls(entries) {
  const set = new Set();
  for (const entry of entries ?? []) {
    for (const url of [entry.url, entry.repoUrl]) {
      if (url) set.add(canonical(url));
    }
  }
  return set;
}

/** A GitHub search item reduced to the fields an entry needs. */
export function normalizeRepo(item) {
  return {
    fullName: item.full_name,
    url: item.html_url ?? `https://github.com/${item.full_name}`,
    description: item.description ?? '',
    createdAt: (item.created_at ?? '').slice(0, 10),
    pushedAt: (item.pushed_at ?? '').slice(0, 10),
    stars: item.stargazers_count ?? 0,
    language: item.language ?? null,
    license: item.license?.spdx_id && item.license.spdx_id !== 'NOASSERTION' ? item.license.spdx_id : null,
    homepage: item.homepage || null,
    topics: item.topics ?? [],
    isFork: Boolean(item.fork),
  };
}

/**
 * Drop forks, anything already listed and repeated hits; most starred first.
 * @param {object[]} items raw search items
 * @param {Set<string>} existing from existingUrls()
 */
export function selectCandidates(items, existing, { minStars = 0 } = {}) {
  const seen = new Map();
  for (const raw of items ?? []) {
    if (!raw?.full_name) continue;
    const key = raw.full_name.toLowerCase();
    if (seen.has(key)) continue;
    const repo = normalizeRepo(raw);
    if (repo.isFork) continue;
    if (existing.has(canonical(repo.url))) continue;
    if (repo.stars < minStars) continue;
    seen.set(key, repo);
  }
  return [...seen.values()].sort((a, b) => b.stars - a.stars || a.createdAt.localeCompare(b.createdAt));
}

/** READMEs come from the raw host, which does not spend API quota. */
export function readmeUrl(fullName) {
  return `https://raw.githubusercontent.com/${fullName}/HEAD/README.md`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run every search and return the candidates. Search API only, by design:
 * the per-repo endpoint would spend the unauthenticated 60/hour budget.
 */
export async function collect({ fetchFn, since, starSince = since, entries, token = process.env.GITHUB_TOKEN, pauseMs = 0, perPage = 50 }) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'fly-brain-hub-collect' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const existing = existingUrls(entries);
  const urls = buildSearchUrls(since, { starSince, perPage });
  const items = [];
  const errors = [];
  for (const url of urls) {
    try {
      const res = await fetchFn(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      for (const item of body.items ?? []) items.push(item);
    } catch (err) {
      errors.push({ url, error: err instanceof Error ? err.message : String(err) });
    }
    if (pauseMs) await sleep(pauseMs);
  }
  return { candidates: selectCandidates(items, existing), errors, queriesRun: urls.length };
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

async function main() {
  const entries = JSON.parse(await readFile(DATA, 'utf8'));
  const lastAdded = entries.reduce((max, e) => (e.addedAt > max ? e.addedAt : max), '0000-00-00');
  const since = arg('--since', lastAdded);
  const starSince = arg('--star-since', new Date(Date.parse(`${since}T00:00:00Z`) - 5 * 864e5).toISOString().slice(0, 10));
  const out = arg('--out', join(dirname(DATA), '..', '..', '.cache', 'collect'));
  const readmeCount = Number(arg('--readmes', '40'));

  const { candidates, errors, queriesRun } = await collect({
    fetchFn: fetch,
    since,
    starSince,
    entries,
    token: process.env.GITHUB_TOKEN,
    pauseMs: process.env.GITHUB_TOKEN ? 2100 : 6500,
  });

  const withDescription = candidates.filter((c) => (c.description ?? '').length > 40);
  const shortlist = withDescription.slice(0, readmeCount);
  await mkdir(join(out, 'readme'), { recursive: true });
  const fetched = [];
  for (const repo of shortlist) {
    try {
      const res = await fetch(readmeUrl(repo.fullName));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      const file = join(out, 'readme', `${repo.fullName.replace('/', '_')}.md`);
      await writeFile(file, text, 'utf8');
      fetched.push({ ...repo, readmeFile: file, readmeBytes: Buffer.byteLength(text) });
    } catch (err) {
      fetched.push({ ...repo, readmeFile: null, readmeError: err instanceof Error ? err.message : String(err) });
    }
  }

  await writeFile(join(out, 'candidates.json'), `${JSON.stringify({ since, starSince, queriesRun, errors, candidates: fetched }, null, 2)}\n`, 'utf8');
  console.log(`since ${since} (stars swept from ${starSince}) | ${queriesRun} queries, ${errors.length} failed`);
  console.log(`${candidates.length} new repos, ${withDescription.length} with a description, ${fetched.length} READMEs fetched into ${out}`);
  for (const repo of fetched) {
    const bytes = repo.readmeBytes ?? 0;
    console.log(`${String(repo.stars).padStart(4)} ${repo.createdAt} ${String(bytes).padStart(6)}B ${repo.fullName} | ${(repo.description ?? '').slice(0, 90)}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
