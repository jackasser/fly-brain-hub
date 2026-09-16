import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it } from 'vitest';
import GuidePatterns from '../../src/components/GuidePatterns.astro';
import { simulationPatterns, learningPatterns } from '../../src/data/guide-patterns';
import projects from '../../src/data/projects.json';

it('AC-18-12 architecture and learning examples map to verified listed sources', () => {
  expect(simulationPatterns.map(p => p.id)).toEqual(['game', 'brain', 'body', 'coupled', 'robot']);
  expect(learningPatterns.map(p => p.id)).toEqual(['fixed', 'readout', 'controller']);
  for (const pattern of [...simulationPatterns, ...learningPatterns]) {
    const project = projects.find(p => p.id === pattern.project)!;
    expect(project).toBeDefined();
    expect(pattern.sources.length).toBeGreaterThan(0);
    for (const source of pattern.sources) expect(project.sourceRefs).toContain(source);
    for (const locale of ['ja', 'en'] as const) {
      expect(pattern[locale].flow).toHaveLength(3);
      expect(pattern[locale].note.length).toBeGreaterThan(15);
    }
  }
});

it('AC-18-12 both locales render visible comparisons, feedback and training labels', async () => {
  const container = await AstroContainer.create();
  for (const locale of ['ja', 'en'] as const) {
    const html = await container.renderToString(GuidePatterns, { props: { locale } });
    expect([...html.matchAll(/data-simulation-pattern=/g)]).toHaveLength(5);
    expect([...html.matchAll(/data-learning-pattern=/g)]).toHaveLength(3);
    expect(html).toContain('data-feedback');
    expect(html).toContain('data-counting-note');
    expect(html).toContain(locale === 'ja' ? '訓練する部分' : 'What is trained');
    for (const pattern of [...simulationPatterns, ...learningPatterns]) {
      expect(html).toContain(`href="${locale === 'ja' ? '/ja' : ''}/projects/${pattern.project}"`);
    }
    expect(html).not.toContain('<details');
  }
});
