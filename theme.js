/* =====================================================================
   theme.js — 테마 엔진 (index.html · search.html 공용)

   · webthema/ 폴더에 thema01.html / theme01.html, 02, 03 … 을 올리면
     하단바 '테마' 메뉴에 자동으로 나타납니다. (목록 파일을 따로 고칠 필요 없음)
   · 테마 파일에서 '배경/디자인 CSS' 와 '아이콘(ICON_DATA)' 만 가져와
     현재 페이지에 덧씌웁니다. 페이지 전체가 바뀌거나 이동하지 않습니다.
   · 선택한 테마는 브라우저(localStorage)에 기억됩니다.
   ===================================================================== */
(function(){
 'use strict';
 const KEY='wt.sel', DEF='default', DIR='webthema/';
 const BUILTIN_NAMES={thema01:'아침'};            /* names.json 이 없을 때 쓰는 기본 이름 */
 const WT=window.WT={map:null,sel:DEF,themes:null};
 const cache={};
 let styleEl=null,defaultTC=null;

 const store={
  get(){try{return localStorage.getItem(KEY)}catch(_){return null}},
  set(v){try{localStorage.setItem(KEY,v)}catch(_){}}
 };
 const tcMeta=()=>document.querySelector('meta[name="theme-color"]');
 const timeout=(ms)=>new Promise((_,rej)=>setTimeout(()=>rej(Error('timeout')),ms));

 /* 아이콘 주소: 테마에 아이콘이 있으면 그것, 없으면 icons/ 폴더 */
 WT.src=n=>(WT.map&&WT.map[n])?WT.map[n]:`icons/${n}.png?v=3`;
 WT.refreshIcons=()=>{
  document.querySelectorAll('img[data-k]').forEach(i=>{
   const s=WT.src(i.dataset.k);if(i.getAttribute('src')!==s)i.src=s;
  });
 };

 /* ---------- 테마 파일 해석 ---------- */
 /* 기준 CSS(원본 index 의 스타일)와 비교해서 '추가된 줄'만 뽑아냅니다. */
 function addedLines(base,theme){
  const A=base.replace(/\r/g,'').split('\n'),B=theme.replace(/\r/g,'').split('\n');
  const m=A.length,n=B.length,w=n+1,dp=new Uint16Array((m+1)*w);
  for(let i=m-1;i>=0;i--)for(let j=n-1;j>=0;j--)
   dp[i*w+j]=A[i]===B[j]?dp[(i+1)*w+j+1]+1:Math.max(dp[(i+1)*w+j],dp[i*w+j+1]);
  const out=[];let i=0,j=0;
  while(j<n){
   if(i<m&&A[i]===B[j]){i++;j++}
   else if(i<m&&dp[(i+1)*w+j]>=dp[i*w+j+1])i++;
   else{out.push(B[j]);j++}
  }
  return out.join('\n');
 }
 WT._addedLines=addedLines;

 let basePromise=null;
 const getBase=()=>basePromise||(basePromise=fetch(DIR+'base-style.css',{cache:'no-cache'})
   .then(r=>{if(!r.ok)throw Error('base-style');return r.text()}));

 function parseIcons(t){
  const m=t.match(/const\s+ICON_DATA\s*=\s*(\{[\s\S]*?\})\s*;/);
  if(!m)return null;
  try{return JSON.parse(m[1])}catch(_){}
  try{return (new Function('return '+m[1]))()}catch(_){return null}
 }

 async function loadTheme(id){
  if(cache[id])return cache[id];
  const r=await fetch(`${DIR}${id}.html`,{cache:'no-cache'});
  if(!r.ok)throw Error('테마 파일 없음: '+id);
  const t=await r.text();
  /* ① @theme-start ~ @theme-end 표시가 있으면 그 사이를 CSS 로 사용
     ② 없으면 원본 스타일과 비교해 추가된 부분만 CSS 로 사용 */
  let css='';
  const mk=t.match(/\/\*\s*@theme-start\s*\*\/([\s\S]*?)\/\*\s*@theme-end\s*\*\//);
  if(mk)css=mk[1];
  else{
   const st=t.match(/<style[^>]*>([\s\S]*?)<\/style>/);
   if(st){
    let base='';try{base=await getBase()}catch(_){}
    css=base?addedLines(base,st[1]):'';
   }
  }
  const tc=t.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i);
  return cache[id]={css,icons:parseIcons(t),tc:tc?tc[1]:null};
 }

 /* 새 아이콘을 미리 받아 두어서, 바뀔 때 깜빡이지 않게 합니다. */
 function preload(icons){
  if(!icons)return Promise.resolve();
  const jobs=Object.values(icons).map(u=>new Promise(r=>{
   const i=new Image();i.onload=i.onerror=()=>r();i.src=u;if(i.decode)i.decode().then(r,r);
  }));
  return Promise.race([Promise.all(jobs),new Promise(r=>setTimeout(r,4000))]);
 }

 function setCss(css){
  if(!css){if(styleEl){styleEl.remove();styleEl=null}return}
  if(!styleEl){styleEl=document.createElement('style');styleEl.id='wt-css';document.head.appendChild(styleEl)}
  styleEl.textContent=css;
 }
 function setTC(c){
  const m=tcMeta();if(!m)return;
  if(defaultTC===null)defaultTC=m.getAttribute('content')||'';
  m.setAttribute('content',c||defaultTC);
 }
 function fire(){document.dispatchEvent(new CustomEvent('wtchange',{detail:{sel:WT.sel}}))}

 /* ---------- 적용 ---------- */
 WT.apply=async function(id){
  if(!id||id===DEF){
   setCss('');WT.map=null;WT.sel=DEF;setTC(null);store.set(DEF);
   WT.refreshIcons();fire();return;
  }
  const th=await loadTheme(id);
  await preload(th.icons);
  setCss(th.css);WT.map=th.icons;WT.sel=id;setTC(th.tc);store.set(id);
  WT.refreshIcons();fire();
 };

 /* ---------- webthema 폴더 속 테마 목록 (빠르게) ----------
    ① webthema/themes.json 한 파일만 읽어서 목록을 만듭니다. (요청 1번)
    ② themes.json 이 없으면 thema01~30 / theme01~30 을 '한꺼번에 동시에' 확인합니다.
    ③ 이전에 받은 목록은 브라우저에 기억해 두고, 메뉴를 누르면 바로 보여준 뒤
       페이지가 열릴 때 뒤에서 미리 새로고침합니다. */
 const LKEY='wt.list';
 const fetchT=(u,o,ms)=>Promise.race([fetch(u,o),timeout(ms||5000)]);
 try{const c=JSON.parse(localStorage.getItem(LKEY)||'null');if(Array.isArray(c)&&c.length)WT.themes=c}catch(_){}
 async function scanList(){
  let names={};
  try{const r=await fetchT(DIR+'names.json',{cache:'no-cache'});if(r.ok)names=await r.json()}catch(_){}
  const ids=[];
  for(let n=1;n<=30;n++){const nn=String(n).padStart(2,'0');ids.push('thema'+nn,'theme'+nn)}
  const ok=await Promise.all(ids.map(async id=>{try{const r=await fetchT(`${DIR}${id}.html`,{method:'HEAD',cache:'no-cache'},5000);return r.ok}catch(_){return false}}));
  const found=[];
  ids.forEach((id,i)=>{if(ok[i])found.push({id,name:names[id]||BUILTIN_NAMES[id]||id})});
  return found;
 }
 WT.list=function(force){
  if(WT.themes&&!force)return Promise.resolve(WT.themes);
  if(WT._lp&&!force)return WT._lp;
  return WT._lp=(async()=>{
   let found=null;
   try{
    const r=await fetchT(DIR+'themes.json',{cache:'no-cache'},5000);
    if(r.ok){
     const j=await r.json();
     const arr=Array.isArray(j)?j:j.themes;
     if(Array.isArray(arr))found=arr.filter(t=>t&&t.id).map(t=>({id:String(t.id),name:String(t.name||t.id)}));
    }
   }catch(_){}
   if(!found)found=await scanList();
   WT.themes=found;
   try{localStorage.setItem(LKEY,JSON.stringify(found))}catch(_){}
   document.dispatchEvent(new CustomEvent('wtlist'));
   return found;
  })().finally(()=>{WT._lp=null});
 };

 /* ---------- 시작할 때: 저장된 테마를 먼저 적용 ---------- */
 const saved=store.get();
 const hasSaved=saved&&saved!==DEF;
 if(hasSaved){
  /* 기본 화면이 잠깐 보였다가 바뀌는 현상을 막기 위해 준비될 때까지 살짝 숨김 */
  const s=document.createElement('style');
  s.textContent='html.wt-wait body{opacity:0}body{transition:opacity .25s}';
  document.head.appendChild(s);
  document.documentElement.classList.add('wt-wait');
 }
 const reveal=()=>document.documentElement.classList.remove('wt-wait');
 WT.ready=(async()=>{
  if(hasSaved){
   try{await Promise.race([WT.apply(saved),timeout(6000)])}
   catch(_){ /* 테마 파일이 지워졌거나 느린 경우 → 기본으로 */
    setCss('');WT.map=null;WT.sel=DEF;setTC(null);store.set(DEF);
   }
  }
  reveal();
 })();
 setTimeout(reveal,3500);
 /* 페이지가 열린 직후, 뒤에서 목록을 미리 받아 둡니다. */
 WT.ready.then(()=>setTimeout(()=>{WT.list(true).catch(()=>{})},300));
})();
