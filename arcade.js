/* =====================================================================
   arcade.js — PC 오락관 홈 화면
   · desktop.html 의 에뮬레이터 코드(C, P, ETC, openEmu, openPc …)를 그대로 사용합니다.
   · 기종 선택 탭 / 검색 / 목록 보기 / 시계 / 설정(⚙)
   ===================================================================== */
(function(){
'use strict';
const q=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

/* ---------- 분류 ---------- */
const BRAND={nintendo:['nes','gb','snes','vb','n64','gbc','gba','nds'],sega:['sms','md','gg'],atari:['atari2600','lynx'],etc:['psx','pce','ngp']};
const pick=ids=>ids.map(id=>C.find(c=>c.id===id)).filter(Boolean);
const mk=(it,t)=>({t,it,id:it.id,n:it.n,y:it.y||'',a:it.a||'#38b6ff',b:it.b||'#0a1230',kw:(window.S_KW&&S_KW[it.id])||''});
const CATS=[
 {k:'all',n:'전체',items:()=>C.map(c=>mk(c,'c')).concat(P.map(p=>mk(p,'p')))},
 {k:'nintendo',n:'닌텐도',items:()=>pick(BRAND.nintendo).map(c=>mk(c,'c'))},
 {k:'sega',n:'세가',items:()=>pick(BRAND.sega).map(c=>mk(c,'c'))},
 {k:'atari',n:'아타리',items:()=>pick(BRAND.atari).map(c=>mk(c,'c'))},
 {k:'etc',n:'소니 · 기타',items:()=>pick(BRAND.etc).map(c=>mk(c,'c'))},
 {k:'pc',n:'윈도우 · DOS',items:()=>P.map(p=>mk(p,'p'))},
 {k:'tool',n:'기타기능',items:()=>ETC.map(e=>mk(Object.assign({y:'',b:'#0a1230'},e),'e'))}
];
let cat='all',view='grid',query='';

const PLAY='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
function art(x){
 if(x.t==='e')return etcIcon(x.it);
 return icon(x.it);
}
function cardHtml(x,i){
 const soon=x.t==='e'&&x.it.soon;
 const rb=x.t==='p'?'<span class="rb" data-t="PC"></span>':(soon?'<span class="rb soon" data-t="준비중"></span>':'');
 const sub=x.t==='e'?(x.it.l||''):(x.y?x.y+'년':'');
 const st=x.t==='p'?'<em class="st"></em><i class="pb"><i></i></i>':'';
 return `<div class="cell" style="animation-delay:${Math.min(i,30)*22}ms"><button type="button" class="card ${soon?'soon':''}" data-t="${x.t}" data-id="${x.id}" style="--ca:${x.a};--cb:${x.b}" title="${esc(x.n)}">
  <span class="no">${i+1}</span>${rb}<span class="art">${art(x)}</span>
  <span class="play">${PLAY}</span>
  <span class="nm"><b>${esc(x.n)}</b><small>${esc(sub)}</small></span>${st}</button></div>`;
}
function matches(x,s){
 const hay=(x.n+' '+x.id+' '+x.kw+' '+(x.it.l||'')+' '+(x.it.fn||'')).toLowerCase();
 return s.split(/\s+/).every(w=>hay.includes(w));
}
function renderCats(){
 q('#cats').innerHTML=CATS.map(c=>`<button type="button" data-k="${c.k}" class="${c.k===cat?'on':''}"><i class="ci"></i>${c.n}<small>(${c.items().length})</small></button>`).join('');
}
function render(){
 const cur=CATS.find(c=>c.k===cat)||CATS[0];
 let items;
 const s=query.trim().toLowerCase();
 if(s){const seen=new Set();items=[];CATS.filter(c=>c.k==='all'||c.k==='tool').forEach(c=>c.items().forEach(x=>{const key=x.t+x.id;if(!seen.has(key)&&matches(x,s)){seen.add(key);items.push(x)}}))}
 else items=cur.items();
 const box=q('#cards');
 box.className='cards'+(view==='list'?' lv':'');
 box.innerHTML=items.length?items.map(cardHtml).join(''):`<div class="none">${s?'검색 결과가 없어요':'표시할 항목이 없어요'}</div>`;
 /* 이미 불러온 윈도우 이미지 상태 표시 유지 */
 if(window.__pcBadge)Object.keys(__pcBadge).forEach(id=>{const b=__pcBadge[id];window.badge&&badge(id,b.t,b.p)});
}
function refreshAll(){renderCats();render()}

/* ---------- 이벤트 ---------- */
q('#cats').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.k;query='';q('#q').value='';refreshAll();q('#list').scrollTop=0};
q('#q').oninput=e=>{query=e.target.value;render()};
q('#bView').onclick=()=>{view=view==='grid'?'list':'grid';q('#bView').textContent=view==='grid'?'☰':'▦';q('#bView').title=view==='grid'?'목록으로 보기':'카드로 보기';render()};
q('#bSet').onclick=()=>PCT.openSettings();
q('#bVer').onclick=()=>{location.href='index.html?select=1'};
q('#bInfo').onclick=()=>iosAlert('ROM 파일은 본인이 합법적으로 소유한 게임만 사용하세요.\n이 사이트는 게임 파일을 제공하지 않습니다. (EmulatorJS · v86)','안내');
q('#cards').onclick=e=>{
 const b=e.target.closest('.card');if(!b)return;
 const id=b.dataset.id,t=b.dataset.t;
 if(t==='c')openEmu(C.find(c=>c.id===id));
 else if(t==='p')openPc(P.find(c=>c.id===id));
 else{
  const it=ETC.find(x=>x.id===id);if(!it)return;
  if(it.href){winOpen(it);return}
  iosAlert('현재 기능은 준비 중 입니다.');
 }
};
addEventListener('keydown',e=>{
 if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')&&!q('#emu').classList.contains('show')&&!q('#pc').classList.contains('show')){e.preventDefault();q('#q').focus()}
});

/* ---------- 시계 · 접속 시간 ---------- */
const p2=n=>String(n).padStart(2,'0'),t0=Date.now();
function tick(){
 const d=new Date();
 q('#clk').textContent=`${d.getFullYear()}.${p2(d.getMonth()+1)}.${p2(d.getDate())} - ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
 const s=Math.floor((Date.now()-t0)/1000);
 q('#up').textContent=`${p2(Math.floor(s/3600))}:${p2(Math.floor(s%3600/60))}:${p2(s%60)}`;
}
tick();setInterval(tick,1000);

/* ---------- 시작 ---------- */
PCT.init();
ICONS_READY.then(refreshAll);
refreshAll();
})();
