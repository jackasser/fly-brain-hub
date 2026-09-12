import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/lib/schema';

const valid = {
  id: 'flybody',
  name: 'flybody',
  url: 'https://github.com/TuragaLab/flybody',
  repoUrl: 'https://github.com/TuragaLab/flybody',
  category: 'body',
  datasets: [],
  org: 'Google DeepMind / HHMI Janelia',
  region: 'US',
  license: 'Apache-2.0',
  language: 'Python',
  date: '2024',
  addedAt: '2026-09-12',
  description_en:
    'A MuJoCo whole-body model of an adult fruit fly with articulated legs, wings and reinforcement learning tasks.',
  description_ja: 'MuJoCo 上で動くショウジョウバエ成虫の全身モデル。脚・翅の関節と強化学習タスクを備える。',
  sourceRefs: ['https://github.com/TuragaLab/flybody'],
};

describe('R-01 project schema', () => {
  it('AC-01-1 accepts a valid entry and fills defaults', () => {
    const parsed = projectSchema.parse(valid);
    expect(parsed.tags).toEqual([]);
    expect(parsed.status).toBe('active');
    expect(parsed.featured).toBe(false);
  });

  it('AC-01-2 rejects a short English description', () => {
    expect(() => projectSchema.parse({ ...valid, description_en: 'too short' })).toThrow();
  });

  it('AC-01-3 rejects unknown keys', () => {
    expect(() => projectSchema.parse({ ...valid, stras: 5 })).toThrow();
  });

  it('AC-01-4 rejects unknown dataset ids', () => {
    expect(() => projectSchema.parse({ ...valid, datasets: ['not-a-dataset'] })).toThrow();
    expect(projectSchema.parse({ ...valid, datasets: ['malecns'] }).datasets).toEqual(['malecns']);
  });

  it('region is optional and never a placeholder', () => {
    const { region: _drop, ...noRegion } = valid;
    expect(projectSchema.parse(noRegion).region).toBeUndefined();
  });

  it('AC-01-5 rejects empty sourceRefs', () => {
    expect(() => projectSchema.parse({ ...valid, sourceRefs: [] })).toThrow();
  });

  it('rejects malformed dates and ids', () => {
    expect(() => projectSchema.parse({ ...valid, date: '2024/09' })).toThrow();
    expect(() => projectSchema.parse({ ...valid, addedAt: '2026-9-1' })).toThrow();
    expect(() => projectSchema.parse({ ...valid, id: 'Fly Body' })).toThrow();
  });
});
