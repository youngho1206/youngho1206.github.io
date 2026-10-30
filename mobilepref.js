/* =====================================================================
   mobilepref.js — 모바일(mobile.html) 배경화면 · 아이콘 스타일 설정
   · <head> 안, theme.js 바로 다음에 불러옵니다. (화면이 그려지기 전에 적용해서 깜빡임 방지)
   · 고른 값은 브라우저(localStorage)에 기억됩니다.
     mm.wall : 배경화면 id  ('theme' = 테마/원래 배경 그대로)
     mm.icon : 아이콘 스타일 ('theme' = 현재 테마의 아이콘 그대로)
   ===================================================================== */
(function(){
 'use strict';
 var KW='mm.wall',KI='mm.icon',DEF_WALL='sunset';

 /* ---------- 배경화면 목록 (mobilebg/ 폴더 · 썸네일은 mobilebg/thumb/) ---------- */
 var WALLS=[
  {id:'dreamsky',n:'꿈꾸는 밤하늘',f:'dreamsky.jpg',pos:'50% 50%'},
  {id:'banff',n:'설산 야경',f:'banff.jpg'},
  {id:'bridge',n:'안개 낀 다리',f:'bridge.jpg'},
  {id:'dublin',n:'강변 마을',f:'dublin.jpg'},
  {id:'eiffel',n:'에펠탑',f:'eiffel.jpg'},
  {id:'lake',n:'알프스 호수',f:'lake.jpg'},
  {id:'mandala',n:'만다라',f:'mandala.jpg'},
  {id:'moon',n:'달',f:'moon.jpg'},
  {id:'stars',n:'은하수',f:'stars.jpg'},
  {id:'sunset',n:'노을 산',f:'sunset.jpg'},
  {id:'xmas1',n:'겨울밤 오두막',f:'xmas1.jpg'},
  {id:'xmas2',n:'크리스마스 트리',f:'xmas2.jpg'},
  {id:'xmas3',n:'오로라 마을',f:'xmas3.jpg'},
  {id:'xmas4',n:'눈사람',f:'xmas4.jpg'}
 ];

 var store={
  get:function(k){try{return localStorage.getItem(k)}catch(_){return null}},
  set:function(k,v){try{localStorage.setItem(k,v)}catch(_){}}
 };
 var wallById=function(id){for(var i=0;i<WALLS.length;i++)if(WALLS[i].id===id)return WALLS[i];return null};

 var P=window.MPref={WALLS:WALLS,wall:null,icon:null};

 /* 저장된 값이 없으면: 테마를 따로 골라 둔 적이 있으면 그 테마 배경, 아니면 기본 밤하늘 */
 (function init(){
  var w=store.get(KW),t=store.get('wt.sel');
  if(!w)w=(t&&t!=='default')?'theme':DEF_WALL;
  if(w!=='theme'&&!wallById(w))w=DEF_WALL;
  P.wall=w;
  var i=store.get(KI);
  P.icon=(i==='default'||i==='beta'||i==='pixel'||i==='vector')?i:'theme';
 })();

 /* ---------- 배경 적용: .bg 를 사진으로 바꿈 (html.mw) ---------- */
 var root=document.documentElement,st=document.createElement('style');
 st.id='mm-wall-css';(document.head||root).appendChild(st);
 function paintWall(){
  var w=wallById(P.wall);
  if(!w||P.wall==='theme'){root.classList.remove('mw');st.textContent='';return}
  root.classList.add('mw');
  st.textContent='html.mw{background:#10122e!important}html.mw body{background:transparent!important}'+
   'html.mw .bg{background:#10122e url("mobilebg/'+w.f+'") '+(w.pos||'50% 50%')+'/cover no-repeat!important}';
  try{var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#141a4a')}catch(_){}
 }
 P.setWall=function(id){
  if(id!=='theme'&&!wallById(id))return;
  P.wall=id;store.set(KW,id);paintWall();
  document.dispatchEvent(new CustomEvent('mmchange'));
 };
 paintWall();

 /* ---------- 아이콘 스타일 ---------- */
 /* 콘솔 id → IMG 파일 이름(gb→gameboy …) 은 emudata.js 의 IMG 를 쓰므로, 아이콘이 필요한 시점(나중)에 계산합니다. */
 var PIXEL={atari2600:1,gb:1,gba:1,gbc:1,gg:1,lynx:1,mamegame:1,md:1,n64:1,nds:1,nes:1,ngp:1,pce:1,psx:1,sms:1,snes:1,vb:1};
 var BETA={atari2600:1,gameboy:1,gameboyadvance:1,gameboycolor:1,gamegear:1,lynx:1,mamegame:1,mastersystem:1,megadrive:1,msdos:1,neogeopocket:1,nes:1,nintendo64:1,nintendods:1,pcengine:1,playstation:1,snes:1,virtualboy:1,windows1:1,windows2:1,windows3:1,windows31:1,windows95:1,windows98:1};
 var VECTOR={atari2600:1,fds:1,gb:1,gba:1,gbc:1,gg:1,lynx:1,mamegame:1,md:1,msdos:1,n64:1,nds:1,nes:1,ngp:1,pce:1,psx:1,sms:1,snes:1,vb:1,win10:1,win20:1,win30:1,win31:1,win95:1,win98:1};
 var rev=null;
 function idOf(name){
  if(!rev){rev={};try{for(var k in IMG)rev[IMG[k]]=k}catch(_){}}
  return rev[name]||null;
 }
 P.ICONS=[
  {id:'theme',n:'테마 기본',d:'지금 고른 테마의 아이콘'},
  {id:'default',n:'기본',d:'원래 레트로 아이콘'},
  {id:'beta',n:'앱 아이콘',d:'색깔 있는 둥근 앱 스타일'},
  {id:'pixel',n:'픽셀',d:'도트 느낌 아이콘'},
  {id:'vector',n:'벡터',d:'깔끔한 선 아이콘'}
 ];
 /* 미리보기용: 스타일별 파일 주소 (name = IMG 값, 예: 'nes','gameboy') */
 P.iconUrl=function(style,name){
  var id=idOf(name);
  if(style==='default')return 'icons/'+name+'.png?v=4';
  if(style==='beta')return BETA[name]?'icons/beta/'+name+'.png':null;
  if(style==='pixel')return(id&&PIXEL[id])?'tabicons/pixel/'+id+'.png':null;
  if(style==='vector'){var v=id==='dos'?'msdos':id;return(v&&VECTOR[v])?'rpicons/'+v+'.svg':null}
  return null;
 };
 /* WT.src 를 한 겹 감싸서, 고른 스타일이 있으면 그 아이콘을 먼저 씁니다. (없는 기종은 기존 방식으로) */
 function hook(){
  var W=window.WT;if(!W||W.__mmHook)return;W.__mmHook=1;
  var orig=W.src;
  W.src=function(n){
   if(P.icon!=='theme'){var u=P.iconUrl(P.icon,n);if(u)return u}
   return orig.call(W,n);
  };
 }
 hook();
 P.setIcon=function(s){
  P.icon=s;store.set(KI,s);hook();
  try{window.WT.refreshIcons()}catch(_){}
  document.dispatchEvent(new CustomEvent('mmchange'));
 };
})();
