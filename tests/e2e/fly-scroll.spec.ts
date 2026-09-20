import { test, expect } from '@playwright/test';
for (const locale of ['', '/ja']) {
  test(`AC-21-2 scroll reverses the rendered pose ${locale}`, async ({ page }) => {
    await page.goto(`${locale}/`);
    const stage = page.locator('[data-fly-stage]');
    await expect(stage).toHaveAttribute('data-ready', '');
    const before = await stage.locator('canvas').screenshot();
    await page.evaluate(() => window.scrollTo(0, 260));
    await expect.poll(() => stage.getAttribute('data-pose')).not.toBe('0.0000');
    expect((await stage.locator('canvas').screenshot()).equals(before)).toBe(false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(stage).toHaveAttribute('data-pose', '0.0000');
    expect((await stage.locator('canvas').screenshot()).equals(before)).toBe(true);
  });
}
test('AC-21-3 reduced motion remains static, including live preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const stage = page.locator('[data-fly-stage]');
  await expect(stage).toHaveAttribute('data-ready', '');
  await page.evaluate(() => window.scrollTo(0, 240));
  await expect(stage).toHaveAttribute('data-pose', '0.0000');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect.poll(() => stage.getAttribute('data-pose')).not.toBe('0.0000');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(stage).toHaveAttribute('data-pose', '0.0000');
});
for (const mode of ['no-js', 'no-webgl']) {
  test(`AC-21-3 fallback and search with ${mode}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: mode !== 'no-js' });
    if (mode === 'no-webgl') await context.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    });
    const page = await context.newPage();
    await page.goto(`${baseURL}/ja/`);
    await expect(page.locator('[data-hero="fly"]')).toBeVisible();
    await page.locator('#home-q').fill('doom');
    await page.locator('.home-search button').click();
    await expect(page).toHaveURL(/\/ja\/projects\?q=doom/);
    await context.close();
  });
}
test('AC-21-4 mobile canvas fits the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/ja/');
  await expect(page.locator('[data-fly-stage]')).toHaveAttribute('data-ready', '');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375);
});

test('AC-21-5 mobile fly turns during the first visible scroll, before the hero reaches the top', async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 830 });
  await page.goto('/ja/');
  const stage = page.locator('[data-fly-stage]');
  await expect(stage).toHaveAttribute('data-ready', '');
  await expect(stage).toHaveAttribute('data-pose', '0.0000');
  await page.evaluate(() => window.scrollTo(0, 120));
  expect(await page.locator('.hero').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(0);
  await expect.poll(async () => Number(await stage.getAttribute('data-pose'))).toBeGreaterThan(0.25);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(stage).toHaveAttribute('data-pose', '0.0000');
});
