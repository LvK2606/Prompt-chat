const {test,expect}=require('@playwright/test');

function mockAdmin(page,{role='admin',user='11111111-1111-4111-8111-111111111111'}={}){
 const called=[];
 const profile={id:user,name:'Admin Demo',email:'admin@example.test'};
 const communityPrompt={id:'custom-test-123',ownerId:'22222222-2222-4222-8222-222222222222',title:'Prompt cộng đồng thử nghiệm',summary:'Mô tả ví dụ',content:'Nội dung prompt an toàn để kiểm tra phê duyệt',category:'coding',model:'ChatGPT',tags:['test'],status:'pending',featured:false,score:5,createdAt:'2026-11-07T00:00:00Z',updatedAt:'2026-11-07T00:00:00Z',deletedAt:null};
 const userRecord={id:'22222222-2222-4222-8222-222222222222',email:'member@example.test',name:'Thành viên thử',role:'member',prompt_count:1,suspended:false,created_at:'2026-11-07T00:00:00Z'};
 page.route('**/api/community?*',async route=>{const url=new URL(route.request().url());called.push({route:url.searchParams.get('route'),body:route.request().postDataJSON?.()});await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})})});
 page.route('**/api/admin?*',async route=>{
  const url=new URL(route.request().url()),cmd=url.searchParams.get('route'),req=route.request();
  let body;try{body=req.postDataJSON()}catch{};
  called.push({route:cmd,body});
  let response={ok:true},status=200;
  switch(cmd){
   case 'me':response={user:profile,role};break;
   case 'overview':response={users:2,prompts:{approved:1,pending:1,private:0,rejected:0},favorites:3,reports:{open:1},seed:{changed:1,hidden:0},activity:[],categoryStats:[{category:'coding',count:1}],recent:[]};break;
   case 'prompts':{
    const filter=url.searchParams.get('status')||'all';
    response={prompts:filter==='deleted'?[]:[communityPrompt],total:filter==='deleted'?0:1,page:Number(url.searchParams.get('page'))||1,limit:15};break;
   }
   case 'seed-overrides':response={items:[]};break;
   case 'users':response={users:[{...profile,role,prompt_count:0,suspended:false},userRecord],total:2,page:1,limit:15};break;
   case 'reports':response={reports:[{id:3,prompt_id:'seed-001',prompt_title:'Một prompt kiểm thử',reason:'spam',details:'Có nội dung quảng cáo',status:'open',created_at:'2026-11-07T00:00:00Z'}],total:1,page:1,limit:12};break;
   case 'audit':response={logs:[{id:1,actor_id:profile.id,actor_email:profile.email,prompt_id:'seed-001',action:'admin_hide_seed',note:'Ẩn theo báo cáo',created_at:'2026-11-07T00:00:00Z'}],total:1,page:1,limit:20};break;
   case 'settings':response={settings:{site_notice:'Thông báo ban đầu',submissions_open:true}};break;
   default:response={ok:true};
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(response)});
 });
 return called;
}

test('non-authenticated visitor cannot see admin dashboard content',async({page})=>{
 await page.route('**/api/admin?*',r=>r.fulfill({status:401,contentType:'application/json',body:JSON.stringify({error:'Hãy đăng nhập để sử dụng trang quản trị.'})}));
 await page.goto('http://127.0.0.1:4173/admin.html');
 await expect(page.locator('#gateTitle')).toContainText('Không thể truy cập');
 await expect(page.locator('#adminLayout')).toBeHidden();
 await expect(page.locator('#panel-users')).toBeHidden();
});

test('admin sees real console sections and mobile has no overflow',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 mockAdmin(page);
 await page.goto('http://127.0.0.1:4173/admin.html');
 await expect(page.locator('#adminGate')).toBeHidden();
 await expect(page.locator('#roleBadge')).toContainText('SUPER ADMIN');
 await expect(page.locator('.stat-card')).toHaveCount(8);
 await expect(page.locator('#sidebarPending')).toHaveText('1');
 await page.locator('#navToggle').click();
 await expect(page.locator('#adminSidebar')).toHaveClass(/open/);
 await page.locator('[data-panel=curated]').click();
 await expect(page.locator('#seedTable tr')).toHaveCount(15);
 await expect(page.locator('#overridesCount')).toHaveText('0 điều chỉnh');
 const width=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
 expect(width.scroll).toBeLessThanOrEqual(width.viewport+1);
});

