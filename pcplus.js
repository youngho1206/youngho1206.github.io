/* =====================================================================
   pcplus.js — 윈도우/DOS 에뮬레이터(v86) 보강 (desktop.html · mobile.html 공용)
   1) (제거됨) 시작 가림막 — 에뮬레이터 화면은 항상 그대로 보임
   2) 전체화면      : 모바일은 가로 고정 + [마우스][키보드][전체화면 종료] 버튼
   3) 마우스 조작   : 화면 밀기 = 포인터 이동, 톡 = 클릭, 좌/우/더블클릭/드래그 버튼
   4) 윈도우 1.0 전용 키보드 : 메뉴·창이동·크기·닫기 등 윈도우 1.0 조작키 (ABC 버튼으로 문자 키보드 전환)
   ===================================================================== */
(function(){
'use strict';
const Q=s=>document.querySelector(s);
const pcEl=Q('#pc'),stage=Q('#pstage'),vs=Q('#vscreen');
if(!pcEl||!stage||!vs)return;
const touch=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;

/* ---------- CSS ---------- */
const st=document.createElement('style');
st.textContent=`
/* 전체화면 */
#pc.pcfs{z-index:1000;padding:0}
#pc.pcfs #pbar{display:none}
#pc.prot{inset:auto;top:0;left:100%;width:100vh;height:100vw;width:100dvh;height:100dvw;transform-origin:0 0;transform:rotate(90deg);animation:none}
#pdock{display:none;position:absolute;top:calc(8px + env(safe-area-inset-top));right:calc(8px + env(safe-area-inset-right));z-index:30;gap:8px;transition:opacity .4s}
#pc.pcfs #pdock{display:flex}
#pdock.dim{opacity:.3}
#pdock button,#pmouse button{border:1px solid rgba(255,255,255,.3);color:#fff;background:rgba(24,26,34,.55);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);
 border-radius:14px;min-width:50px;height:46px;padding:0 10px;font:600 17px/1 var(--sans,sans-serif);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
#pdock button small,#pmouse button small{font:500 10px/1 var(--sans,sans-serif);opacity:.85}
#pdock button.on,#pmouse button.on{background:rgba(255,255,255,.85);color:#10131a}
#pdock button.x{background:rgba(220,50,50,.72);border-color:rgba(255,255,255,.4)}
#pdock button:active,#pmouse button:active{transform:scale(.94)}
/* 마우스 패드 */
#vscreen.tpad{touch-action:none}
#pmouse{display:none;position:absolute;left:calc(8px + env(safe-area-inset-left));top:50%;transform:translateY(-50%);z-index:25;flex-direction:column;gap:8px}
#pmouse.on{display:flex}
#pmouse button{min-width:64px;height:40px;font-size:13px;flex-direction:row}
/* 윈도우 1.0 키보드 */
#vk .kw.f .k{white-space:pre-line;text-align:center;line-height:1.15;font-size:calc(var(--fs)*.62);font-weight:600}
#vk .kw.gap .k{visibility:hidden}
#vk .vkh #vkMode{display:none}
#vk.w1 .vkh #vkMode{display:inline-block}
#vk.w1 .vkh #vkFn{display:none}
#vk.w1abc .vkh #vkFn{display:inline-block}
`;
document.head.appendChild(st);

/* =====================================================================
   1) 시작 가림막 제거
   ===================================================================== */
/* 가림막 없음: 에뮬레이터 화면을 처음부터 그대로 보여줌 (예전 "곧 화면이 나타납니다" 제거) */
const old=Q('#pwait');if(old)old.remove();
function wHide(){}
window.pcWait={
 start(emu,p){
  if(pc&&pc.mm)try{mset(emu,true)}catch(_){}
 },
 stop(){}
};

/* =====================================================================
   2) 전체화면 + 모바일 가로 고정
   ===================================================================== */
const dock=document.createElement('div');dock.id='pdock';
dock.innerHTML='<button type="button" data-d="mouse">🖱<small>마우스</small></button><button type="button" data-d="kbd">⌨<small>키보드</small></button><button type="button" class="x" data-d="exit">✕<small>전체화면 종료</small></button>';
pcEl.appendChild(dock);
let fsOn=false,fsNative=false,locked=false,dimT=0;
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
function dimLater(){dock.classList.remove('dim');clearTimeout(dimT);dimT=setTimeout(()=>dock.classList.add('dim'),3500)}
function updateRot(){
 const need=fsOn&&touch&&!locked&&innerHeight>innerWidth;
 pcEl.classList.toggle('prot',need);
 setTimeout(()=>{try{vkFit()}catch(_){}},90);
}
async function enterFs(){
 if(fsOn)return;
 fsOn=true;pcEl.classList.add('pcfs');
 const req=pcEl.requestFullscreen||pcEl.webkitRequestFullscreen;
 fsNative=false;
 if(req){try{const r=req.call(pcEl,{navigationUI:'hide'});if(r&&r.then)await r;fsNative=true}catch(_){try{const r=req.call(pcEl);if(r&&r.then)await r;fsNative=true}catch(__){}}}
 locked=false;
 if(touch&&screen.orientation&&screen.orientation.lock){try{await screen.orientation.lock('landscape');locked=true}catch(_){}}
 updateRot();dimLater();
 toast(touch?'⛶ 전체화면 · 가로 모드':'⛶ 전체화면 · 종료는 ✕ 버튼 또는 ESC');
}
function leaveFs(){
 if(!fsOn)return;
 fsOn=false;clearTimeout(dimT);
 pcEl.classList.remove('pcfs','prot');
 if(fsNative&&fsEl()){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(_){}}
 fsNative=false;
 try{if(screen.orientation&&screen.orientation.unlock)screen.orientation.unlock()}catch(_){}
 locked=false;
 setTimeout(()=>{try{vkFit()}catch(_){}},120);
}
window.pcfsOn=()=>fsOn;
window.pcExitFs=leaveFs;
['fullscreenchange','webkitfullscreenchange'].forEach(v=>document.addEventListener(v,()=>{if(fsOn&&fsNative&&!fsEl())leaveFs()}));
['resize','orientationchange'].forEach(v=>addEventListener(v,()=>{if(fsOn)setTimeout(updateRot,120)}));
pcEl.addEventListener('pointerdown',()=>{if(fsOn)dimLater()},true);
dock.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const d=b.dataset.d;
 if(d==='exit')leaveFs();else if(d==='kbd')A.kbd();else if(d==='mouse')A.mouse();
 dimLater();
});

