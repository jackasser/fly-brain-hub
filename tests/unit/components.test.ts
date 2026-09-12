import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import AdSlot from '../../src/components/AdSlot.astro';
import ProjectCard from '../../src/components/ProjectCard.astro';
import ProjectGrid from '../../src/components/ProjectGrid.astro';
import LangToggle from '../../src/components/LangToggle.astro';
import type { Project } from '../../src/lib/schema';

const project = (over: Partial<Project> = {}): Project => ({
  id: 'sample',
  name: 'Sample Project',
  url: 'https://sample.example',
  category: 'tool',
  tags: ['python'],
  datasets: [],
  org: 'Sample Org',
  region: 'US',
  date: '2026',
  addedAt: '2026-09-12',
  status: 'active',
  featured: false,
  description_en: 'English description of the sample project, long enough to satisfy the schema minimum length.',
  description_ja: '日本語の説明文。スキーマの最小文字数を満たすための十分な長さの文章です。',
  sourceRefs: ['https://sample.example'],
  ...over,
});

let container: AstroContainer;
beforeAll(async () => {
  container = await AstroContainer.create();
});

const enabledEnv = {
  PUBLIC_ADSENSE_CLIENT: 'ca-pub-1',
  PUBLIC_ADSENSE_SLOT_LEADERBOARD: '111',
  PUBLIC_ADSENSE_SLOT_INFEED: '222',
  PUBLIC_ADSENSE_INFEED_LAYOUT_KEY: '-k1',
  PUBLIC_ADSENSE_SLOT_SIDEBAR: '333',
};

describe('R-07 AdSlot', () => {
  it('AC-07-3a renders an adsbygoogle unit when enabled', async () => {
    const html = await container.renderToString(AdSlot, { props: { name: 'infeed', env: enabledEnv, dev: false } });
    expect(html).toContain('class="adsbygoogle');
    expect(html).toContain('data-ad-client="ca-pub-1"');
    expect(html).toContain('data-ad-slot="222"');
    expect(html).toContain('data-ad-layout-key="-k1"');
    expect(html).toContain('data-ad-format="fluid"');
  });

  it('AC-07-3b renders a placeholder in dev when disabled', async () => {
    const html = await container.renderToString(AdSlot, { props: { name: 'leaderboard', env: {}, dev: true } });
    expect(html).toContain('data-ad-placeholder="leaderboard"');
    expect(html).not.toContain('adsbygoogle');
  });

  it('AC-07-3c renders nothing in production when disabled', async () => {
    const html = await container.renderToString(AdSlot, { props: { name: 'sidebar', env: {}, dev: false } });
    expect(html.trim()).toBe('');
  });
});

describe('R-04 ProjectCard', () => {
  it('AC-04-1 shows the crypto notice only for crypto entries', async () => {
    const crypto = await container.renderToString(ProjectCard, {
      props: { project: project({ category: 'crypto' }), locale: 'en' },
    });
    expect(crypto).toContain('information only');
    const tool = await container.renderToString(ProjectCard, { props: { project: project(), locale: 'en' } });
    expect(tool).not.toContain('information only');
    const cryptoJa = await container.renderToString(ProjectCard, {
      props: { project: project({ category: 'crypto' }), locale: 'ja' },
    });
    expect(cryptoJa).toContain('情報提供のみ');
  });

  it('AC-04-2 renders datasets, license, stars and the localized description', async () => {
    const html = await container.renderToString(ProjectCard, {
      props: { project: project({ datasets: ['malecns'], license: 'MIT', stars: 42 }), locale: 'ja' },
    });
    expect(html).toContain('MaleCNS');
    expect(html).toContain('MIT');
    expect(html).toContain('42');
    expect(html).toContain('日本語の説明文');
    expect(html).not.toContain('English description');
    expect(html).toContain('href="/ja/projects/sample"');
  });
});

describe('R-04 ProjectGrid', () => {
  it('AC-04-3 inserts an in-feed ad after every 6th card when ads are enabled', async () => {
    const projects = Array.from({ length: 13 }, (_, i) => project({ id: `p${i}`, name: `P${i}` }));
    const html = await container.renderToString(ProjectGrid, {
      props: { projects, locale: 'en', env: enabledEnv, dev: false },
    });
    const ads = html.match(/data-ad-slot="222"/g) ?? [];
    expect(ads.length).toBe(2);
    const order = [...html.matchAll(/(?:href="\/projects\/(p\d+)")|(data-ad-slot="222")/g)].map((m) => m[1] ?? 'AD');
    const cards = order.filter((x, i) => order.indexOf(x) === i || x === 'AD');
    expect(cards.indexOf('AD')).toBe(6);
    expect(cards.lastIndexOf('AD')).toBe(13);
  });

  it('renders no ad markup when ads are disabled in production', async () => {
    const projects = Array.from({ length: 7 }, (_, i) => project({ id: `p${i}`, name: `P${i}` }));
    const html = await container.renderToString(ProjectGrid, { props: { projects, locale: 'en', env: {}, dev: false } });
    expect(html).not.toContain('adsbygoogle');
    expect(html).not.toContain('data-ad-placeholder');
  });
});

describe('R-03 LangToggle', () => {
  it('links to the same page in the other locale', async () => {
    const en = await container.renderToString(LangToggle, { props: { locale: 'en', path: '/projects/x' } });
    expect(en).toContain('href="/ja/projects/x"');
    expect(en).toContain('hreflang="ja"');
    const ja = await container.renderToString(LangToggle, { props: { locale: 'ja', path: '/ja/projects/x' } });
    expect(ja).toContain('href="/projects/x"');
  });
});
