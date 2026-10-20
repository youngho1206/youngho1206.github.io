/* xmas.js — 12월 크리스마스 테마 (기본 화면용)
   · 기본 테마일 때만 <html class="xmas"> 가 켜지고, 눈 내리는 효과가 나옵니다.
   · 설정 › 테마에서 'Beta' 나 다른 테마를 고르면 자동으로 꺼져서 예전 모습으로 돌아갑니다. */
(function(){
 'use strict';
 var H=document.documentElement;
 function ls(k){try{return localStorage.getItem(k)}catch(e){return null}}
 function isOn(){
  var s=ls('wt.sel')||'default';
  return (s==='default')&&ls('skyemu.theme')!=='cyber';
 }
 var cv,cx,W,H2,fl=[],run=false,raf=0,last=0;
 var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function make(){
  if(cv)return;
  cv=document.createElement('canvas');cv.id='xm-snow';cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);cx=cv.getContext('2d');size();
  var n=Math.round(Math.min(70,Math.max(34,innerWidth/18)));
  for(var i=0;i<n;i++)fl.push(flake(true));
 }
 function size(){if(!cv)return;W=cv.width=innerWidth;H2=cv.height=innerHeight}
 function flake(init){return{x:Math.random()*W,y:init?Math.random()*H2:-10,r:1.2+Math.random()*3.2,s:18+Math.random()*34,w:Math.random()*6.28,a:.45+Math.random()*.5}}
 function tick(t){
  if(!run)return;raf=requestAnimationFrame(tick);
  var dt=Math.min(.05,(t-last)/1000||.016);last=t;
  cx.clearRect(0,0,W,H2);cx.fillStyle='#fff';
  for(var i=0;i<fl.length;i++){
   var f=fl[i];f.y+=f.s*dt;f.w+=dt*1.2;f.x+=Math.sin(f.w)*14*dt;
   if(f.y>H2+10){fl[i]=flake(false);fl[i].x=Math.random()*W;continue}
   cx.globalAlpha=f.a;cx.beginPath();cx.arc(f.x,f.y,f.r,0,6.283);cx.fill();
  }
  cx.globalAlpha=1;
 }
 function start(){if(rm)return;make();if(run)return;run=true;cv.style.display='';last=performance.now();raf=requestAnimationFrame(tick)}
 function stop(){run=false;cancelAnimationFrame(raf);if(cv){cx.clearRect(0,0,W,H2);cv.style.display='none'}}
 function lights(){
  if(document.getElementById('xm-lights'))return;
  var d=document.createElement('div');d.id='xm-lights';d.setAttribute('aria-hidden','true');document.body.appendChild(d);
 }
 function sync(){
  var on=isOn();H.classList.toggle('xmas',on);
  var m=document.querySelector('meta[name="theme-color"]');
  if(on){lights();start();if(m){if(!m.dataset.o)m.dataset.o=m.content;m.content='#243a6b'}}
  else{stop();if(m&&m.dataset.o)m.content=m.dataset.o}
 }
 H.classList.toggle('xmas',isOn());              /* 화면이 그려지기 전에 먼저 켬 */
 window.XM={on:isOn,sync:sync};
 function init(){sync();addEventListener('resize',size);
  document.addEventListener('visibilitychange',function(){if(document.hidden){run=false;cancelAnimationFrame(raf)}else if(isOn())start()});
  document.addEventListener('wtchange',sync);}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
