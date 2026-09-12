import { expect, test } from '@playwright/test';

const visibleCards = (page: import('@playwright/test').Page) =>
  page.locator('#project-grid article.card:visible');

test('AC-05-2 ?q= restores the query and filters', async ({ page }) => {
  await page.goto('/projects?q=doom');
  await expect(page.locator('#search-q')).toHaveValue('doom');
  await expect(page.locator('[data-status]')).not.toHaveText('');
  const shown = await visibleCards(page).count();
  const total = await page.locator('#project-grid article.card').count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(total);
  await expect(visibleCards(page).first()).toContainText(/doom/i);
});

test('AC-05-3 category facet updates the URL and reduces the count', async ({ page }) => {
  await page.goto('/projects');
  await expect(page.locator('[data-status]')).not.toHaveText('');
  const total = await visibleCards(page).count();
  await page.locator('#search-category').selectOption('connectome');
  await expect(page).toHaveURL(/category=connectome/);
  const shown = await visibleCards(page).count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(total);
  for (const card of await visibleCards(page).all()) {
    await expect(card).toHaveAttribute('data-category', 'connectome');
  }
});

test('AC-05-4 clearing returns to the full list', async ({ page }) => {
  await page.goto('/projects?q=doom&category=demo');
  await expect(page.locator('#search-q')).toHaveValue('doom');
  const total = await page.locator('#project-grid article.card').count();
  await page.locator('[data-clear]').click();
  await expect(page).not.toHaveURL(/[?&]q=/);
  await expect(page.locator('#search-q')).toHaveValue('');
  expect(await visibleCards(page).count()).toBe(total);
});

test('ja search page uses the Japanese description for matching', async ({ page }) => {
  await page.goto('/ja/projects?q=強化学習');
  await expect(visibleCards(page).first()).toContainText('flybody');
});
