import type { Project } from './schema';
import { CATEGORIES, type Category } from './taxonomy';

/** Featured first, then newest `addedAt`, then id for stability. */
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.addedAt !== b.addedAt) return a.addedAt < b.addedAt ? 1 : -1;
    return a.id.localeCompare(b.id);
  });
}

export function latest(projects: Project[], n = 6): Project[] {
  return [...projects]
    .sort((a, b) => (a.addedAt === b.addedAt ? a.id.localeCompare(b.id) : a.addedAt < b.addedAt ? 1 : -1))
    .slice(0, n);
}

export function featured(projects: Project[]): Project[] {
  return sortProjects(projects.filter((p) => p.featured));
}

export function byCategory(projects: Project[], category: Category): Project[] {
  return sortProjects(projects.filter((p) => p.category === category));
}

export function countByCategory(projects: Project[]): Record<Category, number> {
  const out = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  for (const p of projects) out[p.category] += 1;
  return out;
}

/** dataset id -> number of projects that reference it. */
export function datasetUsage(projects: Project[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of projects) for (const d of p.datasets) m.set(d, (m.get(d) ?? 0) + 1);
  return m;
}

export function usedBy(projects: Project[], datasetId: string): Project[] {
  return sortProjects(projects.filter((p) => (p.datasets as string[]).includes(datasetId)));
}

export function allTags(projects: Project[]): [string, number][] {
  const m = new Map<string, number>();
  for (const p of projects) for (const t of p.tags) m.set(t, (m.get(t) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export interface SearchItem {
  id: string;
  name: string;
  category: Category;
  datasets: string[];
  tags: string[];
  description_en: string;
  description_ja: string;
  url: string;
  license: string | null;
  stars: number | null;
}

export function toSearchIndex(projects: Project[]): SearchItem[] {
  return sortProjects(projects).map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    datasets: [...p.datasets],
    tags: [...p.tags],
    description_en: p.description_en,
    description_ja: p.description_ja,
    url: p.url,
    license: p.license ?? null,
    stars: p.stars ?? null,
  }));
}
