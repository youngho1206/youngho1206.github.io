/* retro.js — 별빛 배경, 떠다니는 픽셀 장식(마우스 반응), 보조 문구 */
(function(){
 var rm=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var cv=document.createElement('canvas');cv.id='rg-stars';document.body.prepend(cv);
 var x=cv.getContext('2d'),S=[],W,H;
 function fit(){W=cv.width=innerWidth;H=cv.height=innerHeight;S=[];for(var i=0;i<Math.min(140,W*H/9000);i++)S.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.4,v:Math.random()*.25+.05,p:Math.random()*6.3,c:['#fff','#9fd0ff','#ff9af5','#ffe45e'][i%4]})}
 function draw(t){x.clearRect(0,0,W,H);S.forEach(function(s){if(!rm){s.y+=s.v;if(s.y>H)s.y=0}x.globalAlpha=.45+.55*Math.abs(Math.sin(t/900+s.p));x.fillStyle=s.c;x.fillRect(s.x|0,s.y|0,s.r*1.5,s.r*1.5)});if(!rm)requestAnimationFrame(draw)}
 addEventListener('resize',fit);fit();requestAnimationFrame(draw);
 var d=document.createElement('div');d.id='rg-deco';
 [['🪙',6,18,.5],['👾',88,14,1],['🚀',80,70,1.4],['⭐',12,72,.8],['🕹️',92,44,.6],['🎮',4,46,1.2]].forEach(function(a){var s=document.createElement('span');s.textContent=a[0];s.style.left=a[1]+'%';s.style.top=a[2]+'%';s.dataset.d=a[3];s.style.animationDelay=(-a[3]*2)+'s';d.appendChild(s)});
 document.body.prepend(d);
 if(!rm)addEventListener('pointermove',function(e){var dx=e.clientX/innerWidth-.5,dy=e.clientY/innerHeight-.5;d.querySelectorAll('span').forEach(function(s){var k=+s.dataset.d*34;s.style.transform='translate('+(-dx*k)+'px,'+(-dy*k)+'px)'})});
 var h=document.querySelector('body>header h1,.ttl h1');
 if(h&&!document.querySelector('.rg-sub')){var p=document.createElement('p');p.className='rg-sub';p.textContent='추억의 게임 속으로 떠나는 시간 여행';h.insertAdjacentElement('afterend',p)}
})();
