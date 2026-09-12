import { describe, expect, it } from 'vitest';
import { en } from '../../src/i18n/en';
import { ja } from '../../src/i18n/ja';
import { localePath, otherLocalePath, t, localeFromPath } from '../../src/i18n';

describe('R-03 i18n', () => {
  it('AC-03-1 en and ja have identical key sets', () => {
    expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
  });

  it('AC-03-2 localePath prefixes ja only', () => {
    expect(localePath('ja', '/projects/x')).toBe('/ja/projects/x');
    expect(localePath('en', '/projects/x')).toBe('/projects/x');
    expect(localePath('ja', '/')).toBe('/ja/');
    expect(localePath('en', '/')).toBe('/');
  });

  it('AC-03-3 otherLocalePath round-trips', () => {
    expect(otherLocalePath('/ja/projects/x')).toBe('/projects/x');
    expect(otherLocalePath('/projects/x')).toBe('/ja/projects/x');
    expect(otherLocalePath('/ja/')).toBe('/');
    expect(otherLocalePath('/')).toBe('/ja/');
    expect(localeFromPath('/ja/about')).toBe('ja');
    expect(localeFromPath('/about')).toBe('en');
  });

  it('t() returns the localized string', () => {
    expect(t('en', 'nav.projects')).toBe('Projects');
    expect(t('ja', 'nav.projects')).toBe('プロジェクト');
  });
});
