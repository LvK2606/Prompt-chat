const { test, expect } = require('@playwright/test');

test('100 prompts across all 9 categories, including 64 sourced trends', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#statPrompts')).toHaveText('100');
  await expect(page.locator('#trendingCount')).toHaveText('64');
  await expect(page.locator('#statCategories')).toHaveText('9');
  await expect(page.locator('#trendingGrid .prompt-card')).toHaveCount(6);
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(24);
  await expect(page.locator('#loadMoreBtn')).toBeVisible();
  const data = await page.evaluate(() => ({
    total: window.PROMPT_SEED.length,
    ids: new Set(window.PROMPT_SEED.map(p => p.id)).size,
    trends: window.PROMPT_SEED.filter(p => p.trending),
  }));
  expect(data.total).toBe(100);
  expect(data.ids).toBe(100);
  expect(data.trends).toHaveLength(64);
  expect(new Set(data.trends.map(p => p.category)).size).toBe(9);
  for (const p of data.trends) {
    expect(p.id).toMatch(/^hot-\d{3}$/);
    expect(p.sourceUrl).toMatch(/^https:\/\/(www\.reddit\.com|github\.com)\//);
    expect(p.sourceName.length).toBeGreaterThan(6);
    expect(p.content.length).toBeGreaterThan(180);
  }
});

test('trending navigation loads in batches without document overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#sidebarToggle').click();
  await page.locator('#primaryNav [data-view="trending"]').click();
  await expect(page.locator('#resultCount')).toHaveText('64 prompt');
  await expect(page.locator('#trendingSection')).toBeHidden();
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(24);
  await page.locator('#loadMoreBtn').click();
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(48);
  const widths = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
});

test('trend source is attributed and its link is safe', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#trendingGrid [data-open]').first().click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('.prompt-source')).toContainText('Chủ đề tham khảo');
  const source = page.locator('.prompt-source a');
  await expect(source).toHaveAttribute('target', '_blank');
  await expect(source).toHaveAttribute('rel', /noopener noreferrer/);
  await expect(source).toHaveAttribute('href', /^https:\/\/www\.reddit\.com\//);
});

test('Vietnamese search finds templates without diacritics', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#searchInput').fill('thiet ke gameplay');
  await expect(page.locator('#resultCount')).toHaveText('1 prompt');
  await expect(page.locator('#promptGrid .prompt-card h4').first()).toContainText('Thiết kế gameplay');
});

test('local favorites persist for hot prompt IDs', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#trendingGrid [data-save="hot-001"]').click();
  await expect(page.locator('#statSaved')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('prompthub_favorites_v1') || '[]'))).toContain('hot-001');
  await page.reload();
  await expect(page.locator('#statSaved')).toHaveText('1');
});
