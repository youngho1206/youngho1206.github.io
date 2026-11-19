/* =====================================================================
   pctheme.js — PC 페이지(desktop.html) 테마 · 설정
   ---------------------------------------------------------------------
   · 설정(⚙) › 테마 선택 : 기본 / Ubuntu Style / iOS Style / Windows Style + 내가 만든 테마
   · 설정(⚙) › 비밀번호 입력 후  테마에디터 / 배경수정 / GitHub 연결
   · 만든 테마·배경은 이 브라우저에 바로 저장되고, GitHub 에 연결해 두면
     pctheme/data.json (+ pctheme/img/) 로 올라가 다른 기기에서도 보입니다.
   · PHP 없음. 모두 브라우저 + GitHub Pages(정적) + GitHub API 로 동작합니다.
   ===================================================================== */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const clone=o=>JSON.parse(JSON.stringify(o));
const K={data:'pct.data',sel:'pct.sel',img:'pct.img',dirty:'pct.dirty',gh:'pct.gh',ok:'pct.ok',fail:'pct.fail'};
const ls={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(_){return false}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const ss={get(k){try{return sessionStorage.getItem(k)}catch(_){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(_){}},del(k){try{sessionStorage.removeItem(k)}catch(_){}}};

/* ---------- 비밀번호 (화면 잠금용) ----------
   ※ 정적 사이트라 비밀번호는 '화면 잠금' 수준입니다. 진짜 저장 권한은 GitHub 토큰이 가집니다. */
function cyrb53(str,seed=0){let h1=0xdeadbeef^seed,h2=0x41c6ce57^seed;for(let i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
 h1=Math.imul(h1^(h1>>>16),2246822507);h1^=Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507);h2^=Math.imul(h1^(h1>>>13),3266489909);
 return (4294967296*(2097151&h2)+(h1>>>0)).toString(36)}
const PW_HASH='1qh9b4frbm';
const unlocked=()=>ss.get(K.ok)==='1';

/* ---------- 기본 제공 테마 4종 ---------- */
const SKINS={
 default:{name:'기본',skin:'arcade',d:{accent:'#38b6ff',title:'#ff7a1a',text:'#e8f1ff',pageA:'#0a1a4a',pageB:'#02050f',cardBase:'#0a1230'}},
 ubuntu:{name:'Ubuntu Style',skin:'ubuntu',d:{accent:'#e95420',title:'#ffffff',text:'#f4eaf1',pageA:'#4a1236',pageB:'#1d0715',cardBase:'#2c0a21'}},
 ios:{name:'iOS Style',skin:'ios',d:{accent:'#0a84ff',title:'#1c1c1e',text:'#1c1c1e',pageA:'#ffd1e8',pageB:'#a5c8ff',cardBase:'#ffffff'}},
 windows:{name:'Windows Style',skin:'windows',d:{accent:'#4cc2ff',title:'#ffffff',text:'#f3f6fb',pageA:'#0b3d91',pageB:'#031a45',cardBase:'#1d2230'}}
};
const SKIN_IDS=Object.keys(SKINS);
const CVAR={accent:'--accent',title:'--title',text:'--text',pageA:'--pageA',pageB:'--pageB',cardBase:'--card-base'};
const CNAME={accent:'포인트색',title:'제목색',text:'글자색',pageA:'배경색 ①',pageB:'배경색 ②',cardBase:'카드 바탕색'};

/* ---------- 데이터 ---------- */
let S={data:null,sel:'default',dirty:false,syncing:false,msg:''};
const blank=()=>({v:1,rev:0,themes:[],ov:{},del:[]});
function norm(j){
 const d=blank();if(!j||typeof j!=='object')return d;
 d.rev=+j.rev||0;
 d.themes=Array.isArray(j.themes)?j.themes.filter(t=>t&&t.id&&t.name).map(t=>({colors:{},skin:'default',...t,colors:{...(t.colors||{})}})):[];
 d.ov=(j.ov&&typeof j.ov==='object')?j.ov:{};
 d.del=Array.isArray(j.del)?j.del.map(String):[];
 return d;
}
function loadLocal(){let d=null;try{d=JSON.parse(ls.get(K.data)||'null')}catch(_){}S.data=norm(d);S.dirty=ls.get(K.dirty)==='1';const s=ls.get(K.sel);S.sel=s||'default'}
function saveLocal(markDirty){
 if(markDirty){S.dirty=true;S.data.rev=Date.now()}
 const ok=ls.set(K.data,JSON.stringify(S.data));ls.set(K.dirty,S.dirty?'1':'0');
 pruneImgCache();
 if(!ok)toast('저장 공간이 부족해요. GitHub 에 연결해 이미지를 올려 주세요.');
 return ok;
}
const customList=()=>S.data.themes;
const findTheme=id=>{
 if(SKINS[id])return{id,name:SKINS[id].name,skin:id,builtin:true,colors:{}};
 return S.data.themes.find(t=>t.id===id)||null;
};
const allThemes=()=>SKIN_IDS.map(findTheme).concat(S.data.themes);

/* ---------- 이미지 캐시 (GitHub 에 올린 직후 아직 반영 전이어도 바로 보이게) ---------- */
let imgCache={};try{imgCache=JSON.parse(ls.get(K.img)||'{}')||{}}catch(_){}
const res=u=>(u&&imgCache[u])?imgCache[u]:u;
function imgRefs(d){
 const out=[];
 d.themes.forEach(t=>['pageImg','frameImg','listImg'].forEach(k=>{if(t[k])out.push([t,k])}));
 Object.keys(d.ov).forEach(id=>['frameImg','listImg'].forEach(k=>{if(d.ov[id]&&d.ov[id][k])out.push([d.ov[id],k])}));
 return out;
}
function pruneImgCache(){
 const used=new Set(imgRefs(S.data).map(([o,k])=>o[k]));
 let n=0;const keep={};
 Object.keys(imgCache).forEach(p=>{if(used.has(p)&&n+imgCache[p].length<3.2e6){keep[p]=imgCache[p];n+=imgCache[p].length}});
 imgCache=keep;ls.set(K.img,JSON.stringify(imgCache));
}

/* ---------- 적용 ---------- */
const root=document.documentElement;
function bgCss(color,img,shade){
 const L=[];
 if(img){
  const u=String(res(img)).replace(/["\\\n\r]/g,'');
  if(+shade>0){const a=(+shade/100).toFixed(2);L.push(`linear-gradient(rgba(0,0,0,${a}),rgba(0,0,0,${a}))`)}
  if(color)L.push(`linear-gradient(color-mix(in srgb,${color} 32%,transparent),color-mix(in srgb,${color} 32%,transparent))`);
  L.push(`url("${u}") center/cover no-repeat`);
 }else if(color){
  L.push(`linear-gradient(color-mix(in srgb,${color} 88%,transparent),color-mix(in srgb,${color} 88%,transparent))`);
 }
 return L.join(',');
}
function setBg(el,css){if(!el)return;if(css)el.style.background=css;else el.style.removeProperty('background')}
function apply(id,draft){
 const t=draft||findTheme(id)||findTheme('default');
 const ov=draft?{}:(S.data.ov[t.id]||{});
 const pick=k=>(k in ov)?ov[k]:t[k];
 root.dataset.skin=SKINS[t.skin]?SKINS[t.skin].skin:'arcade';
 /* 테마 전용 CSS / JS (예: pctheme/retro.css, retro.js) */
 let EL=document.getElementById('pct-extra');
 if(t.css){if(!EL){EL=document.createElement('link');EL.id='pct-extra';EL.rel='stylesheet';document.head.appendChild(EL)}if(EL.getAttribute('href')!==t.css)EL.setAttribute('href',t.css)}else if(EL)EL.remove();
 if(t.js){if(window.PCRetro)window.PCRetro.on();else if(!document.getElementById('pct-extra-js')){const sc=document.createElement('script');sc.id='pct-extra-js';sc.src=t.js;document.body.appendChild(sc)}}else if(window.PCRetro)window.PCRetro.off();
 Object.keys(CVAR).forEach(k=>{const v=t.colors&&t.colors[k];if(v)root.style.setProperty(CVAR[k],v);else root.style.removeProperty(CVAR[k])});
 setBg($('#pagebg'),bgCss('',t.pageImg,t.pageShade));
 setBg($('#frame'),bgCss(pick('frameColor'),pick('frameImg'),pick('frameShade')));
 setBg($('#list'),bgCss(pick('listColor'),pick('listImg'),pick('listShade')));
 const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',(t.colors&&t.colors.pageB)||SKINS[t.skin].d.pageB);
 document.dispatchEvent(new CustomEvent('pctheme',{detail:{id:t.id}}));
}
function select(id){
 if(!findTheme(id))id='default';
 S.sel=id;ls.set(K.sel,id);apply(id);
}

/* ---------- 작은 도구 ---------- */
function toast(m){const t=document.getElementById('toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('on'),3200)}
function swatch(t){
 const d=Object.assign({},SKINS[t.skin]?SKINS[t.skin].d:SKINS.default.d,t.colors||{});
 const bg=t.pageImg?`background-image:url("${String(res(t.pageImg)).replace(/["\\\n\r]/g,'')}")`:`background:linear-gradient(135deg,${d.pageA},${d.pageB})`;
 return `<div class="sw" style="${bg};--sa:${d.accent}"></div>`;
}
function fileToDataUri(file,maxW,q){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),img=new Image();
  img.onload=()=>{
   URL.revokeObjectURL(url);
   let w=img.naturalWidth,h=img.naturalHeight;const sc=Math.min(1,maxW/Math.max(w,h));w=Math.round(w*sc);h=Math.round(h*sc);
   const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.fillStyle='#000';cx.fillRect(0,0,w,h);cx.drawImage(img,0,0,w,h);
   let out=cv.toDataURL('image/jpeg',q);
   if(out.length>700000){out=cv.toDataURL('image/jpeg',Math.max(.5,q-.18))}
   resolve(out);
  };
  img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('사진을 읽을 수 없어요.'))};
  img.src=url;
 });
}
function pickFile(){
 return new Promise(res=>{
  const i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=()=>res(i.files&&i.files[0]||null);i.click();
 });
}

/* ---------- 창 만들기 ---------- */
let openWin=null;
function closeWin(){if(openWin){openWin.remove();openWin=null}}
function mkModal(html,cls){
 closeWin();
 const back=document.createElement('div');back.className='pcm-back';
 back.innerHTML=`<div class="pcm ${cls||''}" role="dialog" aria-modal="true">${html}</div>`;
 back.addEventListener('mousedown',e=>{if(e.target===back)closeWin()});
 document.body.appendChild(back);openWin=back;return $('.pcm',back);
}
function mkDrawer(html,cls){
 closeWin();
 const w=document.createElement('div');w.className='pcm-wrap-dw';
 w.innerHTML=`<div class="pcm dw ${cls||''}" role="dialog">${html}</div>`;
 document.body.appendChild(w);openWin=w;return $('.pcm',w);
}
addEventListener('keydown',e=>{if(e.key==='Escape'&&openWin&&!openWin.dataset.lock){if(openWin.dataset.draft){cancelDraft()}else closeWin()}});

/* =====================================================================
   설정 창
   ===================================================================== */
function openSettings(){
 const adm=unlocked();
 const m=mkModal(`
  <h2>⚙ 설정<button type="button" data-x aria-label="닫기">✕</button></h2>
  <div class="bd">
   <h3>테마 선택</h3>
   <div class="tchips" id="tc">${allThemes().map(t=>`<div class="tchip ${t.id===S.sel?'on':''} ${t.builtin?'':'cu'}" data-id="${esc(t.id)}" tabindex="0">${swatch(t)}${esc(t.name)}${t.builtin?'':'<button class="x" type="button" data-del="'+esc(t.id)+'" title="테마 삭제">✕</button>'}</div>`).join('')}</div>
   <h3>관리자</h3>
   ${adm?`
    <div class="row">
     <button class="b pri" type="button" data-a="edit">🎨 테마에디터</button>
     <button class="b pri" type="button" data-a="bg">🖼 배경수정</button>
     <button class="b" type="button" data-a="gh">☁ GitHub 연결 · 동기화</button>
     <button class="b" type="button" data-a="lock">🔒 잠그기</button>
    </div>
    <div class="msg" id="syncmsg">${esc(syncText())}</div>
   `:`
    <p class="sm">테마 만들기 · 배경 바꾸기는 비밀번호를 입력해야 열려요.</p>
    <form class="pw" id="pwf" autocomplete="off"><input type="password" id="pwi" placeholder="비밀번호" inputmode="numeric" autocomplete="off"><button class="b pri" type="submit">확인</button></form>
    <div class="msg er" id="pwe" style="display:none"></div>
   `}
  </div>`,adm?'adm':'');
 m.addEventListener('click',e=>{
  const x=e.target.closest('[data-x]');if(x){closeWin();return}
  const dl=e.target.closest('[data-del]');
  if(dl){e.stopPropagation();delTheme(dl.dataset.del);return}
  const ch=e.target.closest('.tchip');
  if(ch){select(ch.dataset.id);m.querySelectorAll('.tchip').forEach(c=>c.classList.toggle('on',c===ch));return}
  const a=e.target.closest('[data-a]');
  if(a){
   const k=a.dataset.a;
   if(k==='edit')openEditor();
   else if(k==='bg')openBgEditor();
   else if(k==='gh')openGh();
   else if(k==='lock'){ss.del(K.ok);openSettings()}
  }
 });
 const f=$('#pwf',m);
 if(f){
  setTimeout(()=>$('#pwi',m).focus(),30);
  f.onsubmit=e=>{
   e.preventDefault();
   const er=$('#pwe',m),fail=JSON.parse(ls.get(K.fail)||'{"n":0,"t":0}');
   if(Date.now()<fail.t){er.style.display='block';er.textContent='잠시 후 다시 시도해 주세요. ('+Math.ceil((fail.t-Date.now())/1000)+'초)';return}
   if(cyrb53('pct-ys:'+$('#pwi',m).value.trim())===PW_HASH){ls.del(K.fail);ss.set(K.ok,'1');openSettings()}
   else{fail.n++;if(fail.n>=5){fail.t=Date.now()+30000;fail.n=0}ls.set(K.fail,JSON.stringify(fail));er.style.display='block';er.textContent='비밀번호가 맞지 않아요.';$('#pwi',m).select()}
  };
 }
}
function syncText(){
 const c=ghCfg();
 if(S.syncing)return '☁ GitHub 에 올리는 중…';
 if(S.dirty)return '💾 이 기기에 저장됨 · 아직 GitHub 에 올리지 않았어요'+(c.token?' (자동으로 올립니다)':' — "GitHub 연결"에서 로그인해 주세요');
 return '✅ GitHub 와 같은 상태예요'+(c.token?'':' (이 기기는 GitHub 로그인 전)');
}
function refreshSync(){const e=$('#syncmsg');if(e)e.textContent=syncText()}
function delTheme(id){
 const t=findTheme(id);if(!t||t.builtin)return;
 if(!confirm(`'${t.name}' 테마를 삭제할까요?`))return;
 S.data.themes=S.data.themes.filter(x=>x.id!==id);delete S.data.ov[id];if(!S.data.del.includes(id))S.data.del.push(id);
 if(S.sel===id)select('default');
 saveLocal(true);autoPush();openSettings();
}

/* =====================================================================
   배경 입력 한 줄 (이미지 / 색 / 어둡게)  — 테마에디터·배경수정 공용
   ===================================================================== */
function bgRowHtml(key,label,withColor){
 return `<div class="bgrow" data-bg="${key}">
  <b>${label}</b>
  <div class="row"><div class="pv" data-pv></div>
   <div style="flex:1;min-width:120px;display:flex;flex-direction:column;gap:6px">
    <div class="row"><button class="b" type="button" data-pick>📁 사진 선택</button><button class="b dan" type="button" data-clr>지우기</button></div>
    <input type="text" data-url placeholder="또는 사진 주소 (https://… / IMG/배경.jpg)">
   </div></div>
  ${withColor?`<div class="cfield" data-cf><span>색상</span><input type="color" data-col><button class="b" type="button" data-colx>없음</button><span style="opacity:.6">(사진 없으면 이 색으로 채움)</span></div>`:''}
  <div class="cfield"><span>사진 어둡게</span><input type="range" min="0" max="80" step="5" data-shade><span data-sv style="width:34px;text-align:right">0%</span></div>
 </div>`;
}
/* obj 의 {key}Img / {key}Color / {key}Shade 를 화면과 연결 */
function bindBgRow(root_,key,obj,onChange,defColor){
 const row=$(`[data-bg="${key}"]`,root_);if(!row)return;
 const pv=$('[data-pv]',row),url=$('[data-url]',row),sh=$('[data-shade]',row),sv=$('[data-sv]',row);
 const col=$('[data-col]',row),cf=$('[data-cf]',row);
 const I=key+'Img',C=key+'Color',H=key+'Shade';
 const paint=()=>{
  const v=obj[I]||'';
  pv.style.backgroundImage=v?`url("${String(res(v)).replace(/["\\\n\r]/g,'')}")`:'none';
  url.value=(v&&!v.startsWith('data:'))?v:'';
  url.placeholder=v&&v.startsWith('data:')?'(사진 파일을 불러왔어요)':'또는 사진 주소 (https://… / IMG/배경.jpg)';
  sh.value=obj[H]||0;sv.textContent=(obj[H]||0)+'%';
  if(col){col.value=obj[C]||defColor||'#000000';cf.classList.toggle('empty',!obj[C])}
 };
 $('[data-pick]',row).onclick=async()=>{
  const f=await pickFile();if(!f)return;
  try{obj[I]=await fileToDataUri(f,key==='page'?1920:1600,.78);paint();onChange()}catch(e){toast(e.message)}
 };
 $('[data-clr]',row).onclick=()=>{obj[I]='';paint();onChange()};
 url.onchange=()=>{obj[I]=url.value.trim();paint();onChange()};
 sh.oninput=()=>{obj[H]=+sh.value;sv.textContent=sh.value+'%';onChange()};
 if(col){col.oninput=()=>{obj[C]=col.value;cf.classList.remove('empty');onChange()};$('[data-colx]',row).onclick=()=>{obj[C]='';paint();onChange()}}
 paint();
}

/* =====================================================================
   테마에디터 — 새 테마 만들기 / 내 테마 수정
   ===================================================================== */
let draft=null,draftMode='new';
function cancelDraft(){draft=null;closeWin();apply(S.sel)}
function openEditor(){
 const cur=findTheme(S.sel)||findTheme('default');
 const ov=S.data.ov[cur.id]||{};
 const skin=cur.skin||'default';
 draft={
  id:cur.builtin?null:cur.id,name:cur.builtin?'내 테마':cur.name,skin,
  colors:{...SKINS[skin].d,...(cur.colors||{})},
  pageImg:cur.pageImg||'',pageShade:cur.pageShade||0,
  frameColor:('frameColor' in ov)?ov.frameColor:(cur.frameColor||''),frameImg:('frameImg' in ov)?ov.frameImg:(cur.frameImg||''),frameShade:('frameShade' in ov)?ov.frameShade:(cur.frameShade||0),
  listColor:('listColor' in ov)?ov.listColor:(cur.listColor||''),listImg:('listImg' in ov)?ov.listImg:(cur.listImg||''),listShade:('listShade' in ov)?ov.listShade:(cur.listShade||0)
 };
 draftMode=cur.builtin?'new':'edit';
 const m=mkDrawer(`
  <h2>🎨 테마에디터<button type="button" data-x aria-label="닫기">✕</button></h2>
  <div class="bd">
   <p class="sm">고르는 즉시 왼쪽 화면에 미리 보여요. 저장하면 테마 선택 목록에 바로 추가됩니다.</p>
   <label class="f" for="edName">테마 이름</label><input type="text" id="edName" maxlength="24" value="${esc(draft.name)}">
   <label class="f" for="edSkin">기반 스타일</label>
   <select id="edSkin">${SKIN_IDS.map(i=>`<option value="${i}" ${i===draft.skin?'selected':''}>${esc(SKINS[i].name)}</option>`).join('')}</select>
   <h3>색상</h3>
   <div class="cg">${Object.keys(CNAME).map(k=>`<label>${CNAME[k]}<input type="color" data-c="${k}" value="${draft.colors[k]}"></label>`).join('')}</div>
   <h3>배경 사진</h3>
   ${bgRowHtml('page','① 전체 배경',false)}
   ${bgRowHtml('frame','② 테두리 배경',true)}
   ${bgRowHtml('list','③ 게임목록 배경',true)}
   <div class="row" style="margin-top:12px">
    <button class="b pri" type="button" data-save="new">＋ 새 테마로 저장</button>
    ${draftMode==='edit'?'<button class="b" type="button" data-save="edit">현재 테마에 덮어쓰기</button>':''}
    <button class="b" type="button" data-x>취소</button>
   </div>
   <div class="msg" id="edMsg" style="display:none"></div>
  </div>`);
 m.parentElement.dataset.draft='1';
 const live=()=>apply(null,draft);
 m.addEventListener('click',e=>{if(e.target.closest('[data-x]')){cancelDraft()}});
 $('#edName',m).oninput=e=>{draft.name=e.target.value};
 $('#edSkin',m).onchange=e=>{
  draft.skin=e.target.value;draft.colors={...SKINS[draft.skin].d};
  m.querySelectorAll('[data-c]').forEach(i=>i.value=draft.colors[i.dataset.c]);live();
 };
 m.querySelectorAll('[data-c]').forEach(i=>i.oninput=()=>{draft.colors[i.dataset.c]=i.value;live()});
 ['page','frame','list'].forEach(k=>bindBgRow(m,k,draft,live,k==='list'?'#0a1230':'#0e2060'));
 m.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>saveDraft(b.dataset.save));
 live();
}
function saveDraft(mode){
 const name=(draft.name||'').trim();
 const msg=$('#edMsg');
 if(!name){msg.style.display='block';msg.className='msg er';msg.textContent='테마 이름을 적어 주세요.';return}
 const t={id:(mode==='edit'&&draft.id)?draft.id:'c'+Date.now().toString(36),name,skin:draft.skin,colors:{...draft.colors},
  pageImg:draft.pageImg,pageShade:draft.pageShade,frameColor:draft.frameColor,frameImg:draft.frameImg,frameShade:draft.frameShade,listColor:draft.listColor,listImg:draft.listImg,listShade:draft.listShade};
 const i=S.data.themes.findIndex(x=>x.id===t.id);
 if(i>=0)S.data.themes[i]=t;else S.data.themes.push(t);
 S.data.del=S.data.del.filter(x=>x!==t.id);
 delete S.data.ov[t.id];  /* 새로 저장한 값이 우선 */
 draft=null;saveLocal(true);select(t.id);closeWin();
 toast(`'${t.name}' 테마를 만들었어요. 테마 선택에 추가됐어요.`);
 afterSave();
}

