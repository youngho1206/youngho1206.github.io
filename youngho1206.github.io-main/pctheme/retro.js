/* pctheme/retro.js — PC '레트로' 테마 효과 (별빛 · 떠다니는 장식 · 제목). window.PCRetro.on()/off() */
(function(){
 var st=null,old=null;
 function on(){
  if(st)return;st={};
  var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv=document.createElement('canvas');cv.id='rg-stars';document.body.prepend(cv);
  var x=cv.getContext('2d'),S=[],W,H,run=true;
  function fit(){W=cv.width=innerWidth;H=cv.height=innerHeight;S=[];for(var i=0;i<Math.min(140,W*H/9000);i++)S.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.4,v:Math.random()*.25+.05,p:Math.random()*6.3,c:['#fff','#9fd0ff','#ff9af5','#ffe45e'][i%4]})}
  function draw(t){if(!run)return;x.clearRect(0,0,W,H);S.forEach(function(s){if(!rm){s.y+=s.v;if(s.y>H)s.y=0}x.globalAlpha=.45+.55*Math.abs(Math.sin(t/900+s.p));x.fillStyle=s.c;x.fillRect(s.x|0,s.y|0,s.r*1.5,s.r*1.5)});if(!rm)requestAnimationFrame(draw)}
  addEventListener('resize',fit);fit();requestAnimationFrame(draw);
  var d=document.createElement('div');d.id='rg-deco';
  [['🪙',6,18,.5],['👾',88,14,1],['🚀',80,70,1.4],['⭐',12,72,.8],['🕹️',92,44,.6],['🎮',4,46,1.2]].forEach(function(a){var s=document.createElement('span');s.textContent=a[0];s.style.left=a[1]+'%';s.style.top=a[2]+'%';s.dataset.d=a[3];s.style.animationDelay=(-a[3]*2)+'s';d.appendChild(s)});
  document.body.prepend(d);
  function mv(e){var dx=e.clientX/innerWidth-.5,dy=e.clientY/innerHeight-.5;d.querySelectorAll('span').forEach(function(s){var k=+s.dataset.d*34;s.style.transform='translate('+(-dx*k)+'px,'+(-dy*k)+'px)'})}
  if(!rm)addEventListener('pointermove',mv);
  var h=document.querySelector('.ttl h1'),p=null;
  if(h){old=h.textContent;h.textContent='RETRO GAME UNIVERSE';p=document.createElement('p');p.className='rg-sub';p.textContent='추억의 게임 속으로 떠나는 시간 여행';h.insertAdjacentElement('afterend',p)}
  st={cv:cv,d:d,p:p,h:h,mv:mv,fit:fit,stop:function(){run=false}};
 }
 function off(){
  if(!st)return;st.stop();removeEventListener('resize',st.fit);removeEventListener('pointermove',st.mv);
  st.cv.remove();st.d.remove();if(st.p)st.p.remove();if(st.h&&old!=null)st.h.textContent=old;st=null;
 }
 window.PCRetro={on:on,off:off};
 window.PCRetro.on();
})();
