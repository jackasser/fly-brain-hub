import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import GuideVisual from '../../src/components/GuideVisual.astro';

it('AC-18-10 all four purpose illustrations have localized accessible names', async () => {
  const container = await AstroContainer.create();
  const drawings = new Set<string>();
  for (const kind of ['explore', 'simulate', 'body', 'play']) {
    const names = [];
    for (const locale of ['ja', 'en']) {
      const html = await container.renderToString(GuideVisual, { props: { kind, locale } });
      expect(html).toContain('role="img"');
      const name = /aria-label="([^"]+)"/.exec(html)?.[1];
      expect(name?.length).toBeGreaterThan(10);
      names.push(name);
      expect(html).toContain(`data-guide-visual="${kind}"`);
      expect(html).not.toMatch(/<image\b|https?:/);
      if (locale === 'en') drawings.add(html.replace(/aria-label="[^"]+"|data-guide-visual="[^"]+"/g, ''));
    }
    expect(names[0]).not.toBe(names[1]);
  }
  expect(drawings.size).toBe(4);
});
