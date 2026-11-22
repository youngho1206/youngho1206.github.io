/* cyberbg.js — emulator.html '사이버펑크' 테마용 배경 (비 내리는 네온 도시)
   · CyberBG.on() / CyberBG.off() 로 켜고 끕니다. (skyhome.js 의 테마선택에서 호출)
   · 끄면 그림 그리기·비 애니메이션이 모두 멈춥니다. */
(function(){
 var sky,sx,rn,rx,W,H,drops=[],tm,run=false,last=0,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var NEON=['#00f0ff','#ff2a6d','#fcee09','#b14bff'];
 function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
 function make(){
  if(sky)return;
  sky=document.createElement('canvas');sky.id='cy-sky';sky.setAttribute('aria-hidden','true');
  rn=document.createElement('canvas');rn.id='cy-rain';rn.setAttribute('aria-hidden','true');
  document.body.insertBefore(rn,document.body.firstChild);document.body.insertBefore(sky,document.body.firstChild);
  sx=sky.getContext('2d');rx=rn.getContext('2d');
 }
 function paintSky(){
  var d=Math.min(devicePixelRatio||1,1.5);W=innerWidth;H=innerHeight;
  sky.width=W*d;sky.height=H*d;sx.setTransform(d,0,0,d,0,0);
  var g=sx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#07021a');g.addColorStop(.5,'#1d0a45');g.addColorStop(.8,'#4a0d58');g.addColorStop(1,'#0a0414');
  sx.fillStyle=g;sx.fillRect(0,0,W,H);
  var gl=sx.createRadialGradient(W*.5,H*.82,0,W*.5,H*.82,Math.max(W,H)*.6);
  gl.addColorStop(0,'rgba(255,42,109,.35)');gl.addColorStop(.5,'rgba(120,40,200,.15)');gl.addColorStop(1,'rgba(0,0,0,0)');
  sx.fillStyle=gl;sx.fillRect(0,0,W,H);
  var layers=[{c:'#1b0c3c',h:.52,w:[34,90],a:.9,win:.10,glow:1},{c:'#120730',h:.44,w:[40,110],a:1,win:.16,glow:1},{c:'#0a0420',h:.34,w:[50,130],a:1,win:.2,glow:0}];
  layers.forEach(function(L,li){
   var r=rng(2077+li*13),x=-20;
   while(x<W+20){
    var bw=L.w[0]+r()*(L.w[1]-L.w[0]),bh=H*(.12+r()*L.h),top=H-bh;
    sx.fillStyle=L.c;sx.globalAlpha=L.a;sx.fillRect(x,top,bw,bh+2);sx.globalAlpha=1;
    var neon=NEON[(r()*4)|0];
    if(L.glow&&r()<.5){sx.save();sx.shadowColor=neon;sx.shadowBlur=10;sx.fillStyle=neon;sx.globalAlpha=.85;sx.fillRect(x,top,bw,2);sx.restore()}
    if(r()<.22){var sh=14+r()*40;sx.save();sx.shadowColor=neon;sx.shadowBlur=12;sx.fillStyle=neon;sx.globalAlpha=.7;sx.fillRect(x+bw*(.2+r()*.5),top+8+r()*bh*.3,3,sh);sx.restore()}
    for(var wy=top+10;wy<H-6;wy+=9){for(var wx=x+5;wx<x+bw-6;wx+=8){if(r()<L.win){sx.fillStyle=NEON[(r()*4)|0];sx.globalAlpha=.25+r()*.5;sx.fillRect(wx,wy,3,4)}}}
    sx.globalAlpha=1;x+=bw+(r()<.4?r()*8:0);
   }
  });
 }
 function fitRain(){rn.width=innerWidth;rn.height=innerHeight;drops=[];var n=Math.min(110,innerWidth*innerHeight/14000|0);
  for(var i=0;i<n;i++)drops.push({x:Math.random()*rn.width,y:Math.random()*rn.height,l:10+Math.random()*16,v:7+Math.random()*7})}
 function frame(t){
  if(!run)return;requestAnimationFrame(frame);
  if(document.hidden||t-last<32)return;last=t;
  rx.clearRect(0,0,rn.width,rn.height);rx.strokeStyle='rgba(150,225,255,.3)';rx.lineWidth=1;rx.beginPath();
  for(var i=0;i<drops.length;i++){var p=drops[i];rx.moveTo(p.x,p.y);rx.lineTo(p.x-p.l*.22,p.y+p.l);p.y+=p.v;p.x-=p.v*.22;if(p.y>rn.height){p.y=-20;p.x=Math.random()*(rn.width+80)}}
  rx.stroke();
 }
 function all(){if(!run)return;paintSky();fitRain()}
 addEventListener('resize',function(){clearTimeout(tm);tm=setTimeout(all,200)});
 window.CyberBG={
  on:function(){make();sky.style.display=rn.style.display='';if(run)return;run=true;all();if(!reduce)requestAnimationFrame(frame)},
  off:function(){run=false;if(sky){sky.style.display=rn.style.display='none';rx.clearRect(0,0,rn.width,rn.height)}}
 };
})();