/* =====================================================================
   3) 마우스 조작 (터치 패드 방식)
   ===================================================================== */
const mp=document.createElement('div');mp.id='pmouse';
mp.innerHTML='<button type="button" data-m="l">좌클릭</button><button type="button" data-m="d">더블클릭</button><button type="button" data-m="r">우클릭</button><button type="button" data-m="g">드래그</button>';
stage.appendChild(mp);
const bus=(n,v)=>{try{pc.emu&&pc.emu.bus&&pc.emu.bus.send(n,v)}catch(_){}};
function mclick(btn){ /* btn: 0 왼쪽, 2 오른쪽 */
 if(!pc.emu||!pc.running)return;
 const dn=[0,0,0];dn[btn]=1;
 bus('mouse-click',dn);
 setTimeout(()=>bus('mouse-click',pc.mdrag?[1,0,0]:[0,0,0]),55);
}
function drag(on){
 pc.mdrag=!!on;
 bus('mouse-click',on?[1,0,0]:[0,0,0]);
 const g=mp.querySelector('[data-m="g"]');if(g)g.classList.toggle('on',!!on);
}
function mmSet(on,silent){
 on=!!on;pc.mm=on;
 vs.classList.toggle('tpad',on);mp.classList.toggle('on',on);
 document.querySelectorAll('#pbar [data-a="mouse"],#pdock [data-d="mouse"]').forEach(b=>b.classList.toggle('on',on));
 if(!on&&pc.mdrag)drag(false);
 if(pc.emu){try{mset(pc.emu,on||!!pc.mcap)}catch(_){}}
 if(on&&!silent)toast('🖱 마우스 조작 ON · 화면을 밀면 이동, 톡 치면 클릭');
 else if(!on&&!silent)toast('🖱 마우스 조작 OFF');
}
mp.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const m=b.dataset.m;
 if(m==='l')mclick(0);
 else if(m==='r')mclick(2);
 else if(m==='d'){mclick(0);setTimeout(()=>mclick(0),110)}
 else if(m==='g')drag(!pc.mdrag);
});
let tp=null,acc=[0,0];
const rot=()=>pcEl.classList.contains('prot');
const opt={capture:true,passive:false};
vs.addEventListener('touchstart',e=>{
 if(!pc.mm||!pc.running)return;
 e.preventDefault();e.stopPropagation();
 const t=e.touches[0];
 if(!tp)tp={x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:performance.now(),moved:false,two:false};
 if(e.touches.length>1)tp.two=true;
},opt);
vs.addEventListener('touchmove',e=>{
 if(!pc.mm||!pc.running||!tp)return;
 e.preventDefault();e.stopPropagation();
 const t=e.touches[0];
 let dx=t.clientX-tp.x,dy=t.clientY-tp.y;tp.x=t.clientX;tp.y=t.clientY;
 if(Math.hypot(t.clientX-tp.sx,t.clientY-tp.sy)>7)tp.moved=true;
 if(!tp.moved)return;
 if(rot()){const a=dx;dx=dy;dy=-a} /* 세로 화면을 눕혀 쓸 때 방향 보정 */
 const k=1.15+Math.min(1.9,Math.hypot(dx,dy)/9);
 acc[0]+=dx*k;acc[1]+=dy*k;
 const ix=Math.trunc(acc[0]),iy=Math.trunc(acc[1]);acc[0]-=ix;acc[1]-=iy;
 if(ix||iy)bus('mouse-delta',[ix,-iy]);
},opt);
const tend=e=>{
 if(!pc.mm||!tp)return;
 e.preventDefault();e.stopPropagation();
 if(e.touches&&e.touches.length>0)return;
 const t=tp;tp=null;acc=[0,0];
 if(!t.moved&&performance.now()-t.t<380)mclick(t.two?2:0);
};
vs.addEventListener('touchend',tend,opt);
vs.addEventListener('touchcancel',e=>{tp=null;acc=[0,0]},opt);

