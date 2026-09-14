import { test, expect } from '@playwright/test';

for (const prefix of ['', '/ja']) {
  test(`AC-17-1 home search ${prefix || 'en'}`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    await page.locator('.home-search input').fill('doom');
    await page.locator('.home-search button').click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/projects\\?q=doom`));
    await expect(page.locator('[data-status]')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('#search-q')).toHaveValue('doom');
    expect(await page.locator('.card:visible').count()).toBeGreaterThan(0);
    expect(await page.locator('.card[hidden]').count()).toBeGreaterThan(0);
  });

  test(`AC-17-1 no JS ${prefix || 'en'}`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4321${prefix}/`);
    await page.locator('.home-search input').fill('doom');
    await page.locator('.home-search button').click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/projects\\?q=doom`));
    expect(await page.locator('.card:visible').count()).toBeGreaterThan(0);
    await context.close();
  });

  test(`AC-17-2 skip to content ${prefix || 'en'}`, async ({ page }) => {
    await page.goto(`${prefix}/`);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await expect(page.locator('.skip-link')).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test(`AC-17-3 labels and empty recovery ${prefix || 'en'}`, async ({ page }) => {
    await page.goto(`${prefix}/projects`);
    await expect(page.locator('[data-status]')).toHaveAttribute('data-state', 'ready');
    const total = await page.locator('.card').count();
    for (const id of ['q', 'category', 'dataset', 'tag', 'sort']) {
      const label = page.locator(`label[for="search-${id}"]`);
      await expect(label).toBeVisible();
      expect(await label.evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThan(10);
    }
    await page.locator('#search-q').fill('zzzzzzzzzzzzzzzzzzzzz');
    await expect(page.locator('.card:visible')).toHaveCount(0);
    await page.locator('[data-clear]').click();
    await expect(page.locator('.card:visible')).toHaveCount(total);
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`AC-18-6 explainer layout ${prefix || 'en'} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/what-is-a-fly-brain`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator('main').evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
    });

    test(`AC-17-4 layout ${prefix || 'en'} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/', '/projects', '/projects/flybody', '/datasets']) {
        await page.goto(`${prefix}${path}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('main').evaluate(el => el.getBoundingClientRect().right <= innerWidth)).toBe(true);
      }
    });
  }
}
