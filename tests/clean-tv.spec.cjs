const { test, expect } = require('@playwright/test');

test('Clean TV collection adds 16 sourced prompts without replacing original 124', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#statPrompts')).toHaveText('140');
  await expect(page.locator('#statCategories')).toHaveText('11');
  await expect(page.locator('#cleanTvCount')).toHaveText('16');
  await expect(page.locator('#trendingCount')).toHaveText('104');
  await expect(page.locator('#cleanTvGrid .prompt-card')).toHaveCount(6);
  const dataset=await page.evaluate(()=>({
    prompts:window.PROMPT_SEED,
    categories:window.PROMPT_CATEGORIES,
  }));
  const ctv=dataset.prompts.filter(p=>p.cleanTv);
  expect(dataset.prompts).toHaveLength(140);
  expect(new Set(dataset.prompts.map(p=>p.id)).size).toBe(140);
  expect(dataset.categories).toHaveLength(11);
  expect(ctv).toHaveLength(16);
  expect(ctv.every(p=>p.category==='smarttv' && p.trending && !p.facebookVibe)).toBe(true);
  for(const p of ctv){
    expect(p.id).toMatch(/^ctv-\d{3}$/);
    expect(p.content.length).toBeGreaterThan(500);
    expect(p.sourceUrl).toMatch(/^https:\/\/(github\.com|www\.reddit\.com)\//);
    expect(p.sourceName.length).toBeGreaterThan(10);
    expect(p.sourcePlatform.length).toBeGreaterThan(10);
    expect(p.content).toContain('Không root');
    expect(p.content).toContain('THÔNG TIN CỦA TÔI');
    expect(p.content).toContain('YÊU CẦU\n1.');
    expect(p.content).toContain('\n5.');
    expect(['Claude','ChatGPT']).toContain(p.model);
  }
});

test('Android mobile clean TV section, navigation and responsive layout',async({page})=>{
  await page.setViewportSize({width:360,height:780});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#sidebarToggle').click();
  await page.locator('#primaryNav [data-view="cleantv"]').click();
  await expect(page.locator('#resultCount')).toHaveText('16 prompt');
  await expect(page.locator('#cleanTvSection')).toBeHidden();
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(16);
  const overflow=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,body:document.documentElement.scrollWidth}));
  expect(overflow.body).toBeLessThanOrEqual(overflow.viewport+1);
});

test('prompt original links upstream and states scope/compatibility clearly',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#cleanTvGrid [data-open="ctv-001"]').click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  await expect(page.locator('#detailDialog .prompt-source a')).toHaveAttribute('href','https://github.com/Gathin23/cleanyourtv/blob/main/PROMPT.md');
  await expect(page.locator('#detailDialog .prompt-source a')).toHaveAttribute('rel',/noopener noreferrer/);
  await expect(page.locator('#detailPromptText')).toContainText('Google TV');
  await expect(page.locator('#detailPromptText')).toContainText('sao lưu');
});

test('clean TV examples distinguish non-Android TV and no-ADB safe workflow',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  const prompts=await page.evaluate(()=>window.PROMPT_SEED.filter(p=>p.cleanTv));
  const other=prompts.find(p=>p.id==='ctv-010');
  expect(other.title).toContain('không cần ADB');
  expect(other.content).toContain('TIZEN/WEBOS/VIDAA/ROKU');
  expect(other.content).toContain('Không dùng bất kỳ lệnh ADB');
});

test('search finds Clean TV without diacritics, favorites survive reload',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#searchInput').fill('khoi phuc TV');
  await expect(page.locator('#promptGrid [data-open="ctv-013"]')).toBeVisible();
  await page.locator('#searchInput').fill('');
  await page.locator('#cleanTvGrid [data-save="ctv-001"]').click();
  await expect(page.locator('#statSaved')).toHaveText('1');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('prompthub_favorites_v1')||'[]'))).toContain('ctv-001');
  await page.reload();
  await expect(page.locator('#statSaved')).toHaveText('1');
});
