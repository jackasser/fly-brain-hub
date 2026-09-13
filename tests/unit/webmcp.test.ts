import { describe, expect, it } from 'vitest';
import { buildTools, clampedLimit, getItem, projectPages, searchItems, TOOL_NAMES } from '../../src/lib/webmcp';
import type { SearchItem } from '../../src/lib/projects';

const item = (over: Partial<SearchItem> = {}): SearchItem => ({
  id: 'sample',
  name: 'Sample Project',
  category: 'tool',
  datasets: [],
  tags: ['python'],
  description_en: 'English description of the sample project.',
  description_ja: 'サンプルの日本語説明。',
  url: 'https://sample.example',
  license: 'MIT',
  stars: null,
  ...over,
});

const items: SearchItem[] = [
  item({ id: 'flybody', name: 'flybody', category: 'body', tags: ['mujoco'], datasets: [] }),
  item({ id: 'doomfly', name: 'DOOMFLY', category: 'demo', tags: ['doom', 'viral-2026'], datasets: ['malecns'] }),
  item({ id: 'malecns', name: 'MaleCNS v1.0', category: 'connectome', tags: ['adult'], datasets: [] }),
  item({ id: 'navis', name: 'navis', category: 'tool', tags: ['python'], datasets: ['flywire-fafb'] }),
];

describe('R-14 WebMCP tool descriptors', () => {
  it('AC-14-1 exposes exactly the four declared tools', () => {
    const tools = buildTools(items, 'en');
    expect(tools.map((t) => t.name)).toEqual([...TOOL_NAMES]);
    expect(TOOL_NAMES).toEqual(['search-projects', 'get-project', 'list-categories', 'list-datasets']);
  });

  it('AC-14-1 every inputSchema is closed and pins no JSON Schema dialect', () => {
    for (const tool of buildTools(items, 'en')) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.additionalProperties).toBe(false);
      expect(tool.inputSchema).not.toHaveProperty('$schema');
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(20);
      expect(typeof tool.execute).toBe('function');
    }
  });

  it('AC-14-1 the closed taxonomies are offered as enums', () => {
    const search = buildTools(items, 'en')[0];
    const props = search.inputSchema.properties as Record<string, { enum?: readonly string[] }>;
    expect(props.category.enum).toContain('connectome');
    expect(props.category.enum).toContain('crypto');
    expect(props.dataset.enum).toContain('malecns');
    expect(props.dataset.enum).toContain('larval');
  });

  it('AC-14-1 tool names and descriptions stay English regardless of locale', () => {
    const en = buildTools(items, 'en');
    const ja = buildTools(items, 'ja');
    expect(ja.map((t) => t.name)).toEqual(en.map((t) => t.name));
    expect(ja.map((t) => t.description)).toEqual(en.map((t) => t.description));
  });
});

describe('R-14 searchItems', () => {
  it('AC-14-2 filters by category, dataset and tag with exact matching', () => {
    expect(searchItems(items, { category: 'tool' }).map((i) => i.id)).toEqual(['navis']);
    expect(searchItems(items, { dataset: 'malecns' }).map((i) => i.id)).toEqual(['doomfly']);
    expect(searchItems(items, { tag: 'viral-2026' }).map((i) => i.id)).toEqual(['doomfly']);
  });

  it('AC-14-2 matches q against name, tags and description, ignoring case', () => {
    expect(searchItems(items, { q: 'doomfly' }).map((i) => i.id)).toEqual(['doomfly']);
    expect(searchItems(items, { q: 'DOOM' }).map((i) => i.id)).toEqual(['doomfly']);
    expect(searchItems(items, { q: 'mujoco' }).map((i) => i.id)).toEqual(['flybody']);
    expect(searchItems(items, { q: 'サンプル' }, 'ja').map((i) => i.id).length).toBe(items.length);
  });

  it('AC-14-2 combines filters', () => {
    expect(searchItems(items, { q: 'a', category: 'connectome' }).map((i) => i.id)).toEqual(['malecns']);
    expect(searchItems(items, { category: 'tool', dataset: 'malecns' })).toEqual([]);
  });

  it('AC-14-2 an empty filter returns everything', () => {
    expect(searchItems(items, {})).toHaveLength(items.length);
  });
});