/* =====================================================================
   배경수정 — 지금 보이는 테마의 게임목록배경 · 테두리배경
   ===================================================================== */
function openBgEditor(){
 const cur=findTheme(S.sel)||findTheme('default');
 const ov=S.data.ov[cur.id]||{};
 const g=k=>(k in ov)?ov[k]:(cur[k]||(k.endsWith('Shade')?0:''));
 draft={frameColor:g('frameColor'),frameImg:g('frameImg'),frameShade:g('frameShade'),listColor:g('listColor'),listImg:g('listImg'),listShade:g('listShade'),
  id:cur.id,name:cur.name,skin:cur.skin,colors:cur.colors||{},pageImg:cur.pageImg||'',pageShade:cur.pageShade||0};
 const orig=clone(draft);
 const m=mkDrawer(`
  <h2>🖼 배경수정<button type="button" data-x aria-label="닫기">✕</button></h2>
  <div class="bd">
   <p class="sm">지금 보이는 테마 <b>'${esc(cur.name)}'</b> 의 배경만 바꿉니다. 고르는 즉시 미리 보여요.</p>
   ${bgRowHtml('list','게임목록 배경',true)}
   ${bgRowHtml('frame','테두리 배경',true)}
   <div class="row" style="margin-top:12px">
    <button class="b pri" type="button" data-save>💾 저장</button>
    <button class="b dan" type="button" data-reset>원래대로</button>
    <button class="b" type="button" data-x>취소</button>
   </div>
  </div>`);
 m.parentElement.dataset.draft='1';
 const live=()=>apply(null,{...cur,...draft,id:cur.id,colors:cur.colors||{},pageImg:cur.pageImg,pageShade:cur.pageShade});
 m.addEventListener('click',e=>{if(e.target.closest('[data-x]'))cancelDraft()});
 ['frame','list'].forEach(k=>bindBgRow(m,k,draft,live,k==='list'?'#0a1230':'#0e2060'));
 $('[data-save]',m).onclick=()=>{
  S.data.ov[cur.id]={};['frameColor','frameImg','frameShade','listColor','listImg','listShade'].forEach(k=>S.data.ov[cur.id][k]=draft[k]);
  draft=null;saveLocal(true);closeWin();apply(S.sel);toast('배경을 저장했어요.');afterSave();
 };
 $('[data-reset]',m).onclick=()=>{
  if(!confirm('이 테마의 배경 수정을 모두 지우고 원래대로 돌릴까요?'))return;
  delete S.data.ov[cur.id];draft=null;saveLocal(true);closeWin();apply(S.sel);toast('원래 배경으로 돌렸어요.');afterSave();
 };
 live();void orig;
}

