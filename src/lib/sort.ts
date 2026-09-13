/**
 * R-16: how the project list can be reordered on the client.
 *
 * Pure over plain rows so it is testable without a DOM; the search island reads the keys
 * off each card's `data-stars` / `data-added` attributes and feeds them in here.
 */
export const SORT_MODES = ['featured', 'stars', 'newest'] as const;
export type SortMode = (typeof SORT_MODES)[number];

export const DEFAULT_SORT: SortMode = 'featured';

export function isSortMode(value: string): value is SortMode {
  return (SORT_MODES as readonly string[]).includes(value);
}

export interface SortRow {
  id: string;
  /** Undefined for entries with no GitHub repo: they rank below a genuine zero. */
  stars: number | undefined;
  /** YYYY-MM-DD, the date the entry was added to this site. */
  addedAt: string;
}

/**
 * Returns a new array. `featured` is the order the server already rendered, so it is
 * returned untouched; the other modes sort stably, which keeps ties in that same order.
 */
export function sortRows<T extends SortRow>(rows: T[], mode: SortMode): T[] {
  if (mode === 'featured') return [...rows];
  const decorated = rows.map((row, index) => ({ row, index }));
  decorated.sort((a, b) => {
    const diff =
      mode === 'stars'
        ? starRank(b.row.stars) - starRank(a.row.stars)
        : a.row.addedAt === b.row.addedAt
          ? 0
          : a.row.addedAt < b.row.addedAt
            ? 1
            : -1;
    return diff !== 0 ? diff : a.index - b.index;
  });
  return decorated.map((d) => d.row);
}

/** An unknown star count sorts below every known one, including 0. */
function starRank(stars: number | undefined): number {
  return stars === undefined ? -1 : stars;
}