describe('R-14 limits and lookup', () => {
  const many: SearchItem[] = Array.from({ length: 80 }, (_, n) => item({ id: `p${n}`, name: `Project ${n}` }));

  it('AC-14-2 limit defaults to 20 and is capped at 50', () => {
    const tools = buildTools(many, 'en');
    expect(tools).toBeDefined();
    expect(searchItems(many, {}).slice(0, 20)).toHaveLength(20);
    expect(clampedLimit(undefined)).toBe(20);
    expect(clampedLimit(5)).toBe(5);
    expect(clampedLimit(999)).toBe(50);
    expect(clampedLimit(0)).toBe(20);
    expect(clampedLimit(-3)).toBe(20);
  });

  it('AC-14-3 getItem returns null for an unknown id', () => {
    expect(getItem(items, 'flybody')?.name).toBe('flybody');
    expect(getItem(items, 'no-such-project')).toBeNull();
  });

  it('AC-14-3 projectPages gives both locale paths', () => {
    expect(projectPages('flybody')).toEqual({
      page_en: '/projects/flybody',
      page_ja: '/ja/projects/flybody',
    });
  });
});

describe('R-14 tool execution', () => {
  it('AC-14-2 search-projects returns ok, total and a limited result list', async () => {
    const [search] = buildTools(items, 'en');
    const out = (await search.execute({ category: 'demo' })) as {
      ok: boolean;
      total: number;
      results: { id: string; description: string; page: string }[];
    };
    expect(out.ok).toBe(true);
    expect(out.total).toBe(1);
    expect(out.results[0].id).toBe('doomfly');
    expect(out.results[0].page).toBe('/projects/doomfly');
    expect(out.results[0].description).toBe('English description of the sample project.');
  });

  it('AC-14-3 returned data follows the page locale', async () => {
    const [search] = buildTools(items, 'ja');
    const out = (await search.execute({ category: 'demo' })) as {
      results: { description: string; page: string }[];
    };
    expect(out.results[0].page).toBe('/ja/projects/doomfly');
    expect(out.results[0].description).toBe('サンプルの日本語説明。');
  });

  it('AC-14-3 get-project reports a miss without throwing', async () => {
    const get = buildTools(items, 'en')[1];
    const hit = (await get.execute({ id: 'navis' })) as { found: boolean; project: { page_ja: string } };
    expect(hit.found).toBe(true);
    expect(hit.project.page_ja).toBe('/ja/projects/navis');
    const miss = (await get.execute({ id: 'nope' })) as { ok: boolean; found: boolean };
    expect(miss.ok).toBe(true);
    expect(miss.found).toBe(false);
  });

  it('AC-14-1 list-categories counts the loaded items and links both locales', async () => {
    const list = buildTools(items, 'ja')[2];
    const out = (await list.execute({})) as { categories: { slug: string; count: number; page: string }[] };
    expect(out.categories).toHaveLength(7);
    const demo = out.categories.find((c) => c.slug === 'demo')!;
    expect(demo.count).toBe(1);
    expect(demo.page).toBe('/ja/category/demo');
  });

  it('AC-14-1 list-datasets reports how many projects use each dataset', async () => {
    const list = buildTools(items, 'en')[3];
    const out = (await list.execute({})) as { datasets: { id: string; usedBy: number }[] };
    expect(out.datasets.find((d) => d.id === 'malecns')!.usedBy).toBe(1);
    expect(out.datasets.find((d) => d.id === 'hemibrain')!.usedBy).toBe(0);
  });
});
