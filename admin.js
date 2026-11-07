(function buildAdmin(){
"use strict";
const $=id=>document.getElementById(id),all=x=>Array.from(document.querySelectorAll(x)),escape=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),short=(s,n=90)=>String(s??"").length>n?String(s??"").slice(0,n)+"…":String(s??""),date=v=>v?new Date(v).toLocaleString("vi-VN",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—",day=v=>v?new Date(v).toLocaleDateString("vi-VN"):"—",fmt=n=>new Intl.NumberFormat("vi-VN").format(n||0);
const categories=window.PROMPT_CATEGORIES||[],baseline=window.PROMPT_SEED||[],modelList=new Set(["Mọi AI","ChatGPT","Claude","Gemini","Midjourney","Khác"]);
const meta={overview:["DASHBOARD","Tổng quan hệ thống","Theo dõi prompt, hoạt động cộng đồng và các mục cần xử lý."],reviews:["KIỂM DUYỆT","Duyệt đóng góp","Chỉ những prompt được duyệt mới xuất hiện trong thư viện công khai."],prompts:["NỘI DUNG","Quản lý prompt cộng đồng","Tạo, sửa, phân loại, ẩn và khôi phục nội dung người dùng."],curated:["THƯ VIỆN MẪU","Prompt hệ thống","Quản lý bộ prompt mẫu mà không thay đổi dữ liệu gốc GitHub."],users:["TÀI KHOẢN","Quản lý người dùng","Phân quyền Admin, Moderator, Member và xử lý tài khoản bị khóa."],reports:["AN TOÀN CỘNG ĐỒNG","Báo cáo vi phạm","Xử lý các báo cáo được gửi bởi thành viên."],audit:["MINH BẠCH","Nhật ký quản trị","Theo dõi các hoạt động quản trị trên máy chủ."],settings:["CẤU HÌNH","Cài đặt website","Điều khiển thông báo và tính năng đóng góp của cộng đồng."]};
const state={user:null,role:null,panel:"overview",overview:null,prompts:[],users:[],reports:[],audits:[],overrides:new Map(),pending:[],totals:{},page:{reviews:1,prompts:1,curated:1,users:1,reports:1,audit:1},filters:{prompts:{q:"",status:"all"},users:{q:""},reports:{status:"open"},curated:{q:"",category:"all"}},confirm:null,detail:null,loading:false};
function toast(message,bad=false){
 const d=document.createElement("div");d.className="notice-toast"+(bad?" error":"");d.textContent=message;
 $("adminToast").append(d);setTimeout(()=>d.remove(),4400);
}
async function api(route,{method="GET",body,params={}}={}){
 const p=new URLSearchParams({route,...params}),response=await fetch("/api/admin?"+p,{method,credentials:"same-origin",headers:method==="POST"?{"Content-Type":"application/json"}:{},body:method==="POST"?JSON.stringify(body||{}):undefined,cache:"no-store"});
 const data=await response.json().catch(()=>({error:"Phản hồi máy chủ không hợp lệ."}));
 if(!response.ok){if([401,403].includes(response.status)&&data.error?.includes("quản trị"))showGate(data.error);throw Error(data.error||"Không thể hoàn thành yêu cầu.");}
 return data;
}
async function community(route,body){
 const r=await fetch("/api/community?route="+route,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"}),data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||"Không thể xử lý đóng góp.");
 return data;
}
function showGate(message){
 $("adminLayout").hidden=true;$("adminGate").hidden=false;$("gateTitle").textContent="Không thể truy cập quản trị";$("gateDescription").textContent=message||"Vui lòng đăng nhập và bảo đảm tài khoản có quyền admin hoặc moderator.";
}
function isAdmin(){return state.role==="admin"}
function permitted(panel){return isAdmin()||!["curated","users","audit","settings"].includes(panel)}
function setLoading(node){if(node)node.innerHTML='<div class="empty-note">Đang tải dữ liệu từ máy chủ…</div>'}
function empty(message){return '<div class="empty-note">'+escape(message)+'</div>'}
function statusLabel(status){return ({approved:"Công khai",pending:"Chờ duyệt",private:"Riêng tư",rejected:"Từ chối",deleted:"Đã xóa",open:"Chưa xử lý",resolved:"Đã xử lý",dismissed:"Không vi phạm",member:"Thành viên",moderator:"Kiểm duyệt",admin:"Admin"})[status]||status||"—"}
function pill(s){return '<span class="pill '+escape(s||"")+'">'+escape(statusLabel(s))+'</span>'}
function pager(id,data,section){const total=data.total||0,limit=data.limit||20,page=data.page||state.page[section]||1,pages=Math.max(1,Math.ceil(total/limit));$(id).innerHTML='<span>'+fmt(total)+' kết quả · Trang '+page+'/'+pages+'</span><button type="button" class="tiny-btn" data-page="'+section+'" data-num="'+(page-1)+'" '+(page<=1?"disabled":"")+' aria-label="Trang trước">‹ Trước</button><button type="button" class="tiny-btn" data-page="'+section+'" data-num="'+(page+1)+'" '+(page>=pages?"disabled":"")+' aria-label="Trang sau">Sau ›</button>'}
function go(section){
 if(!meta[section]||!permitted(section))section="overview";
 state.panel=section;location.hash=section;
 all("[data-content-panel]").forEach(e=>e.hidden=e.id!=="panel-"+section);
 all("[data-panel]").forEach(x=>x.classList.toggle("active",x.dataset.panel===section));
 $("currentTitle").textContent=meta[section][1];$("sectionEyebrow").textContent=meta[section][0];$("pageTitle").textContent=meta[section][1];$("pageSubtitle").textContent=meta[section][2];
 closeSidebar();
 load(section);
}
function openSidebar(){$("adminSidebar").classList.add("open");$("adminScrim").hidden=false}
function closeSidebar(){$("adminSidebar").classList.remove("open");$("adminScrim").hidden=true}
function renderOverview(o){
 state.overview=o;$("sidebarPending").textContent=o.prompts.pending||0;$("sidebarReports").textContent=o.reports.open||0;
 const items=[
 ["Thành viên","♙",o.users,"Đã đăng ký"],
 ["Prompt công khai","▤",(o.prompts.approved||0)+baseline.length-(o.seed.hidden||0),"Bao gồm bộ prompt mẫu"],
 ["Chờ xét duyệt","⏳",o.prompts.pending||0,"Đóng góp cần kiểm tra"],
 ["Báo cáo vi phạm","⚑",o.reports.open||0,"Cần xử lý"],
 ["Đã lưu","♡",o.favorites||0,"Lượt lưu trong database"],
 ["Prompt mẫu đã sửa","✦",o.seed.changed||0,"Tùy biến bởi quản trị"],
 ["Prompt chưa công khai","☷",(o.prompts.private||0)+(o.prompts.rejected||0),"Nháp và bài từ chối"],
 ["Thư viện mẫu","▦",baseline.length-(o.seed.hidden||0),"Prompt đang hiển thị"]
 ];
 $("overviewCards").innerHTML=items.map(x=>'<div class="stat-card"><div class="stat-top"><span class="stat-symbol">'+x[1]+'</span><span class="stat-chip">LIVE DATA</span></div><div class="stat-label">'+escape(x[0])+'</div><div class="stat-value">'+fmt(x[2])+'</div><div class="stat-hint">'+escape(x[3])+'</div></div>').join("");
 const today=new Date(),chart=[];for(let j=13;j>=0;j--){const d=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-j));const key=d.toISOString().slice(0,10);const v=o.recent.find(x=>x.day===key);chart.push({label:d.getUTCDate()+"/"+(d.getUTCMonth()+1),count:v?.count||0})}
 const max=Math.max(1,...chart.map(x=>x.count));
 $("activityChart").innerHTML=chart.map(x=>'<div class="bar-item" title="'+x.label+': '+x.count+' prompt"><span class="bar-count">'+x.count+'</span><div class="bar-fill" style="--h:'+Math.max(4,Math.round(x.count/max*115))+'px"></div><span class="bar-label">'+x.label+'</span></div>').join("");
 const catMax=Math.max(1,...o.categoryStats.map(x=>x.count));
 $("categoryChart").innerHTML=o.categoryStats.length?o.categoryStats.slice(0,7).map(c=>'<div class="category-line"><span>'+escape(categories.find(x=>x.id===c.category)?.name||c.category)+'</span><div class="category-meter"><span style="width:'+Math.round(c.count/catMax*100)+'%"></span></div><strong>'+c.count+'</strong></div>').join(""):empty("Chưa có prompt cộng đồng để thống kê.");
 $("statusSummary").innerHTML=["approved","pending","private","rejected"].map(key=>'<div class="status-card">'+pill(key)+'<strong>'+fmt(o.prompts[key]||0)+'</strong><span>Prompt '+statusLabel(key).toLowerCase()+'</span></div>').join("");
 $("recentAudit").innerHTML=o.activity.length?o.activity.map(x=>'<div class="compact-log-item"><strong>'+escape(short(x.action.replaceAll("_"," "),36))+'</strong><span>'+day(x.created_at)+'</span></div>').join(""):empty("Chưa có thao tác quản trị.");
}
async function loadOverview(){setLoading($("overviewCards"));const data=await api("overview");renderOverview(data)}
async function loadReviews(){
 setLoading($("reviewList"));const data=await api("prompts",{params:{status:"pending",page:state.page.reviews,limit:10}});
 state.pending=data.prompts;state.totals.reviews=data.total;
 $("sidebarPending").textContent=data.total;
 $("reviewList").innerHTML=data.prompts.length?data.prompts.map(p=>'<article class="review-item"><div class="review-meta">'+pill(p.status)+'<small>'+date(p.createdAt)+' · '+escape(short(p.id,44))+'</small></div><h3>'+escape(p.title)+'</h3><p>'+escape(p.summary)+' · '+escape(p.category)+'</p><pre class="review-preview">'+escape(short(p.content,520))+'</pre><div class="review-actions"><button type="button" class="btn btn-soft btn-small" data-action="view-review" data-id="'+escape(p.id)+'">Xem toàn bộ</button><button type="button" class="btn btn-soft btn-small" data-action="approve" data-id="'+escape(p.id)+'">✓ Duyệt</button><button type="button" class="btn btn-danger btn-small" data-action="reject" data-id="'+escape(p.id)+'">✕ Từ chối</button></div></article>').join(""):empty("Không có prompt nào đang chờ duyệt.");
 pager("reviewPager",data,"reviews");
}
async function loadPrompts(){
 setLoading($("promptTable"));const data=await api("prompts",{params:{...state.filters.prompts,page:state.page.prompts,limit:15}});state.prompts=data.prompts;state.totals.prompts=data.total;
 $("promptTable").innerHTML=data.prompts.length?data.prompts.map(p=>'<tr><td><div class="cell-main"><strong>'+escape(p.title)+'</strong><small>'+escape(short(p.id,40))+'</small></div></td><td>'+escape(categories.find(c=>c.id===p.category)?.name||p.category)+'</td><td>'+pill(p.deletedAt?"deleted":p.status)+'</td><td>'+day(p.createdAt)+'</td><td><div class="cell-actions"><button class="tiny-btn" data-action="view-prompt" data-id="'+escape(p.id)+'">Xem</button>'+(isAdmin()?'<button class="tiny-btn" data-action="edit-prompt" data-id="'+escape(p.id)+'">Sửa</button><button class="tiny-btn '+(p.deletedAt?"good":"warn")+'" data-action="'+(p.deletedAt?"restore":"delete")+'" data-id="'+escape(p.id)+'">'+(p.deletedAt?"Khôi phục":"Xóa")+'</button>':'')+'</div></td></tr>').join(""):'<tr><td colspan="5">'+empty("Chưa có prompt khớp bộ lọc.")+'</td></tr>';
 pager("promptPager",data,"prompts");
}
function seedEffective(p){const ov=state.overrides.get(p.id);return {...p,...(ov?.overrides||{}),hidden:ov?.hidden||false,changed:!!ov&&Object.keys(ov.overrides||{}).length>0}}
async function loadCurated(){
 if(!isAdmin())return;
 const data=await api("seed-overrides");state.overrides=new Map(data.items.map(x=>[x.id,x]));
 $("overridesCount").textContent=data.items.filter(x=>x.hidden||Object.keys(x.overrides||{}).length).length+" điều chỉnh";
 renderCurated();
}
function renderCurated(){
 const q=(state.filters.curated.q||"").toLocaleLowerCase("vi"),category=state.filters.curated.category;
 const items=baseline.map(seedEffective).filter(x=>(category==="all"||x.category===category)&&(!q||[x.id,x.title,x.summary,x.content].join(" ").toLocaleLowerCase("vi").includes(q)));
 const limit=15,page=state.page.curated,paged=items.slice((page-1)*limit,page*limit);
 $("seedTable").innerHTML=paged.length?paged.map(p=>'<tr><td><div class="cell-main"><strong>'+escape(p.title)+'</strong><small>'+escape(p.id)+'</small></div></td><td>'+escape(categories.find(c=>c.id===p.category)?.name||p.category)+'</td><td>'+pill(p.hidden?"deleted":"approved")+(p.featured?" <span class='soft-tag'>Nổi bật</span>":"")+'</td><td>'+ (p.changed?"Đã chỉnh sửa":"Bản gốc")+'</td><td><div class="cell-actions"><button type="button" class="tiny-btn" data-action="edit-seed" data-id="'+escape(p.id)+'">Sửa</button><button type="button" class="tiny-btn '+(p.hidden?"good":"warn")+'" data-action="toggle-seed" data-id="'+escape(p.id)+'">'+(p.hidden?"Hiện":"Ẩn")+'</button>'+(p.changed?'<button type="button" class="tiny-btn" data-action="reset-seed" data-id="'+escape(p.id)+'">Đặt lại</button>':"")+'</div></td></tr>').join(""):'<tr><td colspan="5">'+empty("Không tìm thấy prompt mẫu.")+'</td></tr>';
 pager("seedPager",{total:items.length,page,limit},"curated");
}
async function loadUsers(){
 if(!isAdmin())return;setLoading($("userTable"));const data=await api("users",{params:{...state.filters.users,page:state.page.users,limit:15}});state.users=data.users;
 $("userTable").innerHTML=data.users.length?data.users.map(u=>'<tr><td><div class="cell-main"><strong>'+escape(u.name||"Không có tên")+'</strong><small>'+escape(u.email)+'</small></div></td><td>'+pill(u.role)+'</td><td>'+fmt(u.prompt_count)+'</td><td>'+pill(u.suspended?"suspended":"active")+'</td><td><div class="cell-actions">'+(u.id===state.user.id?'<span class="soft-tag">Bạn</span>':'<select class="tiny-btn" data-user-role="'+escape(u.id)+'" aria-label="Đổi vai trò '+escape(u.email)+'"><option value="member" '+(u.role==="member"?"selected":"")+'>Thành viên</option><option value="moderator" '+(u.role==="moderator"?"selected":"")+'>Moderator</option><option value="admin" '+(u.role==="admin"?"selected":"")+'>Admin</option></select><button type="button" class="tiny-btn '+(u.suspended?"good":"warn")+'" data-action="'+(u.suspended?"unsuspend":"suspend")+'" data-id="'+escape(u.id)+'">'+(u.suspended?"Mở khóa":"Khóa")+'</button>')+'</div></td></tr>').join(""):'<tr><td colspan="5">'+empty("Không tìm thấy tài khoản.")+'</td></tr>';
 pager("userPager",data,"users");
}
async function loadReports(){
 setLoading($("reportList"));const data=await api("reports",{params:{...state.filters.reports,page:state.page.reports,limit:12}});state.reports=data.reports;$("sidebarReports").textContent=state.filters.reports.status==="open"?data.total:$("sidebarReports").textContent;
 const names={spam:"Spam",inappropriate:"Nội dung không phù hợp",misleading:"Sai lệch/gây hiểu nhầm",copyright:"Bản quyền",other:"Khác"};
 $("reportList").innerHTML=data.reports.length?data.reports.map(r=>'<article class="review-item"><div class="review-meta">'+pill(r.status)+'<small> Báo cáo #'+r.id+' · '+date(r.created_at)+'</small></div><h3>'+escape(r.prompt_title||r.prompt_id)+'</h3><p>Lý do: <strong>'+escape(names[r.reason]||r.reason)+'</strong> · Prompt '+escape(r.prompt_id)+'</p>'+(r.details?'<pre class="review-preview">'+escape(r.details)+'</pre>':"")+(r.status==="open"?'<div class="review-actions"><button class="btn btn-primary btn-small" data-action="resolve-report" data-id="'+r.id+'">✓ Đã xử lý</button><button class="btn btn-soft btn-small" data-action="dismiss-report" data-id="'+r.id+'">Bỏ qua</button><button class="btn btn-soft btn-small" data-action="locate-prompt" data-id="'+escape(r.prompt_id)+'">Xem prompt</button></div>':"")+'</article>').join(""):empty("Không có báo cáo trong danh sách này.");
 pager("reportPager",data,"reports");
}
async function loadAudit(){
 if(!isAdmin())return;setLoading($("auditTable"));const data=await api("audit",{params:{page:state.page.audit,limit:20}});state.audits=data.logs;
 $("auditTable").innerHTML=data.logs.length?data.logs.map(x=>'<tr><td>'+date(x.created_at)+'</td><td>'+escape(x.actor_email||short(x.actor_id,16))+'</td><td><strong>'+escape(x.action.replaceAll("_"," "))+'</strong></td><td>'+escape(short(x.prompt_id,35))+'</td><td>'+escape(short(x.note,100))+'</td></tr>').join(""):'<tr><td colspan="5">'+empty("Chưa có sự kiện quản trị.")+'</td></tr>';
 pager("auditPager",data,"audit");
}
async function loadSettings(){
 if(!isAdmin())return;const data=await api("settings");$("siteNotice").value=data.settings.site_notice||"";$("submissionsOpen").checked=data.settings.submissions_open!==false;
}
async function load(section=state.panel){
 try{
  if(section==="overview")await loadOverview();
  if(section==="reviews")await loadReviews();
  if(section==="prompts")await loadPrompts();
  if(section==="curated")await loadCurated();
  if(section==="users")await loadUsers();
  if(section==="reports")await loadReports();
  if(section==="audit")await loadAudit();
  if(section==="settings")await loadSettings();
  $("updatedAt").textContent="Cập nhật: "+new Date().toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"});
 }catch(e){toast(e.message,true)}
}
function modal(id){const element=$(id);if(!element.open)element.showModal()}
function close(id){const element=$(id);if(element.open)element.close()}
function confirmAction(title,message,callback,needsReason=false,reasonLabel="Lý do thực hiện"){
 state.confirm=callback;$("confirmTitle").textContent=title;$("confirmMessage").textContent=message;
 $("confirmReasonWrap").hidden=!needsReason;$("confirmReasonLabel").textContent=reasonLabel;$("confirmReason").value="";
 modal("confirmDialog");if(needsReason)$("confirmReason").focus();
}
async function executeConfirm(){
 if(!state.confirm)return;const callback=state.confirm,reason=$("confirmReason").value.trim(),needsReason=!$("confirmReasonWrap").hidden;
 if(needsReason&&!reason){$("confirmReason").focus();toast("Vui lòng nhập lý do.",true);return}
 $("confirmExecute").disabled=true;
 try{await callback(reason);close("confirmDialog");state.confirm=null;toast("Đã cập nhật thành công.");await load(state.panel);if(state.overview)loadOverview().catch(()=>{});}
 catch(e){toast(e.message,true)}finally{$("confirmExecute").disabled=false}
}
function openEditor(type,p){
 if(!isAdmin())return;
 $("editorForm").reset();$("editMode").value=type;$("editId").value=p?.id||"";$("editorTitle").textContent=type==="seed"?"Chỉnh sửa prompt hệ thống":p?"Chỉnh sửa prompt":"Thêm prompt mới";
 $("editTitle").value=p?.title||"";$("editSummary").value=p?.summary||"";$("editContent").value=p?.content||"";
 $("editCategory").value=p?.category||categories[0]?.id||"writing";$("editModel").value=modelList.has(p?.model)?p.model:"Mọi AI";
 $("editTags").value=(p?.tags||[]).join(", ");$("editScore").value=p?.score||0;$("editFeatured").checked=!!p?.featured;
 $("editStatusWrap").hidden=type==="seed";$("editStatus").value=p?.status==="approved"?"approved":"private";if(!p||type==="seed")$("editStatus").value="approved";
 modal("editorDialog");
}
async function saveEditor(e){
 e.preventDefault();if(!isAdmin())return;
 const obj={id:$("editId").value||undefined,title:$("editTitle").value.trim(),summary:$("editSummary").value.trim(),content:$("editContent").value.trim(),category:$("editCategory").value,model:$("editModel").value,tags:$("editTags").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,6),score:Number($("editScore").value)||0,featured:$("editFeatured").checked,status:$("editStatus").value};
 const type=$("editMode").value;const submit=$("saveEditor");submit.disabled=true;
 try{
  if(type==="seed")await api("seed-save",{method:"POST",body:obj});
  else await api("prompt-save",{method:"POST",body:obj});
  close("editorDialog");toast("Đã lưu prompt và cập nhật database.");await load(state.panel);
 }catch(err){toast(err.message,true)}finally{submit.disabled=false}
}
function viewPrompt(p){
 state.detail=p;$("detailTitle").textContent=p.title;
 $("detailInfo").innerHTML='<strong>'+escape(p.title)+'</strong><div>'+escape(p.summary)+'<p style="margin-top:9px">Danh mục: '+escape(p.category)+' · '+escape(p.model)+' · '+pill(p.status||"private")+'</p><p>ID: '+escape(p.id)+'</p></div>';
 $("detailText").textContent=p.content;
 const act=$("detailActions");act.innerHTML='<button type="button" class="btn btn-soft" data-close-modal="detailDialog">Đóng</button>';
 if(p.status==="pending"){
  act.innerHTML='<button class="btn btn-danger" type="button" data-action="detail-reject">Từ chối</button><button class="btn btn-primary" type="button" data-action="detail-approve">Duyệt công khai</button>'+act.innerHTML;
 }
 modal("detailDialog");
}
function action(id,mode){
 const p=state.prompts.find(x=>x.id===id)||state.pending.find(x=>x.id===id)||baseline.map(seedEffective).find(x=>x.id===id);
 if(["view-prompt","view-review"].includes(mode)){if(p)viewPrompt(p);return}
 if(mode==="edit-prompt"){if(p)openEditor("community",p);return}
 if(mode==="edit-seed"){if(p)openEditor("seed",p);return}
 if(mode==="approve"||mode==="reject"||mode==="detail-approve"||mode==="detail-reject"){
  const target=mode.startsWith("detail-")?state.detail?.id:id,approve=mode.includes("approve");if(!target)return;
  close("detailDialog");
  confirmAction(approve?"Duyệt prompt":"Từ chối prompt",(approve?"Xuất bản ":"Từ chối ")+target+"? Quyết định sẽ được ghi vào nhật ký.",async(reason)=>{
   await community("review",{id:target,action:approve?"approve":"reject",reason});
  },!approve,"Lý do từ chối");
  return;
 }
 if(mode==="toggle-seed"){
  const src=state.overrides.get(id),hidden=!src?.hidden;confirmAction(hidden?"Ẩn prompt mẫu":"Hiện prompt mẫu","Thay đổi trạng thái hiển thị của "+id+". Bản gốc trên GitHub không bị thay đổi.",()=>api("seed-visibility",{method:"POST",body:{id,hidden}}));
  return;
 }
 if(mode==="reset-seed"){confirmAction("Khôi phục nội dung gốc","Đặt lại các nội dung đã sửa cho "+id+". Trạng thái ẩn/hiện vẫn giữ nguyên.",()=>api("seed-reset",{method:"POST",body:{id}}));return}
 if(["delete","restore","feature","unfeature","unpublish"].includes(mode)){
  confirmAction(mode==="delete"?"Chuyển vào thùng rác":"Thay đổi trạng thái",mode==="delete"?"Ẩn prompt "+id+" khỏi thư viện, vẫn có thể khôi phục.":"Xác nhận "+mode+" đối với "+id,()=>api("prompt-state",{method:"POST",body:{id,action:mode}}));
  return;
 }
 if(mode==="suspend"||mode==="unsuspend"){
  const user=state.users.find(x=>x.id===id);if(!user)return;
  confirmAction(mode==="suspend"?"Khóa tài khoản":"Mở khóa tài khoản",(mode==="suspend"?"Ngăn ":"Khôi phục ")+"khả năng sử dụng tính năng cộng đồng cho "+user.email+".",reason=>api("user-action",{method:"POST",body:{id,action:mode,reason}}),mode==="suspend","Lý do khóa tài khoản");
  return;
 }
 if(mode==="resolve-report"||mode==="dismiss-report"){
  confirmAction("Xử lý báo cáo","Xác nhận "+(mode==="resolve-report"?"đã xử lý":"báo cáo không vi phạm")+" #"+id+"?",()=>api("report-state",{method:"POST",body:{id:Number(id),status:mode==="resolve-report"?"resolved":"dismissed"}}));return;
 }
 if(mode==="locate-prompt"){
  go("prompts");$("promptSearch").value=id;$("promptStatus").value="all";state.filters.prompts={q:id,status:"all"};state.page.prompts=1;loadPrompts();return;
 }
}
async function exportData(){
 try{const data=await api("export");const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="prompthub-admin-export-"+new Date().toISOString().slice(0,10)+".json";link.click();URL.revokeObjectURL(url);toast("Đã xuất dữ liệu (không bao gồm mật khẩu).");}
 catch(e){toast(e.message,true)}
}
async function login(){
 $("gateTitle").textContent="Đang kiểm tra quyền…";$("gateDescription").textContent="Đang xác thực phiên làm việc và vai trò từ máy chủ.";
 try{
  const data=await api("me");state.user=data.user;state.role=data.role;
  if(!["admin","moderator"].includes(state.role))throw Error("Tài khoản không được cấp quyền quản trị.");
  $("adminGate").hidden=true;$("adminLayout").hidden=false;
  $("roleBadge").textContent=state.role==="admin"?"SUPER ADMIN":"MODERATOR";$("accountEmail").textContent=state.user.email;
  all("[data-admin-only]").forEach(x=>x.hidden=!isAdmin());
  $("editCategory").innerHTML=categories.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join("");
  $("seedCategory").innerHTML='<option value="all">Tất cả danh mục</option>'+categories.map(x=>'<option value="'+escape(x.id)+'">'+escape(x.name)+'</option>').join("");
  go(location.hash.slice(1)||"overview");
 }catch(e){showGate(e.message)}
}
function listen(){
 $("gateRetry").addEventListener("click",login);
 $("navToggle").addEventListener("click",openSidebar);$("adminScrim").addEventListener("click",closeSidebar);
 $("refreshCurrent").addEventListener("click",()=>load(state.panel));
 $("reloadReviews").addEventListener("click",loadReviews);
 $("applyPromptFilter").addEventListener("click",()=>{state.filters.prompts={q:$("promptSearch").value.trim(),status:$("promptStatus").value};state.page.prompts=1;loadPrompts()});
 $("applySeedFilter").addEventListener("click",()=>{state.filters.curated={q:$("seedSearch").value.trim(),category:$("seedCategory").value};state.page.curated=1;renderCurated()});
 $("applyUserFilter").addEventListener("click",()=>{state.filters.users={q:$("userSearch").value.trim()};state.page.users=1;loadUsers()});
 $("reloadReports").addEventListener("click",()=>{state.filters.reports.status=$("reportStatus").value;state.page.reports=1;loadReports()});
 $("addPrompt").addEventListener("click",()=>openEditor("community",null));$("exportPrompts").addEventListener("click",exportData);
 $("editorForm").addEventListener("submit",saveEditor);$("confirmExecute").addEventListener("click",executeConfirm);
 $("settingsForm").addEventListener("submit",async e=>{e.preventDefault();try{await api("settings-save",{method:"POST",body:{siteNotice:$("siteNotice").value.trim(),submissionsOpen:$("submissionsOpen").checked}});toast("Đã áp dụng thiết lập trên website.");await loadOverview()}catch(e){toast(e.message,true)}});
 $("logoutAdmin").addEventListener("click",async()=>{try{await fetch("/api/auth/sign-out",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:"{}"})}catch(e){}location.href="/"});
 document.addEventListener("click",e=>{
  if(!(e.target instanceof Element))return;
  const cl=e.target.closest("[data-close-modal]");if(cl){close(cl.dataset.closeModal);return}
  const goTo=e.target.closest("[data-panel],[data-go]");if(goTo){go(goTo.dataset.panel||goTo.dataset.go);return}
  const actionButton=e.target.closest("[data-action]");if(actionButton){action(actionButton.dataset.id||"",actionButton.dataset.action);return}
  const pageButton=e.target.closest("[data-page]");if(pageButton){const name=pageButton.dataset.page,num=Number(pageButton.dataset.num);if(num>0&&num<=200){state.page[name]=num;load(name)}return}
 });
 document.addEventListener("change",e=>{
  if(!(e.target instanceof Element))return;
  const el=e.target.closest("[data-user-role]");if(!el||!isAdmin())return;
  const id=el.dataset.userRole,user=state.users.find(x=>x.id===id),role=el.value;if(!user||role===user.role)return;
  el.value=user.role;
  confirmAction("Thay đổi phân quyền","Cấp vai trò "+statusLabel(role)+" cho "+user.email+"? Quyền sẽ có hiệu lực ngay khi các API kiểm tra lại phiên.",()=>api("user-action",{method:"POST",body:{id,action:"role",role}}));
 });
 window.addEventListener("hashchange",()=>{const view=location.hash.slice(1);if(state.user&&meta[view]&&view!==state.panel)go(view)});
 all("dialog").forEach(el=>el.addEventListener("click",e=>{if(e.target===el)el.close()}));
}
listen();
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",login);
else login();
})();
