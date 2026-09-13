/**
 * R-14: the tools this site offers to an agent-enabled browser.
 *
 * Entry point is `document.modelContext` (WebMCP CG draft, 2026-04). Everything here is a
 * pure function over the R-05 search index so it can be unit-tested without a browser;
 * `WebMcpTools.astro` only feature-detects and registers what `buildTools` returns.
 */
import type { SearchItem } from './projects';
import { CATEGORIES, CATEGORY_META, DATASET_IDS, DATASET_LABELS, type Category, type DatasetId, type Locale } from './taxonomy';

export const TOOL_NAMES = ['search-projects', 'get-project', 'list-categories', 'list-datasets'] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

/** JSON Schema, deliberately without `$schema`: the draft pins no dialect. */
export interface InputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  additionalProperties: false;
}

/** The subset of WebMCP's ModelContextTool this site uses. */
export interface ToolDescriptor {
  name: ToolName;
  description: string;
  inputSchema: InputSchema;
  execute: (input?: Record<string, unknown>) => Promise<unknown>;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  dataset?: string;
  tag?: string;
  limit?: number;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

/** Out-of-range or missing limits fall back to the default rather than erroring. */
export function clampedLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

export function projectPages(id: string): { page_en: string; page_ja: string } {
  return { page_en: `/projects/${id}`, page_ja: `/ja/projects/${id}` };
}

const pageFor = (id: string, locale: Locale) => (locale === 'ja' ? `/ja/projects/${id}` : `/projects/${id}`);
const categoryPage = (slug: Category, locale: Locale) => (locale === 'ja' ? `/ja/category/${slug}` : `/category/${slug}`);

/** Substring match over name, tags and the locale's description. Facets are exact. */
export function searchItems(items: SearchItem[], filters: SearchFilters, locale: Locale = 'en'): SearchItem[] {
  const q = (filters.q ?? '').trim().toLowerCase();
  return items.filter((item) => {
    if (filters.category && item.category !== filters.category) return false;
    if (filters.dataset && !item.datasets.includes(filters.dataset)) return false;
    if (filters.tag && !item.tags.includes(filters.tag)) return false;
    if (!q) return true;
    const haystack = [item.name, ...item.tags, locale === 'ja' ? item.description_ja : item.description_en]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function getItem(items: SearchItem[], id: string): SearchItem | null {
  return items.find((i) => i.id === id) ?? null;
}

/** One result row: the index fields plus where to read the rest. */
function toResult(item: SearchItem, locale: Locale) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    datasets: item.datasets,
    tags: item.tags,
    description: locale === 'ja' ? item.description_ja : item.description_en,
    url: item.url,
    license: item.license,
    stars: item.stars,
    page: pageFor(item.id, locale),
    ...projectPages(item.id),
  };
}

/**
 * Tool names and descriptions stay English: they are how an agent selects a tool, not UI copy.
 * The data they return follows `locale`.
 */
export function buildTools(items: SearchItem[], locale: Locale): ToolDescriptor[] {
  return [
    {
      name: 'search-projects',
      description:
        'Search this directory of Drosophila connectome and fly-brain projects by free text and by category, dataset or tag. Returns matching projects with their id, description, license, star count and the path of their page on this site.',
      inputSchema: {
        type: 'object',
        properties: {
          q: { type: 'string', description: 'Free text matched against project name, tags and description.' },
          category: { type: 'string', enum: [...CATEGORIES], description: 'Restrict to one category.' },
          dataset: { type: 'string', enum: [...DATASET_IDS], description: 'Restrict to projects using this connectome dataset.' },
          tag: { type: 'string', description: 'Restrict to projects carrying this exact tag.' },
          limit: { type: 'number', description: `Maximum results to return (default ${DEFAULT_LIMIT}, maximum ${MAX_LIMIT}).` },
        },
        additionalProperties: false,
      },
      async execute(input = {}) {
        const filters = input as SearchFilters;
        const matched = searchItems(items, filters, locale);
        return {
          ok: true,
          total: matched.length,
          results: matched.slice(0, clampedLimit(filters.limit)).map((i) => toResult(i, locale)),
        };
      },
    },
    {
      name: 'get-project',
      description:
        'Look up one project in this directory by its id. Returns the indexed summary; fetch the returned page path for the full entry, including the organisation, dates, repository and the sources that were checked.',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'The project id, as returned by search-projects.' } },
        required: ['id'],
        additionalProperties: false,
      },
      async execute(input = {}) {
        const id = typeof input.id === 'string' ? input.id : '';
        const item = getItem(items, id);
        return item ? { ok: true, found: true, project: toResult(item, locale) } : { ok: true, found: false, id };
      },
    },
    {
      name: 'list-categories',
      description:
        'List the seven categories this directory uses, with how many projects each currently holds and the path of its listing page.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        return {
          ok: true,
          categories: CATEGORIES.map((slug) => ({
            slug,
            label: CATEGORY_META[slug].label[locale],
            blurb: CATEGORY_META[slug].blurb[locale],
            count: items.filter((i) => i.category === slug).length,
            page: categoryPage(slug, locale),
            ...(CATEGORY_META[slug].notice ? { notice: CATEGORY_META[slug].notice[locale] } : {}),
          })),
        };
      },
    },
    {
      name: 'list-datasets',
      description:
        'List the connectome datasets projects in this directory are built on, with how many projects use each one.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      async execute() {
        return {
          ok: true,
          datasets: DATASET_IDS.map((id: DatasetId) => ({
            id,
            label: DATASET_LABELS[id],
            usedBy: items.filter((i) => i.datasets.includes(id)).length,
            page: pageFor(id, locale),
          })),
        };
      },
    },
  ];
}
