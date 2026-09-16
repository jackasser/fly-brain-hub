import { describe, expect, it } from 'vitest';
import { guideGroups, guideProjects, guideJourneys } from '../../src/data/explainer';
import projects from '../../src/data/projects.json';

describe('R-18 repository guide', () => {
  it('AC-18-11 each purpose provides a concrete three-step starting route', () => {
    expect(Object.keys(guideJourneys).sort()).toEqual(guideGroups.map(g => g.id).sort());
    for (const group of guideGroups) {
      const journey = guideJourneys[group.id];
      expect(guideProjects.some(p => p.id === journey.project && p.group === group.id)).toBe(true);
      for (const locale of ['ja', 'en'] as const) {
        const text = journey[locale];
        expect(text.flow).toHaveLength(3);
        expect(text.steps).toHaveLength(3);
        expect(text.preparation.length).toBeGreaterThan(10);
        expect(text.outcome.length).toBeGreaterThan(10);
        for (const step of text.steps) {
          expect(step.action.length).toBeGreaterThan(3);
          expect(step.result.length).toBeGreaterThan(5);
        }
      }
    }
  });
  it('AC-18-8 covers the representative repositories with sourced bilingual instructions', () => {
    expect(guideProjects.map(p => p.id).sort()).toEqual([
      'flywire-codex', 'neuprint-python', 'shiu-lif-model', 'flyvis',
      'flybody', 'neuromechfly', 'fly-chess-lab',
    ].sort());
    for (const guide of guideProjects) {
      const project = projects.find(p => p.id === guide.id)!;
      expect(project).toBeDefined();
      expect(guideGroups.some(g => g.id === guide.group)).toBe(true);
      expect(guide.checkedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(guide.sources.length).toBeGreaterThan(0);
      for (const url of guide.sources) expect(project.sourceRefs).toContain(url);
      for (const locale of ['ja', 'en'] as const) {
        for (const key of ['summary', 'features', 'io', 'needs', 'start', 'limits'] as const) {
          expect(guide[locale][key].length, `${guide.id}.${locale}.${key}`).toBeGreaterThan(10);
        }
      }
    }
    for (const group of guideGroups) expect(guideProjects.some(p => p.group === group.id)).toBe(true);
  });
});
