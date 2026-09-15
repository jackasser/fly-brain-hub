import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { projectSchema, type Project } from '../../src/lib/schema';
import { CATEGORIES } from '../../src/lib/taxonomy';

const root = new URL('../../', import.meta.url);
// fileURLToPath, not URL.pathname: the latter keeps non-ASCII directory names percent-encoded.
const dist = join(fileURLToPath(root), 'dist');
const projects: Project[] = (
  JSON.parse(readFileSync(new URL('src/data/projects.json', root), 'utf8')) as unknown[]
).map((e) => projectSchema.parse(e));

const html = (rel: string) => readFileSync(join(dist, rel), 'utf8');
const has = (rel: string) => existsSync(join(dist, rel));

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('dist/ (run `npm run build` first)', () => {
  it('dist exists', () => {
    expect(existsSync(dist), `missing ${dist}`).toBe(true);
  });

  describe('R-04 pages exist in both locales', () => {
    it('AC-04-4 project, category, datasets and list pages', () => {
      for (const p of projects) {
        expect(has(`projects/${p.id}/index.html`), p.id).toBe(true);
        expect(has(`ja/projects/${p.id}/index.html`), `ja/${p.id}`).toBe(true);
      }
      for (const c of CATEGORIES) {
        expect(has(`category/${c}/index.html`), c).toBe(true);
        expect(has(`ja/category/${c}/index.html`), `ja/${c}`).toBe(true);
      }
      for (const rel of ['index.html', 'ja/index.html', 'projects/index.html', 'ja/projects/index.html', 'datasets/index.html', 'ja/datasets/index.html']) {
        expect(has(rel), rel).toBe(true);
      }
    });

    it('AC-04-8 every in-site category link lands on /projects?category=', () => {
      for (const [prefix, home] of [
        ['', 'index.html'],
        ['/ja', 'ja/index.html'],
      ] as const) {
        const top = html(home);
        for (const c of CATEGORIES) {
          const tile = new RegExp(`<a class="cat" data-category="${c}" href="([^"]+)"`).exec(top)?.[1];
          expect(tile, `${home} tile ${c}`).toBe(`${prefix}/projects?category=${c}`);
        }
        expect(top, home).not.toContain('href="/category/');
        expect(top, home).not.toContain('href="/ja/category/');
      }
      const list = html('projects/index.html');
      expect(list).toContain('href="/projects?category=connectome"');
      for (const p of projects) {
        expect(html(`projects/${p.id}/index.html`), p.id).toContain(`href="/projects?category=${p.category}"`);
        expect(html(`ja/projects/${p.id}/index.html`), `ja/${p.id}`).toContain(`href="/ja/projects?category=${p.category}"`);
      }
      // Only the category pages themselves (their own canonical / hreflang) may still mention the route.
      const others = walk(dist).filter((f) => f.endsWith('.html') && !/[\\/]category[\\/]/.test(f));
      expect(others.length).toBeGreaterThan(0);
      for (const f of others) {
        const content = readFileSync(f, 'utf8');
        expect(content, f).not.toContain('href="/category/');
        expect(content, f).not.toContain('href="/ja/category/');
      }
    });

    it('AC-04-5 detail pages link every sourceRef', () => {
      for (const p of projects) {
        const page = html(`projects/${p.id}/index.html`);
        for (const ref of p.sourceRefs) {
          const escaped = ref.replace(/&/g, '&amp;');
          expect(page, `${p.id} missing ${ref}`).toContain(`href="${escaped}"`);
        }
      }
    });

    it('AC-04-7 external links on detail pages open in a new tab', () => {
      for (const p of projects) {
        const page = html(`projects/${p.id}/index.html`);
        const official = `<a class="btn" href="${p.url.replace(/&/g, '&amp;')}" target="_blank" rel="noopener noreferrer"`;
        expect(page, `${p.id} official`).toContain(official);
        for (const ref of p.sourceRefs) {
          const esc = ref.replace(/&/g, '&amp;');
          expect(page, `${p.id} ${ref}`).toContain(`href="${esc}" target="_blank" rel="noopener noreferrer nofollow"`);
        }
      }
    });

    it('AC-04-6 datasets page shows the used-by count per connectome', () => {
      for (const rel of ['datasets/index.html', 'ja/datasets/index.html']) {
        const page = html(rel);
        for (const ds of projects.filter((p) => p.category === 'connectome')) {
          const count = projects.filter((p) => p.datasets.includes(ds.id as never)).length;
          const cell = new RegExp(`<td[^>]*data-dataset="${ds.id}" data-used-by="${count}">\\s*${count}\\s`).test(page);
          expect(cell, `${rel} ${ds.id}`).toBe(true);
        }
      }
    });
  });

  describe('R-06 canonical / sitemap / og', () => {
    it('AC-06-5 canonical has no trailing slash, sitemap matches, og:image everywhere', () => {
      const noSlash = (u: string) => u === u.replace(/\/+$/, '') || /\/\/[^/]+\/$/.test(u);
      const pages = walk(dist).filter((f) => f.endsWith('index.html'));
      for (const f of pages) {
        const c = readFileSync(f, 'utf8');
        const m = /<link rel="canonical" href="([^"]+)"/.exec(c);
        expect(m, f).toBeTruthy();
        expect(noSlash(m![1]), `${f}: ${m![1]}`).toBe(true);
        expect(c, f).toMatch(/<meta property="og:image" content="[^"]+\/og\.png"/);
      }
      expect(has('og.png')).toBe(true);
      const sm = html('sitemap-0.xml');
      const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]);
      expect(urls.length).toBeGreaterThan(50);
      for (const u of urls) expect(noSlash(u), u).toBe(true);
      expect(urls).toContain(`${new URL(urls[0]).origin}/projects/flybody`);
    });

    it('404 page carries no hreflang alternates', () => {
      expect(html('404.html')).not.toContain('<link rel="alternate" hreflang=');
    });
  });

  describe('R-11 covers', () => {
    it('AC-11-9 generated covers are emitted as files', () => {
      const generated = projects.filter((p) => !p.thumbnail && !p.video && !p.image && !/github\.com/.test(p.repoUrl ?? ''));
      expect(generated.length).toBeGreaterThan(0);
      for (const p of generated) {
        expect(has(`covers/${p.id}.svg`), p.id).toBe(true);
        expect(html(`covers/${p.id}.svg`).startsWith('<svg')).toBe(true);
      }
      expect(html('projects/index.html')).not.toContain('<svg');
    });

    it('AC-11-7 every card on the list page has a cover', () => {
      const page = html('projects/index.html');
      const cards = (page.match(/<article class="card/g) ?? []).length;
      const covers = (page.match(/class="card__cover"/g) ?? []).length;
      expect(cards).toBe(projects.length);
      expect(covers).toBe(cards);
    });
  });

  describe('R-12 fly face', () => {
    it('AC-12-1 favicon is a fly face', () => {
      expect(has('favicon.svg')).toBe(true);
      const svg = html('favicon.svg');
      expect(svg).toMatch(/<title>[^<]*fly[^<]*<\/title>/i);
      expect((svg.match(/data-part="eye"/g) ?? []).length).toBe(2);
    });

    it('AC-12-3 home pages carry the fly hero', () => {
      expect(html('index.html')).toContain('data-hero="fly"');
      expect(html('ja/index.html')).toContain('data-hero="fly"');
    });
  });

  describe('R-03 hreflang', () => {
    it('AC-03-4b every EN page has a ja alternate and vice versa', () => {
      const esc = (s: string) => s.replace(/[/.]/g, '\\$&');
      const pages = walk(dist).filter((f) => f.endsWith('index.html'));
      for (const f of pages) {
        const rel = f.slice(dist.length + 1).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\/$/, '');
        const c = readFileSync(f, 'utf8');
        const isJa = rel === 'ja' || rel.startsWith('ja/');
        const bare = isJa ? rel.replace(/^ja\/?/, '') : rel;
        const enPath = bare ? `/${bare}` : '/';
        const jaPath = bare ? `/ja/${bare}` : '/ja';
        expect(c, f).toMatch(new RegExp(`hreflang="en" href="[^"]+${esc(enPath)}"`));
        expect(c, f).toMatch(new RegExp(`hreflang="ja" href="[^"]+${esc(jaPath)}"`));
        expect(c, f).toMatch(new RegExp(`<html lang="${isJa ? 'ja' : 'en'}"`));
      }
    });

    it('AC-03-4 EN and JA pages point at each other and x-default is EN', () => {
      const en = html('projects/flybody/index.html');
      const ja = html('ja/projects/flybody/index.html');
      expect(en).toMatch(/<link rel="alternate" hreflang="ja" href="[^"]+\/ja\/projects\/flybody"/);
      expect(en).toMatch(/<link rel="alternate" hreflang="x-default" href="[^"]+\/projects\/flybody"/);
      expect(en).not.toMatch(/hreflang="x-default" href="[^"]+\/ja\//);
      expect(ja).toMatch(/<link rel="alternate" hreflang="en" href="[^"]+\/projects\/flybody"/);
      expect(ja).toMatch(/<html lang="ja"/);
      expect(en).toMatch(/<html lang="en"/);
      const home = html('ja/index.html');
      expect(home).toMatch(/hreflang="en" href="[^"]+\/"/);
    });
  });

  describe('R-05 search index', () => {
    it('AC-05-1 search-index.json has every entry with exactly the documented keys', () => {
      const index = JSON.parse(html('search-index.json')) as Record<string, unknown>[];
      expect(index.map((i) => i.id).sort()).toEqual(projects.map((p) => p.id).sort());
      const keys = ['id', 'name', 'category', 'datasets', 'tags', 'description_en', 'description_ja', 'url', 'license', 'stars'];
      for (const item of index) {
        expect(Object.keys(item).sort()).toEqual([...keys].sort());
      }
    });
  });

  describe('R-06 SEO', () => {
    it('AC-06-2 detail pages carry JSON-LD and canonical', () => {
      const page = html('projects/flybody/index.html');
      expect(page).toContain('application/ld+json');
      expect(page).toContain('"@type":"SoftwareSourceCode"');
      expect(page).toMatch(/<link rel="canonical" href="[^"]+\/projects\/flybody"/);
      const ds = html('projects/malecns/index.html');
      expect(ds).toContain('"@type":"Dataset"');
    });

    it('canonical origin follows PUBLIC_SITE_URL when it is set', () => {
      const site = process.env.PUBLIC_SITE_URL;
      if (!site) return;
      const origin = site.replace(/\/$/, '');
      expect(html('index.html')).toContain(`<link rel="canonical" href="${origin}/"`);
      expect(html('robots.txt')).toContain(`${origin}/sitemap-index.xml`);
    });

    it('AC-06-3 sitemap, RSS (both locales), robots and 404 exist', () => {
      for (const rel of ['sitemap-index.xml', 'rss.xml', 'ja/rss.xml', 'robots.txt', '404.html']) {
        expect(has(rel), rel).toBe(true);
      }
      const rss = html('rss.xml');
      const rssJa = html('ja/rss.xml');
      for (const p of projects) {
        expect(rss).toContain(`/projects/${p.id}`);
        expect(rssJa).toContain(`/ja/projects/${p.id}`);
      }
      expect(html('robots.txt')).toContain('sitemap-index.xml');
    });
  });

  describe('R-07 ads', () => {
    it('AC-07-4 no ad markup when PUBLIC_ADSENSE_CLIENT is unset', () => {
      if (process.env.PUBLIC_ADSENSE_CLIENT) return; // built with ads on; skip
      const offenders = walk(dist)
        .filter((f) => /\.(html|js)$/.test(f))
        .filter((f) => readFileSync(f, 'utf8').includes('adsbygoogle'));
      expect(offenders).toEqual([]);
    });
  });

  describe('R-13 analytics', () => {
    it('AC-13-3 insights script and privacy wording follow PUBLIC_VERCEL_ANALYTICS', () => {
      const on = /^(1|true|yes|on)$/i.test(process.env.PUBLIC_VERCEL_ANALYTICS ?? '');
      const pages = walk(dist).filter((f) => f.endsWith('index.html'));
      for (const f of pages) {
        const c = readFileSync(f, 'utf8');
        expect(c.includes('/_vercel/insights/script.js'), f).toBe(on);
      }
      expect(html('404.html')).not.toContain('/_vercel/insights');
      const en = html('privacy/index.html');
      const ja = html('ja/privacy/index.html');
      if (on) {
        expect(en).toContain('Vercel Web Analytics');
        expect(ja).toContain('Vercel Web Analytics');
      } else {
        expect(en).toContain('does not currently use');
        expect(ja).toContain('使用していません');
      }
    });
  });

  describe('R-15 house ad', () => {
    it('AC-15-6 nothing is added when PUBLIC_AD_INQUIRY_URL is unset', () => {
      if (process.env.PUBLIC_AD_INQUIRY_URL) return; // built with the house ad on; skip
      const offenders = walk(dist)
        .filter((f) => /\.(html|js)$/.test(f))
        .filter((f) => readFileSync(f, 'utf8').includes('data-house-ad'));
      expect(offenders).toEqual([]);
      for (const rel of ['privacy/index.html', 'ja/privacy/index.html']) {
        expect(html(rel), rel).not.toContain('docs.google.com/forms');
      }
    });
  });

  describe('R-14 WebMCP', () => {
    it('AC-14-5 every built page registers the tools, the 404 page included', () => {
      const pages = walk(dist).filter((f) => f.endsWith('.html'));
      expect(pages.length).toBeGreaterThan(0);
      for (const f of pages) expect(readFileSync(f, 'utf8'), f).toContain('data-webmcp');
    });

    it('AC-14-7 privacy explains the agent tools in both locales', () => {
      for (const rel of ['privacy/index.html', 'ja/privacy/index.html']) {
        expect(html(rel), rel).toContain('WebMCP');
      }
    });
  });

  describe('R-08 legal pages', () => {
    it('AC-08-1 about/privacy/contact/submit exist in both locales', () => {
      for (const page of ['about', 'privacy', 'contact', 'submit']) {
        expect(has(`${page}/index.html`), page).toBe(true);
        expect(has(`ja/${page}/index.html`), `ja/${page}`).toBe(true);
      }
    });

    it('AC-08-2 privacy discloses AdSense, cookies and the opt-out URL', () => {
      for (const rel of ['privacy/index.html', 'ja/privacy/index.html']) {
        const page = html(rel);
        expect(page).toContain('AdSense');
        expect(page).toMatch(/Cookie/i);
        expect(page).toContain('google.com/settings/ads');
        expect(page).toMatch(rel.startsWith('ja') ? /X の投稿/ : /embedded posts from X/);
      }
    });

    it('AC-08-3 submit links to the prefilled issue template', () => {
      expect(html('submit/index.html')).toContain('issues/new?template=submit-project.yml');
      expect(html('ja/submit/index.html')).toContain('issues/new?template=submit-project.yml');
    });

    it('AC-08-4 every page footer links to the privacy policy', () => {
      const pages = walk(dist).filter((f) => f.endsWith('.html'));
      for (const f of pages) {
        const content = readFileSync(f, 'utf8');
        const footer = /<footer class="site-footer"[\s\S]*?<\/footer>/.exec(content)?.[0] ?? '';
        expect(footer, f).toMatch(/href="\/(ja\/)?privacy"/);
      }
    });
  });

  describe('R-18 explainer page', () => {
    const EXPLAINER = 'what-is-a-fly-brain';
    const body = (rel: string) => /<article[\s\S]*?<\/article>/.exec(html(rel))?.[0] ?? '';

    it('AC-18-2 both locales exist and point at each other', () => {
      for (const rel of [`${EXPLAINER}/index.html`, `ja/${EXPLAINER}/index.html`]) {
        expect(has(rel), rel).toBe(true);
      }
      expect(html(`${EXPLAINER}/index.html`)).toContain(`hreflang="ja" href="`);
      expect(html(`${EXPLAINER}/index.html`)).toContain(`/ja/${EXPLAINER}"`);
      expect(html(`ja/${EXPLAINER}/index.html`)).toContain(`hreflang="en" href="`);
    });

    it('AC-18-3 every project link in the body resolves to a real entry', () => {
      const ids = new Set(projects.map((p) => p.id));
      for (const rel of [`${EXPLAINER}/index.html`, `ja/${EXPLAINER}/index.html`]) {
        const links = [...body(rel).matchAll(/href="\/(?:ja\/)?projects\/([a-z0-9-]+)"/g)].map(
          (m) => m[1],
        );
        expect(links.length, `${rel} has no project links`).toBeGreaterThan(0);
        for (const id of links) expect(ids.has(id), `${rel} -> ${id}`).toBe(true);
      }
    });

    it('AC-18-4 header and footer link to it in both locales', () => {
      for (const [rel, href] of [
        ['index.html', `/${EXPLAINER}`],
        ['ja/index.html', `/ja/${EXPLAINER}`],
      ] as const) {
        const page = html(rel);
        const header = /<header class="site-header"[\s\S]*?<\/header>/.exec(page)?.[0] ?? '';
        const footer = /<footer class="site-footer"[\s\S]*?<\/footer>/.exec(page)?.[0] ?? '';
        expect(header, `header ${rel}`).toContain(`href="${href}"`);
        expect(footer, `footer ${rel}`).toContain(`href="${href}"`);
      }
    });

    it('AC-18-5 the body links to no external site', () => {
      for (const rel of [`${EXPLAINER}/index.html`, `ja/${EXPLAINER}/index.html`]) {
        expect(body(rel), rel).not.toMatch(/href="https?:/);
      }
    });

    it('AC-18-7 overview, diagram and comparison are rendered', () => {
      for (const rel of [
        `ja/${EXPLAINER}/index.html`,
        `${EXPLAINER}/index.html`,
      ] as const) {
        const article = body(rel);
        expect(article, `${rel} diagram`).toMatch(/<svg[\s\S]*?<\/svg>/);
        expect(article, `${rel} compare`).toContain('class="compare"');
        expect(article).toContain('data-guide-overview');
      }
    });
    it('AC-18-8 overview targets and all repository fields exist in both locales', () => {
      for (const prefix of ['', 'ja/']) {
        const article = body(`${prefix}${EXPLAINER}/index.html`);
        const targets = [...article.matchAll(/href="#(guide-[a-z-]+)"/g)].map(m => m[1]);
        expect(targets.length).toBe(4);
        for (const id of targets) expect(article).toContain(`id="${id}"`);
        expect([...article.matchAll(/<details\b/g)]).toHaveLength(7);
        for (const id of ['flywire-codex', 'neuprint-python', 'shiu-lif-model', 'flyvis', 'flybody', 'neuromechfly', 'fly-chess-lab']) {
          expect(article).toContain(`href="/${prefix}projects/${id}"`);
        }
        for (const field of ['features', 'io', 'needs', 'start', 'limits']) {
          expect([...article.matchAll(new RegExp(`data-guide-field="${field}"`, 'g'))]).toHaveLength(7);
        }
      }
    });
  });

  describe('R-19 footer project count', () => {
    const footerOf = (content: string) =>
      /<footer class="site-footer"[\s\S]*?<\/footer>/.exec(content)?.[0] ?? '';

    it('AC-19-1 every page footer shows the live project count', () => {
      const pages = walk(dist).filter((f) => f.endsWith('.html'));
      expect(pages.length).toBeGreaterThan(0);
      for (const f of pages) {
        const count = /data-project-count="(\d+)"/.exec(footerOf(readFileSync(f, 'utf8')))?.[1];
        expect(count, f).toBe(String(projects.length));
      }
    });

    it('AC-19-3 the footer count links to the projects list', () => {
      for (const [rel, href] of [
        ['index.html', '/projects'],
        ['ja/index.html', '/ja/projects'],
      ] as const) {
        const anchor = /<a[^>]*data-project-count="\d+"[^>]*>/.exec(footerOf(html(rel)))?.[0] ?? '';
        expect(anchor, rel).toContain(`href="${href}"`);
      }
    });
  });

  describe('R-20 home to list', () => {
    const homes = [
      ['index.html', ''],
      ['ja/index.html', '/ja'],
    ] as const;
    const sectionOf = (content: string, labelledBy: string) =>
      new RegExp(`<section class="[^"]*" aria-labelledby="${labelledBy}"[\\s\\S]*?</section>`).exec(content)?.[0] ?? '';
    const heroOf = (content: string) => /<section class="hero[^"]*"[\s\S]*?<\/section>/.exec(content)?.[0] ?? '';
    const countButtons = (content: string) =>
      [...content.matchAll(/<a class="btn[^"]*" href="([^"]+)"[^>]*data-project-count="(\d+)"[^>]*>/g)].map((m) => ({
        href: m[1],
        count: m[2],
      }));

    it('AC-20-1 the hero offers a button to the list carrying the live count', () => {
      for (const [rel, prefix] of homes) {
        const buttons = countButtons(heroOf(html(rel)));
        expect(buttons, rel).toHaveLength(1);
        expect(buttons[0].href, rel).toBe(`${prefix}/projects`);
        expect(buttons[0].count, rel).toBe(String(projects.length));
      }
    });

    it('AC-20-2 the three stats link to the list, the category grid and the datasets', () => {
      for (const [rel, prefix] of homes) {
        const stats = /<nav class="explore-stats"[\s\S]*?<\/nav>/.exec(html(rel))?.[0] ?? '';
        const hrefs = [...stats.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
        expect(hrefs, rel).toEqual([`${prefix}/projects`, '#h-categories', `${prefix}/datasets`]);
      }
    });

    it('AC-20-3 category, featured and latest sections each link to the list; latest ends with a count button', () => {
      for (const [rel, prefix] of homes) {
        const page = html(rel);
        for (const id of ['h-categories', 'h-featured', 'h-latest']) {
          const section = sectionOf(page, id);
          expect(section, `${rel} ${id}`).not.toBe('');
          expect(section, `${rel} ${id}`).toContain(`href="${prefix}/projects"`);
        }
        const latest = sectionOf(page, 'h-latest');
        const buttons = countButtons(latest);
        expect(buttons, rel).toHaveLength(1);
        expect(buttons[0].href, rel).toBe(`${prefix}/projects`);
        expect(buttons[0].count, rel).toBe(String(projects.length));
        // the button comes after the cards, so it is what a reader reaches at the end of the section
        expect(latest.lastIndexOf('<article'), rel).toBeLessThan(latest.lastIndexOf('data-project-count='));
      }
    });
  });
});