test('admin can edit and hide a curated seed with confirmation',async({page})=>{
 const called=mockAdmin(page);
 await page.goto('http://127.0.0.1:4173/admin.html');
 await page.locator('[data-panel=curated]').click();
 await expect(page.locator('#seedTable tr')).toHaveCount(15);
 await page.locator('#seedTable [data-action=edit-seed]').first().click();
 await expect(page.locator('#editorDialog')).toBeVisible();
 await expect(page.locator('#editTitle')).not.toBeEmpty();
 await page.locator('#editTitle').fill('Tiêu đề đã sửa từ admin');
 await page.locator('#editorForm button[type=submit]').click();
 await expect.poll(()=>called.some(x=>x.route==='seed-save'&&x.body?.title==='Tiêu đề đã sửa từ admin')).toBe(true);
 await page.locator('#seedTable [data-action=toggle-seed]').first().click();
 await expect(page.locator('#confirmDialog')).toBeVisible();
 await page.locator('#confirmExecute').click();
 await expect.poll(()=>called.some(x=>x.route==='seed-visibility'&&x.body?.hidden===true)).toBe(true);
});

test('moderator sees review queue but cannot access roles/settings',async({page})=>{
 const called=mockAdmin(page,{role:'moderator'});
 await page.goto('http://127.0.0.1:4173/admin.html');
 await expect(page.locator('#roleBadge')).toContainText('MODERATOR');
 await expect(page.locator('[data-panel=users]')).toBeHidden();
 await expect(page.locator('[data-panel=settings]')).toBeHidden();
 await expect(page.locator('#addPrompt')).toBeHidden();
 await page.locator('[data-panel=reviews]').click();
 await expect(page.locator('#reviewList .review-item')).toHaveCount(1);
 await page.locator('#reviewList [data-action=approve]').click();
 await page.locator('#confirmExecute').click();
 await expect.poll(()=>called.some(x=>x.route==='review'&&x.body?.action==='approve')).toBe(true);
});

test('admin user role changes require confirmation, and settings persist',async({page})=>{
 const called=mockAdmin(page);
 await page.goto('http://127.0.0.1:4173/admin.html');
 await page.locator('[data-panel=users]').click();
 await expect(page.locator('#userTable tr')).toHaveCount(2);
 await page.locator('[data-user-role]').selectOption('moderator');
 await expect(page.locator('#confirmDialog')).toBeVisible();
 await page.locator('#confirmExecute').click();
 await expect.poll(()=>called.some(x=>x.route==='user-action'&&x.body?.role==='moderator')).toBe(true);
 await page.locator('[data-panel=settings]').click();
 await expect(page.locator('#siteNotice')).toHaveValue('Thông báo ban đầu');
 await page.locator('#siteNotice').fill('Tạm ngừng tiếp nhận nội dung mới');
 await page.locator('#submissionsOpen').uncheck();
 await page.locator('#settingsForm button[type=submit]').click();
 await expect.poll(()=>called.some(x=>x.route==='settings-save'&&x.body?.submissionsOpen===false)).toBe(true);
});

test('report moderation and audit show traceable actions',async({page})=>{
 const called=mockAdmin(page);
 await page.goto('http://127.0.0.1:4173/admin.html');
 await page.locator('[data-panel=reports]').click();
 await expect(page.locator('#reportList .review-item')).toHaveCount(1);
 await page.locator('#reportList [data-action=resolve-report]').click();
 await page.locator('#confirmExecute').click();
 await expect.poll(()=>called.some(x=>x.route==='report-state'&&x.body?.status==='resolved')).toBe(true);
 await page.locator('[data-panel=audit]').click();
 await expect(page.locator('#auditTable')).toContainText('admin hide seed');
});

test('admin can publish, unpublish and feature community prompts through buttons',async({page})=>{
 const called=mockAdmin(page);
 await page.goto('http://127.0.0.1:4173/admin.html');
 await page.locator('[data-panel=prompts]').click();
 await expect(page.locator('#promptTable')).toContainText('Prompt cộng đồng thử nghiệm');
 await page.locator('#promptTable [data-action=publish]').click();
 await page.locator('#confirmExecute').click();
 await expect.poll(()=>called.some(x=>x.route==='prompt-state'&&x.body?.action==='approve')).toBe(true);
});