/* =====================================================================
   4) 윈도우 1.0 전용 키보드
   ===================================================================== */
window.pcKbdAbc=false;
window.vkIsW1=()=>!!(pc&&pc.os&&pc.os.id==='win10'&&!window.pcKbdAbc);
window.vkKey=()=>vkIsW1()?'w1':'std';
window.vkMacro=seq=>{
 if(!vkSend([]))return;
 seq.forEach((c,i)=>setTimeout(()=>vkSend([c]),i*40));
};
window.vkW1Defs=L=>{
 const E=0xE0;
 const combo=(mod,key)=>[mod,key,key|0x80,mod|0x80];
 const M=(l,seq,w)=>Object.assign(L(l,'',0,w,'s f'),{mac:seq});
 const G=w=>Object.assign(L('','',0,w,'gap'),{gap:true});
 const ALT=0x38;
 const r1=[
  M('메뉴\nAlt',[ALT,ALT|0x80],1.875),
  M('시스템\nAlt+␣',combo(ALT,0x39),1.875),
  M('전환\nAlt+Tab',combo(ALT,0x0F),1.875),
  M('닫기\nAlt+F4',combo(ALT,0x3E),1.875),
  M('이동\nAlt+F7',combo(ALT,0x41),1.875),
  M('크기\nAlt+F8',combo(ALT,0x42),1.875),
  M('최소\nAlt+F9',combo(ALT,0x43),1.875),
  M('최대\nAlt+F10',combo(ALT,0x44),1.875)
 ];
 const r2=[
  L('Esc','',0x01,2,'s m'),L('Tab','',0x0F,2,'s m'),
  L('Enter\n확인','',0x1C,3,'s f'),L('Space\n선택','',0x39,3,'s f'),
  L('⌫','',0x0E,2,'s m'),L('Del','',[E,0x53],3,'s m')
 ];
 const r3=[
  L('Shift','',0x2A,2.5,'s m mod'),L('Ctrl','',0x1D,2.5,'s m mod'),G(2.5),
  L('↑','',[E,0x48],2.5,'s'),
  L('PgUp','',[E,0x49],2.5,'s m'),L('PgDn','',[E,0x51],2.5,'s m')
 ];
 const r4=[
  L('Alt','',0x38,2.5,'s m mod'),L('F1\n도움말','',0x3B,2.5,'s f'),
  L('←','',[E,0x4B],2.5,'s'),L('↓','',[E,0x50],2.5,'s'),L('→','',[E,0x4D],2.5,'s'),
  L('Home','',[E,0x47],1.25,'s m'),L('End','',[E,0x4F],1.25,'s m')
 ];
 return[{keys:r1},{keys:r2},{keys:r3},{keys:r4}];
};
/* 헤더에 [ABC / 조작] 전환 버튼 */
const vk=Q('#vk'),vkAl=Q('#vkAl');
if(vk&&vkAl){
 const mb=document.createElement('button');mb.type='button';mb.id='vkMode';mb.setAttribute('aria-label','윈도우 1.0 조작키 / 문자 키보드 전환');
 vkAl.parentNode.insertBefore(mb,vkAl);
 mb.onclick=()=>{
  window.pcKbdAbc=!window.pcKbdAbc;
  vkBuild();vkSync();vkFit();
 };
}
function vkSync(){
 const w1=!!(pc&&pc.os&&pc.os.id==='win10');
 if(!vk)return;
 vk.classList.toggle('w1',w1);
 vk.classList.toggle('w1abc',w1&&!!window.pcKbdAbc);
 const mb=Q('#vkMode');if(mb)mb.textContent=window.pcKbdAbc?'조작키':'ABC';
}
const _vkShow=vkShow;
vkShow=function(on){
 if(on&&pc&&pc.os&&pc.os.id!=='win10')window.pcKbdAbc=false;
 vkSync();_vkShow(on);vkSync();
};

/* =====================================================================
   버튼 연결 · 정리
   ===================================================================== */
A.fs=()=>{if(fsOn)leaveFs();else enterFs()};
A.mouse=()=>mmSet(!pc.mm);
const _quit=A.quit;
A.quit=function(){
 try{leaveFs()}catch(_){}
 try{mmSet(false,true)}catch(_){}
 wHide();
 return _quit.apply(this,arguments);
};
/* 새 OS를 열 때마다 상태 초기화 */
let was=pcEl.classList.contains('show');
new MutationObserver(()=>{
 const now=pcEl.classList.contains('show');
 if(now&&!was){mmSet(false,true);wHide();window.pcKbdAbc=false;vkSync();
  if(pc&&pc.os&&pc.os.id==='win10')setTimeout(()=>toast('⌨ 키보드 버튼 → 윈도우 1.0 조작 키보드'),1800)}
 if(!now&&was){leaveFs();wHide()}
 was=now;
}).observe(pcEl,{attributes:true,attributeFilter:['class']});
})();
