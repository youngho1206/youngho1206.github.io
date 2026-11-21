/* =====================================================================
   pcnotice.js — 새로 추가된 기종(세가CD·3DO·재규어·새턴·32X)용 공통 코드

   · PC용 안내 : 이 기종을 '처음' 실행할 때 한 번만 안내창을 띄웁니다.
   · 준비중    : emudata.js 에서 soon:1 로 표시한 기종(드림캐스트·PS2·게임큐브·Wii)은
                 실행하지 않고 이유를 안내합니다.
   · PC 옵션   : PCEMU.opts(c) — PC 사양에 맞춘 코어 설정(스프라이트 제한 해제·고해상도 등)
   · 바이오스  : PCEMU.findBios(names) — BIOS/ 폴더에 올려 둔 바이오스 파일을 찾아 줍니다.

   새 기종을 PC용으로 만들려면 emudata.js 의 항목에 pc:1 만 넣으면 됩니다.
   ===================================================================== */
(function(){
'use strict';
var MSG='현재 이 에뮬레이터는 PC용으로 맞게 제작되었으며 휴대폰에서는 게임롬파일을 불러올때 게임시작전에 튕길 수 있습니다.';
var KEY='pcemu.notice.v1';

/* ---------- 안내창 ---------- */
var css='#pcnOv{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(6,8,16,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}'+
'#pcnOv.on{display:flex}'+
'#pcnOv .pcn{width:min(92vw,360px);border-radius:22px;padding:22px 20px 16px;text-align:center;color:#f4f6fb;background:linear-gradient(180deg,rgba(40,46,74,.96),rgba(20,24,44,.97));border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.55);font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}'+
'#pcnOv .pcn i{display:block;font-style:normal;font-size:34px;line-height:1;margin-bottom:8px}'+
'#pcnOv .pcn b{display:block;font-size:17px;font-weight:700;margin-bottom:10px}'+
'#pcnOv .pcn p{margin:0 0 16px;font-size:14px;line-height:1.7;color:#d6dbea;word-break:keep-all;white-space:pre-line}'+
'#pcnOv .pcn button{width:100%;border:0;border-radius:14px;padding:12px 0;font-weight:700;font-size:15px;font-family:inherit;color:#fff;background:linear-gradient(180deg,#5aa0ff,#3a74e8);cursor:pointer}'+
'#pcnOv .pcn button:active{filter:brightness(.92)}';
var ov=null,after=null;
function build(){
 if(ov)return ov;
 var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
 ov=document.createElement('div');ov.id='pcnOv';ov.setAttribute('role','alertdialog');ov.setAttribute('aria-modal','true');
 ov.innerHTML='<div class="pcn"><i id="pcnI">💻</i><b id="pcnT"></b><p id="pcnM"></p><button type="button" id="pcnOk">확인</button></div>';
 document.body.appendChild(ov);
 function close(){ov.classList.remove('on');var f=after;after=null;if(f)try{f()}catch(e){}}
 ov.querySelector('#pcnOk').onclick=close;
 ov.addEventListener('click',function(e){if(e.target===ov)close()});
 addEventListener('keydown',function(e){if(ov.classList.contains('on')&&(e.key==='Escape'||e.key==='Enter'))close()});
 return ov;
}
function modal(icon,title,msg,cb){
 build();
 ov.querySelector('#pcnI').textContent=icon;
 ov.querySelector('#pcnT').textContent=title;
 ov.querySelector('#pcnM').textContent=msg;
 after=cb||null;ov.classList.add('on');
 setTimeout(function(){try{ov.querySelector('#pcnOk').focus()}catch(e){}},40);
}

/* ---------- 처음 한 번만 ---------- */
function seen(){try{return localStorage.getItem(KEY)==='1'}catch(e){return false}}
function mark(){try{localStorage.setItem(KEY,'1')}catch(e){}}

/* 준비중 기종이면 안내만 하고 true (실행하지 않음) */
function soon(c){
 if(!c||!c.soon)return false;
 modal('🛠️',c.n+' · 준비 중',c.why||'이 기종은 아직 웹에서 실행할 수 없습니다.');
 return true;
}
/* PC용 기종을 처음 열 때 한 번 안내 */
function notice(c){
 if(!c||!c.pc||seen())return;
 mark();
 setTimeout(function(){modal('💻','PC용 에뮬레이터 안내',MSG)},350);
}

/* ---------- PC 사양용 코어 설정 (알 수 없는 항목은 코어가 무시합니다) ---------- */
var OPTS={
 segaCD:{'genesis_plus_gx_no_sprite_limit':'enabled'},
 sega32x:{'picodrive_sprlim':'enabled'},
 '3do':{'opera_high_resolution':'enabled'}
};
function opts(c){return c&&c.pc&&OPTS[c.core]?Object.assign({},OPTS[c.core]):null}

/* ---------- 바이오스: BIOS/ 폴더에 올려 둔 파일 중 처음 발견되는 것 ---------- */
function findBios(names){
 names=names||[];
 var i=0;
 function next(){
  if(i>=names.length)return Promise.resolve([]);
  var n=names[i++],u;
  try{u=new URL('BIOS/'+n,location.href).href}catch(e){return next()}
  return fetch(u,{method:'HEAD',cache:'no-store'}).then(function(r){return r.ok?[{name:n,url:u}]:next()},function(){return next()});
 }
 return next();
}

window.PCEMU={MSG:MSG,soon:soon,notice:notice,opts:opts,findBios:findBios,modal:modal};

/* ---------- 각 화면의 전역 openEmu 에 연결 (함수가 있을 때만) ---------- */
var o=window.openEmu;
if(typeof o==='function'&&!o.__pc){
 var w=function(c){
  if(soon(c))return;
  var r=o.apply(this,arguments);
  notice(c);
  return r;
 };
 w.__pc=1;window.openEmu=w;
}
})();
