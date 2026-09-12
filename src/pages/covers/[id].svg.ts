import type { APIContext } from 'astro';
import { loadProjects } from '../../lib/load';
import { generatedCover } from '../../lib/media';
import type { Project } from '../../lib/schema';

/** One generated cover per project: used directly for entries without an embeddable image,
 *  and as the `onerror` fallback for every external image. */
export async function getStaticPaths() {
  const projects = await loadProjects();
  return projects.map((project) => ({ params: { id: project.id }, props: { project } }));
}

export function GET({ props }: APIContext<{ project: Project }>) {
  const { project } = props;
  return new Response(generatedCover(project.id, project.category, project.name), {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  });
}
