import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });
for (const prefix of ['', '/ja']) {
  for (const width of [639, 640, 700, 760, 768]) {
    test(`AC-18-13 anchor headings clear the header (${prefix || 'en'} ${width})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${prefix}/what-is-a-fly-brain`);
      for (const id of ['simulation-patterns', 'learning-patterns']) {
        await page.locator(`a[href="#${id}"]`).click();
        await expect(page).toHaveURL(new RegExp(`#${id}$`));
        const headerBottom = await page.locator('.site-header').evaluate(el => Math.max(0, el.getBoundingClientRect().bottom));
        for (const selector of ['.eyebrow', 'h2']) {
          const top = await page.locator(`#${id} ${selector}`).first().evaluate(el => el.getBoundingClientRect().top);
          expect(top, `${id} ${selector} at ${width}px`).toBeGreaterThanOrEqual(headerBottom);
        }
      }
    });
  }
  test(`AC-18-12 architecture and training can be reached without JavaScript (${prefix || 'en'})`, async ({ page }) => {
    await page.goto(`${prefix}/what-is-a-fly-brain`);
    await page.locator('a[href="#simulation-patterns"]').click();
    await expect(page).toHaveURL(/#simulation-patterns$/);
    await expect(page.locator('[data-simulation-pattern]')).toHaveCount(5);
    await expect(page.locator('[data-feedback]')).toBeVisible();
    await page.locator('a[href="#learning-patterns"]').click();
    await expect(page).toHaveURL(/#learning-patterns$/);
    await expect(page.locator('[data-learning-pattern]')).toHaveCount(3);
    await expect(page.locator('[data-learning-pattern="readout"] .trained')).toBeVisible();
    await page.locator('[data-learning-pattern="readout"] a').click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/projects/fly-dino/?$`));
  });
  test(`AC-18-11 visual routes expose starting steps without JavaScript (${prefix || 'en'})`, async ({ page }) => {
    for (const kind of ['explore', 'simulate', 'body', 'play']) {
      await page.goto(`${prefix}/what-is-a-fly-brain`);
      await page.locator(`[data-guide-overview] a[href="#guide-${kind}"]`).click();
      const route = page.locator(`#guide-${kind} [data-guide-journey]`);
      await expect(route.locator('svg[role="img"]')).toBeVisible();
      await expect(route.locator('ol > li')).toHaveCount(3);
      for (const step of await route.locator('ol > li').all()) await expect(step).toBeVisible();
      await expect(route.locator('details')).toHaveCount(0);
      const start = route.locator('[data-guide-start]');
      const href = await start.getAttribute('href');
      expect(href).toMatch(new RegExp(`^${prefix}/projects/`));
      await start.click();
      await expect(page).toHaveURL(new RegExp(`${href}/?$`));
    }
  });
  test(`AC-18-9 guide works without JavaScript (${prefix || 'en'})`, async ({ page }) => {
    await page.goto(`${prefix}/what-is-a-fly-brain`);
    await page.locator('[data-guide-overview] a').first().click();
    await expect(page).toHaveURL(/#guide-explore$/);
    const detail = page.locator('details').first();
    await expect(detail).not.toHaveAttribute('open', '');
    await detail.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(detail).toHaveAttribute('open', '');
    await expect(detail.locator('[data-guide-field="start"]')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(detail).not.toHaveAttribute('open', '');
    await page.locator(`[data-guide-project="flywire-codex"] a`).click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/projects/flywire-codex/?$`));
  });
}
