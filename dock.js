/* =====================================================================
   dock.js — 하단 독바 (홈 · 검색 · 테마 · 정보)
   index.html / search.html 맨 아래에서 불러옵니다. (theme.js 가 먼저 필요)
   ===================================================================== */
(function(){
 'use strict';
 const $=(s,r=document)=>r.querySelector(s);
 const onSearch=/search\.html$/i.test(location.pathname);

 /* ---------- 스타일 ---------- */
 const css=`
body{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 108px*var(--wk,1))!important}
.wtdock{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%) scale(var(--wk,1));transform-origin:50% 100%;z-index:8;
 display:flex;align-items:flex-end;gap:4px;padding:8px 10px;border-radius:26px;
 background:linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,.08)),rgba(28,30,48,.24);
 -webkit-backdrop-filter:blur(26px) saturate(1.8);backdrop-filter:blur(26px) saturate(1.8);
 border:1px solid rgba(255,255,255,.38);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -1px 0 rgba(255,255,255,.08),0 16px 40px rgba(10,10,30,.35),0 2px 8px rgba(10,10,30,.2);
 font-family:var(--sans,system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif);
 -webkit-user-select:none;user-select:none}
.wtdock .dw{position:relative}
.wtdock .di{appearance:none;-webkit-appearance:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;
 width:62px;height:56px;margin:0;padding:0;border:0;border-radius:18px;background:none;color:#fff;text-decoration:none;cursor:pointer;
 font:inherit;text-shadow:0 1px 3px rgba(20,20,50,.45);transition:transform .25s cubic-bezier(.2,1.3,.4,1),background .2s}
.wtdock .di svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;
 filter:drop-shadow(0 1px 2px rgba(20,20,50,.45))}
.wtdock .di span{font-size:10.5px;font-weight:500;letter-spacing:.02em;line-height:1}
.wtdock .di.on{background:rgba(255,255,255,.24);box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.wtdock .di:active{transform:scale(.92)}
@media (hover:hover){.wtdock .di:hover{transform:translateY(-4px) scale(1.1);background:rgba(255,255,255,.18)}.wtdock .di.on:hover{background:rgba(255,255,255,.28)}}
.wtdock .di:focus-visible{outline:2px solid #fff;outline-offset:1px}
body:has(#emu.show) .wtdock,body:has(#pc.show) .wtdock{display:none}

/* 테마 작은 메뉴 */
.wtpop{position:absolute;left:50%;bottom:calc(100% + 18px);min-width:200px;max-width:min(86vw,260px);padding:8px;border-radius:20px;
 background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(255,255,255,.05)),rgba(26,28,48,.86);
 -webkit-backdrop-filter:blur(34px) saturate(1.8);backdrop-filter:blur(34px) saturate(1.8);
 border:1px solid rgba(255,255,255,.38);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 18px 44px rgba(10,10,30,.45);
 color:#fff;text-align:left;opacity:0;visibility:hidden;transform:translate(-50%,10px) scale(.96);transform-origin:50% 100%;
 transition:opacity .2s,transform .28s cubic-bezier(.2,.9,.3,1),visibility 0s linear .28s}
.wtpop.open{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1);transition-delay:0s}
.wtpop .pt{padding:6px 10px 8px;font-size:11px;letter-spacing:.14em;color:rgba(255,255,255,.7)}
.wtpop .pi{appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:10px;width:100%;margin:0;padding:11px 12px;border:0;border-radius:13px;
 background:none;color:#fff;font:500 14px/1.2 var(--sans,system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif);text-align:left;cursor:pointer}
.wtpop .pi:hover,.wtpop .pi:focus-visible{background:rgba(255,255,255,.16);outline:0}
.wtpop .pi.on{background:rgba(255,255,255,.22)}
.wtpop .pi .ck{flex:none;width:16px;height:16px;border-radius:50%;border:1.5px solid rgba(255,255,255,.6)}
.wtpop .pi.on .ck{background:#fff;border-color:#fff;box-shadow:inset 0 0 0 3px rgba(60,56,110,.9)}
.wtpop .pi .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.wtpop .pi .sub{flex:none;font-size:11px;color:rgba(255,255,255,.65)}
.wtpop .ph{padding:8px 10px 6px;font-size:12px;line-height:1.6;color:rgba(255,255,255,.72)}

/* 설정 시트 */
.wtinfo .srow{appearance:none;-webkit-appearance:none;display:flex;align-items:center;gap:12px;width:100%;margin:8px 0 0;padding:14px 14px;border:0;border-radius:16px;
 background:rgba(255,255,255,.14);color:#fff;font-family:inherit;font-weight:500;font-size:15px;line-height:1.3;text-align:left;cursor:pointer;border:1px solid rgba(255,255,255,.2)}
.wtinfo .srow:hover,.wtinfo .srow:focus-visible{background:rgba(255,255,255,.24);outline:0}
.wtinfo .srow svg{flex:none;width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.wtinfo .srow small{display:block;margin-top:3px;font-size:12px;font-weight:400;color:rgba(255,255,255,.72)}

/* 정보 시트 */
.wtinfo{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));
 background:rgba(10,10,24,.42);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);opacity:0;visibility:hidden;transition:opacity .25s,visibility 0s linear .25s}
.wtinfo.open{opacity:1;visibility:visible;transition-delay:0s}
.wtinfo .card{position:relative;zoom:var(--wk,1);width:min(calc(100% / var(--wk,1)),520px);max-height:min(calc(82vh / var(--wk,1)),720px);overflow-y:auto;overscroll-behavior:contain;padding:26px 24px 24px;border-radius:28px;
 background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.06)),rgba(28,30,50,.78);
 -webkit-backdrop-filter:blur(30px) saturate(1.8);backdrop-filter:blur(30px) saturate(1.8);border:1px solid rgba(255,255,255,.36);
 box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 30px 80px rgba(0,0,0,.5);color:#fff;text-align:left;
 font-family:var(--sans,system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif);
 transform:translateY(16px) scale(.97);transition:transform .32s cubic-bezier(.2,.9,.3,1)}
.wtinfo.open .card{transform:none}
.wtinfo h2{margin:0 0 4px;font-size:22px;font-weight:600;letter-spacing:.02em}
.wtinfo h3{margin:24px 0 10px;font-size:13px;font-weight:600;letter-spacing:.16em;color:rgba(255,255,255,.7)}
.wtinfo ol{margin:0;padding:0;list-style:none;counter-reset:n;display:flex;flex-direction:column;gap:10px}
.wtinfo li{counter-increment:n;position:relative;padding-left:30px;font-size:13.5px;line-height:1.7;color:rgba(255,255,255,.92);word-break:keep-all;overflow-wrap:break-word}
.wtinfo li:before{content:counter(n);position:absolute;left:0;top:2px;width:20px;height:20px;border-radius:50%;background:rgba(255,255,255,.2);
 font-size:11px;font-weight:600;line-height:20px;text-align:center}
.wtinfo li b{font-weight:600;color:#fff}
.wtinfo .note{margin:0 0 18px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);
 font-size:13px;line-height:1.75;text-align:center;color:#fff;word-break:keep-all}
.wtinfo dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:8px 12px;font-size:13.5px;line-height:1.6}
.wtinfo dt{color:rgba(255,255,255,.7)}
.wtinfo dd{margin:0;min-width:0;word-break:break-all}
.wtinfo a{color:#fff;text-decoration:underline;text-underline-offset:3px}
.wtinfo .x{position:absolute;top:14px;right:14px;width:34px;height:34px;border:0;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:15px;cursor:pointer;line-height:34px;padding:0}
.wtinfo .x:hover{background:rgba(255,255,255,.3)}
@media (prefers-reduced-motion:reduce){.wtdock *,.wtpop,.wtinfo,.wtinfo .card{transition:none!important}}
`;
 const st=document.createElement('style');st.id='wt-dock-css';st.textContent=css;document.head.appendChild(st);

 /* ---------- 기기별 독바 크기 자동 최적화 ----------
    k = (페이지 폭 ÷ 실제 기기 폭) × 기기 종류별 목표 배율
    · 앞부분: 모바일 '데스크탑 모드'(페이지 폭이 ~980px로 늘어나 작아 보임)를 되돌리는 보정
    · 뒷부분: 폰 세로 / 폰 가로 / 태블릿 / PC 화면에 맞는 크기
    · 마지막에 화면 폭·높이를 넘지 않도록 제한 */
 function calcK(iw,ih,sw,sh,touch,dockW,dockH){
  const land=iw>ih;
  let ratio=1,t=1;
  if(touch){
   const shortSide=Math.min(sw,sh),devW=land?Math.max(sw,sh):shortSide;   /* 현재 방향에서의 실제 기기 폭(CSS px) */
   if(devW>0&&iw>devW*1.15)ratio=iw/devW;                                 /* 데스크탑 모드 보정 */
   if(shortSide<600)t=land?.88:1;                                         /* 폰 */
   else t=land?1.15:1.2;                                                  /* 태블릿 */
  }else{
   t=Math.max(1,Math.min(1.35,1+(iw-1000)/3500));                         /* PC: 화면이 넓을수록 조금 크게 */
  }
  let k=ratio*t;
  k=Math.min(k,(iw*.92)/dockW,(ih*.2)/dockH);                             /* 화면 폭 92% · 높이 20% 이내 */
  return Math.max(.8,Math.min(3.2,k));
 }
 window.WTDockScale=calcK;
 function fit(){
  const iw=window.innerWidth||document.documentElement.clientWidth,ih=window.innerHeight||document.documentElement.clientHeight,
        touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0,
        dk=document.querySelector('.wtdock'),
        k=calcK(iw,ih,screen.width||iw,screen.height||ih,touch,(dk&&dk.offsetWidth)||280,(dk&&dk.offsetHeight)||72);
  document.documentElement.style.setProperty('--wk',k.toFixed(3));
 }
 fit();
 addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,250));

 /* ---------- 아이콘(선 아이콘) ---------- */
 const IC={
  home:'<svg viewBox="0 0 24 24"><path d="M3.5 11.2 12 4l8.5 7.2"/><path d="M5.8 9.8v9.7h12.4V9.8"/><path d="M10 19.5v-5.2h4v5.2"/></svg>',
  search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20.5 20.5-4.9-4.9"/></svg>',
  theme:'<svg viewBox="0 0 24 24"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.5 0 2.1-.9 2.1-1.8 0-1.4-1.3-1.5-1.3-2.7 0-1 .8-1.7 1.9-1.7H17a3.5 3.5 0 0 0 3.5-3.5C20.5 5.9 16.7 3.5 12 3.5Z"/><circle cx="7.6" cy="11.2" r=".9"/><circle cx="9.8" cy="7.6" r=".9"/><circle cx="14.6" cy="7.4" r=".9"/></svg>',
  gear:'<svg viewBox=\"0 0 24 24\"><circle cx=\"12\" cy=\"12\" r=\"3.2\"/><path d=\"M19.4 13.5a7.6 7.6 0 0 0 0-3l1.9-1.5-1.9-3.3-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14.1 2.6h-3.8l-.4 2.5A7.6 7.6 0 0 0 7.3 6.6l-2.3-.9L3.1 9l1.9 1.5a7.6 7.6 0 0 0 0 3L3.1 15l1.9 3.3 2.3-.9a7.6 7.6 0 0 0 2.6 1.5l.4 2.5h3.8l.4-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.9 1.9-3.3Z\"/></svg>',
  info:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.8"/><path d="M12 11v5.4"/><circle cx="12" cy="7.9" r=".6"/></svg>'
 };

 /* ---------- 독바 ---------- */
 const dock=document.createElement('nav');
 dock.className='wtdock';dock.setAttribute('aria-label','하단 메뉴');
 dock.innerHTML=`
  <a class="di${onSearch?'':' on'}" id="dkHome" href="index.html">${IC.home}<span>홈</span></a>
  <a class="di${onSearch?' on':''}" id="dkSearch" href="search.html">${IC.search}<span>검색</span></a>
  <div class="dw">
   <button class="di" id="dkTheme" type="button" aria-haspopup="true" aria-expanded="false">${IC.theme}<span>테마</span></button>
   <div class="wtpop" id="wtPop" role="menu" aria-label="테마 선택"></div>
  </div>
  <button class="di" id="dkSet" type="button">${IC.gear}<span>설정</span></button>
  <button class="di" id="dkInfo" type="button">${IC.info}<span>정보</span></button>`;
 document.body.appendChild(dock);
 fit();

 /* 홈 화면에서 '홈'을 누르면 맨 위로 */
 $('#dkHome').addEventListener('click',e=>{
  if(!onSearch){e.preventDefault();closePop();window.scrollTo({top:0,behavior:'smooth'})}
 });

 /* ---------- 테마 메뉴 ---------- */
 const pop=$('#wtPop'),btnT=$('#dkTheme');
 const esc=t=>String(t).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
 function paintPop(list,loading){
  const sel=window.WT.sel;
  let h='<div class="pt">테마</div>';
  h+=`<button class="pi${sel==='default'?' on':''}" role="menuitemradio" data-id="default"><span class="ck"></span><span class="nm">기본페이지</span></button>`;
  (list||[]).forEach(t=>{
   h+=`<button class="pi${sel===t.id?' on':''}" role="menuitemradio" data-id="${esc(t.id)}"><span class="ck"></span><span class="nm">${esc(t.name)}</span>${t.name!==t.id?`<span class="sub">${esc(t.id)}</span>`:''}</button>`;
  });
  if(loading)h+='<div class="ph">테마를 찾는 중…</div>';
  else if(!list||!list.length)h+='<div class="ph">설정 → 테마 추가로 새 테마를 만들 수 있어요.</div>';
  pop.innerHTML=h;
 }
 function place(){
  pop.style.marginLeft='0';
  const r=pop.getBoundingClientRect(),vw=document.documentElement.clientWidth,m=10;
  let dx=0;
  if(r.left<m)dx=m-r.left;else if(r.right>vw-m)dx=vw-m-r.right;
  pop.style.marginLeft=dx+'px';
 }
 async function openPop(){
  closeInfo();
  paintPop(window.WT.themes,!window.WT.themes);
  pop.classList.add('open');btnT.classList.add('on');btnT.setAttribute('aria-expanded','true');place();
  try{
   const list=await window.WT.list();
   if(pop.classList.contains('open')){paintPop(list,false);place()}
  }catch(_){paintPop([],false)}
 }
 function closePop(){pop.classList.remove('open');btnT.classList.remove('on');btnT.setAttribute('aria-expanded','false')}
 btnT.addEventListener('click',e=>{e.stopPropagation();pop.classList.contains('open')?closePop():openPop()});
 pop.addEventListener('click',async e=>{
  e.stopPropagation();
  const b=e.target.closest('.pi');if(!b||b.dataset.busy)return;
  const id=b.dataset.id,nm=b.querySelector('.nm'),old=nm.textContent;
  b.dataset.busy='1';nm.textContent='적용 중…';
  try{await window.WT.apply(id);closePop()}
  catch(err){nm.textContent='불러오기 실패';setTimeout(()=>{nm.textContent=old;delete b.dataset.busy},1600);return}
  delete b.dataset.busy;nm.textContent=old;
 });
 document.addEventListener('wtlist',()=>{if(pop.classList.contains('open'))paintPop(window.WT.themes,false)});
 document.addEventListener('wtchange',()=>{if(pop.classList.contains('open'))paintPop(window.WT.themes,false)});
 document.addEventListener('pointerdown',e=>{if(pop.classList.contains('open')&&!e.target.closest('.dw'))closePop()});

 /* ---------- 설정 시트 ---------- */
 const setSheet=document.createElement('div');
 setSheet.className='wtinfo';setSheet.setAttribute('role','dialog');setSheet.setAttribute('aria-modal','true');setSheet.setAttribute('aria-label','설정');
 setSheet.innerHTML=`
  <div class="card">
   <button class="x" type="button" aria-label="닫기">✕</button>
   <h2>설정</h2>
   <button class="srow" id="stAddTheme" type="button">
    <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
    <span>테마 추가<small>배경과 아이콘을 내 사진으로 바꿔 새 테마로 저장해요</small></span>
   </button>
  </div>`;
 document.body.appendChild(setSheet);
 function openSet(){closePop();closeInfo();setSheet.classList.add('open');$('#dkSet').classList.add('on');$('.x',setSheet).focus({preventScroll:true})}
 function closeSet(){setSheet.classList.remove('open');$('#dkSet').classList.remove('on')}
 $('#dkSet').addEventListener('click',()=>setSheet.classList.contains('open')?closeSet():openSet());
 $('.x',setSheet).addEventListener('click',closeSet);
 setSheet.addEventListener('pointerdown',e=>{if(e.target===setSheet)closeSet()});
 /* 암호 확인 (PBKDF2-SHA256 · 평문 암호는 코드에 없음) */
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
   <input id="pwIn" type="password" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="암호" aria-label="암호" style="width:100%;box-sizing:border-box;padding:13px 14px;border:0;border-radius:14px;background:rgba(255,255,255,.2);color:#fff;font-size:18px;letter-spacing:6px;text-align:center;outline:0">
   <div id="pwMsg" style="min-height:20px;margin:10px 0 0;font-size:13px;text-align:center;color:#ffd0d0" aria-live="polite"></div>
   <button class="srow" id="pwOk" type="button" style="justify-content:center;font-weight:600">확인</button>
  </div>`;
 document.body.appendChild(pwBox);
 const pwIn=$('#pwIn',pwBox),pwMsg=$('#pwMsg',pwBox),pwOk=$('#pwOk',pwBox);
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

 $('#stAddTheme').addEventListener('click',()=>{
  const go=()=>{closeSet();window.WTAdd.open()};
  const load=()=>{
   if(window.WTAdd)return go();
   const b=$('#stAddTheme');b.disabled=true;
   const sc=document.createElement('script');sc.src='themeadd.js?v=1';
   sc.onload=()=>{b.disabled=false;go()};
   sc.onerror=()=>{b.disabled=false;alert('themeadd.js 파일을 불러오지 못했어요. 서버에 올렸는지 확인해 주세요.')};
   document.head.appendChild(sc);
  };
  pwAsk(load);
 });

 /* ---------- 정보 시트 ---------- */
 const info=document.createElement('div');
 info.className='wtinfo';info.setAttribute('role','dialog');info.setAttribute('aria-modal','true');info.setAttribute('aria-label','정보');
 info.innerHTML=`
  <div class="card">
   <button class="x" type="button" aria-label="닫기">✕</button>
   <h2>정보</h2>

   <h3>사용방법</h3>
   <ol>
    <li><b>게임 시작</b> — 홈 화면에서 콘솔 아이콘을 누르면 에뮬레이터가 열려요. 위쪽 탭(1980·1990·2000년대)으로 연대별로 골라볼 수 있어요.</li>
    <li><b>게임 불러오기</b> — 열린 화면의 <b>📂 게임</b> 버튼으로 ROM 파일(.zip 포함)을 고르거나, 화면에 끌어다 놓으세요. 본인이 합법적으로 가진 파일만 사용해 주세요.</li>
    <li><b>저장 · 불러오기</b> — 게임 중 <b>💾 저장</b> / <b>📥 불러오기</b>로 진행 상황을 파일로 저장하고 다시 이어서 할 수 있어요.</li>
    <li><b>조작 · 화면</b> — <b>🎮 조작</b>으로 화면 터치 조작을 켜고 끄고, <b>⛶ 전체화면</b>, <b>▲ 메뉴숨김</b>도 쓸 수 있어요. 스마트폰은 가로로 돌려서 하면 편해요.</li>
    <li><b>PC (DOS · Windows)</b> — 홈 아래쪽의 PC 항목을 누르면 서버에 있는 이미지로 자동 시작해요. 내 디스크 이미지는 <b>💽 로컬부팅</b>, 글자 입력은 <b>⌨ 키보드</b>, 상태 보관은 <b>VHD 저장 / 불러오기</b>를 쓰세요.</li>
    <li><b>검색</b> — 아래 <b>검색</b>을 누르고 이름 일부(예: 슈퍼, 윈도우, n64)만 입력한 뒤 결과를 누르면 바로 실행돼요.</li>
    <li><b>테마</b> — 아래 <b>테마</b>를 눌러 아이콘과 배경 스타일을 바꿀 수 있어요. 고른 테마는 기억돼요. 내 사진으로 새 테마를 만들려면 <b>설정 → 테마 추가</b>를 쓰세요.</li>
    <li>에뮬레이션 엔진을 불러오므로 <b>인터넷 연결</b>이 필요해요.</li>
   </ol>

   <h3>사이트 정보</h3>
   <p class="note">《 이 홈페이지는 2026년 9월 6일부터 AI를 통해 제작된 홈페이지입니다.<br>하지만 모든 기능이 AI로 추가된 것이 아닙니다. 》</p>
   <dl>
    <dt>제작자 이름</dt><dd>최영호</dd>
    <dt>전자우편</dt><dd><a href="mailto:youngho7375@naver.com">youngho7375@naver.com</a></dd>
    <dt>카카오톡 ID</dt><dd>cyho20</dd>
    <dt>블로그</dt><dd><a href="https://blog.naver.com/yh_7375" target="_blank" rel="noopener">https://blog.naver.com/yh_7375</a></dd>
   </dl>
  </div>`;
 document.body.appendChild(info);

 function openInfo(){closePop();closeSet();info.classList.add('open');$('#dkInfo').classList.add('on');$('.x',info).focus({preventScroll:true})}
 function closeInfo(){info.classList.remove('open');$('#dkInfo').classList.remove('on')}
 $('#dkInfo').addEventListener('click',()=>info.classList.contains('open')?closeInfo():openInfo());
 $('.x',info).addEventListener('click',closeInfo);
 info.addEventListener('pointerdown',e=>{if(e.target===info)closeInfo()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePop();closeInfo();closeSet()}});
})();
