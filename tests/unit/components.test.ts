import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { beforeAll, describe, expect, it } from 'vitest';
import AdSlot from '../../src/components/AdSlot.astro';
import ProjectCard from '../../src/components/ProjectCard.astro';
import ProjectGrid from '../../src/components/ProjectGrid.astro';
import LangToggle from '../../src/components/LangToggle.astro';
import CoverMedia from '../../src/components/CoverMedia.astro';
import FlyHero from '../../src/components/FlyHero.astro';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
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

  it('AC-07-5 renders nothing when the slot id is missing even though ads are enabled', async () => {
    const html = await container.renderToString(AdSlot, {
      props: { name: 'sidebar', env: { PUBLIC_ADSENSE_CLIENT: 'ca-pub-1' }, dev: false },
    });
    expect(html.trim()).toBe('');
  });

  it('AC-07-6 BaseLayout with ads=false emits no ad loader or slot', async () => {
    const html = await container.renderToString(BaseLayout, {
      props: { locale: 'en', title: 'x', description: 'y', path: '/404', ads: false, adEnv: enabledEnv },
      slots: { default: '<p>hi</p>' },
    });
    expect(html).not.toContain('adsbygoogle');
    expect(html).not.toContain('pagead2');
    const on = await container.renderToString(BaseLayout, {
      props: { locale: 'en', title: 'x', description: 'y', path: '/about', adEnv: enabledEnv, dev: false },
      slots: { default: '<p>hi</p>' },
    });
    expect(on).toContain('pagead2.googlesyndication.com');
    expect(on).toContain('data-ad-slot="111"');
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

describe('R-11 covers', () => {
  it('AC-11-5 ProjectCard picks GitHub preview, inline SVG or YouTube thumbnail', async () => {
    const gh = await container.renderToString(ProjectCard, {
      props: { project: project({ repoUrl: 'https://github.com/o/r' }), locale: 'en' },
    });
    expect(gh).toContain('class="card__cover');
    expect(gh).toContain('src="https://opengraph.githubassets.com/sample/o/r"');
    expect(gh).toContain('loading="lazy"');
    const gen = await container.renderToString(ProjectCard, { props: { project: project(), locale: 'en' } });
    expect(gen).toContain('class="card__cover');
    expect(gen).toContain('src="/covers/sample.svg"');
    expect(gen).not.toContain('<svg');
    expect(gh).not.toContain('<svg');
    expect(gh).toContain("this.src='/covers/sample.svg'");
    const yt = await container.renderToString(ProjectCard, {
      props: { project: project({ video: 'https://youtu.be/dQw4w9WgXcQ' }), locale: 'ja' },
    });
    expect(yt).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
  });

  it('AC-11-6 CoverMedia embeds YouTube on detail pages and falls back to the cover otherwise', async () => {
    const withVideo = await container.renderToString(CoverMedia, {
      props: { project: project({ video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }), locale: 'en' },
    });
    expect(withVideo).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(withVideo).toContain('<iframe');
    const noVideo = await container.renderToString(CoverMedia, {
      props: { project: project({ repoUrl: 'https://github.com/o/r' }), locale: 'en' },
    });
    expect(noVideo).not.toContain('<iframe');
    expect(noVideo).toContain('opengraph.githubassets.com/sample/o/r');
  });
});

describe('R-13 analytics', () => {
  const base = { locale: 'en', title: 'x', description: 'y', path: '/about', adEnv: {}, dev: false } as const;
  it('AC-13-2 emits Vercel insights only when enabled, GA only with an id, nothing on ad-free pages', async () => {
    const off = await container.renderToString(BaseLayout, { props: { ...base, analyticsEnv: {} }, slots: { default: 'hi' } });
    expect(off).not.toContain('/_vercel/insights/script.js');
    expect(off).not.toContain('googletagmanager');
    const vercel = await container.renderToString(BaseLayout, {
      props: { ...base, analyticsEnv: { PUBLIC_VERCEL_ANALYTICS: '1' } },
      slots: { default: 'hi' },
    });
    expect(vercel).toContain('src="/_vercel/insights/script.js"');
    expect(vercel).toContain('window.va');
    expect(vercel).not.toContain('googletagmanager');
    const ga = await container.renderToString(BaseLayout, {
      props: { ...base, analyticsEnv: { PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234' } },
      slots: { default: 'hi' },
    });
    expect(ga).toContain('https://www.googletagmanager.com/gtag/js?id=G-TEST1234');
    expect(ga).toContain("analytics_storage:'denied'");
    const notFound = await container.renderToString(BaseLayout, {
      props: { ...base, path: '/404', ads: false, analyticsEnv: { PUBLIC_VERCEL_ANALYTICS: '1', PUBLIC_GA_MEASUREMENT_ID: 'G-TEST1234' } },
      slots: { default: 'hi' },
    });
    expect(notFound).not.toContain('/_vercel/insights');
    expect(notFound).not.toContain('googletagmanager');
  });
});

describe('R-15 house ad', () => {
  const FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSc-example/viewform';
  const houseEnv = { PUBLIC_AD_INQUIRY_URL: FORM };

  it('AC-15-2 offers the empty slot with a link to the inquiry form', async () => {
    const html = await container.renderToString(AdSlot, {
      props: { name: 'leaderboard', env: houseEnv, dev: false, locale: 'ja' },
    });
    expect(html).toContain('data-house-ad="leaderboard"');
    expect(html).toContain(FORM);
    expect(html).toContain('target="_blank"');
    expect(html).toMatch(/rel="[^"]*noopener/);
    expect(html).toContain('広告募集中');
    expect(html).not.toContain('adsbygoogle');
  });

  it('AC-15-2 real ads win the slot back', async () => {
    const html = await container.renderToString(AdSlot, {
      props: { name: 'leaderboard', env: { ...enabledEnv, ...houseEnv }, dev: false },
    });
    expect(html).toContain('adsbygoogle');
    expect(html).not.toContain('data-house-ad');
  });

  it('AC-15-2 the house ad replaces the dev placeholder', async () => {
    const configured = await container.renderToString(AdSlot, {
      props: { name: 'sidebar', env: houseEnv, dev: true },
    });
    expect(configured).toContain('data-house-ad="sidebar"');
    expect(configured).not.toContain('data-ad-placeholder');

    const unconfigured = await container.renderToString(AdSlot, { props: { name: 'sidebar', env: {}, dev: true } });
    expect(unconfigured).toContain('data-ad-placeholder="sidebar"');
    expect(unconfigured).not.toContain('data-house-ad');
  });

  it('AC-15-3 house={false} drops the house ad and nothing else', async () => {
    const prod = await container.renderToString(AdSlot, {
      props: { name: 'infeed', env: houseEnv, dev: false, house: false },
    });
    expect(prod.trim()).toBe('');

    // The dev placeholder still marks the slot; only the offer is suppressed.
    const inDev = await container.renderToString(AdSlot, {
      props: { name: 'infeed', env: houseEnv, dev: true, house: false },
    });
    expect(inDev).not.toContain('data-house-ad');
    expect(inDev).toContain('data-ad-placeholder="infeed"');
  });

  it('AC-15-8 each locale links to its own form', async () => {
    const env = {
      PUBLIC_AD_INQUIRY_URL: 'https://docs.google.com/forms/d/e/EN/viewform',
      PUBLIC_AD_INQUIRY_URL_JA: 'https://docs.google.com/forms/d/e/JA/viewform',
    };
    const ja = await container.renderToString(AdSlot, { props: { name: 'leaderboard', env, dev: false, locale: 'ja' } });
    expect(ja).toContain('/forms/d/e/JA/viewform');
    expect(ja).not.toContain('/forms/d/e/EN/viewform');

    const en = await container.renderToString(AdSlot, { props: { name: 'leaderboard', env, dev: false, locale: 'en' } });
    expect(en).toContain('/forms/d/e/EN/viewform');
    expect(en).not.toContain('/forms/d/e/JA/viewform');
  });

  it('AC-15-4 a long list carries the house ad once, not at every in-feed break', async () => {
    const projects = Array.from({ length: 13 }, (_, n) => project({ id: `p${n}` }));
    const html = await container.renderToString(ProjectGrid, {
      props: { projects, locale: 'en', env: houseEnv, dev: false },
    });
    expect(html.match(/data-house-ad="infeed"/g)).toHaveLength(1);
  });

  it('AC-15-5 the 404 page stays free of it', async () => {
    const html = await container.renderToString(BaseLayout, {
      props: {
        locale: 'en',
        title: 'x',
        description: 'y',
        path: '/404',
        ads: false,
        alternatesEnabled: false,
        adEnv: houseEnv,
        dev: false,
      },
      slots: { default: 'hi' },
    });
    expect(html).not.toContain('data-house-ad');
  });
});

describe('R-14 WebMCP', () => {
  const base = { locale: 'en', title: 'x', description: 'y', path: '/about', adEnv: {}, dev: false } as const;

  it('AC-14-4 BaseLayout marks every page as a WebMCP tool provider', async () => {
    const page = await container.renderToString(BaseLayout, { props: base, slots: { default: 'hi' } });
    expect(page).toContain('data-webmcp');
  });

  it('AC-14-4 the 404 page keeps the tools even though it carries no ads', async () => {
    const notFound = await container.renderToString(BaseLayout, {
      props: { ...base, path: '/404', ads: false, alternatesEnabled: false },
      slots: { default: 'hi' },
    });
    expect(notFound).toContain('data-webmcp');
  });
});

describe('R-11 X post media', () => {
  it('AC-11-13 play badge on video posters; official X embed on detail pages', async () => {
    const xp = project({
      url: 'https://x.com/lyra/status/1',
      image: 'https://pbs.twimg.com/amplify_video_thumb/1/img/a.jpg',
      imageCredit: '@lyra on X (video poster, 2026-09-12)',
      imageKind: 'video-poster',
    });
    const card = await container.renderToString(ProjectCard, { props: { project: xp, locale: 'en' } });
    expect(card).toContain('src="https://pbs.twimg.com/amplify_video_thumb/1/img/a.jpg"');
    expect(card).toContain('data-play');
    const plain = await container.renderToString(ProjectCard, { props: { project: project({ repoUrl: 'https://github.com/o/r' }), locale: 'en' } });
    expect(plain).not.toContain('data-play');
    const detail = await container.renderToString(CoverMedia, { props: { project: xp, locale: 'ja' } });
    expect(detail).toContain('class="twitter-tweet"');
    expect(detail).toContain('https://platform.twitter.com/widgets.js');
    expect(detail).toContain('href="https://x.com/lyra/status/1"');
    const gh = await container.renderToString(CoverMedia, { props: { project: project({ repoUrl: 'https://github.com/o/r' }), locale: 'en' } });
    expect(gh).not.toContain('twitter-tweet');
  });
});

describe('R-12 FlyHero', () => {
  it('AC-12-2 renders a fly face with a glowing brain and localized label', async () => {
    const en = await container.renderToString(FlyHero, { props: { locale: 'en' } });
    expect(en).toContain('<svg');
    expect(en).toContain('role="img"');
    expect(en).toContain('data-hero="fly"');
    expect((en.match(/data-part="eye"/g) ?? []).length).toBe(2);
    expect(en).toContain('data-part="brain"');
    expect(en).toMatch(/aria-label="[^"]*fruit fly[^"]*"/i);
    const ja = await container.renderToString(FlyHero, { props: { locale: 'ja' } });
    expect(ja).toMatch(/aria-label="[^"]*ハエ[^"]*"/);
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
