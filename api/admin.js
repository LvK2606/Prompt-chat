"use strict";
module.exports=async function handler(req,res){
"use strict";
const {neon}=require("@neondatabase/serverless"),crypto=require("node:crypto");
const sql=neon(process.env.DATABASE_URL);
res.setHeader("Cache-Control","private, no-store");
res.setHeader("X-Content-Type-Options","nosniff");
const error=(status,message)=>res.status(status).json({error:message});
const method=req.method,route=String(req.query?.route||"overview").slice(0,60);
if(!process.env.DATABASE_URL||!process.env.NEON_AUTH_URL)return error(503,"Chưa cấu hình dịch vụ.");
if(!["GET","POST"].includes(method))return error(405,"Phương thức không được hỗ trợ.");
if(method==="POST"){
 const origin=req.headers.origin||"",host=req.headers.host||"";
 if(!origin||!([`https://${host}`,"http://localhost:3000","http://localhost:4173"].includes(origin)))return error(403,"Nguồn yêu cầu không hợp lệ.");
 if(!req.body||typeof req.body!=="object"||Array.isArray(req.body)||JSON.stringify(req.body).length>36000)return error(413,"Dữ liệu gửi lên không hợp lệ hoặc quá lớn.");
}
const text=(v,max=150)=>String(v??"").trim().slice(0,max);
const categories=new Set(["writing","coding","marketing","design","learning","business","creative","productivity","advanced","vibe","smarttv","temple"]);
const models=new Set(["Mọi AI","ChatGPT","Claude","Gemini","Midjourney","Khác"]);
const roles=new Set(["member","moderator","admin"]);
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
const seedId=x=>/^(seed|hot|fbv|ctv|tem)-\d{3}$/.test(x);
const pack=p=>({id:p.id,ownerId:p.owner_id,title:p.title,summary:p.summary,content:p.content,category:p.category,model:p.model,tags:p.tags,featured:p.featured,score:p.score,status:p.status,createdAt:p.created_at,updatedAt:p.updated_at,reviewedBy:p.reviewed_by,rejectionReason:p.rejection_reason,deletedAt:p.deleted_at});
const validate=o=>{
 if(!o||typeof o!=="object"||Array.isArray(o))return null;
 const title=text(o.title,100),summary=text(o.summary,240),content=text(o.content,12000),category=text(o.category,50),model=text(o.model,50);
 if(!title||!summary||!content||String(o.content||"").length>12000||!categories.has(category)||!models.has(model))return null;
 const tags=(Array.isArray(o.tags)?o.tags:[]).slice(0,6).map(x=>text(x,25)).filter(Boolean);
 return {title,summary,content,category,model,tags};
};
const audit=async(actor,prompt,action,note="")=>{
 await sql`INSERT INTO community_audit(actor_id,prompt_id,action,note) VALUES(${actor},${prompt},${action},${text(note,500)})`;
};
try{
 const sessionResponse=await fetch(process.env.NEON_AUTH_URL+"/get-session",{headers:{cookie:req.headers.cookie||"",origin:"https://prompt-chat.vercel.app"},cache:"no-store"});
 const session=sessionResponse.ok?await sessionResponse.json():null;
 const user=session?.user;
 if(!user?.id)return error(401,"Hãy đăng nhập để sử dụng trang quản trị.");
 const roleRows=await sql`SELECT role FROM community_roles WHERE user_id=${user.id} LIMIT 1`;
 const role=roleRows[0]?.role||"member";
 if(!["admin","moderator"].includes(role))return error(403,"Tài khoản không có quyền quản trị.");
 const blocked=await sql`SELECT suspended FROM community_user_status WHERE user_id=${user.id} LIMIT 1`;
 if(blocked[0]?.suspended)return error(403,"Tài khoản đã bị tạm khóa.");
 const admin=role==="admin";
 const adminOnly=()=>admin?null:error(403,"Chỉ quản trị viên mới được thực hiện thao tác này.");
 if(route==="me"&&method==="GET")return res.json({user:{id:user.id,name:user.name,email:user.email},role});
 if(route==="overview"&&method==="GET"){
  const [users, prompts, favs, reports, seed, activity, categoriesStats, recent]=await Promise.all([
   sql`SELECT count(*)::int AS count FROM neon_auth."user"`,
   sql`SELECT status,count(*)::int AS count FROM community_prompts WHERE deleted_at IS NULL GROUP BY status`,
   sql`SELECT count(*)::int AS count FROM community_favorites`,
   sql`SELECT status,count(*)::int AS count FROM community_reports GROUP BY status`,
   sql`SELECT count(*) FILTER(WHERE hidden=true OR overrides <> '{}'::jsonb)::int AS changed,count(*) FILTER(WHERE hidden=true)::int AS hidden FROM community_seed_overrides`,
   sql`SELECT id,actor_id,prompt_id,action,note,created_at FROM community_audit ORDER BY created_at DESC LIMIT 8`,
   sql`SELECT category,count(*)::int AS count FROM community_prompts WHERE deleted_at IS NULL GROUP BY category ORDER BY count DESC LIMIT 12`,
   sql`SELECT created_at::date::text AS day,count(*)::int AS count FROM community_prompts WHERE deleted_at IS NULL AND created_at>=now()-interval '13 days' GROUP BY created_at::date ORDER BY day`
  ]);
  return res.json({users:users[0]?.count||0,prompts:Object.fromEntries(prompts.map(x=>[x.status,x.count])),favorites:favs[0]?.count||0,reports:Object.fromEntries(reports.map(x=>[x.status,x.count])),seed:seed[0]||{changed:0,hidden:0},activity,categoryStats:categoriesStats,recent});
 }
 if(route==="prompts"&&method==="GET"){
  const status=text(req.query.status||"all",20),q=text(req.query.q||"",100);
  if(!["all","approved","pending","rejected","private","deleted"].includes(status))return error(400,"Trạng thái không hợp lệ.");
  const page=Math.min(200,Math.max(1,parseInt(req.query.page,10)||1)),limit=Math.min(50,Math.max(1,parseInt(req.query.limit,10)||20));
  const term="%"+q+"%",deleted=status==="deleted",effective=status==="deleted"?"all":status;
  // Avoid dynamic SQL assembly: the two parameterized queries have the same predicates.
  const [items,count]=await Promise.all([
   sql`SELECT p.* FROM community_prompts p WHERE (${deleted} = (p.deleted_at IS NOT NULL)) AND (${admin} OR (p.deleted_at IS NULL AND p.status IN ('approved','pending','rejected'))) AND (${effective}='all' OR p.status=${effective}) AND (${q}='' OR p.title ILIKE ${term} OR p.summary ILIKE ${term} OR p.id ILIKE ${term}) ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`,
   sql`SELECT count(*)::int AS count FROM community_prompts p WHERE (${deleted} = (p.deleted_at IS NOT NULL)) AND (${admin} OR (p.deleted_at IS NULL AND p.status IN ('approved','pending','rejected'))) AND (${effective}='all' OR p.status=${effective}) AND (${q}='' OR p.title ILIKE ${term} OR p.summary ILIKE ${term} OR p.id ILIKE ${term})`
  ]);
  return res.json({prompts:items.map(pack),total:count[0]?.count||0,page,limit});
 }
 if(route==="prompt-save"&&method==="POST"){
  if(!admin)return adminOnly();
  const item=validate(req.body),id=text(req.body.id,100);
  if(!item)return error(400,"Tên, mô tả, nội dung, danh mục hoặc mô hình AI không hợp lệ.");
  const featured=req.body.featured===true;
  const status=["approved","private"].includes(req.body.status)?req.body.status:"approved";
  if(id){
   if(!/^custom-[a-zA-Z0-9-]{1,90}$/.test(id))return error(400,"ID prompt không hợp lệ.");
   const updated=await sql`UPDATE community_prompts SET title=${item.title},summary=${item.summary},content=${item.content},category=${item.category},model=${item.model},tags=${JSON.stringify(item.tags)}::jsonb,featured=${featured},status=${status},score=${Math.max(0,Math.min(999,Number(req.body.score)||0))},updated_at=now(),deleted_at=NULL,rejection_reason=NULL WHERE id=${id} RETURNING id`;
   if(!updated.length)return error(404,"Không tìm thấy prompt.");
   await audit(user.id,id,"admin_update_prompt",status);
   return res.json({ok:true,id});
  }
  const next="custom-"+crypto.randomUUID();
  await sql`INSERT INTO community_prompts(id,owner_id,title,summary,content,category,model,tags,status,featured,score,reviewed_by,reviewed_at) VALUES(${next},${user.id},${item.title},${item.summary},${item.content},${item.category},${item.model},${JSON.stringify(item.tags)}::jsonb,${status},${featured},${Math.max(0,Math.min(999,Number(req.body.score)||0))},${user.id},now())`;
  await audit(user.id,next,"admin_create_prompt",status);
  return res.status(201).json({ok:true,id:next});
 }
 if(route==="prompt-state"&&method==="POST"){
  if(!admin)return adminOnly();
  const id=text(req.body.id,100),action=text(req.body.action,30),reason=text(req.body.reason,300);
  if(!/^custom-[a-zA-Z0-9-]{1,90}$/.test(id)||!["approve","unpublish","reject","feature","unfeature","delete","restore"].includes(action))return error(400,"Tham số không hợp lệ.");
  if(action==="reject"&&!reason)return error(400,"Phải nêu lý do từ chối.");
  let result=[];
  if(action==="approve")result=await sql`UPDATE community_prompts SET status='approved',rejection_reason=NULL,reviewed_by=${user.id},reviewed_at=now(),updated_at=now() WHERE id=${id} AND deleted_at IS NULL RETURNING id`;
  if(action==="unpublish")result=await sql`UPDATE community_prompts SET status='private',featured=false,updated_at=now() WHERE id=${id} AND deleted_at IS NULL RETURNING id`;
  if(action==="reject")result=await sql`UPDATE community_prompts SET status='rejected',rejection_reason=${reason},featured=false,reviewed_by=${user.id},reviewed_at=now(),updated_at=now() WHERE id=${id} AND deleted_at IS NULL RETURNING id`;
  if(action==="feature")result=await sql`UPDATE community_prompts SET featured=true,updated_at=now() WHERE id=${id} AND status='approved' AND deleted_at IS NULL RETURNING id`;
  if(action==="unfeature")result=await sql`UPDATE community_prompts SET featured=false,updated_at=now() WHERE id=${id} AND deleted_at IS NULL RETURNING id`;
  if(action==="delete")result=await sql`UPDATE community_prompts SET deleted_at=now(),featured=false,updated_at=now() WHERE id=${id} AND deleted_at IS NULL RETURNING id`;
  if(action==="restore")result=await sql`UPDATE community_prompts SET deleted_at=NULL,status='private',featured=false,updated_at=now() WHERE id=${id} AND deleted_at IS NOT NULL RETURNING id`;
  if(!result.length)return error(409,"Không thể thay đổi trạng thái prompt này.");
  await audit(user.id,id,"admin_"+action,reason);
  return res.json({ok:true});
 }
 if(route==="seed-overrides"&&method==="GET"){
  if(!admin)return adminOnly();
  const rows=await sql`SELECT id,overrides,hidden,updated_at,updated_by FROM community_seed_overrides ORDER BY updated_at DESC LIMIT 500`;
  return res.json({items:rows});
 }
 if(route==="seed-save"&&method==="POST"){
  if(!admin)return adminOnly();
  const id=text(req.body.id,60);if(!seedId(id))return error(400,"ID prompt mẫu không hợp lệ.");
  const item=validate(req.body);if(!item)return error(400,"Nội dung prompt mẫu không hợp lệ.");
  const overrides={...item,featured:req.body.featured===true,score:Math.max(0,Math.min(999,Math.floor(Number(req.body.score)||0)))};
  await sql`INSERT INTO community_seed_overrides(id,overrides,hidden,updated_by) VALUES(${id},${JSON.stringify(overrides)}::jsonb,false,${user.id}) ON CONFLICT (id) DO UPDATE SET overrides=excluded.overrides,updated_by=excluded.updated_by,updated_at=now()`;
  await audit(user.id,id,"admin_edit_seed","Cập nhật prompt mẫu");
  return res.json({ok:true});
 }
 if(route==="seed-visibility"&&method==="POST"){
  if(!admin)return adminOnly();
  const id=text(req.body.id,60);if(!seedId(id)||typeof req.body.hidden!=="boolean")return error(400,"Dữ liệu không hợp lệ.");
  await sql`INSERT INTO community_seed_overrides(id,overrides,hidden,updated_by) VALUES(${id},'{}'::jsonb,${req.body.hidden},${user.id}) ON CONFLICT (id) DO UPDATE SET hidden=excluded.hidden,updated_by=excluded.updated_by,updated_at=now()`;
  await audit(user.id,id,req.body.hidden?"admin_hide_seed":"admin_show_seed");
  return res.json({ok:true});
 }
 if(route==="seed-reset"&&method==="POST"){
  if(!admin)return adminOnly();
  const id=text(req.body.id,60);if(!seedId(id))return error(400,"ID không hợp lệ.");
  await sql`UPDATE community_seed_overrides SET overrides='{}'::jsonb,updated_by=${user.id},updated_at=now() WHERE id=${id}`;
  await audit(user.id,id,"admin_reset_seed");
  return res.json({ok:true});
 }
 if(route==="users"&&method==="GET"){
  if(!admin)return adminOnly();
  const q=text(req.query.q||"",100),term="%"+q+"%";
  const page=Math.min(200,Math.max(1,parseInt(req.query.page,10)||1)),limit=Math.min(40,Math.max(1,parseInt(req.query.limit,10)||20));
  const [rows,count]=await Promise.all([
   sql`SELECT u.id::text AS id,u.name,u.email,u."createdAt" AS created_at,u."emailVerified" AS email_verified,COALESCE(r.role,'member') AS role,COALESCE(s.suspended,false) AS suspended,s.reason,COALESCE((SELECT count(*)::int FROM community_prompts p WHERE p.owner_id=u.id::text AND p.deleted_at IS NULL),0) AS prompt_count FROM neon_auth."user" u LEFT JOIN community_roles r ON r.user_id=u.id::text LEFT JOIN community_user_status s ON s.user_id=u.id::text WHERE (${q}='' OR u.email ILIKE ${term} OR u.name ILIKE ${term}) ORDER BY u."createdAt" DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`,
   sql`SELECT count(*)::int AS count FROM neon_auth."user" u WHERE (${q}='' OR u.email ILIKE ${term} OR u.name ILIKE ${term})`
  ]);
  return res.json({users:rows,total:count[0]?.count||0,page,limit});
 }
 if(route==="user-action"&&method==="POST"){
  if(!admin)return adminOnly();
  const id=text(req.body.id,60),action=text(req.body.action,30);
  if(!uuid(id))return error(400,"ID người dùng không hợp lệ.");
  if(id===user.id)return error(403,"Không thể thay đổi quyền hoặc khóa chính tài khoản của bạn.");
  const exists=await sql`SELECT id::text FROM neon_auth."user" WHERE id=${id}::uuid LIMIT 1`;
  if(!exists.length)return error(404,"Không tìm thấy người dùng.");
  if(action==="role"){
   const next=text(req.body.role,25);if(!roles.has(next))return error(400,"Vai trò không hợp lệ.");
   if(next==="member")await sql`DELETE FROM community_roles WHERE user_id=${id}`;
   else await sql`INSERT INTO community_roles(user_id,role) VALUES(${id},${next}) ON CONFLICT(user_id) DO UPDATE SET role=excluded.role,granted_at=now()`;
   await audit(user.id,"user:"+id,"role_change",next);return res.json({ok:true});
  }
  if(action==="suspend"||action==="unsuspend"){
   const reason=text(req.body.reason,500);if(action==="suspend"&&!reason)return error(400,"Cần có lý do khóa tài khoản.");
   const suspended=action==="suspend";
   await sql`INSERT INTO community_user_status(user_id,suspended,reason,updated_by) VALUES(${id},${suspended},${reason},${user.id}) ON CONFLICT(user_id) DO UPDATE SET suspended=excluded.suspended,reason=excluded.reason,updated_by=excluded.updated_by,updated_at=now()`;
   await audit(user.id,"user:"+id,suspended?"suspend_user":"unsuspend_user",reason);return res.json({ok:true});
  }
  return error(400,"Thao tác người dùng không hợp lệ.");
 }
 if(route==="reports"&&method==="GET"){
  const status=text(req.query.status||"open",20);
  if(!["open","resolved","dismissed","all"].includes(status))return error(400,"Trạng thái không hợp lệ.");
  const page=Math.min(100,Math.max(1,parseInt(req.query.page,10)||1)),limit=Math.min(50,Math.max(1,parseInt(req.query.limit,10)||20));
  const [rows,count]=await Promise.all([
   sql`SELECT r.id,r.prompt_id,r.reason,r.details,r.status,r.created_at,r.resolved_at,p.title AS prompt_title FROM community_reports r LEFT JOIN community_prompts p ON p.id=r.prompt_id WHERE (${status}='all' OR r.status=${status}) ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`,
   sql`SELECT count(*)::int AS count FROM community_reports WHERE (${status}='all' OR status=${status})`
  ]);
  return res.json({reports:rows,total:count[0]?.count||0,page,limit});
 }
 if(route==="report-state"&&method==="POST"){
  const id=Number(req.body.id),status=text(req.body.status,20);
  if(!Number.isSafeInteger(id)||id<1||!["resolved","dismissed"].includes(status))return error(400,"Báo cáo hoặc trạng thái không hợp lệ.");
  const rows=await sql`UPDATE community_reports SET status=${status},resolved_by=${user.id},resolved_at=now() WHERE id=${id} AND status='open' RETURNING id,prompt_id`;
  if(!rows.length)return error(409,"Báo cáo đã được xử lý.");
  await audit(user.id,rows[0].prompt_id,"report_"+status,String(id));
  return res.json({ok:true});
 }
 if(route==="audit"&&method==="GET"){
  if(!admin)return adminOnly();
  const page=Math.min(200,Math.max(1,parseInt(req.query.page,10)||1)),limit=Math.min(50,Math.max(1,parseInt(req.query.limit,10)||30));
  const [rows,count]=await Promise.all([
   sql`SELECT a.id,a.actor_id,a.prompt_id,a.action,a.note,a.created_at,u.email AS actor_email FROM community_audit a LEFT JOIN neon_auth."user" u ON u.id::text=a.actor_id ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${(page-1)*limit}`,
   sql`SELECT count(*)::int AS count FROM community_audit`
  ]);
  return res.json({logs:rows,total:count[0]?.count||0,page,limit});
 }
 if(route==="settings"&&method==="GET"){
  if(!admin)return adminOnly();
  const rows=await sql`SELECT key,value,updated_at FROM community_settings WHERE key IN('site_notice','submissions_open')`;
  return res.json({settings:Object.fromEntries(rows.map(x=>[x.key,x.value]))});
 }
 if(route==="settings-save"&&method==="POST"){
  if(!admin)return adminOnly();
  const notice=text(req.body.siteNotice,240),submissions=req.body.submissionsOpen;
  if(typeof submissions!=="boolean")return error(400,"Thiết lập không hợp lệ.");
  await sql`INSERT INTO community_settings(key,value,updated_by) VALUES('site_notice',${JSON.stringify(notice)}::jsonb,${user.id}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()`;
  await sql`INSERT INTO community_settings(key,value,updated_by) VALUES('submissions_open',${JSON.stringify(submissions)}::jsonb,${user.id}) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_by=excluded.updated_by,updated_at=now()`;
  await audit(user.id,"site","settings_change","submissions_open="+submissions);
  return res.json({ok:true});
 }
 if(route==="export"&&method==="GET"){
  if(!admin)return adminOnly();
  const [prompts,overrides,settings]=await Promise.all([
   sql`SELECT id,owner_id,title,summary,content,category,model,tags,status,featured,score,created_at,updated_at,deleted_at FROM community_prompts ORDER BY created_at DESC LIMIT 2000`,
   sql`SELECT id,overrides,hidden,updated_at FROM community_seed_overrides ORDER BY id`,
   sql`SELECT key,value FROM community_settings`
  ]);
  return res.json({format:"prompthub-admin-export",version:1,exportedAt:new Date().toISOString(),prompts,seedOverrides:overrides,settings:Object.fromEntries(settings.map(x=>[x.key,x.value]))});
 }
 return error(404,"Không tìm thấy chức năng quản trị.");
}catch(e){console.error("Admin API error",e?.message);return error(500,"Máy chủ quản trị gặp lỗi. Vui lòng thử lại.");}
};
