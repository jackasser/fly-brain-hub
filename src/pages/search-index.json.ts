import { loadProjects } from '../lib/load';
import { toSearchIndex } from '../lib/projects';

export async function GET() {
  const index = toSearchIndex(await loadProjects());
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
