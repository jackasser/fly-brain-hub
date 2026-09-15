import { en, type MessageKey } from './en';
import { ja } from './ja';
import type { Category, Locale } from '../lib/taxonomy';

export type { Locale, MessageKey };

export const LOCALES: readonly Locale[] = ['en', 'ja'];
export const DEFAULT_LOCALE: Locale = 'en';

const messages: Record<Locale, Record<MessageKey, string>> = { en, ja };

export function t(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? en[key];
}

/** Strip a leading locale prefix and return the locale-agnostic path (always starts with "/"). */
export function stripLocale(path: string): string {
  if (path === '/ja' || path.startsWith('/ja/')) {
    const rest = path.slice(3);
    return rest === '' ? '/' : rest;
  }
  return path === '' ? '/' : path;
}

export function localeFromPath(path: string): Locale {
  return path === '/ja' || path.startsWith('/ja/') ? 'ja' : 'en';
}

/** Build the URL path for `locale` from a locale-agnostic path. */
export function localePath(locale: Locale, path: string): string {
  const bare = stripLocale(path);
  if (locale === 'en') return bare;
  return bare === '/' ? '/ja/' : `/ja${bare}`;
}

/**
 * Where a category click lands: the full list with the category facet pre-selected (AC-04-8),
 * so search and sort stay available. `/category/<slug>` is kept only for sitemap and WebMCP.
 */
export function categoryPath(locale: Locale, category: Category): string {
  return localePath(locale, `/projects?category=${category}`);
}

/** Same page in the other locale. */
export function otherLocalePath(path: string): string {
  const current = localeFromPath(path);
  return localePath(current === 'en' ? 'ja' : 'en', path);
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'en' ? 'ja' : 'en';
}

export function pick<T>(locale: Locale, values: Record<Locale, T>): T {
  return values[locale];
}
