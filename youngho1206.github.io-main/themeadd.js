/* =====================================================================
   themeadd.js — 설정 › 테마 추가
   · webthema/thema01.html 을 기반으로, 배경 사진 / 아이콘 사진만 바꿔서 새 테마로 저장합니다.
   · 번호는 webthema 폴더의 기존 테마 번호 다음 숫자(thema02, thema03 …)로 자동 지정됩니다.
   · 저장은 GitHub API 로 webthema 폴더에 바로 올립니다. (GitHub 토큰 1회 입력 필요)
     토큰은 이 브라우저(localStorage)에만 저장되고, 사이트 파일에는 들어가지 않습니다.
   · 토큰이 없으면 만들어진 html 파일을 내려받게 해 줍니다. (webthema 폴더에 직접 올리면 됨)
   ===================================================================== */
(function(){
 'use strict';
 if(window.WTAdd)return;
 const $=(s,r=document)=>r.querySelector(s);
 const DIR='webthema/',BASE_ID='thema01',GHKEY='wt.gh';
 const esc=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

 /* ---------- 스타일 ---------- */
 const st=document.createElement('style');
 st.textContent=`
.wta{align-items:flex-start;overflow-y:auto}
.wta .card{width:min(calc(100% / var(--wk,1)),620px);max-height:none;margin:auto;overflow:visible}
.wta h2{margin:0 0 6px}
.wta .sub{margin:0 0 14px;font-size:12.5px;line-height:1.65;color:rgba(255,255,255,.75);word-break:keep-all}
.wta label.f{display:block;margin:14px 0 6px;font-size:12px;letter-spacing:.12em;color:rgba(255,255,255,.72)}
.wta input[type=text],.wta input[type=password]{width:100%;box-sizing:border-box;margin:0;padding:12px 14px;border-radius:13px;border:1px solid rgba(255,255,255,.3);
 background:rgba(255,255,255,.14);color:#fff;font-family:inherit;font-weight:500;font-size:15px;line-height:1.2;outline:0}
.wta input::placeholder{color:rgba(255,255,255,.55)}
.wta input:focus{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.22)}
.wta .bgrow{display:flex;gap:12px;align-items:center;padding:10px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
.wta .bgprev{flex:none;width:96px;height:64px;border-radius:12px;border:1px solid rgba(255,255,255,.4);background:center/cover no-repeat}
.wta .btns{display:flex;flex-wrap:wrap;gap:8px}
.wta .b{appearance:none;-webkit-appearance:none;margin:0;padding:9px 14px;border:1px solid rgba(255,255,255,.34);border-radius:12px;background:rgba(255,255,255,.18);
 color:#fff;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;text-align:center}
.wta .b:hover,.wta .b:focus-visible{background:rgba(255,255,255,.3);outline:0}
.wta .b.go{width:100%;margin-top:18px;padding:15px;font-size:16px;font-weight:600;background:linear-gradient(135deg,#ffffff,#e9e2ff);color:#4a4580;border:0}
.wta .b.go:disabled{opacity:.55;cursor:default}
.wta .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:10px}
.wta .tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 8px 10px;border-radius:16px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2)}
.wta .tile.chg{border-color:#fff;background:rgba(255,255,255,.2)}
.wta .tile img{width:64px;height:64px;object-fit:contain}
.wta .tile .nm{font-size:12px;line-height:1.3;text-align:center;word-break:keep-all}
.wta .tile .btns{justify-content:center;gap:6px}
.wta .tile .b{padding:6px 10px;font-size:12px}
.wta details{margin-top:18px;border-radius:14px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);padding:10px 14px}
.wta summary{cursor:pointer;font-size:13px;font-weight:600;letter-spacing:.04em}
.wta details p{margin:10px 0 0;font-size:12px;line-height:1.7;color:rgba(255,255,255,.75);word-break:keep-all}
.wta .msg{margin:12px 0 0;min-height:20px;font-size:13px;line-height:1.6;text-align:center;word-break:keep-all}
.wta .msg.err{color:#ffd0d0}.wta .msg.ok{color:#d6ffe0}
.wta input[type=file]{display:none}
`;
 document.head.appendChild(st);

 /* ---------- 기본 데이터 (thema01.html 기반) ---------- */
 const state={baseHtml:null,baseIcons:null,bg:null,icons:{},busy:false};
 const BASE_BG='linear-gradient(165deg,#a7bbd6 0%,#9eadd0 38%,#a99fcb 68%,#bba3cc 100%)';
 let ov=null;

 const iconKeys=()=>{
  const keys=Object.keys(state.baseIcons||{});
  return keys;
 };
 const labelOf=key=>{
  try{
   if(typeof C!=='undefined'&&typeof IMG!=='undefined'){
    const c=C.find(x=>IMG[x.id]===key);if(c)return c.n;
   }
  }catch(_){}
  return key;
 };

 async function loadBase(){
  if(state.baseHtml)return;
  const r=await fetch(DIR+BASE_ID+'.html',{cache:'no-cache'});
  if(!r.ok)throw Error(BASE_ID+'.html 을 찾을 수 없어요.');
  const t=await r.text();
  const m=t.match(/const\s+ICON_DATA\s*=\s*(\{[\s\S]*?\})\s*;/);
  if(!m)throw Error(BASE_ID+'.html 에서 아이콘(ICON_DATA)을 찾지 못했어요.');
  state.baseIcons=JSON.parse(m[1]);
  state.baseHtml=t;
 }

 /* ---------- 이미지 → 작은 data URL ---------- */
 function okType(f){return /^image\/(png|jpe?g)$/i.test(f.type)||/\.(png|jpe?g)$/i.test(f.name)}
 function readImage(file,maxSide,mime,q){
  return new Promise((res,rej)=>{
   const url=URL.createObjectURL(file),img=new Image();
   img.onload=()=>{
    URL.revokeObjectURL(url);
    const k=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
    const w=Math.max(1,Math.round(img.naturalWidth*k)),h=Math.max(1,Math.round(img.naturalHeight*k));
    const cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const cx=cv.getContext('2d');
    if(mime==='image/jpeg'){cx.fillStyle='#fff';cx.fillRect(0,0,w,h)}
    cx.drawImage(img,0,0,w,h);
    res(cv.toDataURL(mime,q));
   };
   img.onerror=()=>{URL.revokeObjectURL(url);rej(Error('사진을 읽을 수 없어요.'))};
   img.src=url;
  });
 }

 /* ---------- GitHub ---------- */
 function ghCfg(){
  let c={};try{c=JSON.parse(localStorage.getItem(GHKEY)||'{}')||{}}catch(_){}
  const h=location.hostname,auto=/\.github\.io$/i.test(h);
  return {
   owner:c.owner||(auto?h.split('.')[0]:'youngho1206'),
   repo:c.repo||(auto?h:'youngho1206.github.io'),
   branch:c.branch||'main',
   token:c.token||''
  };
 }
 function ghSave(c){try{localStorage.setItem(GHKEY,JSON.stringify(c))}catch(_){}}
 function b64enc(s){const b=new TextEncoder().encode(s);let o='';for(let i=0;i<b.length;i+=0x8000)o+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(o)}
 function b64dec(b){const bin=atob(String(b).replace(/\s/g,''));return new TextDecoder().decode(Uint8Array.from(bin,c=>c.charCodeAt(0)))}
 async function gh(cfg,method,path,body){
  const u=`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`+(method==='GET'?`?ref=${encodeURIComponent(cfg.branch)}&t=${Date.now()}`:'');
  const r=await fetch(u,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+cfg.token,'X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
  if(r.status===401)throw Error('GitHub 토큰이 올바르지 않거나 만료됐어요.');
  if(r.status===403)throw Error('GitHub 권한이 없어요. 토큰에 이 저장소의 Contents 읽기/쓰기 권한이 필요해요.');
  if(r.status===404&&method!=='GET')throw Error('저장소를 찾을 수 없어요. 아이디/저장소 이름/토큰 권한을 확인해 주세요.');
  return r;
 }
 async function ghJson(cfg,path){
  const r=await gh(cfg,'GET',path);
  if(r.status===404)return null;
  if(!r.ok)throw Error('GitHub 읽기 실패 ('+r.status+')');
  const j=await r.json();
  return {sha:j.sha,text:b64dec(j.content)};
 }
 async function ghPut(cfg,path,text,sha,msg){
  const body={message:msg,content:b64enc(text),branch:cfg.branch};
  if(sha)body.sha=sha;
  const r=await gh(cfg,'PUT',path,body);
  if(r.status===409||r.status===422){const e=Error('conflict');e.conflict=true;throw e}
  if(!r.ok){let m='';try{m=(await r.json()).message||''}catch(_){}throw Error('GitHub 저장 실패 ('+r.status+') '+m)}
 }

 /* ---------- 테마 html 만들기 ---------- */
 function buildHtml(name){
  const icons=Object.assign({},state.baseIcons,state.icons);
  let t=state.baseHtml.replace(/const\s+ICON_DATA\s*=\s*\{[\s\S]*?\}\s*;/,()=>'const ICON_DATA='+JSON.stringify(icons)+';');
  if(state.bg){
   const css='\n/* wt-bg: 내가 고른 배경 사진 */\n.bg{background:#222 url('+state.bg+') center/cover no-repeat!important}\n.bg:before,.bg:after,.bg i{display:none!important}\n';
   const k=t.indexOf('</style>');
   if(k<0)throw Error('thema01.html 에서 style 을 찾지 못했어요.');
   t=t.slice(0,k)+css+t.slice(k);
  }
  t=t.replace(/<title>[\s\S]*?<\/title>/,()=>'<title>'+esc(name)+'</title>');
  return t;
 }
 function download(fn,text){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'text/html'}));a.download=fn;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
 }
 const numOf=id=>{const m=/^(?:thema|theme)(\d+)$/.exec(id);return m?+m[1]:0};
 const pad=n=>String(n).padStart(2,'0');

 /* ---------- 저장 ---------- */
 async function save(){
  const msg=$('.msg',ov),nameEl=$('#taName',ov),go=$('.go',ov);
  const say=(t,k)=>{msg.textContent=t;msg.className='msg'+(k?' '+k:'')};
  if(state.busy)return;
  const name=nameEl.value.trim().replace(/\s+/g,' ');
  if(!name){say('테마목록에 표시될 이름을 먼저 입력해 주세요.','err');nameEl.focus();return}
  if(!state.bg&&!Object.keys(state.icons).length){say('배경이나 아이콘 사진을 하나 이상 바꿔 주세요.','err');return}
  const cfg=ghCfg();
  cfg.owner=$('#taOwner',ov).value.trim()||cfg.owner;
  cfg.repo=$('#taRepo',ov).value.trim()||cfg.repo;
  cfg.branch=$('#taBranch',ov).value.trim()||cfg.branch;
  const tk=$('#taToken',ov).value.trim();if(tk)cfg.token=tk;
  state.busy=true;go.disabled=true;
  try{
   if(!cfg.token){
    /* 토큰이 없으면: 번호만 정해서 파일을 내려받게 함 */
    let list=[];try{list=await window.WT.list()}catch(_){}
    const n=Math.max(1,...(list||[]).map(t=>numOf(t.id)))+1;
    const fn='thema'+pad(n)+'.html';
    say('만드는 중…');
    download(fn,buildHtml(name));
    say('GitHub 토큰이 없어서 서버에 바로 저장하지 못했어요. 내려받은 '+fn+' 을 webthema 폴더에 올리고, 아래 "서버 저장 연결"에 토큰을 넣으면 다음부터 자동 저장돼요.','err');
    return;
   }
   ghSave(cfg);
   for(let attempt=0;attempt<3;attempt++){
    say('서버 폴더 확인 중…');
    const r=await gh(cfg,'GET','webthema');
    if(!r.ok)throw Error(r.status===404?'저장소의 webthema 폴더를 찾을 수 없어요.':'폴더 확인 실패 ('+r.status+')');
    const files=await r.json();
    const max=Math.max(0,...files.map(f=>numOf((f.name||'').replace(/\.html$/i,''))));
    const id='thema'+pad(max+1),fn=id+'.html';
    say('저장 중… ('+fn+')');
    const html=buildHtml(name);
    try{await ghPut(cfg,DIR+fn,html,null,'테마 추가: '+name+' ('+fn+')')}
    catch(e){if(e.conflict)continue;throw e}
    /* 테마 목록(themes.json) · 이름(names.json) 갱신 */
    say('테마 목록 갱신 중…');
    for(let k=0;k<3;k++){
     const cur=await ghJson(cfg,DIR+'themes.json');
     let arr=[];
     if(cur){try{const j=JSON.parse(cur.text);arr=Array.isArray(j)?j:(j.themes||[])}catch(_){}}
     else{
      /* themes.json 이 아직 없으면 폴더에 있는 테마로 새로 만든다 */
      let nm={};const nj=await ghJson(cfg,DIR+'names.json');if(nj){try{nm=JSON.parse(nj.text)}catch(_){}}
      arr=files.map(f=>(f.name||'').replace(/\.html$/i,'')).filter(i=>numOf(i)).sort((a,b)=>numOf(a)-numOf(b)).map(i=>({id:i,name:nm[i]||i}));
     }
     arr=arr.filter(t=>t.id!==id);arr.push({id,name});
     try{await ghPut(cfg,DIR+'themes.json',JSON.stringify({themes:arr},null,2)+'\n',cur&&cur.sha,'테마 목록 갱신: '+fn);break}
     catch(e){if(e.conflict&&k<2)continue;throw e}
    }
    for(let k=0;k<3;k++){
     const cur=await ghJson(cfg,DIR+'names.json');
     let nm={};if(cur){try{nm=JSON.parse(cur.text)}catch(_){}}
     nm[id]=name;
     try{await ghPut(cfg,DIR+'names.json',JSON.stringify(nm,null,2)+'\n',cur&&cur.sha,'테마 이름 추가: '+name);break}
     catch(e){if(e.conflict&&k<2)continue;throw e}
    }
    say('저장 완료! '+fn+' 이(가) webthema 폴더에 올라갔어요. GitHub Pages에 반영되기까지 1~2분 걸리고, 그 뒤 새로고침하면 테마 목록에 "'+name+'"이(가) 나타나요.','ok');
    return;
   }
   throw Error('파일 번호가 계속 겹쳐서 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }catch(e){
   say(e&&e.message?e.message:'저장 중 오류가 났어요.','err');
  }finally{state.busy=false;go.disabled=false}
 }

 /* ---------- 화면 ---------- */
 function tileHtml(key){
  return `<div class="tile" data-k="${esc(key)}"><img alt="" src="${state.baseIcons[key]}"><span class="nm">${esc(labelOf(key))}</span>
   <div class="btns"><label class="b">변경<input type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg"></label><button class="b rs" type="button">되돌리기</button></div></div>`;
 }
 function build(){
  const g=ghCfg();
  ov=document.createElement('div');
  ov.className='wtinfo wta';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','테마 추가');
  ov.innerHTML=`
  <div class="card">
   <button class="x" type="button" aria-label="닫기">✕</button>
   <h2>테마 추가</h2>
   <p class="sub">${esc(BASE_ID)}.html을 기반으로 배경과 아이콘을 내 사진(PNG · JPG · JPEG)으로 바꾼 뒤 저장하면 webthema 폴더에 새 테마 파일로 추가돼요.</p>

   <label class="f" for="taName">테마 이름 (테마목록에 표시)</label>
   <input id="taName" type="text" maxlength="24" placeholder="예) 바다" autocomplete="off">

   <label class="f">배경 (페이지 백그라운드)</label>
   <div class="bgrow">
    <div class="bgprev" id="taBgPrev"></div>
    <div class="btns"><label class="b">배경 사진 선택<input id="taBg" type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg"></label><button class="b" id="taBgRs" type="button">되돌리기</button></div>
   </div>

   <label class="f">아이콘</label>
   <div class="grid" id="taGrid"></div>

   <details>
    <summary>서버 저장 연결 (GitHub)</summary>
    <p>GitHub Pages는 정적 서버라 사이트 안에서 파일을 직접 쓸 수 없어요. 그래서 GitHub에 파일을 올리는 방식으로 저장해요. GitHub › Settings › Developer settings › Fine-grained tokens 에서 이 저장소 <b>Contents: Read and write</b> 권한 토큰을 만들어 한 번만 넣어 주세요. 토큰은 이 브라우저에만 저장돼요.</p>
    <label class="f" for="taOwner">GitHub 아이디</label><input id="taOwner" type="text" value="${esc(g.owner)}" autocomplete="off">
    <label class="f" for="taRepo">저장소 이름</label><input id="taRepo" type="text" value="${esc(g.repo)}" autocomplete="off">
    <label class="f" for="taBranch">브랜치</label><input id="taBranch" type="text" value="${esc(g.branch)}" autocomplete="off">
    <label class="f" for="taToken">토큰 ${g.token?'(저장됨 — 바꿀 때만 입력)':''}</label><input id="taToken" type="password" placeholder="${g.token?'••••••••':'github_pat_…'}" autocomplete="off">
    ${g.token?'<div class="btns" style="margin-top:10px"><button class="b" id="taForget" type="button">저장된 토큰 지우기</button></div>':''}
   </details>

   <button class="b go" type="button">테마저장</button>
   <p class="msg" role="status" aria-live="polite"></p>
  </div>`;
  document.body.appendChild(ov);
  $('#taGrid',ov).innerHTML=iconKeys().map(tileHtml).join('');
  $('#taBgPrev',ov).style.backgroundImage=BASE_BG;

  const say=(t,k)=>{const m=$('.msg',ov);m.textContent=t;m.className='msg'+(k?' '+k:'')};
  const close=()=>ov.classList.remove('open');
  $('.x',ov).addEventListener('click',close);
  ov.addEventListener('pointerdown',e=>{if(e.target===ov)close()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ov.classList.contains('open'))close()});

  /* 배경 */
  $('#taBg',ov).addEventListener('change',async e=>{
   const f=e.target.files[0];e.target.value='';if(!f)return;
   if(!okType(f)){say('PNG, JPG, JPEG 사진만 쓸 수 있어요.','err');return}
   try{state.bg=await readImage(f,1920,'image/jpeg',.82);$('#taBgPrev',ov).style.backgroundImage='url('+state.bg+')';say('')}
   catch(err){say(err.message,'err')}
  });
  $('#taBgRs',ov).addEventListener('click',()=>{state.bg=null;$('#taBgPrev',ov).style.backgroundImage=BASE_BG});

  /* 아이콘 */
  $('#taGrid',ov).addEventListener('change',async e=>{
   if(e.target.type!=='file')return;
   const tile=e.target.closest('.tile'),f=e.target.files[0];e.target.value='';if(!f)return;
   if(!okType(f)){say('PNG, JPG, JPEG 사진만 쓸 수 있어요.','err');return}
   try{
    const d=await readImage(f,256,'image/png');
    state.icons[tile.dataset.k]=d;$('img',tile).src=d;tile.classList.add('chg');say('')
   }catch(err){say(err.message,'err')}
  });
  $('#taGrid',ov).addEventListener('click',e=>{
   const b=e.target.closest('.rs');if(!b)return;
   const tile=b.closest('.tile');delete state.icons[tile.dataset.k];
   $('img',tile).src=state.baseIcons[tile.dataset.k];tile.classList.remove('chg');
  });

  const fg=$('#taForget',ov);
  if(fg)fg.addEventListener('click',()=>{const c=ghCfg();c.token='';ghSave(c);fg.textContent='지웠어요';fg.disabled=true});
  $('.go',ov).addEventListener('click',save);
 }

 window.WTAdd={
  async open(){
   if(ov){ov.classList.add('open');return}
   const tmp=document.createElement('div');
   tmp.className='wtinfo open';
   tmp.innerHTML='<div class="card"><h2>테마 추가</h2><p class="sub" style="margin:10px 0 0">불러오는 중…</p></div>';
   document.body.appendChild(tmp);
   try{await loadBase();tmp.remove();build();requestAnimationFrame(()=>ov.classList.add('open'));setTimeout(()=>{const n=$('#taName',ov);n&&n.focus({preventScroll:true})},350)}
   catch(e){tmp.querySelector('.sub').textContent=(e&&e.message)||'불러오지 못했어요.';setTimeout(()=>tmp.remove(),2800)}
  }
 };
})();
