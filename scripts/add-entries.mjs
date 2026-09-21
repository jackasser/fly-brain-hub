#!/usr/bin/env node
// R-22: append reviewed entries to src/data/projects.json.
// Usage: node scripts/add-entries.mjs <entries.json> [--write]
// Checks what the schema cannot: duplicates against what is already listed, and length bounds.
// The full schema check is `npm run check` (AC-01-6); nothing is written unless every entry passes here.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DATA = fileURLToPath(new URL('../src/data/projects.json', import.meta.url));

export const REQUIRED_KEYS = ['id', 'name', 'url', 'category', 'org', 'date', 'addedAt', 'description_en', 'description_ja', 'sourceRefs'];
export const EN_RANGE = [60, 600];
export const JA_RANGE = [40, 600];

const canonical = (url) => (url ? url.replace(/\/+$/, '').toLowerCase() : '');

/**
 * @param {object[]} incoming entries to add
 * @param {object[]} existing current projects.json contents
 * @returns {string[]} one line per problem; empty means safe to append
 */
export function validateEntries(incoming, existing) {
  const errors = [];
  const ids = new Set((existing ?? []).map((e) => e.id));
  const urls = new Set();
  for (const entry of existing ?? []) {
    for (const url of [entry.url, entry.repoUrl]) if (url) urls.add(canonical(url));
  }

  incoming.forEach((entry, i) => {
    const at = `[${i}] ${entry?.id ?? '(no id)'}`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${at}: not an object`);
      return;
    }
    for (const key of REQUIRED_KEYS) {
      if (entry[key] === undefined || entry[key] === null || entry[key] === '') errors.push(`${at}: missing ${key}`);
    }
    if (typeof entry.id === 'string' && !/^[a-z0-9-]+$/.test(entry.id)) errors.push(`${at}: id must be a lowercase slug`);
    if (ids.has(entry.id)) errors.push(`${at}: duplicate id`);
    else if (entry.id) ids.add(entry.id);

    for (const url of [...new Set([entry.url, entry.repoUrl].filter(Boolean))]) {
      if (urls.has(canonical(url))) errors.push(`${at}: duplicate url ${url}`);
      else urls.add(canonical(url));
    }

    const en = typeof entry.description_en === 'string' ? entry.description_en.length : 0;
    const ja = typeof entry.description_ja === 'string' ? entry.description_ja.length : 0;
    if (entry.description_en !== undefined && (en < EN_RANGE[0] || en > EN_RANGE[1])) {
      errors.push(`${at}: description_en is ${en} characters, must be ${EN_RANGE[0]}-${EN_RANGE[1]}`);
    }
    if (entry.description_ja !== undefined && (ja < JA_RANGE[0] || ja > JA_RANGE[1])) {
      errors.push(`${at}: description_ja is ${ja} characters, must be ${JA_RANGE[0]}-${JA_RANGE[1]}`);
    }
    if (entry.addedAt !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(entry.addedAt))) {
      errors.push(`${at}: addedAt must be YYYY-MM-DD`);
    }
    if (entry.sourceRefs !== undefined && (!Array.isArray(entry.sourceRefs) || entry.sourceRefs.length === 0)) {
      errors.push(`${at}: sourceRefs needs at least one URL`);
    }
  });

  return errors;
}

/** Existing entries first, in their original order, then the new ones. */
export function appendEntries(existing, incoming) {
  return [...(existing ?? []), ...incoming];
}

async function main() {
  const file = process.argv[2];
  if (!file || file.startsWith('--')) {
    console.error('usage: node scripts/add-entries.mjs <entries.json> [--write]');
    process.exit(2);
  }
  const incoming = JSON.parse(await readFile(file, 'utf8'));
  const list = Array.isArray(incoming) ? incoming : [incoming];
  const existing = JSON.parse(await readFile(DATA, 'utf8'));
  const errors = validateEntries(list, existing);

  for (const entry of list) {
    const en = entry?.description_en?.length ?? 0;
    const ja = entry?.description_ja?.length ?? 0;
    console.log(`${String(en).padStart(3)} ${String(ja).padStart(3)} ${entry?.id ?? '(no id)'}`);
  }
  if (errors.length) {
    for (const e of errors) console.error(e);
    console.error(`NG ${errors.length} problem(s); nothing written`);
    process.exit(1);
  }
  console.log(`OK ${list.length} entries`);

  if (process.argv.includes('--write')) {
    const next = appendEntries(existing, list);
    await writeFile(DATA, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    console.log(`written. total = ${next.length}`);
  } else {
    console.log('dry run; pass --write to append');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
