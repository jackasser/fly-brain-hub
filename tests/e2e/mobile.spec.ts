import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

for (const path of ['/', '/projects', '/projects/flybody', '/datasets', '/ja/', '/ja/projects/malecns']) {
  test(`AC-10-1 no horizontal scroll at 390px: ${path}`, async ({ page }) => {
    await page.goto(path);
    const overflow = await page.evaluate(() => {
      const el = document.scrollingElement!;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test('cards stack in one column at 390px', async ({ page }) => {
  await page.goto('/projects');
  const boxes = await page.locator('#project-grid article.card').evaluateAll((els) =>
    els.slice(0, 2).map((e) => e.getBoundingClientRect()),
  );
  expect(boxes.length).toBe(2);
  expect(Math.abs(boxes[0].x - boxes[1].x)).toBeLessThan(1);
  expect(boxes[1].y).toBeGreaterThan(boxes[0].y + boxes[0].height - 1);
});

test('AC-10-2 dark and light schemes paint different backgrounds', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const light = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(light).not.toBe(dark);
});
