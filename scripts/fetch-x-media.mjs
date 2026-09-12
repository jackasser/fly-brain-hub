#!/usr/bin/env node
// Fill `image` / `imageCredit` / `imageKind` for entries whose `url` is an X (Twitter) post,
// using X's public syndication CDN (the same JSON the official embed widget reads).
// Only the poster/photo URL on pbs.twimg.com is stored; the post itself is embedded officially on the detail page.
// Usage: node scripts/fetch-x-media.mjs [--force]
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA = fileURLToPath(new URL('../src/data/projects.json', import.meta.url));

/** "https://x.com/user/status/123" (or twitter.com) -> "123", else null */
export function xStatusId(url) {
  if (!url) return null;
  const m = /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/i.exec(url);
  return m ? m[1] : null;
}

/** Token the syndication endpoint expects (derived from the id; no credentials involved). */
export function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
}

export function syndicationUrl(id) {
  return `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}`;
}

/**
 * Pick the card image from a syndication payload.
 * Video posts -> poster frame (imageKind "video-poster"); photo posts -> first photo (imageKind "photo").
 * @returns {{ image: string, imageKind: 'photo'|'video-poster', handle: string } | null}
 */
export function pickXMedia(json) {
  if (!json || typeof json !== 'object') return null;
  const handle = json.user?.screen_name;
  if (!handle) return null;
  const https = (u) => typeof u === 'string' && /^https:\/\/pbs\.twimg\.com\//.test(u);
  if (json.video && https(json.video.poster)) return { image: json.video.poster, imageKind: 'video-poster', handle };
  const photo = (json.photos ?? []).find((p) => https(p?.url));
  if (photo) return { image: photo.url, imageKind: 'photo', handle };
  const md = (json.mediaDetails ?? []).find((m) => https(m?.media_url_https));
  if (md) return { image: md.media_url_https, imageKind: md.type === 'video' ? 'video-poster' : 'photo', handle };
  return null;
}

function withMedia(entry, media, today) {
  const credit = `@${media.handle} on X (${media.imageKind === 'video-poster' ? 'video poster' : 'photo'}, ${today})`;
  const out = {};
  let placed = false;
  const place = () => {
    if (placed) return;
    out.image = media.image;
    out.imageKind = media.imageKind;
    out.imageCredit = credit;
    placed = true;
  };
  for (const [k, v] of Object.entries(entry)) {
    if (k === 'image' || k === 'imageKind' || k === 'imageCredit') {
      place();
      continue;
    }
    if ((k === 'featured' || k === 'sourceRefs') && !placed) place();
    out[k] = v;
  }
  place();
  return out;
}

/**
 * @param {object[]} entries
 * @param {(url: string, init?: RequestInit) => Promise<{ok: boolean, status?: number, json: () => Promise<any>}>} fetchFn
 */
export async function updateXMedia(entries, fetchFn, today, { force = false } = {}) {
  const out = [];
  const updated = [];
  const skipped = [];
  for (const entry of entries) {
    const id = xStatusId(entry.url);
    if (!id || (entry.image && !force)) {
      out.push(entry);
      continue;
    }
    try {
      const res = await fetchFn(syndicationUrl(id), { headers: { 'User-Agent': 'Mozilla/5.0 fly-brain-hub' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const media = pickXMedia(await res.json());
      if (!media) throw new Error('no media in post');
      out.push(withMedia(entry, media, today));
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
  const force = process.argv.includes('--force');
  const { entries: next, updated, skipped } = await updateXMedia(entries, fetch, today, { force });
  await writeFile(DATA, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  console.log(`updated ${updated.length}${updated.length ? `: ${updated.join(', ')}` : ''}; skipped ${skipped.length}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
