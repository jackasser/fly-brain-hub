import { expect, test, type Page } from '@playwright/test';

const visibleCards = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#project-grid [data-id]')]
      .filter((c) => !c.hidden)
      .map((c) => ({
        id: c.dataset.id!,
        stars: c.dataset.stars ? Number(c.dataset.stars) : null,
        added: c.dataset.added!,
      })),
  );

// The sort select only becomes usable once the search island has loaded the index.
const ready = (page: Page) =>
  page.waitForFunction(() => !document.querySelector<HTMLSelectElement>('select[name="sort"]')?.disabled);

test('AC-16-5 ?sort=stars puts the most-starred project first', async ({ page }) => {
  await page.goto('/projects?sort=stars');
  await ready(page);

  await expect(page.locator('select[name="sort"]')).toHaveValue('stars');

  const cards = await visibleCards(page);
  expect(cards.length).toBeGreaterThan(10);

  const starred = cards.filter((c) => c.stars !== null).map((c) => c.stars!);
  expect(starred.length).toBeGreaterThan(1);
  expect(starred[0]).toBe(Math.max(...starred));
  expect([...starred].sort((a, b) => b - a)).toEqual(starred);

  // Entries with no star count at all sit after every entry that has one.
  const firstUnstarred = cards.findIndex((c) => c.stars === null);
  if (firstUnstarred !== -1) {
    expect(cards.slice(firstUnstarred).every((c) => c.stars === null)).toBe(true);
  }
});

test('AC-16-5 newest orders by the date the entry was added', async ({ page }) => {
  await page.goto('/projects?sort=newest');
  await ready(page);

  const added = (await visibleCards(page)).map((c) => c.added);
  expect(added.length).toBeGreaterThan(10);
  expect([...added].sort().reverse()).toEqual(added);
});

test('AC-16-6 choosing a mode writes ?sort=, and returning to the default clears it', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);
  expect(new URL(page.url()).searchParams.get('sort')).toBeNull();

  await page.selectOption('select[name="sort"]', 'stars');
  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('stars');

  await page.selectOption('select[name="sort"]', 'featured');
  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBeNull();
});

test('AC-16-7 sorting never moves a non-card child of the grid (the ad slots)', async ({ page }) => {
  await page.goto('/projects');
  await ready(page);

  // Stand in for an in-feed ad unit: the real one is only rendered when ads are configured.
  const indexBefore = await page.evaluate(() => {
    const grid = document.getElementById('project-grid')!;
    const marker = document.createElement('div');
    marker.id = 'ad-marker';
    grid.insertBefore(marker, grid.children[6]);
    return [...grid.children].indexOf(marker);
  });
  expect(indexBefore).toBe(6);

  await page.selectOption('select[name="sort"]', 'stars');
  await expect.poll(() => new URL(page.url()).searchParams.get('sort')).toBe('stars');

  const indexAfter = await page.evaluate(() => {
    const grid = document.getElementById('project-grid')!;
    return [...grid.children].indexOf(document.getElementById('ad-marker')!);
  });
  expect(indexAfter).toBe(indexBefore);
});

test('AC-16-8 sorting applies within a filtered result', async ({ page }) => {
  await page.goto('/projects?category=demo&sort=newest');
  await ready(page);

  const cards = await visibleCards(page);
  expect(cards.length).toBeGreaterThan(2);

  const categories = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('#project-grid [data-id]')]
      .filter((c) => !c.hidden)
      .map((c) => c.dataset.category),
  );
  expect(new Set(categories)).toEqual(new Set(['demo']));

  const added = cards.map((c) => c.added);
  expect([...added].sort().reverse()).toEqual(added);
});