/* =====================================================================
   GitHub 연결 · 동기화
   ===================================================================== */
function ghCfg(){
 let c={};try{c=JSON.parse(ls.get(K.gh)||'null')||{}}catch(_){}
 let old={};try{old=JSON.parse(ls.get('wt.gh')||'null')||{}}catch(_){}   /* 모바일 테마추가에서 입력해 둔 값 재사용 */
 const h=location.hostname,auto=/\.github\.io$/i.test(h);
 return{owner:c.owner||old.owner||(auto?h.split('.')[0]:'youngho1206'),repo:c.repo||old.repo||(auto?h:'youngho1206.github.io'),branch:c.branch||old.branch||'main',token:c.token||old.token||''};
}
const b64enc=s=>{const b=new TextEncoder().encode(s);let o='';for(let i=0;i<b.length;i+=0x8000)o+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(o)};
const b64dec=b=>new TextDecoder().decode(Uint8Array.from(atob(String(b).replace(/\s/g,'')),c=>c.charCodeAt(0)));
async function gh(cfg,method,path,body){
 const u=`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`+(method==='GET'?`?ref=${encodeURIComponent(cfg.branch)}&t=${Date.now()}`:'');
 const r=await fetch(u,{method,headers:{'Accept':'application/vnd.github+json','Authorization':'Bearer '+cfg.token,'X-GitHub-Api-Version':'2022-11-28'},body:body?JSON.stringify(body):undefined});
 if(r.status===401)throw Error('GitHub 토큰이 올바르지 않거나 만료됐어요.');
 if(r.status===403)throw Error('GitHub 권한이 없어요. 토큰에 이 저장소의 Contents 읽기/쓰기 권한이 필요해요.');
 return r;
}
function mergeData(local,remote){
 const out=clone(local);if(!remote)return out;
 const del=new Set([...(local.del||[])]);
 remote.themes.forEach(t=>{if(!out.themes.some(x=>x.id===t.id)&&!del.has(t.id))out.themes.push(t)});
 Object.keys(remote.ov||{}).forEach(id=>{if(!(id in out.ov)&&!del.has(id))out.ov[id]=remote.ov[id]});
 out.del=[...new Set([...(local.del||[]),...(remote.del||[])])].filter(id=>!out.themes.some(t=>t.id===id));
 return out;
}
let pushing=null;
function push(){
 if(pushing)return pushing;
 return pushing=(async()=>{
  const cfg=ghCfg();if(!cfg.token)throw Error('NOTOKEN');
  S.syncing=true;refreshSync();
  try{
   let sha=null,remote=null;
   const r=await gh(cfg,'GET','pctheme/data.json');
   if(r.ok){const j=await r.json();sha=j.sha;try{remote=norm(JSON.parse(b64dec(j.content)))}catch(_){}}
   else if(r.status===404&&false){}
   else if(r.status!==404)throw Error('GitHub 읽기 실패 ('+r.status+') — 아이디/저장소 이름을 확인해 주세요.');
   const out=mergeData(S.data,remote);
   for(const [o,k] of imgRefs(out)){
    const v=o[k];
    if(typeof v==='string'&&v.startsWith('data:')){
     const path=`pctheme/img/${cyrb53(v)}.jpg`;
     const rr=await gh(cfg,'PUT',path,{message:'테마 이미지 추가',content:v.split(',')[1],branch:cfg.branch});
     if(!rr.ok&&rr.status!==422){let m='';try{m=(await rr.json()).message||''}catch(_){}throw Error('이미지 업로드 실패 ('+rr.status+') '+m)}
     imgCache[path]=v;o[k]=path;
    }
   }
   out.rev=Date.now();
   const body={message:'PC 테마 저장',content:b64enc(JSON.stringify(out,null,1)),branch:cfg.branch};if(sha)body.sha=sha;
   const pr=await gh(cfg,'PUT','pctheme/data.json',body);
   if(!pr.ok){let m='';try{m=(await pr.json()).message||''}catch(_){}throw Error('저장 실패 ('+pr.status+') '+m)}
   S.data=out;S.dirty=false;
   const sel=S.sel;if(!findTheme(sel))S.sel='default';
   ls.set(K.img,JSON.stringify(imgCache));saveLocal(false);apply(S.sel);
  }finally{S.syncing=false;pushing=null;refreshSync()}
 })();
}
async function autoPush(){
 const c=ghCfg();if(!c.token)return false;
 try{await push();toast('☁ GitHub 에 올렸어요. 다른 기기에서도 곧 보여요.');return true}
 catch(e){toast('GitHub 업로드 실패: '+e.message);return false}
}
function afterSave(){
 const c=ghCfg();
 if(c.token){autoPush();return}
 setTimeout(()=>{
  if(confirm('이 기기에만 저장됐어요.\n다른 기기에서도 보이게 GitHub 에 올리려면 로그인이 필요해요.\n지금 연결할까요?'))openGh();
 },250);
}
function openGh(){
 const c=ghCfg();
 const m=mkModal(`
  <h2>☁ GitHub 연결 · 동기화<button type="button" data-x aria-label="닫기">✕</button></h2>
  <div class="bd">
   <p class="sm">테마를 다른 기기에서도 보려면 GitHub 저장소에 올려야 해요. GitHub 는 보안상 <b>아이디·비밀번호나 구글 로그인으로는 파일 업로드를 허용하지 않고</b>, <b>액세스 토큰</b>으로만 허용해요. 토큰은 1번만 입력하면 되고 <b>이 브라우저에만 저장</b>되며 사이트 파일에는 들어가지 않아요.</p>
   <label class="f" for="ghO">GitHub 아이디</label><input type="text" id="ghO" value="${esc(c.owner)}" autocomplete="off">
   <label class="f" for="ghR">저장소 이름</label><input type="text" id="ghR" value="${esc(c.repo)}" autocomplete="off">
   <label class="f" for="ghB">브랜치</label><input type="text" id="ghB" value="${esc(c.branch)}" autocomplete="off">
   <label class="f" for="ghT">액세스 토큰</label><input type="password" id="ghT" value="${esc(c.token)}" placeholder="github_pat_…" autocomplete="off">
   <p class="sm">토큰 만들기: GitHub › Settings › Developer settings › Personal access tokens › <b>Fine-grained tokens</b> › 이 저장소만 선택 › Permissions › <b>Contents: Read and write</b> 로 생성</p>
   <div class="row">
    <button class="b pri" type="button" data-a="save">저장하고 확인</button>
    <button class="b" type="button" data-a="push">지금 올리기</button>
    <button class="b" type="button" data-a="dl">파일로 내려받기</button>
    <button class="b dan" type="button" data-a="out">토큰 지우기</button>
   </div>
   <div class="msg" id="ghMsg">${esc(syncText())}</div>
   <p class="sm">‘파일로 내려받기’ 는 data.json 을 받아 GitHub 웹에서 <b>pctheme/data.json</b> 으로 직접 올릴 수 있게 해줘요.</p>
  </div>`);
 const msg=(t,k)=>{const e=$('#ghMsg',m);e.textContent=t;e.className='msg '+(k||'')};
 const read=()=>({owner:$('#ghO',m).value.trim(),repo:$('#ghR',m).value.trim(),branch:$('#ghB',m).value.trim()||'main',token:$('#ghT',m).value.trim()});
 m.addEventListener('click',async e=>{
  if(e.target.closest('[data-x]')){closeWin();openSettings();return}
  const a=e.target.closest('[data-a]');if(!a)return;
  const k=a.dataset.a,cfg=read();
  if(k==='save'){
   ls.set(K.gh,JSON.stringify(cfg));
   if(!cfg.token){msg('토큰을 입력해 주세요.','er');return}
   msg('확인하는 중…');
   try{
    const r=await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}`,{headers:{'Authorization':'Bearer '+cfg.token,'Accept':'application/vnd.github+json'}});
    if(r.status===401)msg('토큰이 올바르지 않아요.','er');
    else if(r.status===404)msg('저장소를 찾을 수 없어요. 아이디/저장소 이름과 토큰의 저장소 권한을 확인해 주세요.','er');
    else if(!r.ok)msg('확인 실패 ('+r.status+')','er');
    else{msg('✅ 연결됐어요.'+(S.dirty?' 이제 “지금 올리기”를 눌러 주세요.':''),'ok')}
   }catch(_){msg('인터넷 연결을 확인해 주세요.','er')}
  }else if(k==='push'){
   ls.set(K.gh,JSON.stringify(cfg));
   try{await push();msg('✅ GitHub 에 올렸어요. (사이트에 반영되기까지 1분 정도 걸릴 수 있어요)','ok')}
   catch(er){msg(er.message==='NOTOKEN'?'토큰을 먼저 입력해 주세요.':'❌ '+er.message,'er')}
  }else if(k==='dl'){
   const b=new Blob([JSON.stringify(S.data,null,1)],{type:'application/json'});
   const u=URL.createObjectURL(b),l=document.createElement('a');l.href=u;l.download='data.json';l.click();setTimeout(()=>URL.revokeObjectURL(u),2000);
  }else if(k==='out'){
   ls.del(K.gh);ls.del('wt.gh');$('#ghT',m).value='';msg('토큰을 지웠어요.');
  }
 });
}

/* ---------- 서버(GitHub Pages)에서 최신 테마 목록 받기 ---------- */
async function pull(){
 try{
  const r=await fetch('pctheme/data.json?t='+Date.now(),{cache:'no-store'});
  if(!r.ok)return;
  const remote=norm(await r.json());
  if(S.dirty){
   if(remote.rev>S.data.rev){S.data=mergeData(S.data,remote);saveLocal(false)}
  }else if(remote.rev>=S.data.rev){
   /* 아직 사이트에 반영 전인 내 이미지 경로가 깨지지 않게 캐시를 유지 */
   S.data=remote;saveLocal(false);
  }
  if(!findTheme(S.sel))S.sel='default';
  apply(S.sel);
  if(openWin&&!openWin.dataset.draft&&$('#tc',openWin))openSettings();
 }catch(_){}
}

/* ---------- 시작 ---------- */
loadLocal();
if(!findTheme(S.sel))S.sel='default';
apply(S.sel);                                   /* 깜빡임 없이 먼저 적용 */
window.PCT={
 init(){apply(S.sel);pull()},
 openSettings,select,apply:()=>apply(S.sel),
 get sel(){return S.sel}
};
})();
