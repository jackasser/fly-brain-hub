import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import FlyScroll from '../../src/components/FlyScroll.astro';
it('AC-21-1 localized 3D stage retains the SVG fallback and schematic note', async () => {
  const container = await AstroContainer.create();
  for (const locale of ['en', 'ja']) {
    const html = await container.renderToString(FlyScroll, { props: { locale } });
    expect(html).toContain('data-fly-stage');
    expect(html).toContain('data-hero="fly"');
    expect(html).toContain(locale === 'ja' ? '模式モデル' : 'Schematic model');
    expect(html).toContain('aria-hidden="true"');
  }
});
