import { describe, expect, it } from 'vitest';
import { jsonLd, alternates, serializeJsonLd } from '../../src/lib/seo';
import type { Project } from '../../src/lib/schema';

const base: Project = {
  id: 'x',
  name: 'X',
  url: 'https://x.example',
  category: 'tool',
  tags: [],
  datasets: [],
  org: 'o',
  region: 'US',
  date: '2026',
  addedAt: '2026-09-12',
  status: 'active',
  featured: false,
  description_en: 'e'.repeat(60),
  description_ja: 'j'.repeat(40),
  sourceRefs: ['https://x.example'],
};

describe('R-06 seo', () => {
  it('AC-06-1 jsonLd picks @type by category and adds codeRepository when repoUrl exists', () => {
    expect(jsonLd({ ...base, category: 'connectome' }, 'en')['@type']).toBe('Dataset');
    expect(jsonLd({ ...base, category: 'media' }, 'en')['@type']).toBe('Article');
    const withRepo = jsonLd({ ...base, repoUrl: 'https://github.com/a/b', license: 'MIT' }, 'ja');
    expect(withRepo['@type']).toBe('SoftwareSourceCode');
    expect(withRepo.codeRepository).toBe('https://github.com/a/b');
    expect(withRepo.description).toBe(base.description_ja);
    expect(withRepo.license).toBe('MIT');
    expect(jsonLd(base, 'en').codeRepository).toBeUndefined();
  });

  it('AC-06-4 serializeJsonLd never closes the script tag and round-trips', () => {
    const evil = { ...base, name: 'x</script><script>alert(1)</script>', org: '<b>&' };
    const out = serializeJsonLd(jsonLd(evil, 'en'));
    expect(out).not.toContain('</script');
    expect(out).not.toContain('<');
    expect(JSON.parse(out).name).toBe(evil.name);
    expect(JSON.parse(out).author.name).toBe('<b>&');
  });

  it('AC-06-1b every category maps to its JSON-LD type', () => {
    const expected = {
      connectome: 'Dataset', simulation: 'SoftwareSourceCode', body: 'SoftwareSourceCode', demo: 'SoftwareSourceCode',
      tool: 'SoftwareSourceCode', media: 'Article', crypto: 'WebPage',
    } as const;
    for (const [cat, type] of Object.entries(expected)) {
      expect(jsonLd({ ...base, category: cat as never }, 'en')['@type']).toBe(type);
    }
  });

  it('alternates builds en/ja/x-default absolute URLs', () => {
    expect(alternates('https://example.com', '/projects/x')).toEqual([
      { hreflang: 'en', href: 'https://example.com/projects/x' },
      { hreflang: 'ja', href: 'https://example.com/ja/projects/x' },
      { hreflang: 'x-default', href: 'https://example.com/projects/x' },
    ]);
    expect(alternates('https://example.com/', '/ja/')[0].href).toBe('https://example.com/');
    expect(alternates('https://example.com/', '/ja/')[1].href).toBe('https://example.com/ja');
    expect(alternates('https://example.com', '/projects/x/')[0].href).toBe('https://example.com/projects/x');
  });
});
