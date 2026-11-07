(function client(){
"use strict";
const S={user:null,role:null,hooks:null,queue:[]},$=id=>document.getElementById(id),escape=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(route,body){const r=await fetch("/api/community?route="+route,{method:body?"POST":"GET",headers:body?{"Content-Type":"application/json"}:{},body:body?JSON.stringify(body):undefined});const x=await r.json();if(!r.ok)throw Error(x.error||"Yêu cầu không thành công.");return x}
async function auth(route,data){const r=await fetch("/api/auth/"+route,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const x=await r.json().catch(()=>({}));if(!r.ok)throw Error(x.message||"Xác thực thất bại.");return x}
function init(hooks){
S.hooks=hooks;
const btn=document.createElement("button");btn.id="accountBtn";btn.type="button";btn.className="button button-outline account-button";btn.textContent="Đăng nhập";document.querySelector(".topbar-end").prepend(btn);
const panel=document.createElement("section");panel.id="moderationPanel";panel.className="moderation-panel";panel.hidden=true;$("explore").after(panel);
const dlg=document.createElement("dialog");dlg.id="accountDialog";dlg.className="dialog account-dialog";
dlg.innerHTML='<div class="dialog-head"><div><span class="section-overline">PROMPTHUB COMMUNITY</span><h2 id="accountTitle">Đăng nhập</h2><p id="accountInfo">Lưu và đồng bộ prompt trên các thiết bị.</p></div><button type="button" class="dialog-x" id="accountClose">×</button></div><form id="accountForm" class="editor-form"><label id="accountNameRow" hidden>Họ tên <input id="accountName" maxlength="80" autocomplete="name"></label><label>Email<input id="accountEmail" type="email" required autocomplete="email"></label><label>Mật khẩu<input id="accountPassword" type="password" minlength="8" required autocomplete="current-password"></label><p id="accountError" class="auth-error" role="alert"></p><div class="form-actions"><button type="button" class="button button-outline" id="accountSwitch">Đăng ký</button><button type="submit" class="button button-primary" id="accountSubmit">Đăng nhập</button></div></form><div id="accountProfile" class="profile-actions" hidden><p id="profileText"></p><button type="button" class="button button-outline" id="accountLogout">Đăng xuất</button></div>';
document.body.appendChild(dlg);
btn.addEventListener("click",()=>showAccount());$("accountClose").addEventListener("click",()=>dlg.close());$("accountSwitch").addEventListener("click",()=>showAccount($("accountTitle").textContent!=="Đăng ký"));$("accountLogout").addEventListener("click",logout);$("accountForm").addEventListener("submit",submitAccount);
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
const f=document.querySelector(".footer span:last-child");if(f)f.textContent="Prompt công khai được kiểm duyệt · Đăng nhập để đồng bộ giữa các thiết bị.";
refresh();
}
function showAccount(register=false){
$("accountDialog").open||$("accountDialog").showModal();$("accountError").textContent="";
$("accountForm").hidden=!!S.user;$("accountProfile").hidden=!S.user;
if(S.user){$("accountTitle").textContent="Tài khoản của tôi";$("accountInfo").textContent=S.user.email||"";$("profileText").textContent="Xin chào "+(S.user.name||"thành viên")+". Prompt của bạn đã được đồng bộ.";return}
$("accountTitle").textContent=register?"Đăng ký":"Đăng nhập";$("accountInfo").textContent="Dùng email và mật khẩu để đồng bộ thư viện.";$("accountNameRow").hidden=!register;$("accountName").required=register;$("accountPassword").autocomplete=register?"new-password":"current-password";$("accountSwitch").textContent=register?"Đã có tài khoản? Đăng nhập":"Chưa có tài khoản? Đăng ký";$("accountSubmit").textContent=register?"Tạo tài khoản":"Đăng nhập";
}
async function submitAccount(e){
e.preventDefault();$("accountSubmit").disabled=true;$("accountError").textContent="";
try{const register=$("accountTitle").textContent==="Đăng ký",email=$("accountEmail").value.trim(),password=$("accountPassword").value;await auth(register?"sign-up/email":"sign-in/email",register?{name:$("accountName").value.trim()||email.split("@")[0],email,password}:{email,password});$("accountDialog").close();await refresh();S.hooks.toast(S.user?"Đăng nhập thành công!":"Tài khoản đã tạo. Vui lòng đăng nhập để tiếp tục.");}
catch(e){$("accountError").textContent=e.message}finally{$("accountSubmit").disabled=false}
}
async function logout(){
try{await auth("sign-out",{})}catch(e){console.warn(e)}
S.user=null;S.role=null;$("accountDialog").close();S.hooks.state.custom=S.hooks.readLocal();S.hooks.state.favorites=new Set(S.hooks.readFavorites());await refresh();S.hooks.toast("Bạn đã đăng xuất.");
}
async function refreshPublic(){try{const x=await api("public");S.hooks.state.shared=Array.isArray(x.prompts)?x.prompts:[]}catch(e){console.warn("Public API:",e.message)}S.hooks.render()}
async function refresh(){
try{const p=await api("profile");S.user=p.user;S.role=p.role}catch(e){S.user=null;S.role=null}
if(S.user){
const key="prompthub_migrated_"+S.user.id;
if(!localStorage.getItem(key)){try{await api("import",{prompts:S.hooks.readLocal(),favorites:S.hooks.readFavorites()});localStorage.setItem(key,"true")}catch(e){S.hooks.toast("Không nhập được dữ liệu cũ: "+e.message,true)}}
try{const x=await api("mine");S.hooks.state.custom=x.prompts||[];S.hooks.state.favorites=new Set(x.favorites||[])}catch(e){S.hooks.toast("Không đồng bộ được: "+e.message,true)}
}else{S.hooks.state.custom=S.hooks.readLocal();S.hooks.state.favorites=new Set(S.hooks.readFavorites())}
$("accountBtn").textContent=S.user?(S.user.name||"Tài khoản"):"Đăng nhập";
let b=$("moderationBtn");if(["admin","moderator"].includes(S.role)){if(!b){b=document.createElement("button");b.id="moderationBtn";b.className="button button-outline";b.textContent="Quản trị";document.querySelector(".topbar-end").prepend(b);b.addEventListener("click",openQueue)}b.hidden=false}else if(b)b.hidden=true;
await refreshPublic();
}
async function openQueue(){
try{const x=await api("queue");S.queue=x.prompts||[];const panel=$("moderationPanel");panel.hidden=false;panel.innerHTML='<div class="subsection-header"><h2>Đóng góp đang chờ duyệt ('+S.queue.length+')</h2><button type="button" class="text-action" id="hideQueue">Đóng ×</button></div>'+(S.queue.map(p=>'<article class="review-card"><h3>'+escape(p.title)+'</h3><p>'+escape(p.summary)+'</p><small>Người gửi: '+escape(p.ownerId)+'</small><pre>'+escape(p.content)+'</pre><div class="form-actions"><button class="button button-outline" data-reject="'+escape(p.id)+'">Từ chối</button><button class="button button-primary" data-approve="'+escape(p.id)+'">Duyệt</button></div></article>').join("")||"<p>Không có prompt nào đang chờ duyệt.</p>");$("hideQueue").onclick=()=>panel.hidden=true;panel.querySelectorAll("[data-approve],[data-reject]").forEach(b=>b.addEventListener("click",async()=>{const action=b.hasAttribute("data-approve")?"approve":"reject",id=b.dataset.approve||b.dataset.reject,reason=action==="reject"?prompt("Lý do từ chối:"):"";if(action==="reject"&&!reason?.trim())return;b.disabled=true;try{await api("review",{id,action,reason});S.hooks.toast("Đã xử lý đóng góp.");await openQueue();await refreshPublic()}catch(e){S.hooks.toast(e.message,true);b.disabled=false}}));panel.scrollIntoView({behavior:"smooth"});}
catch(e){S.hooks.toast(e.message,true)}
}
async function importCloud(prompts,favorites){if(!S.user)return false;await api("import",{prompts,favorites});await refresh();return true}
async function save(p){const result=await api("save",p);await refresh();return result}
async function remove(id){await api("remove",{id});await refresh()}
async function favorite(id,saved){if(!S.user)return;try{await api("favorite",{id,saved})}catch(e){S.hooks.toast(e.message,true);await refresh()}}
async function contribute(id){if(!S.user){showAccount();return}try{await api("submit",{id});await refresh();S.hooks.toast("Đã gửi prompt để quản trị viên xét duyệt.")}catch(e){S.hooks.toast(e.message,true)}}
window.PromptHubCommunity={init,save,remove,favorite,contribute,importCloud,get signedIn(){return !!S.user},get user(){return S.user},get role(){return S.role}};
})();
