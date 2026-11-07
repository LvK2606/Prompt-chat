const {test,expect}=require('@playwright/test');
const seedTitle='Prompt mẫu đã được cập nhật bởi quản trị';
function publicMocks(page,{role=null,notice='',hidden=[],overrides=[],submissionsOpen=true,suspended=false}={}){
 const posted=[];
 const user=role?{id:'11111111-1111-4111-8111-111111111111',name:'Người dùng thử',email:'user@example.test'}:null;
 page.route('**/api/community?*',async route=>{
  const url=new URL(route.request().url()),cmd=url.searchParams.get('route');
  let body;try{body=route.request().postDataJSON()}catch{}
  if(route.request().method()==='POST')posted.push({route:cmd,body});
  let data={ok:true};
  if(cmd==='profile')data={user,role,suspended,suspensionReason:suspended?'Vi phạm quy định cộng đồng':''};
  if(cmd==='public')data={prompts:[],seedOverrides:[...overrides,...hidden.map(id=>({id,hidden:true,overrides:{}}))],settings:{siteNotice:notice,submissionsOpen}};
  if(cmd==='mine')data={prompts:[],favorites:[]};
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 return posted;
}

test('public website reflects admin override, hidden seeded content and site announcement',async({page})=>{
 publicMocks(page,{notice:'Thư viện đang được cập nhật.',hidden:['seed-002'],overrides:[{id:'seed-001',hidden:false,overrides:{title:seedTitle,featured:true}}]});
 await page.setViewportSize({width:390,height:844});
 await page.goto('http://127.0.0.1:4173/');
 await expect(page.locator('#communitySiteNotice')).toContainText('Thư viện đang được cập nhật.');
 await expect(page.locator('#statPrompts')).toHaveText('155');
 await page.locator('#searchInput').fill(seedTitle);
 await expect(page.locator('#promptGrid [data-open="seed-001"]')).toBeVisible();
 await page.locator('#searchInput').fill('');
 const hidden=await page.evaluate(()=>[...document.querySelectorAll('[data-open]')].some(x=>x.dataset.open==='seed-002'));
 expect(hidden).toBe(false);
 const width=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 expect(width.scroll).toBeLessThanOrEqual(width.client+1);
});

test('authenticated member reports public prompt with reason and optional details',async({page})=>{
 const posted=publicMocks(page,{role:'member'});
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#promptGrid [data-open]').first().click();
 await expect(page.locator('#detailDialog')).toBeVisible();
 await page.locator('#detailDialog [data-report]').click();
 await expect(page.locator('#reportDialog')).toBeVisible();
 await page.locator('#reportReason').selectOption('misleading');
 await page.locator('#reportDetails').fill('Nội dung có thể gây hiểu nhầm.');
 await page.locator('#reportForm button[type="submit"]').click();
 await expect.poll(()=>posted.filter(x=>x.route==='report').length).toBe(1);
 const report=posted.find(x=>x.route==='report');
 expect(report.body.reason).toBe('misleading');
 expect(report.body.details).toContain('gây hiểu nhầm');
 await expect(page.locator('#reportDialog')).toBeHidden();
});

test('moderator/admin link is visible in sidebar without breaking mobile topbar',async({page})=>{
 publicMocks(page,{role:'admin'});
 await page.setViewportSize({width:360,height:780});
 await page.goto('http://127.0.0.1:4173/');
 await expect(page.locator('#sidebarAdminLink')).toHaveAttribute('href','/admin.html');
 await expect(page.locator('#moderationBtn')).toBeHidden();
 const dims=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 expect(dims.scroll).toBeLessThanOrEqual(dims.client+1);
});

test('suspended account cannot submit a community report in browser',async({page})=>{
 const posted=publicMocks(page,{role:'member',suspended:true});
 await page.goto('http://127.0.0.1:4173/');
 await page.locator('#promptGrid [data-open]').first().click();
 await page.locator('#detailDialog [data-report]').click();
 await expect(page.locator('#reportDialog')).toBeHidden();
 expect(posted.some(p=>p.route==='report')).toBe(false);
});

test('closed contributions are blocked by public UI before a network request',async({page})=>{
 const posted=publicMocks(page,{role:'member',submissionsOpen:false});
 await page.goto('http://127.0.0.1:4173/');
 await page.waitForFunction(()=>window.PromptHubCommunity?.submissionsOpen===false);
 await page.evaluate(()=>window.PromptHubCommunity.contribute('custom-local-demo'));
 await expect(page.locator('#toastStack')).toContainText('tạm ngừng nhận prompt');
 expect(posted.some(x=>x.route==='submit')).toBe(false);
});
