/* saver.js — 절전 모드를 모든 페이지에 똑같이 적용합니다.
   - 첫 화면(index.html)의 [절전] 버튼이 localStorage 'ds.saver' 에 on/off 를 저장하면,
     이 파일을 불러온 모든 html 이 그 값을 읽어 같은 상태로 동작합니다.
   - 다른 탭·iframe 에서 값이 바뀌면 새로고침 없이 바로 따라갑니다. 끄면 원래대로 돌아옵니다.
   - 켜짐: 애니메이션·전환·블러·그림자 효과 제거, 화면 위에 떠 있는 장식용 캔버스(눈·배경효과) 숨김. */
(function(W,D){'use strict';
if(W.__saverJs)return;W.__saverJs=1;
var KEY='ds.saver',root=D.documentElement,on=false,mo=null,tm=0;
function ls(){try{return W.localStorage.getItem(KEY)}catch(e){return null}}

/* 켜짐일 때 적용되는 CSS (이미 같은 규칙이 있어도 무해) */
var st=D.createElement('style');st.id='saver-css';
st.textContent='html.ds-saver *,html.ds-saver *::before,html.ds-saver *::after{animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;text-shadow:none!important;scroll-behavior:auto!important}'
 +'html.ds-saver .bg{display:none!important}';
(D.head||root).appendChild(st);

/* 장식용 캔버스 숨김: 화면 고정(fixed) + 터치 안 받는(pointer-events:none) 캔버스만 대상 → 게임 화면은 건드리지 않음 */
function deco(v){
  var c=D.querySelectorAll('canvas'),i,el,cs;
  for(i=0;i<c.length;i++){
    el=c[i];
    if(v){
      if(el.dataset.svH)continue;
      cs=W.getComputedStyle(el);
      if(cs.position==='fixed'&&cs.pointerEvents==='none'){el.dataset.svH=el.style.display||'-';el.style.display='none'}
    }else if(el.dataset.svH){
      el.style.display=el.dataset.svH==='-'?'':el.dataset.svH;delete el.dataset.svH;
    }
  }
}
function watch(v){
  if(v&&!mo&&W.MutationObserver&&D.body){
    mo=new MutationObserver(function(){clearTimeout(tm);tm=setTimeout(function(){if(on)deco(true)},300)});
    mo.observe(D.body,{childList:true,subtree:true});
  }else if(!v&&mo){mo.disconnect();mo=null;clearTimeout(tm)}
}
function apply(v){
  on=!!v;
  root.classList.toggle('ds-saver',on);
  if(D.body){deco(on);watch(on)}
  try{D.dispatchEvent(new CustomEvent('saverchange',{detail:{on:on}}))}catch(e){}
}
W.__saverApply=apply;

apply(ls()==='on');                       /* 가장 먼저 상태 반영 (깜빡임 방지) */
if(D.readyState==='loading')D.addEventListener('DOMContentLoaded',function(){apply(on)});
W.addEventListener('load',function(){apply(on)});
/* 다른 탭/프레임에서 바뀌면 바로 따라감 */
W.addEventListener('storage',function(e){if(e.key===KEY||e.key===null)apply(ls()==='on')});
/* 뒤로가기(캐시 복원) 시 최신 값으로 다시 맞춤 */
W.addEventListener('pageshow',function(e){if(e.persisted)apply(ls()==='on')});
})(window,document);
