import type { APIContext } from 'astro';

export function GET(context: APIContext) {
  const site = (context.site ?? new URL('https://example.com')).toString().replace(/\/$/, '');
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap-index.xml\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
