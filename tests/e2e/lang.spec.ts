import { expect, test } from '@playwright/test';

test('AC-03-5 language toggle round-trips on a detail page', async ({ page }) => {
  await page.goto('/projects/flybody');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.locator('a.lang-toggle').click();
  await expect(page).toHaveURL(/\/ja\/projects\/flybody$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  await page.locator('a.lang-toggle').click();
  await expect(page).toHaveURL(/\/projects\/flybody$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('home toggle goes to /ja/ and back', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.lang-toggle').click();
  await expect(page).toHaveURL(/\/ja\/$/);
  await page.locator('a.lang-toggle').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/ja/);
});
