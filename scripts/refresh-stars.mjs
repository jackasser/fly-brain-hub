#!/usr/bin/env node
// Refresh GitHub star counts in src/data/projects.json.
// Usage: node scripts/refresh-stars.mjs   (optional: GITHUB_TOKEN env for a higher rate limit)
// Only `stars` and `starsUpdatedAt` are touched; every other key and its order is preserved.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA = fileURLToPath(new URL('../src/data/projects.json', import.meta.url));

/** "https://github.com/owner/repo[/...]" -> "owner/repo", else null */
export function parseGithubRepo(url) {
  if (!url) return null;
  const m = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s#?]+)/i.exec(url);
  if (!m) return null;
  return `${m[1]}/${m[2].replace(/\.git$/, '')}`;
}

function withStars(entry, stars, today) {
  const out = {};
  let placed = false;
  const place = () => {
    if (placed) return;
    out.stars = stars;
    out.starsUpdatedAt = today;
    placed = true;
  };
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'stars' || k === 'starsUpdatedAt') {
      place();
      continue;
    }
    if (k === 'sourceRefs' && !placed) place();
    out[k] = v;
  }
  place();
  return out;
}

/**
 * @param {object[]} entries
 * @param {(url: string, init?: RequestInit) => Promise<{ok: boolean, status?: number, json: () => Promise<any>}>} fetchFn
 * @param {string} today YYYY-MM-DD
 */
export async function updateStars(entries, fetchFn, today, token = process.env.GITHUB_TOKEN) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'fly-brain-hub-refresh-stars' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const updated = [];
  const skipped = [];
  const out = [];
  for (const entry of entries) {
    const repo = parseGithubRepo(entry.repoUrl);
    if (!repo) {
      out.push(entry);
      continue;
    }
    try {
      const res = await fetchFn(`https://api.github.com/repos/${repo}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const stars = data.stargazers_count;
      if (typeof stars !== 'number' || !Number.isInteger(stars) || stars < 0) throw new Error('invalid stargazers_count');
      out.push(withStars(entry, stars, today));
      updated.push(entry.id);
    } catch (err) {
      console.warn(`skip ${entry.id}: ${err instanceof Error ? err.message : err}`);
      out.push(entry);
      skipped.push(entry.id);
    }
  }
  return { entries: out, updated, skipped };
}

async function main() {
  const entries = JSON.parse(await readFile(DATA, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const { entries: next, updated, skipped } = await updateStars(entries, fetch, today);
  await writeFile(DATA, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`updated ${updated.length}, skipped ${skipped.length}${skipped.length ? `: ${skipped.join(', ')}` : ''}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
