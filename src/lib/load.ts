import { getCollection } from 'astro:content';
import type { Project } from './schema';
import { sortProjects } from './projects';

let cache: Project[] | null = null;

/** All projects from the content collection, sorted. Cached for the build. */
export async function loadProjects(): Promise<Project[]> {
  if (!cache) {
    const entries = await getCollection('projects');
    cache = sortProjects(entries.map((e) => e.data as Project));
  }
  return cache;
}
