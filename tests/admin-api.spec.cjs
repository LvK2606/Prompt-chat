const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../api/admin.js'),'utf8');
const selfId='11111111-1111-4111-8111-111111111111';

async function invoke({route='overview',method='GET',role='admin',session=true,suspended=false,origin='https://prompt-chat.vercel.app',body={},query={}}={}){
 const queries=[];
 const sql=(strings,...values)=>{const statement=strings.join('?');queries.push({statement,values});if(statement.includes('SELECT role FROM community_roles'))return Promise.resolve([{role}]);if(statement.includes('SELECT suspended FROM community_user_status'))return Promise.resolve([{suspended}]);return Promise.resolve([])};
 const mod={exports:{}};
 const ctx={module:mod,require:name=>name==='@neondatabase/serverless'?{neon:()=>sql}:require(name),process:{env:{DATABASE_URL:'postgresql://placeholder',NEON_AUTH_URL:'https://auth.invalid'}},console,fetch:async()=>({ok:session,json:async()=>({user:session?{id:selfId,email:'admin@example.test',name:'Admin'}:null})})};
 vm.runInNewContext(code,ctx,{timeout:3000});
 const req={method,query:{route,...query},headers:{host:'prompt-chat.vercel.app',origin,cookie:'session=fake'},body};
 const res={code:200,data:null,setHeader(){return this},status(n){this.code=n;return this},json(d){this.data=d;return this}};
 await mod.exports(req,res);
 return {code:res.code,data:res.data,queries};
}

test('no session gets 401 for all management data',async()=>{
 for(const route of ['me','overview','users','prompts','audit','settings','reports','seed-overrides']){
  const res=await invoke({route,session:false});expect(res.code,'route='+route).toBe(401);
 }
});
test('member cannot read dashboard, private prompts, users or settings',async()=>{
 for(const route of ['overview','users','prompts','audit','settings','reports','seed-overrides']){
  const res=await invoke({route,role:'member'});expect(res.code,'route='+route).toBe(403);
 }
});
test('moderator never gains user, role, system settings or curated edit privileges',async()=>{
 const routes=[{route:'users',method:'GET'},{route:'settings',method:'GET'},{route:'seed-save',method:'POST',body:{id:'seed-001'}},{route:'user-action',method:'POST',body:{id:'22222222-2222-4222-8222-222222222222',action:'role',role:'admin'}}];
 for(const item of routes){const res=await invoke({...item,role:'moderator'});expect(res.code,item.route).toBe(403)}
});
test('moderator prompt listing explicitly excludes private drafts and deleted records',async()=>{
 const res=await invoke({route:'prompts',role:'moderator'});
 expect(res.code).toBe(200);
 expect(res.queries.some(x=>x.statement.includes("p.status IN ('approved','pending','rejected')"))).toBe(true);
});
test('cross-site POST requests and acting on own admin account are denied',async()=>{
 let res=await invoke({route:'user-action',method:'POST',body:{id:selfId,action:'role',role:'member'},origin:'https://evil.example'});
 expect(res.code).toBe(403);
 res=await invoke({route:'user-action',method:'POST',body:{id:selfId,action:'role',role:'member'}});
 expect(res.code).toBe(403);
 expect(res.queries.some(x=>/^\s*(?:UPDATE|DELETE|INSERT)/i.test(x.statement))).toBe(false);
});
test('suspended elevated account cannot access private management actions',async()=>{
 const res=await invoke({route:'overview',role:'admin',suspended:true});
 expect(res.code).toBe(403);
});
test('admin identity endpoint never returns password hashes',async()=>{
 const res=await invoke({route:'me',role:'admin'});
 expect(res.code).toBe(200);
 expect(res.data.role).toBe('admin');
 expect(res.data.user.email).toBe('admin@example.test');
 expect(JSON.stringify(res.data)).not.toContain('password');
});
test('invalid curated prompt identifiers and invalid report actions are rejected',async()=>{
 const res=await invoke({route:'seed-visibility',method:'POST',body:{id:'../../secret',hidden:true}});
 expect(res.code).toBe(400);
 const res2=await invoke({route:'report-state',method:'POST',body:{id:3,status:'open'}});
 expect(res2.code).toBe(400);
});
