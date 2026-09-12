import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { loadProjects } from './load';
import { latest } from './projects';
import { CATEGORY_META, type Locale } from './taxonomy';
import { localePath, t } from '../i18n';

export async function buildFeed(context: APIContext, locale: Locale): Promise<Response> {
  const projects = await loadProjects();
  const site = context.site ?? new URL('https://example.com');
  return rss({
    title: t(locale, 'site.name'),
    description: t(locale, 'site.description'),
    site,
    items: latest(projects, projects.length).map((p) => ({
      title: p.name,
      link: localePath(locale, `/projects/${p.id}`),
      description: locale === 'ja' ? p.description_ja : p.description_en,
      pubDate: new Date(`${p.addedAt}T00:00:00Z`),
      categories: [CATEGORY_META[p.category].label[locale], ...p.tags],
    })),
    customData: `<language>${locale === 'ja' ? 'ja' : 'en'}</language>`,
  });
}
