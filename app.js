(function app() {
  "use strict";
  const $ = id => document.getElementById(id);
  const categories = Array.isArray(window.PROMPT_CATEGORIES) ? window.PROMPT_CATEGORIES : [];
  const seed = Array.isArray(window.PROMPT_SEED) ? window.PROMPT_SEED : [];
  const CATEGORY_IDS = new Set(categories.map(c => c.id));
  const MODELS = new Set(["Mọi AI", "ChatGPT", "Claude", "Gemini", "Midjourney", "Khác"]);
  const KEYS = {custom: "prompthub_custom_v1", favorites: "prompthub_favorites_v1", theme: "prompthub_theme_v1"};
  const read = (key, fallback) => {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (_) { toast("Không thể lưu dữ liệu trên trình duyệt này.", true); }
  };
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const fold = value => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  const trim = (value, limit) => String(value ?? "").trim().slice(0, limit);
  const normalizePrompt = (raw, preserveId = true) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const title = trim(raw.title, 100), summary = trim(raw.summary, 240), content = trim(raw.content, 12000);
    if (!title || !summary || !content) return null;
    const category = CATEGORY_IDS.has(raw.category) ? raw.category : "creative";
    const tags = (Array.isArray(raw.tags) ? raw.tags : []).slice(0, 6).map(x => trim(x, 25)).filter(Boolean);
    const id = preserveId && typeof raw.id === "string" && /^custom-[a-zA-Z0-9-]{1,90}$/.test(raw.id) ? raw.id : generateId();
    return {id, title, summary, content, category, tags, model: MODELS.has(raw.model) ? raw.model : "Mọi AI", featured:false, score:0, createdAt: /^\d{4}-\d\d-\d\d$/.test(raw.createdAt) ? raw.createdAt : new Date().toISOString().slice(0,10), isCustom:true};
  };
  function generateId() {
    return "custom-" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now() + "-" + Math.random().toString(36).slice(2,10));
  }
  const storedCustom = read(KEYS.custom, []);
  const storedFav = read(KEYS.favorites, []);
  const state = {
    view:"all", category:"all", query:"", sort:"popular", shared:[], visibleLimit:24,
    custom:(Array.isArray(storedCustom) ? storedCustom : []).slice(0,500).map(x=>normalizePrompt(x)).filter(Boolean),
    favorites:new Set((Array.isArray(storedFav) ? storedFav : []).filter(x=>typeof x === "string")),
    dark:read(KEYS.theme,false) === true
  };
  const all = () => seed.concat(state.shared.filter(p=>!state.custom.some(c=>c.id===p.id))).concat(state.custom);
  const findPrompt = id => all().find(p=>p.id === id);
  const getCategory = id => categories.find(c=>c.id === id) || categories[0] || {name:"Khác",icon:"✦",color:"purple"};
  function toast(message, error = false) {
    const holder = $("toastStack");
    if (!holder) return;
    const n = document.createElement("div");
    n.className = "toast" + (error ? " error" : "");
    n.textContent = message;
    holder.appendChild(n);
    setTimeout(()=>n.remove(),3200);
  }
  function closeSidebar() { $("appShell").classList.remove("sidebar-open"); }
  function updateTheme() {
    document.body.classList.toggle("dark",state.dark);
    $("themeToggle").textContent = state.dark ? "☀" : "☾";
    $("themeToggle").setAttribute("aria-label",state.dark ? "Bật giao diện sáng" : "Bật giao diện tối");
  }
  function navigate(view = "all", category = "all") {
    state.view = view;
    state.category = category;
    state.visibleLimit = 24;
    closeSidebar();
    render();
    $("explore").scrollIntoView({behavior:"smooth",block:"start"});
  }
  function getVisible() {
    const query = fold(state.query.trim());
    let items = all().filter(p => {
      if (state.view === "featured" && !p.featured) return false;
      if (state.view === "trending" && !p.trending) return false;
      if (state.view === "favorites" && !state.favorites.has(p.id)) return false;
      if (state.view === "mine" && !p.isCustom) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
      if (!query) return true;
      return fold([p.title,p.summary,p.content,p.model,getCategory(p.category).name,...p.tags].join(" ")).includes(query);
    });
    if (state.sort === "az") items.sort((a,b)=>a.title.localeCompare(b.title,"vi"));
    else if (state.sort === "latest") items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
    else items.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title,"vi"));
    return items;
  }
  function cardMarkup(p) {
    const cat=getCategory(p.category), favorite=state.favorites.has(p.id);
    const tags=p.tags.slice(0,3).map(t=>'<span class="tag">#'+escapeHTML(t)+'</span>').join("");
    return '<article class="prompt-card" role="button" tabindex="0" data-open="'+escapeHTML(p.id)+'" aria-label="Xem prompt: '+escapeHTML(p.title)+'">' +
      '<div class="card-top"><span class="card-emoji '+cat.color+'">'+escapeHTML(cat.icon)+'</span><span class="card-category">'+escapeHTML(cat.name)+'</span>' +
      (p.isCustom ? '<span class="card-my-label">Của tôi</span>' : (p.trending ? '<span class="trend-mark" title="Biên soạn từ xu hướng cộng đồng">🔥 Xu hướng</span>' : '')) +
      '<button class="save-button'+(favorite?' saved':'')+'" type="button" aria-label="'+(favorite?'Bỏ lưu':'Lưu')+' '+escapeHTML(p.title)+'" aria-pressed="'+favorite+'" data-save="'+escapeHTML(p.id)+'">'+(favorite?'♥':'♡')+'</button></div>' +
      '<h4>'+escapeHTML(p.title)+'</h4><p>'+escapeHTML(p.summary)+'</p><div class="card-tags">'+tags+'</div>' +
      '<div class="card-foot"><span class="model-label"><span>✦</span>'+escapeHTML(p.model)+'</span><button type="button" class="copy-mini" data-copy="'+escapeHTML(p.id)+'">↗ Sao chép</button></div></article>';
  }
  function featuredMarkup(p, i) {
    const cat=getCategory(p.category), favorite=state.favorites.has(p.id), tones=["purple","peach","blue"];
    return '<article role="button" tabindex="0" class="featured-card '+tones[i%tones.length]+'" data-open="'+escapeHTML(p.id)+'" aria-label="Xem prompt '+escapeHTML(p.title)+'">' +
      '<div class="feat-top"><span class="feat-icon">'+escapeHTML(cat.icon)+'</span><button type="button" class="feat-saved'+(favorite?' saved':'')+'" data-save="'+escapeHTML(p.id)+'" aria-label="'+(favorite?'Bỏ lưu':'Lưu')+'" aria-pressed="'+favorite+'">'+(favorite?'♥':'♡')+'</button></div>' +
      '<h4>'+escapeHTML(p.title)+'</h4><p>'+escapeHTML(p.summary)+'</p><div class="feat-bottom"><span>'+escapeHTML(cat.name)+' · '+escapeHTML(p.model)+'</span><strong>↗</strong></div></article>';
  }
  function renderCategoryNav() {
    const counts = all().reduce((acc,p)=>(acc[p.category]=(acc[p.category]||0)+1,acc),{});
    $("categoryCount").textContent=categories.length+" nhóm";
    $("categoryNav").innerHTML = categories.map(c=>'<button type="button" class="category-item'+(state.category===c.id?' active':'')+'" data-category="'+escapeHTML(c.id)+'"><span class="category-symbol">'+escapeHTML(c.icon)+'</span>'+escapeHTML(c.name)+'<span class="category-total">'+(counts[c.id]||0)+'</span></button>').join("");
    $("quickFilters").innerHTML='<button type="button" class="chip'+(state.category==="all"?" active":"")+'" data-category="all">✦ Tất cả</button>'+categories.map(c=>'<button type="button" class="chip'+(state.category===c.id?' active':'')+'" data-category="'+escapeHTML(c.id)+'">'+escapeHTML(c.icon)+' '+escapeHTML(c.name)+'</button>').join("");
  }
  function render() {
    const items=getVisible();
    const total=all().length;
    const viewNames={all:"Khám phá",featured:"Nổi bật",trending:"Xu hướng cộng đồng",favorites:"Đã lưu",mine:"Prompt của tôi"};
    const title=state.view === "all" && state.category !== "all" ? getCategory(state.category).name : ({all:"Tất cả prompt",featured:"Prompt nổi bật",trending:"Prompt xu hướng",favorites:"Prompt đã lưu",mine:"Prompt của tôi"}[state.view]||"Tất cả prompt");
    $("breadcrumbText").textContent=state.category!=="all" ? getCategory(state.category).name : viewNames[state.view];
    $("libraryTitle").textContent=title;
    $("resultCount").textContent=items.length+" prompt";
    $("statPrompts").textContent=String(total);
    $("statCategories").textContent=String(categories.length);
    $("statSaved").textContent=String([...state.favorites].filter(id=>Boolean(findPrompt(id))).length);
    $("favoriteCount").textContent=$("statSaved").textContent;
    $("heroPromptCount").textContent=total+" prompt sẵn sàng";
    $("promptGrid").innerHTML=items.slice(0,state.visibleLimit).map(cardMarkup).join("");
    $("loadMoreBtn").hidden=items.length<=state.visibleLimit;
    $("loadMoreBtn").textContent="Xem thêm prompt · "+Math.min(state.visibleLimit,items.length)+"/"+items.length;
    $("emptyState").hidden=items.length!==0;
    $("clearFilters").hidden=state.view==="all"&&state.category==="all"&&!state.query;
    const showFeatured=state.view==="all"&&state.category==="all"&&!state.query.trim();
    $("featuredSection").hidden=!showFeatured;
    $("trendingSection").hidden=!showFeatured;
    $("trendingCount").textContent=String(seed.filter(p=>p.trending).length);
    if(showFeatured) $("trendingGrid").innerHTML=seed.filter(p=>p.trending).slice(0,6).map(cardMarkup).join("");
    if(showFeatured) $("featuredGrid").innerHTML=seed.filter(p=>p.featured).slice(0,3).map(featuredMarkup).join("");
    document.querySelectorAll("[data-view]").forEach(el=>el.classList.toggle("active",el.dataset.view===state.view));
    renderCategoryNav();
  }
  async function copy(text) {
    try {
      if(navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const el=document.createElement("textarea"); el.value=text; el.setAttribute("readonly",""); el.style.position="fixed"; el.style.opacity="0"; document.body.appendChild(el);el.select();
        const ok=document.execCommand("copy");el.remove();if(!ok)throw new Error("not copied");
      }
      toast("Đã sao chép prompt vào bộ nhớ tạm!");
    } catch (_) { toast("Không thể tự sao chép. Hãy chọn và sao chép nội dung thủ công.",true); }
  }
  function toggleFavorite(id) {
    if(!findPrompt(id))return;
    if(state.favorites.has(id))state.favorites.delete(id);else state.favorites.add(id);
    if(window.PromptHubCommunity?.signedIn)window.PromptHubCommunity.favorite(id,state.favorites.has(id));else write(KEYS.favorites,[...state.favorites]);render();
    if($("detailDialog").open && $("detailDialog").dataset.prompt===id) openDetail(id,true);
  }
  function showDialog(dialog) {
    if(typeof dialog.showModal==="function"){if(!dialog.open)dialog.showModal();}
    else dialog.setAttribute("open","");
  }
  function closeDialog(dialog) {if(typeof dialog.close==="function"&&dialog.open) dialog.close();else dialog.removeAttribute("open");}
  function openDetail(id,refresh=false) {
    const p=findPrompt(id);if(!p)return;
    const cat=getCategory(p.category),saved=state.favorites.has(id);
    const tags=p.tags.map(t=>'<span class="tag">#'+escapeHTML(t)+'</span>').join("");
    const sourceLink=p.trending && typeof p.sourceUrl==="string" && /^https:\/\/(www\.reddit\.com|github\.com)\//.test(p.sourceUrl) ? '<p class="prompt-source">🔎 Chủ đề tham khảo: <a href="'+escapeHTML(p.sourceUrl)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(p.sourceName||"Cộng đồng AI")+' ↗</a><span>Prompt đã được biên soạn lại, không sao chép nguyên văn.</span></p>' : "";
    $("detailContent").innerHTML='<div class="detail-main"><div class="detail-eyebrow"><span class="detail-emoji">'+escapeHTML(cat.icon)+'</span>'+escapeHTML(cat.name)+' <span>·</span> '+escapeHTML(p.model)+'<button class="dialog-x" type="button" data-close="detail" style="margin-left:auto" aria-label="Đóng">×</button></div>' +
      '<h2 id="detailTitle">'+escapeHTML(p.title)+'</h2><p class="detail-desc">'+escapeHTML(p.summary)+'</p>'+sourceLink+'<div class="detail-tags">'+tags+'</div>' +
      '<div class="detail-code-head"><span>NỘI DUNG PROMPT</span><span style="color:var(--muted);font-size:10px">'+p.content.length+' ký tự</span></div><pre class="prompt-text" id="detailPromptText"></pre>' +
      '<div class="detail-actions"><button class="button button-primary" type="button" data-copy="'+escapeHTML(id)+'">⧉ Sao chép prompt</button><button class="button button-outline" type="button" data-save="'+escapeHTML(id)+'">'+(saved?'♥ Đã lưu':'♡ Lưu prompt')+'</button>' +
      (p.isCustom?'<button class="button button-outline" type="button" data-edit="'+escapeHTML(id)+'">✎ Sửa</button><button class="button button-outline" type="button" data-delete="'+escapeHTML(id)+'">Xóa</button>'+(window.PromptHubCommunity?.signedIn&&(!p.status||p.status==='private'||p.status==='rejected')?'<button class="button button-primary" type="button" data-contribute="'+escapeHTML(id)+'">↗ Đóng góp công khai</button>':'')+(p.status?'<span class="review-status">'+escapeHTML(({private:'Riêng tư',pending:'Chờ duyệt',approved:'Đã duyệt',rejected:'Bị từ chối'}[p.status]||p.status))+'</span>':''):'')+
      '<button class="button button-outline" type="button" data-download="'+escapeHTML(id)+'">↓ .txt</button></div><p class="detail-footnote">Mẹo: Thay nội dung trong [DẤU NGOẶC] bằng thông tin thực tế trước khi gửi cho AI.</p></div>';
    $("detailPromptText").textContent=p.content;
    $("detailDialog").dataset.prompt=id;
    if(!refresh)showDialog($("detailDialog"));
  }
  function openEditor(id) {
    const p=id?state.custom.find(x=>x.id===id):null;
    $("promptForm").reset();
    $("editPromptId").value=p?p.id:"";
    $("editorDialogTitle").textContent=p?"Chỉnh sửa prompt":"Tạo prompt của bạn";
    if(p){
      $("formTitle").value=p.title;$("formSummary").value=p.summary;$("formCategory").value=p.category;
      $("formTags").value=p.tags.join(", ");$("formContent").value=p.content;$("formModel").value=p.model;
    }
    closeDialog($("detailDialog"));
    showDialog($("editorDialog"));
    $("formTitle").focus();
  }
  async function saveEditor(event) {
    event.preventDefault();
    const title=trim($("formTitle").value,100),summary=trim($("formSummary").value,240),content=trim($("formContent").value,12000);
    if(!title||!summary||!content){toast("Vui lòng điền các trường bắt buộc.",true);return;}
    const originalId=$("editPromptId").value;
    const current=originalId?state.custom.find(p=>p.id===originalId):null;
    const obj=normalizePrompt({id:current?current.id:generateId(),title,summary,content,category:$("formCategory").value,model:$("formModel").value,tags:$("formTags").value.split(",").map(s=>s.trim()),createdAt:current?current.createdAt:new Date().toISOString().slice(0,10)});
    if(!obj){toast("Không thể lưu prompt không hợp lệ.",true);return;}
    if(window.PromptHubCommunity?.signedIn){try{await window.PromptHubCommunity.save({...obj,id:current?.id||undefined});closeDialog($("editorDialog"));state.view="mine";state.category="all";state.query="";$("searchInput").value="";render();toast("Đã lưu prompt vào tài khoản!");}catch(err){toast(err.message,true)}return;}
    if(current){state.custom=state.custom.map(p=>p.id===current.id?obj:p);}
    else{if(state.custom.length>=500){toast("Đã đạt giới hạn 500 prompt cá nhân.",true);return;}state.custom.unshift(obj);}
    write(KEYS.custom,state.custom);
    closeDialog($("editorDialog"));state.view="mine";state.category="all";state.query="";$("searchInput").value="";
    render();toast(current?"Đã cập nhật prompt!":"Đã lưu prompt mới vào trình duyệt!");
  }
  async function deleteCustom(id) {
    const p=state.custom.find(x=>x.id===id);if(!p)return;
    if(!confirm('Xóa prompt "'+p.title+'"? Thao tác này không thể hoàn tác.'))return;
    if(window.PromptHubCommunity?.signedIn){try{await window.PromptHubCommunity.remove(id);closeDialog($("detailDialog"));render();toast("Đã xóa prompt trên đám mây.");}catch(err){toast(err.message,true)}return;}
    state.custom=state.custom.filter(x=>x.id!==id);state.favorites.delete(id);
    write(KEYS.custom,state.custom);write(KEYS.favorites,[...state.favorites]);closeDialog($("detailDialog"));render();toast("Đã xóa prompt.");
  }
  function downloadFile(filename,text,type="text/plain;charset=utf-8") {
    const url=URL.createObjectURL(new Blob([text],{type}));
    const a=document.createElement("a");a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function exportBackup() {
    const data={format:"prompthub-backup",version:1,exportedAt:new Date().toISOString(),custom:state.custom,favorites:[...state.favorites]};
    downloadFile("prompthub-backup-"+new Date().toISOString().slice(0,10)+".json",JSON.stringify(data,null,2),"application/json;charset=utf-8");
    toast("Đã tạo bản sao lưu JSON.");
  }
  async function importBackup(file) {
    if(!file)return;
    if(file.size>1024*1024){toast("File quá lớn (tối đa 1 MB).",true);return;}
    try{
      const parsed=JSON.parse(await file.text());
      if(!parsed||parsed.format!=="prompthub-backup"||parsed.version!==1||!Array.isArray(parsed.custom)||!Array.isArray(parsed.favorites))throw new Error("bad format");
      if(parsed.custom.length>500||parsed.favorites.length>1000)throw new Error("too many entries");
      const merged=new Map(state.custom.map(p=>[p.id,p]));
      for(const item of parsed.custom){const p=normalizePrompt(item);if(p)merged.set(p.id,p);}
      state.custom=[...merged.values()].slice(0,500);
      const validIDs=new Set(seed.concat(state.custom).map(x=>x.id));
      state.favorites=new Set([...state.favorites,...parsed.favorites.filter(x=>typeof x==="string"&&validIDs.has(x))]);
      if(window.PromptHubCommunity?.signedIn){await window.PromptHubCommunity.importCloud(state.custom,[...state.favorites]);}else{write(KEYS.custom,state.custom);write(KEYS.favorites,[...state.favorites]);render();}
      toast("Đã nhập bản sao lưu thành công!");
    }catch(_){toast("Không thể đọc file. Chỉ chấp nhận bản sao lưu từ PromptHub.",true);}
    finally{$("importFile").value="";}
  }
  function handleDocumentClick(event) {
    if(!(event.target instanceof Element))return;
    const close=event.target.closest("[data-close]");
    if(close){closeDialog(close.dataset.close==="detail"?$("detailDialog"):$("editorDialog"));return;}
    const copyBtn=event.target.closest("[data-copy]");
    if(copyBtn){const p=findPrompt(copyBtn.dataset.copy);if(p)copy(p.content);return;}
    const saveBtn=event.target.closest("[data-save]");
    if(saveBtn){toggleFavorite(saveBtn.dataset.save);return;}
    const contributeBtn=event.target.closest("[data-contribute]");if(contributeBtn){window.PromptHubCommunity?.contribute(contributeBtn.dataset.contribute);closeDialog($("detailDialog"));return;}
    const editBtn=event.target.closest("[data-edit]");
    if(editBtn){openEditor(editBtn.dataset.edit);return;}
    const deleteBtn=event.target.closest("[data-delete]");
    if(deleteBtn){deleteCustom(deleteBtn.dataset.delete);return;}
    const dl=event.target.closest("[data-download]");
    if(dl){const p=findPrompt(dl.dataset.download);if(p)downloadFile("prompt-"+p.id+".txt",p.title+"\n\n"+p.content);return;}
    const view=event.target.closest("[data-view]");
    if(view){navigate(view.dataset.view);return;}
    const category=event.target.closest("[data-category]");
    if(category){navigate("all",category.dataset.category);return;}
    if(event.target.closest("a[href]"))return;
    const card=event.target.closest("[data-open]");
    if(card)openDetail(card.dataset.open);
  }
  function initialize() {
    $("formCategory").innerHTML=categories.map(c=>'<option value="'+escapeHTML(c.id)+'">'+escapeHTML(c.name)+'</option>').join("");
    updateTheme();render();
    document.addEventListener("click",handleDocumentClick);
    document.addEventListener("keydown",e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();closeDialog($("detailDialog"));closeDialog($("editorDialog"));$("searchInput").focus();$("searchInput").select();}
      if((e.key==="Enter"||e.key===" ")&&e.target instanceof Element&&e.target.matches("[data-open]")){e.preventDefault();openDetail(e.target.dataset.open);}
    });
    $("searchInput").addEventListener("input",e=>{state.query=e.target.value;state.visibleLimit=24;render();});
    $("sortSelect").addEventListener("change",e=>{state.sort=e.target.value;state.visibleLimit=24;render();});
    $("themeToggle").addEventListener("click",()=>{state.dark=!state.dark;write(KEYS.theme,state.dark);updateTheme();});
    $("sidebarToggle").addEventListener("click",()=>$("appShell").classList.toggle("sidebar-open"));
    $("mobileScrim").addEventListener("click",closeSidebar);
    ["topCreate","sidebarCreate","heroCreate","bottomCreate","emptyCreate"].forEach(id=>$(id).addEventListener("click",()=>openEditor()));
    $("exploreBtn").addEventListener("click",()=>navigate("all"));
    $("viewFeatured").addEventListener("click",()=>navigate("featured"));
    $("viewTrending").addEventListener("click",()=>navigate("trending"));
    $("loadMoreBtn").addEventListener("click",()=>{state.visibleLimit+=24;render();});
    $("clearFilters").addEventListener("click",()=>{state.query="";$("searchInput").value="";navigate("all");});
    $("closeEditor").addEventListener("click",()=>closeDialog($("editorDialog")));
    $("cancelEditor").addEventListener("click",()=>closeDialog($("editorDialog")));
    $("promptForm").addEventListener("submit",saveEditor);
    $("exportBtn").addEventListener("click",exportBackup);
    $("importBtn").addEventListener("click",()=>$("importFile").click());
    $("importFile").addEventListener("change",e=>importBackup(e.target.files?.[0]));
    if(window.PromptHubCommunity)window.PromptHubCommunity.init({state,render,toast,readLocal:()=>{const v=read(KEYS.custom,[]);return(Array.isArray(v)?v:[]).slice(0,500).map(x=>normalizePrompt(x)).filter(Boolean)},readFavorites:()=>{const v=read(KEYS.favorites,[]);return Array.isArray(v)?v:[]}});
    for(const id of ["detailDialog","editorDialog"]){
      $(id).addEventListener("click",e=>{if(e.target===$(id))closeDialog($(id));});
    }
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize);
  else initialize();
})();
