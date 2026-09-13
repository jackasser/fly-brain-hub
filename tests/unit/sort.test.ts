import { describe, expect, it } from 'vitest';
import { isSortMode, SORT_MODES, sortRows, type SortRow } from '../../src/lib/sort';

/** Input order stands in for the SSR order, which is what ties must fall back to. */
const rows: SortRow[] = [
  { id: 'a', stars: 10, addedAt: '2026-09-01' },
  { id: 'b', stars: undefined, addedAt: '2026-09-13' },
  { id: 'c', stars: 500, addedAt: '2026-09-05' },
  { id: 'd', stars: 10, addedAt: '2026-09-13' },
  { id: 'e', stars: 0, addedAt: '2026-08-01' },
];

const ids = (r: SortRow[]) => r.map((x) => x.id);

describe('R-16 sort modes', () => {
  it('AC-16-1 offers exactly the three declared modes, in order', () => {
    expect(SORT_MODES).toEqual(['featured', 'stars', 'newest']);
  });

  it('AC-16-1 rejects anything that is not a mode', () => {
    expect(isSortMode('stars')).toBe(true);
    expect(isSortMode('newest')).toBe(true);
    expect(isSortMode('featured')).toBe(true);
    expect(isSortMode('')).toBe(false);
    expect(isSortMode('popular')).toBe(false);
    expect(isSortMode('STARS')).toBe(false);
  });
});

describe('R-16 sortRows', () => {
  it('AC-16-2 featured leaves the server order untouched', () => {
    expect(ids(sortRows(rows, 'featured'))).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('AC-16-2 stars sorts descending and keeps unstarred entries last', () => {
    // b has no star count at all: it goes after e, which genuinely has zero.
    expect(ids(sortRows(rows, 'stars'))).toEqual(['c', 'a', 'd', 'e', 'b']);
  });

  it('AC-16-2 a tie on stars falls back to the server order', () => {
    const out = sortRows(rows, 'stars');
    expect(out.findIndex((r) => r.id === 'a')).toBeLessThan(out.findIndex((r) => r.id === 'd'));
  });

  it('AC-16-2 newest sorts by the date the entry was added', () => {
    expect(ids(sortRows(rows, 'newest'))).toEqual(['b', 'd', 'c', 'a', 'e']);
  });

  it('AC-16-2 a tie on addedAt falls back to the server order', () => {
    const out = sortRows(rows, 'newest');
    expect(out.findIndex((r) => r.id === 'b')).toBeLessThan(out.findIndex((r) => r.id === 'd'));
  });

  it('AC-16-2 does not mutate the input', () => {
    const before = ids(rows);
    sortRows(rows, 'stars');
    sortRows(rows, 'newest');
    expect(ids(rows)).toEqual(before);
  });

  it('AC-16-2 handles an empty list', () => {
    expect(sortRows([], 'stars')).toEqual([]);
  });
});
