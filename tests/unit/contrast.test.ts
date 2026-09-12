import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// AC-10-3: text tokens must reach WCAG AA (4.5:1) on the surfaces they are used on, in both themes.
const css = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');

function block(name: 'light' | 'dark'): Record<string, string> {
  const src = name === 'light' ? css.split('@media')[0] : css.slice(css.indexOf('@media'));
  const out: Record<string, string> = {};
  for (const m of src.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]] ??= m[2].toLowerCase();
  return out;
}

function lum(hex: string): number {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const ratio = (a: string, b: string) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

describe('R-10 contrast', () => {
  for (const theme of ['light', 'dark'] as const) {
    const t = block(theme);
    for (const fg of ['fg', 'fg-muted', 'fg-faint']) {
      for (const bg of ['bg', 'bg-elev', 'bg-sunk']) {
        it(`AC-10-3 ${theme}: --${fg} on --${bg} >= 4.5`, () => {
          expect(t[fg], fg).toBeTruthy();
          expect(t[bg], bg).toBeTruthy();
          expect(ratio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
        });
      }
    }
  }
});
