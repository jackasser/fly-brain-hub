import { test, expect } from '@playwright/test';

test.use({ javaScriptEnabled: false });
for (const prefix of ['', '/ja']) {
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
