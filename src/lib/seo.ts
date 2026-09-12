import type { Project } from './schema';
import { CATEGORY_META, type Locale } from './taxonomy';
import { localePath } from '../i18n';

export interface JsonLd {
  '@context': 'https://schema.org';
  '@type': string;
  name: string;
  url: string;
  description: string;
  license?: string;
  codeRepository?: string;
  author?: { '@type': 'Organization'; name: string };
  datePublished?: string;
  keywords?: string;
}

export function jsonLd(project: Project, locale: Locale): JsonLd {
  const out: JsonLd = {
    '@context': 'https://schema.org',
    '@type': CATEGORY_META[project.category].jsonLdType,
    name: project.name,
    url: project.url,
    description: locale === 'ja' ? project.description_ja : project.description_en,
    author: { '@type': 'Organization', name: project.org },
    datePublished: project.date,
  };
  if (project.license) out.license = project.license;
  if (project.repoUrl) out.codeRepository = project.repoUrl;
  if (project.tags.length) out.keywords = project.tags.join(', ');
  return out;
}

/** JSON for an inline <script type="application/ld+json">: `<` is escaped so data can never close the tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export interface Alternate {
  hreflang: 'en' | 'ja' | 'x-default';
  href: string;
}

/** Absolute URL without a trailing slash (except the site root), matching the sitemap. */
function absolute(site: string, path: string): string {
  const u = new URL(path, site.endsWith('/') ? site : `${site}/`);
  if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.replace(/[/]+$/, '');
  return u.toString();
}

/** hreflang alternates for a locale-agnostic (or localised) path. */
export function alternates(site: string, path: string): Alternate[] {
  const enHref = absolute(site, localePath('en', path));
  const jaHref = absolute(site, localePath('ja', path));
  return [
    { hreflang: 'en', href: enHref },
    { hreflang: 'ja', href: jaHref },
    { hreflang: 'x-default', href: enHref },
  ];
}

export function canonical(site: string, path: string): string {
  return absolute(site, path);
}
