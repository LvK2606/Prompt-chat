const {test, expect}=require('@playwright/test');

test('online temple collection has 16 sourced original templates and preserves the old library',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});
  await expect(page.locator('#statPrompts')).toHaveText('156');
  await expect(page.locator('#statCategories')).toHaveText('12');
  await expect(page.locator('#templeCount')).toHaveText('16');
  await expect(page.locator('#trendingCount')).toHaveText('120');
  await expect(page.locator('#onlineTempleGrid .prompt-card')).toHaveCount(6);
  const data=await page.evaluate(()=>({categories:window.PROMPT_CATEGORIES,items:window.PROMPT_SEED}));
  const all=data.items,t=all.filter(p=>p.onlineTemple);
  expect(all).toHaveLength(156);
  expect(new Set(all.map(p=>p.id)).size).toBe(156);
  expect(data.categories).toHaveLength(12);
  expect(t).toHaveLength(16);
  expect(t.every(p=>p.category==='temple'&&p.trending===true&&p.isCustom===false)).toBe(true);
  expect(new Set(t.map(p=>p.sourceUrl)).size).toBeGreaterThanOrEqual(7);
  for(const p of t){
    expect(p.id).toMatch(/^tem-\d{3}$/);
    expect(p.content.length).toBeGreaterThan(1000);
    expect(p.content).toContain('THÔNG TIN DỰ ÁN');
    expect(p.content).toContain('YÊU CẦU CỤ THỂ\n1.');
    expect(p.content).toContain('\n5.');
    expect(p.content).toContain('không thay thế');
    expect(p.sourceName.length).toBeGreaterThan(12);
    expect(p.sourcePlatform.length).toBeGreaterThan(20);
    expect(p.sourceUrl).toMatch(/^https:\/\//);
  }
});

test('mobile users can open temple collection without horizontal scrolling',async({page})=>{
  await page.setViewportSize({width:360,height:780});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#sidebarToggle').click();
  await page.locator('#primaryNav [data-view="temple"]').click();
  await expect(page.locator('#resultCount')).toHaveText('16 prompt');
  await expect(page.locator('#onlineTempleSection')).toBeHidden();
  await expect(page.locator('#promptGrid .prompt-card')).toHaveCount(16);
  await expect(page.locator('#loadMoreBtn')).toBeHidden();
  const dims=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(dims.scroll).toBeLessThanOrEqual(dims.viewport+1);
});

test('source detail shows original reference and disclosure',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#onlineTempleGrid [data-open="tem-001"]').click();
  await expect(page.locator('#detailDialog')).toBeVisible();
  const a=page.locator('#detailDialog .prompt-source a');
  await expect(a).toHaveAttribute('href','https://vnexpress.net/tac-gia-chua-online-khuay-dao-mang-voi-30-phut-lap-trinh-ai-5140379.html');
  await expect(a).toHaveAttribute('target','_blank');
  await expect(a).toHaveAttribute('rel',/noopener noreferrer/);
  await expect(page.locator('#detailDialog .prompt-source')).toContainText('biên soạn độc lập');
});

test('Vietnamese search finds online temple prompt without accents',async({page})=>{
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#searchInput').fill('chua ao 3d viet nam');
  await expect(page.locator('#promptGrid [data-open="tem-001"]')).toBeVisible();
});

test('online temple favorite persists and privacy guidance does not promise paid religious merit',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:4173/');
  await page.locator('#onlineTempleGrid [data-save="tem-001"]').click();
  await expect(page.locator('#statSaved')).toHaveText('1');
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('prompthub_favorites_v1')||'[]'))).toContain('tem-001');
  await page.reload();
  await expect(page.locator('#statSaved')).toHaveText('1');
  const p=await page.evaluate(()=>window.PROMPT_SEED.find(p=>p.id==='tem-013'));
  expect(p.content).toContain('Không mạo danh');
  expect(p.content).toContain('không đặt QR chuyển tiền');
});
