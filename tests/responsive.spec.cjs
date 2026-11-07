const { test, expect } = require('@playwright/test');

const sizes = [
  { width: 320, height: 720 },
  { width: 360, height: 780 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 480, height: 900 },
  { width: 600, height: 900 },
  { width: 720, height: 900 },
  { width: 768, height: 1024 },
  { width: 900, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
];

for (const viewport of sizes) {
  test(`layout has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#accountBtn')).toBeVisible();

    const result = await page.evaluate(() => {
      const rect = id => {
        const element = document.getElementById(id);
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width, height: box.height };
      };
      return {
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        topbar: rect('appShell'),
        account: rect('accountBtn'),
        theme: rect('themeToggle'),
        header: document.querySelector('.topbar').getBoundingClientRect().height,
        hero: document.querySelector('.hero').getBoundingClientRect().height,
      };
    });
    expect(result.document, JSON.stringify(result)).toBeLessThanOrEqual(result.viewport + 1);
    expect(result.body, JSON.stringify(result)).toBeLessThanOrEqual(result.viewport + 1);
    expect(result.account.left).toBeGreaterThanOrEqual(-1);
    expect(result.account.right).toBeLessThanOrEqual(result.viewport + 1);
    expect(result.theme.right).toBeLessThanOrEqual(result.viewport + 1);
    if (viewport.width <= 720) {
      await expect(page.locator('#topCreate')).toBeHidden();
      expect(result.header).toBeLessThanOrEqual(70);
      expect(result.hero).toBeLessThanOrEqual(435);
    }
    if (viewport.width === 390) {
      await page.screenshot({ path: 'test-results/mobile-390-fold.png' });
      await page.locator('#explore').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'test-results/mobile-390-search.png' });
      await page.locator('#searchInput').fill('lap trinh');
      await expect(page.locator('#resultCount')).not.toHaveText('0 prompt');
    }
  });
}

test('mobile detail dialog stays within viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://127.0.0.1:4173/');
  await expect(page.locator('#promptGrid [data-open]').first()).toBeVisible();
  await page.locator('#promptGrid [data-open]').first().click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  const box = await page.locator('#detailDialog').boundingBox();
  expect(box.width).toBeLessThanOrEqual(360);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(361);
});
