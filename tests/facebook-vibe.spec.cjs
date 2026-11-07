const { test, expect } = require('@playwright/test');

test('Facebook vibe catalogue contains 24 authored templates with attributable sources', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#statPrompts')).toHaveText('156');
  await expect(page.locator('#statCategories')).toHaveText('12');
  await expect(page.locator('#vibeCount')).toHaveText('24');
  await expect(page.locator('#trendingCount')).toHaveText('120');
  await expect(page.locator('#vibeGrid .prompt-card')).toHaveCount(6);
  const info = await page.evaluate(() => {
    const items = window.PROMPT_SEED.filter(p => p.facebookVibe);
    return {
      unique: new Set(window.PROMPT_SEED.map(p => p.id)).size,
      items,
      categoryName: window.PROMPT_CATEGORIES.find(c => c.id === 'vibe')?.name,
    };
  });
  expect(info.unique).toBe(156);
  expect(info.categoryName).toBe('Vibe Coding');
  expect(info.items).toHaveLength(24);
  for (const p of info.items) {
    expect(p.id).toMatch(/^fbv-\d{3}$/);
    expect(p.trending).toBe(true);
    expect(p.category).toBe('vibe');
    expect(p.content.length).toBeGreaterThan(400);
    expect(p.sourceName.length).toBeGreaterThan(10);
    expect(p.sourceUrl).toMatch(/^https:\/\/(vibecodingislife\.com|vibeheatmap\.com|getvibekits\.com)\//);
    expect(p.sourcePlatform.length).toBeGreaterThan(15);
  }
  expect(info.items.some(p => p.sourcePlatform.includes('Facebook được lưu trữ'))).toBe(true);
  expect(info.items.some(p => p.sourcePlatform.includes('Reddit'))).toBe(true);
});

test('mobile category and Vibe Coding view filter correctly without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#sidebarToggle').click();
  await page.locator('#primaryNav [data-view="vibe"]').click();
  await expect(page.locator('#resultCount')).toHaveText('24 prompt');
  await expect(page.locator('#vibeSection')).toBeHidden();
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(24);
  await expect(page.locator('#loadMoreBtn')).toBeHidden();
  const width = await page.evaluate(() => ({
    view: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(width.scroll).toBeLessThanOrEqual(width.view + 1);
});

test('archived Facebook post is attributed honestly and linked safely', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#vibeGrid [data-open="fbv-001"]').click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('.prompt-source')).toContainText('Facebook được lưu trữ');
  await expect(page.locator('.prompt-source')).toContainText('biên soạn độc lập');
  const link = page.locator('.prompt-source a');
  await expect(link).toHaveAttribute('href', 'https://vibecodingislife.com/archive/why-does-code-work-on-my-computer-but-fail-on-another');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener noreferrer/);
});

test('Reddit expansion sources are not mislabeled as Facebook posts', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#vibeGrid [data-open="fbv-001"]').click();
  await page.locator('#detailDialog [data-close="detail"]').click();
  await page.locator('#sidebarToggle').click();
  await page.locator('#primaryNav [data-view="vibe"]').click();
  await page.locator('#promptGrid [data-open="fbv-016"]').click();
  await expect(page.locator('.prompt-source')).toContainText('Reddit');
  await expect(page.locator('.prompt-source a')).toHaveAttribute('href', 'https://vibeheatmap.com/week/2026-W44/');
});

test('mobile local favorite for Facebook vibe IDs persists across refresh', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#vibeGrid [data-save="fbv-001"]').click();
  await expect(page.locator('#statSaved')).toHaveText('1');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('prompthub_favorites_v1') || '[]'))).toContain('fbv-001');
  await page.reload();
  await expect(page.locator('#statSaved')).toHaveText('1');
});

test('search without Vietnamese diacritics finds Facebook-origin prompt', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#searchInput').fill('chan doan loi chay may');
  await expect(page.locator('#promptGrid [data-open="fbv-001"]')).toBeVisible();
});
