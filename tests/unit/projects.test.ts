import { describe, expect, it } from 'vitest';
import { byCategory, countByCategory, datasetUsage, featured, latest, sortProjects } from '../../src/lib/projects';
import type { Project } from '../../src/lib/schema';

const mk = (over: Partial<Project>): Project => ({
  id: 'x',
  name: 'x',
  url: 'https://x.example',
  category: 'tool',
  tags: [],
  datasets: [],
  org: 'o',
  region: 'US',
  date: '2026',
  addedAt: '2026-01-01',
  status: 'active',
  featured: false,
  description_en: 'e'.repeat(60),
  description_ja: 'j'.repeat(40),
  sourceRefs: ['https://x.example'],
  ...over,
});

const list = [
  mk({ id: 'a', addedAt: '2026-09-01', category: 'connectome' }),
  mk({ id: 'b', addedAt: '2026-09-05', featured: true, category: 'demo', datasets: ['a' as never] }),
  mk({ id: 'c', addedAt: '2026-09-03', category: 'demo', datasets: ['a' as never] }),
  mk({ id: 'd', addedAt: '2026-09-03', category: 'tool' }),
];

describe('lib/projects', () => {
  it('sortProjects: featured first, then newest, then id', () => {
    expect(sortProjects(list).map((p) => p.id)).toEqual(['b', 'c', 'd', 'a']);
  });
  it('latest returns n newest by addedAt regardless of featured', () => {
    expect(latest(list, 2).map((p) => p.id)).toEqual(['b', 'c']);
  });
  it('featured filters', () => {
    expect(featured(list).map((p) => p.id)).toEqual(['b']);
  });
  it('byCategory and countByCategory', () => {
    expect(byCategory(list, 'demo').map((p) => p.id)).toEqual(['b', 'c']);
    expect(countByCategory(list).demo).toBe(2);
    expect(countByCategory(list).crypto).toBe(0);
  });
  it('datasetUsage counts references', () => {
    expect(datasetUsage(list).get('a')).toBe(2);
    expect(datasetUsage(list).get('nope')).toBeUndefined();
  });
});
