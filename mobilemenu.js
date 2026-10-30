/* =====================================================================
   mobilemenu.js — 모바일 상단(시간 · 검색) / 하단(메인으로 · 안내 · 테마 · 설정) 메뉴
   · 예전 하단 독바(dock.js)를 대신합니다. mobile.html 맨 아래에서 불러옵니다.
   · 필요한 것: theme.js, mobilepref.js(배경·아이콘), emudata.js 와 mobile.html 의 C / P / ETC / openEmu / openPc
   ===================================================================== */
(function(){
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 const esc=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
 const P2=n=>String(n).padStart(2,'0');

 /* ---------- 아이콘(선) ---------- */
 const IC={
  home:'<svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.8v9.7h12.4V9.8"/><path d="M10 19.5v-5.2h4v5.2"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6"/></svg>',
  theme:'<svg viewBox="0 0 24 24"><circle cx="13.5" cy="6.5" r=".6"/><circle cx="17.5" cy="10.5" r=".6"/><circle cx="8.5" cy="7.5" r=".6"/><circle cx="6.5" cy="12.5" r=".6"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.83-.44-1.12-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z"/></svg>',
  gear:'<svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  broom:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4.5h6V7"/><path d="M6 7l1 12.5h10L18 7"/><path d="M10 11v5M14 11v5"/></svg>',
  refresh:'<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4.5V11h-6.5"/></svg>'
 };

 /* ---------- 상단 바 : 시간 + 검색 ---------- */
 const top=document.createElement('div');
 top.className='mm-top mm-glass';
 top.innerHTML=`
  <div class="mm-clock" id="mmClock" aria-label="현재 시간"></div>
  <div class="mm-sf" id="mmSf">
   <input id="mmQ" type="text" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="검색어를 입력해주세요." aria-label="검색어">
   <button class="mm-x" id="mmQx" type="button" aria-label="지우기">✕</button>
  </div>
  <button class="mm-go" id="mmGo" type="button">검색</button>`;
 const res=document.createElement('div');
 res.className='mm-res mm-glass';res.id='mmRes';res.setAttribute('role','listbox');

 /* ---------- 하단 바 ---------- */
 const bot=document.createElement('nav');
 bot.className='mm-bot mm-glass';bot.setAttribute('aria-label','하단 메뉴');
 bot.innerHTML=`
  <button class="mm-tab js-back" id="mmHome" type="button">${IC.home}<span>메인으로</span></button>
  <button class="mm-tab" id="mmGuide" data-sheet="guide" type="button">${IC.info}<span>안내</span></button>
  <button class="mm-tab" id="mmTheme" data-sheet="theme" type="button">${IC.theme}<span>테마</span></button>
  <button class="mm-tab" id="mmSet" data-sheet="set" type="button">${IC.gear}<span>설정</span></button>`;

 const back=document.createElement('div');back.className='mm-back';
 const sheet=document.createElement('section');
 sheet.className='mm-sheet mm-glass';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');
 document.body.append(top,res,back,sheet,bot);

 /* ---------- 시계 : AM 00:07 ---------- */
 const clock=$('#mmClock');let lastT='';
 function tick(){
  const d=new Date(),h=d.getHours(),t=(h<12?'AM':'PM')+' '+P2(h%12)+':'+P2(d.getMinutes());
  if(t===lastT)return;lastT=t;
  clock.innerHTML='<b>'+t.slice(0,2)+'</b><span>'+t.slice(3)+'</span>';
 }
 tick();setInterval(tick,1000);
 document.addEventListener('visibilitychange',tick);

 /* ---------- 검색 ---------- */
 const sNorm=t=>String(t).toLowerCase().replace(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]/g,'');
 const sIsSub=(q,t)=>{let i=0;for(const ch of t){if(ch===q[i])i++;if(i===q.length)return true}return false};
 let S_ALL=null;
 function buildAll(){
  const kw=(typeof S_KW!=='undefined')?S_KW:{};
  const mk=(o,name,idStr)=>Object.assign(o,{
   nn:sNorm(name),words:name.toLowerCase().split(/[^a-z0-9\u3131-\u318e\uac00-\ud7a3]+/).filter(Boolean),
   extra:sNorm(idStr)});
  S_ALL=[
   ...C.map(c=>mk({k:'emu',c,tag:era(c.y)},c.n,[c.id,c.l,c.fn||'',kw[c.id]||''].join(' '))),
   ...P.map(c=>mk({k:'pc',c,tag:'PC'},c.n,[c.id,c.l,c.fn||'',kw[c.id]||''].join(' '))),
   ...ETC.map(c=>mk({k:'etc',c,tag:'기타'},c.n,[c.id,c.l].join(' ')))
  ];
 }
 function searchAll(raw){
  const q=sNorm(raw);if(!q)return{list:[],similar:false};
  if(!S_ALL)buildAll();
  const sc=o=>o.nn.startsWith(q)?0:o.words.some(w=>sNorm(w).startsWith(q))?1:o.nn.includes(q)?2:o.extra.includes(q)?3:(q.length>1&&sIsSub(q,o.nn))?4:-1;
  let list=S_ALL.map(o=>({o,s:sc(o)})).filter(r=>r.s>=0).sort((a,b)=>a.s-b.s);
  if(list.length)return{list:list.map(r=>r.o),similar:false};
  const set=[...new Set(q)];
  list=S_ALL.map(o=>({o,n:set.filter(ch=>o.nn.includes(ch)||o.extra.includes(ch)).length})).filter(r=>r.n>0).sort((a,b)=>b.n-a.n).slice(0,6);
  return{list:list.map(r=>r.o),similar:true};
 }
 function hl(name,raw){
  const q=sNorm(raw);if(!q)return esc(name);
  const sep='[^a-z0-9\\u3131-\\u318e\\uac00-\\ud7a3]*';
  let re;try{re=new RegExp([...q].map(ch=>ch.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join(sep),'i')}catch(_){return esc(name)}
  const m=re.exec(name);if(!m)return esc(name);
  return esc(name.slice(0,m.index))+'<mark>'+esc(m[0])+'</mark>'+esc(name.slice(m.index+m[0].length));
 }
 const inp=$('#mmQ'),sf=$('#mmSf');
 let sList=[],sIdx=0;
 function showRes(forceOpen){
  const raw=inp.value;sf.classList.toggle('has',!!raw);
  if(!sNorm(raw)){res.classList.remove('open');res.innerHTML='';sList=[];return}
  closeSheet();
  const r=searchAll(raw);sList=r.list;sIdx=0;
  res.innerHTML=!sList.length?'<div class="none">검색 결과가 없습니다</div>':
   (r.similar?'<div class="hint">비슷한 이름</div>':'')+sList.map((o,i)=>{
    const ic=o.k==='etc'?etcIcon(o.c):icon(o.c);
    return `<button type="button" class="it${i?'':' on'}" role="option" data-i="${i}"><span class="si">${ic}</span><span class="nm">${hl(o.c.n,raw)}</span><span class="tg">${esc(o.tag)}</span></button>`;
   }).join('');
  res.classList.add('open');
 }
 function closeRes(){res.classList.remove('open')}
 function pick(i){
  const o=sList[i];if(!o)return;
  closeRes();inp.blur();inp.value='';sf.classList.remove('has');sList=[];
  if(o.k==='pc')openPc(o.c);
  else if(o.k==='emu')openEmu(o.c);
  else if(o.c.href)location.href=o.c.href;
  else iosAlert('현재 기능은 준비 중 입니다.');
 }
 function mark(){res.querySelectorAll('.it').forEach((b,i)=>b.classList.toggle('on',i===sIdx));const b=res.querySelector('.it.on');b&&b.scrollIntoView({block:'nearest'})}
 inp.addEventListener('input',()=>showRes());
 inp.addEventListener('focus',()=>{if(sNorm(inp.value))showRes()});
 inp.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(e.key==='ArrowDown'&&sList.length){e.preventDefault();sIdx=(sIdx+1)%sList.length;mark()}
  else if(e.key==='ArrowUp'&&sList.length){e.preventDefault();sIdx=(sIdx-1+sList.length)%sList.length;mark()}
  else if(e.key==='Enter'){e.preventDefault();if(!sList.length)showRes();pick(sIdx)}
  else if(e.key==='Escape'){closeRes();inp.blur()}
 });
 $('#mmQx').addEventListener('click',()=>{inp.value='';showRes();inp.focus()});
 $('#mmGo').addEventListener('click',()=>{
  if(!sNorm(inp.value)){inp.focus();return}
  showRes();
  if(sList.length===1)pick(0);
  inp.blur();
 });
 res.addEventListener('click',e=>{const b=e.target.closest('.it');if(b)pick(+b.dataset.i)});
 res.addEventListener('mousemove',e=>{const b=e.target.closest('.it');if(b&&+b.dataset.i!==sIdx){sIdx=+b.dataset.i;mark()}});
 document.addEventListener('pointerdown',e=>{if(res.classList.contains('open')&&!e.target.closest('.mm-top,.mm-res'))closeRes()});

 /* ---------- 시트 (안내 · 테마 · 설정) ---------- */
 let cur=null;const sub={guide:'how',theme:'wall'};
 const TITLES={guide:'안내',theme:'테마',set:'설정'};
 const TABS={
  guide:[['how','게임방법'],['save','세이브방법'],['info','정보']],
  theme:[['wall','배경화면'],['icon','아이콘'],['thm','테마']],
  set:null
 };

 function guideBody(t){
  if(t==='save')return `
   <p class="sub">게임 진행 상황을 파일로 저장해 두면 나중에 이어서 할 수 있어요.</p>
   <ol class="mm-ol">
    <li><b>저장</b> — 게임 중 위쪽 <b>💾 저장</b> 버튼을 누르면 진행 상황이 세이브 파일(.gsv)로 저장돼요.</li>
    <li><b>불러오기</b> — 다음에 같은 게임을 열고 <b>📥 불러오기</b>로 저장해 둔 파일을 고르면 이어서 할 수 있어요.</li>
    <li><b>백업</b> — 세이브 파일은 내 기기나 클라우드에 따로 보관해 두세요.</li>
    <li><b>PC (DOS · Windows)</b> — <b>💾 VHD저장</b> / <b>📥 VHD불러오기</b>로 디스크 상태를 저장하고 이어서 할 수 있어요.</li>
    <li><b>주의</b> — 설정의 <b>데이터 삭제</b>를 하면 게임 저장 데이터도 함께 지워져요. 지우기 전에 세이브 파일을 따로 보관하세요.</li>
   </ol>
   <button class="mm-btn pri" type="button" data-view="https://youngho1206.tistory.com/2" data-vt="세이브파일 저장 방법">세이브파일 저장방법 자세히 보기</button>`;
  if(t==='info')return `
   <p class="mm-note" style="margin:4px 0 16px;text-align:center">《 이 홈페이지는 2026년 9월 6일부터 AI를 통해 제작된 홈페이지입니다.<br>하지만 모든 기능이 AI로 추가된 것이 아닙니다. 》</p>
   <h3>제작자</h3>
   <dl class="mm-dl">
    <dt>이름</dt><dd>최영호</dd>
    <dt>전자우편</dt><dd><a href="mailto:youngho7375@naver.com">youngho7375@naver.com</a></dd>
    <dt>카카오톡 ID</dt><dd>cyho20</dd>
    <dt>블로그</dt><dd><a href="https://blog.naver.com/yh_7375" target="_blank" rel="noopener">https://blog.naver.com/yh_7375</a></dd>
   </dl>
   <button class="mm-btn" type="button" data-view="https://youngho1206.tistory.com/m/1" data-vt="어플 설치 방법">어플 설치방법 보기</button>`;
  return `
   <ol class="mm-ol">
    <li><b>게임 시작</b> — 메인 화면에서 콘솔 아이콘을 누르면 에뮬레이터가 열려요. 위쪽 연대 탭(1980·1990·2000년대)으로 골라볼 수도 있어요.</li>
    <li><b>게임 불러오기</b> — 열린 화면의 <b>📂 게임</b> 버튼으로 ROM 파일(.zip 포함)을 고르거나 화면에 끌어다 놓으세요.</li>
    <li><b>조작 · 화면</b> — <b>🎮 조작</b>으로 화면 터치 조작을 켜고 끄고, <b>⛶ 전체화면</b>, <b>▲ 메뉴숨김</b>도 쓸 수 있어요. 스마트폰은 가로로 돌려서 하면 편해요.</li>
    <li><b>PC (DOS · Windows)</b> — 아래쪽 PC 항목을 누르면 서버에 있는 이미지로 자동 시작해요. 내 디스크 이미지는 <b>💽 로컬부팅</b>, 글자 입력은 <b>⌨ 키보드</b>를 쓰세요.</li>
    <li><b>검색</b> — 위쪽 검색창에 이름 일부(예: 슈퍼, 윈도우, n64)만 입력하고 결과를 누르면 바로 실행돼요.</li>
    <li><b>테마</b> — 아래 <b>테마</b> 메뉴에서 배경화면·아이콘·테마를 바꿀 수 있어요. 고른 것은 기억돼요.</li>
    <li>에뮬레이션 엔진을 불러오므로 <b>인터넷 연결</b>이 필요해요.</li>
   </ol>
   <div class="mm-note">롬파일은 본인이 합법적으로 소유한 게임만 사용하세요. 이 사이트는 게임 파일을 제공하지 않습니다.</div>`;
 }

 const PREV=['nes','snes','gameboy','playstation'];
 function themeIconUrl(style,n){
  if(style==='theme'){const W=window.WT;return(W&&W.map&&W.map[n])?W.map[n]:'icons/'+n+'.png?v=4'}
  return MPref.iconUrl(style,n)||('icons/'+n+'.png?v=4');
 }
 function themeBody(t){
  if(t==='icon'){
   return `<p class="sub">메인 화면의 기종 아이콘 모양을 고를 수 있어요.</p><div class="mm-rows">`+
    MPref.ICONS.map(s=>`<button type="button" class="mm-row${MPref.icon===s.id?' on':''}" data-icon="${s.id}">
      <span class="tx"><b>${esc(s.n)}</b><small>${esc(s.d)}</small></span>
      <span class="pv">${PREV.map(n=>`<img src="${esc(themeIconUrl(s.id,n))}" alt="" loading="lazy" draggable="false">`).join('')}</span>
      <span class="mm-ck"></span></button>`).join('')+`</div>`;
  }
  if(t==='thm'){
   const sel=window.WT?WT.sel:'default',list=window.WT&&WT.themes;
   let h=`<p class="sub">미리 만들어 둔 테마를 고르면 배경과 아이콘이 한 번에 바뀌어요.</p><div class="mm-rows">`;
   h+=`<button type="button" class="mm-row${sel==='default'?' on':''}" data-thm="default"><span class="tx"><b>기본페이지</b><small>처음 모습 + 꿈꾸는 밤하늘 배경</small></span><span class="mm-ck"></span></button>`;
   (list||[]).forEach(x=>{
    h+=`<button type="button" class="mm-row${sel===x.id?' on':''}" data-thm="${esc(x.id)}"><span class="tx"><b>${esc(x.name)}</b>${x.name!==x.id?`<small>${esc(x.id)}</small>`:''}</span><span class="mm-ck"></span></button>`;
   });
   h+=`</div>`;
   if(!list)h+='<div class="mm-ph">테마를 찾는 중…</div>';
   else if(!list.length)h+='<div class="mm-ph">설정 → 테마 추가로 새 테마를 만들 수 있어요.</div>';
   return h;
  }
  /* 배경화면 */
  return `<p class="sub">모바일 화면의 배경 사진을 고를 수 있어요.</p><div class="mm-walls">`+
   `<button type="button" class="mm-wall none${MPref.wall==='theme'?' on':''}" data-wall="theme"><span>테마 배경<br>(원래 배경)</span></button>`+
   MPref.WALLS.map(w=>`<button type="button" class="mm-wall${MPref.wall===w.id?' on':''}" data-wall="${w.id}"><img src="mobilebg/thumb/${w.f}" alt="" loading="lazy" draggable="false"><span>${esc(w.n)}</span></button>`).join('')+`</div>`;
 }
 function setBody(){
  return `<p class="sub">테마 추가 · 캐쉬 · 데이터 관련 기능이에요.</p>
   <button class="mm-act" id="stAdd" type="button">${IC.plus}<span>테마 추가<small>배경과 아이콘을 내 사진으로 바꿔 새 테마로 저장해요</small></span></button>
   <button class="mm-act js-cache" type="button">${IC.refresh}<span>캐쉬 지우기<small>저장된 임시 파일을 지우고 최신 버전으로 새로 불러와요 (내 데이터는 그대로)</small></span></button>
   <button class="mm-act js-wipe" type="button">${IC.broom}<span>데이터 삭제<small>이 사이트에 쌓인 기록·게임 저장 데이터를 모두 지우고 처음 상태로 되돌려요</small></span></button>`;
 }
 function render(keepScroll){
  if(!cur)return;
  const tabs=TABS[cur],t=sub[cur];
  const prev=keepScroll?($('.mm-bd',sheet)||{}).scrollTop:0;
  sheet.setAttribute('aria-label',TITLES[cur]);
  sheet.innerHTML=
   `<div class="mm-sh"><h2>${TITLES[cur]}</h2><button class="mm-close" type="button" aria-label="닫기">✕</button></div>`+
   (tabs?`<div class="mm-tabs" role="tablist">${tabs.map(x=>`<button type="button" role="tab" data-t="${x[0]}" class="${x[0]===t?'on':''}">${x[1]}</button>`).join('')}</div>`:'')+
   `<div class="mm-bd">${cur==='guide'?guideBody(t):cur==='theme'?themeBody(t):setBody()}</div>`;
  if(prev)$('.mm-bd',sheet).scrollTop=prev;
 }
 function openSheet(name){
  if(cur===name){closeSheet();return}
  closeRes();inp.blur();
  cur=name;render();
  sheet.classList.add('open');back.classList.add('open');
  bot.querySelectorAll('[data-sheet]').forEach(b=>b.classList.toggle('on',b.dataset.sheet===name));
  if(name==='theme'&&window.WT&&!WT.themes)WT.list().catch(()=>{});
 }
 function closeSheet(){
  if(!cur)return;cur=null;
  sheet.classList.remove('open');back.classList.remove('open');
  bot.querySelectorAll('[data-sheet]').forEach(b=>b.classList.remove('on'));
 }
 bot.addEventListener('click',e=>{const b=e.target.closest('[data-sheet]');if(b)openSheet(b.dataset.sheet)});
 back.addEventListener('pointerdown',closeSheet);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeSheet();closeView()}});

 sheet.addEventListener('click',async e=>{
  if(e.target.closest('.mm-close')){closeSheet();return}
  const tb=e.target.closest('.mm-tabs button');
  if(tb){sub[cur]=tb.dataset.t;render();return}
  const w=e.target.closest('[data-wall]');
  if(w){MPref.setWall(w.dataset.wall);return}
  const ic=e.target.closest('[data-icon]');
  if(ic){MPref.setIcon(ic.dataset.icon);return}
  const th=e.target.closest('[data-thm]');
  if(th){applyTheme(th);return}
  const v=e.target.closest('[data-view]');
  if(v){openView(v.dataset.view,v.dataset.vt);return}
  if(e.target.closest('#stAdd')){addTheme();return}
 });
 /* 고른 내용이 바뀌면 체크 표시를 새로 그림 (스크롤 위치는 유지) */
 ['mmchange','wtchange','wtlist'].forEach(ev=>document.addEventListener(ev,()=>{if(cur==='theme')render(true)}));

 async function applyTheme(btn){
  if(btn.dataset.busy)return;
  const id=btn.dataset.thm,nm=btn.querySelector('b'),old=nm.textContent;
  btn.dataset.busy='1';nm.textContent='적용 중…';
  try{
   await WT.apply(id);
   MPref.setIcon('theme');
   MPref.setWall(id==='default'?'sunset':'theme');
  }catch(err){
   nm.textContent='불러오기 실패';
   setTimeout(()=>{nm.textContent=old;delete btn.dataset.busy},1600);
   return;
  }
  delete btn.dataset.busy;
 }

 /* ---------- 안내 페이지 보기 (세이브 방법 · 어플 설치 방법) ---------- */
 let view=null;
 function openView(url,title){
  if(!view){
   view=document.createElement('div');view.className='mm-view';
   view.innerHTML='<div class="vh"><span></span><a target="_blank" rel="noopener">새 창으로</a><button class="mm-close" type="button" aria-label="닫기">✕</button></div><iframe title="" referrerpolicy="no-referrer"></iframe>';
   document.body.appendChild(view);
   $('.mm-close',view).addEventListener('click',closeView);
  }
  $('span',view).textContent=title||'안내';
  const a=$('a',view);a.href=url;
  const f=$('iframe',view);f.title=title||'';if(f.getAttribute('src')!==url)f.src=url;
  view.classList.add('open');
 }
 function closeView(){if(view)view.classList.remove('open')}

 /* ---------- 암호 확인 (PBKDF2-SHA256 · 평문 암호는 코드에 없음) → 테마 추가 ---------- */
 const PW={s:'46d89e4235224cb424a8d1bf750755cb',h:'16862305ad8d1458b082470f4a831be7b032d8875298c99579ae43c24a7fd09f',n:310000,k:'wt_pw_fail'};
 const hex2=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
 const unhex=h=>new Uint8Array(h.match(/../g).map(x=>parseInt(x,16)));
 async function pwHash(v){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(v),'PBKDF2',false,['deriveBits']);return hex2(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:unhex(PW.s),iterations:PW.n},k,256))}
 function pwSame(a,b){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0}
 function pwState(){try{return JSON.parse(localStorage.getItem(PW.k)||'{}')}catch(e){return{}}}
 function pwSave(o){try{localStorage.setItem(PW.k,JSON.stringify(o))}catch(e){}}
 const pwBox=document.createElement('div');
 pwBox.className='wtinfo';pwBox.setAttribute('role','dialog');pwBox.setAttribute('aria-modal','true');pwBox.setAttribute('aria-label','암호 확인');
 pwBox.innerHTML=`
  <div class="card" style="max-width:340px">
   <button class="x" type="button" aria-label="닫기">✕</button>
   <h2>암호 입력</h2>
   <p style="margin:6px 0 14px;font-size:13px;opacity:.8">테마 추가를 하려면 암호가 필요해요.</p>
   <input id="mmPwIn" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="암호" aria-label="암호" style="width:100%;box-sizing:border-box;padding:13px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.2);color:#fff;font-size:18px;letter-spacing:6px;text-align:center;outline:0">
   <div id="mmPwMsg" style="min-height:20px;margin:10px 0 0;font-size:13px;text-align:center;color:#ffd0d0" aria-live="polite"></div>
   <button class="srow" id="mmPwOk" type="button" style="justify-content:center;font-weight:600">확인</button>
  </div>`;
 document.body.appendChild(pwBox);
 const pwIn=$('#mmPwIn',pwBox),pwMsg=$('#mmPwMsg',pwBox),pwOk=$('#mmPwOk',pwBox);
 let pwThen=null,pwBusy=false;
 function pwClose(){pwBox.classList.remove('open');pwIn.value='';pwMsg.textContent='';pwThen=null}
 function pwAsk(then){pwThen=then;pwIn.value='';pwMsg.textContent='';pwBox.classList.add('open');setTimeout(()=>pwIn.focus({preventScroll:true}),150)}
 async function pwSubmit(){
  if(pwBusy)return;
  const st=pwState(),now=Date.now();
  if(st.until&&st.until>now){pwMsg.textContent='너무 많이 틀렸어요. '+Math.ceil((st.until-now)/1000)+'초 뒤에 다시 해보세요.';return}
  const v=pwIn.value;if(!v){pwMsg.textContent='암호를 입력해 주세요.';return}
  pwBusy=true;pwOk.disabled=true;
  let ok=false;
  try{ok=pwSame(await pwHash(v),PW.h)}catch(e){pwMsg.textContent='이 브라우저에서는 암호 확인을 쓸 수 없어요. (https 필요)';pwBusy=false;pwOk.disabled=false;return}
  pwBusy=false;pwOk.disabled=false;
  if(ok){pwSave({});const f=pwThen;pwClose();f&&f();return}
  const n=(st.n||0)+1,o={n:n};
  if(n>=5)o.until=now+Math.min(30*Math.pow(2,n-5),3600)*1000;
  pwSave(o);pwIn.value='';
  pwMsg.textContent=o.until?'5번 이상 틀려서 잠시 잠겼어요.':'암호가 맞지 않아요. ('+n+'/5)';
  pwIn.focus({preventScroll:true});
 }
 pwOk.addEventListener('click',pwSubmit);
 pwIn.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();pwSubmit()}});
 $('.x',pwBox).addEventListener('click',pwClose);
 pwBox.addEventListener('pointerdown',e=>{if(e.target===pwBox)pwClose()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&pwBox.classList.contains('open'))pwClose()});

 function addTheme(){
  const go=()=>{closeSheet();window.WTAdd.open()};
  const load=()=>{
   if(window.WTAdd)return go();
   const b=$('#stAdd');if(b)b.disabled=true;
   const sc=document.createElement('script');sc.src='themeadd.js?v=1';
   sc.onload=()=>{if(b)b.disabled=false;go()};
   sc.onerror=()=>{if(b)b.disabled=false;alert('themeadd.js 파일을 불러오지 못했어요. 서버에 올렸는지 확인해 주세요.')};
   document.head.appendChild(sc);
  };
  pwAsk(load);
 }

 window.MMenu={open:openSheet,close:closeSheet};
})();
