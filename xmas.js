/* =====================================================================
   xmas.js — 크리스마스 테마 공용 '눈 내리는 효과'
   · XmasSnow.on()  : 눈 내리기 시작 (화면 맨 뒤쪽 캔버스, 터치·클릭은 그대로 통과)
   · XmasSnow.off() : 눈을 멈추고 캔버스를 지움
   · XmasSnow.auto(): <html class="xmas"> 가 켜져 있을 때만 자동으로 눈이 내림 (mobile.html 용)
   · 설정 > '동작 줄이기' 를 켠 기기에서는 움직이지 않고 가만히 있는 눈만 그립니다.
   ===================================================================== */
(function(){
 'use strict';
 var cv=null,cx=null,W=0,H=0,flakes=[],run=false,last=0,tm=0,z=-1;
 var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

 function count(){
  var n=Math.round(W*H/16000);
  return Math.max(36,Math.min(n,reduce?60:90));
 }
 function make(i){
  /* 크기 3단계: 멀리(작고 느림) / 중간 / 가까이(크고 빠름) */
  var layer=Math.random();
  var r=layer<.55?1.2+Math.random()*1.2:layer<.9?2.4+Math.random()*1.6:4+Math.random()*2.6;
  return{x:Math.random()*W,y:i===true?-10:Math.random()*H,r:r,
   v:.35+r*.22+Math.random()*.35,sw:Math.random()*Math.PI*2,sa:.3+Math.random()*.9,
   a:.55+Math.random()*.4,star:r>4.2&&Math.random()<.5,rot:Math.random()*6.28,rs:(Math.random()-.5)*.03};
 }
 function fit(){
  if(!cv)return;
  var d=Math.min(devicePixelRatio||1,2);
  W=innerWidth;H=innerHeight;
  cv.width=Math.round(W*d);cv.height=Math.round(H*d);
  cx.setTransform(d,0,0,d,0,0);
  flakes=[];for(var i=0,n=count();i<n;i++)flakes.push(make());
  if(reduce)draw();
 }
 function star6(x,y,r,rot){
  cx.save();cx.translate(x,y);cx.rotate(rot);cx.beginPath();
  for(var k=0;k<3;k++){cx.moveTo(-r,0);cx.lineTo(r,0);cx.rotate(Math.PI/3)}
  cx.stroke();cx.restore();
 }
 function draw(){
  cx.clearRect(0,0,W,H);
  cx.fillStyle='#fff';cx.strokeStyle='#fff';cx.lineWidth=1.3;cx.lineCap='round';
  for(var i=0;i<flakes.length;i++){
   var f=flakes[i];
   cx.globalAlpha=f.a;
   if(f.star){star6(f.x,f.y,f.r*.95,f.rot)}
   else{cx.beginPath();cx.arc(f.x,f.y,f.r,0,6.2832);cx.fill()}
  }
  cx.globalAlpha=1;
 }
 function frame(t){
  if(!run)return;
  requestAnimationFrame(frame);
  if(document.hidden||t-last<33)return;
  var dt=Math.min(3,(t-last)/33);last=t;
  for(var i=0;i<flakes.length;i++){
   var f=flakes[i];
   f.y+=f.v*dt*1.15;f.sw+=.018*dt;f.x+=Math.sin(f.sw)*f.sa*.5*dt+.12*dt;f.rot+=f.rs*dt;
   if(f.y>H+10){flakes[i]=make(true);flakes[i].x=Math.random()*(W+40)-20}
   else if(f.x>W+12)f.x=-12;
  }
  draw();
 }
 function mount(){
  if(cv)return;
  cv=document.createElement('canvas');cv.id='xsnow';cv.setAttribute('aria-hidden','true');
  cv.style.cssText='position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:'+z;
  (document.body||document.documentElement).appendChild(cv);
  cx=cv.getContext('2d');
 }
 function onResize(){clearTimeout(tm);tm=setTimeout(fit,180)}
 addEventListener('resize',onResize);
 addEventListener('orientationchange',onResize);

 var api=window.XmasSnow={
  on:function(zi){
   if(typeof zi==='number')z=zi;
   if(!document.body){document.addEventListener('DOMContentLoaded',function(){api.on(zi)},{once:true});return}
   mount();cv.style.display='';cv.style.zIndex=z;fit();
   if(run)return;run=true;last=0;if(!reduce)requestAnimationFrame(frame);
  },
  off:function(){
   run=false;if(cv){cv.style.display='none';cx.clearRect(0,0,cv.width,cv.height)}
  },
  /* <html class="xmas"> 가 켜져 있을 때만 눈을 내립니다 (테마를 바꾸면 자동으로 멈춤) */
  auto:function(zi){
   var chk=function(){document.documentElement.classList.contains('xmas')?api.on(zi):api.off()};
   if(document.body)chk();else document.addEventListener('DOMContentLoaded',chk,{once:true});
   try{new MutationObserver(chk).observe(document.documentElement,{attributes:true,attributeFilter:['class']})}catch(_){}
  }
 };
})();
