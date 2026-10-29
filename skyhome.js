/* =====================================================================
   skyhome.js — emulator.html 전용 새 홈 화면 (Retro PC Web Emulator)
   · arcade.js 대신 이 페이지에서만 사용합니다. (arcade.js 는 다른 페이지용으로 그대로 둠)
   · 에뮬레이터 기능(openEmu / openPc / winOpen …)은 emulator.html 안의 기존 코드를 그대로 호출합니다.
   · 기종 목록(C, P, ETC)은 emudata.js 와 emulator.html 의 기존 데이터를 그대로 씁니다.
   ===================================================================== */
(function(){
'use strict';
const q=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const root=q('#sky');

/* =====================================================================
   1) 공지사항 — 아래 목록만 고치면 됩니다. (맨 위가 가장 최신)
   ===================================================================== */
const NOTICES=[
 {d:'2026.10.21',t:'크리스마스 테마 적용',b:'눈 내리는 포근한 겨울 화면과 귀여운 크리스마스 아이콘으로 바뀌었어요. 예전 느낌은 오른쪽 위 [테마선택]에서 고를 수 있어요.'},
 {d:'2026.10.20',t:'사이버펑크 테마 추가',b:'오른쪽 위의 [테마선택]에서 사이버펑크 스타일을 고를 수 있어요. 네온 도시 배경과 각진 네온 메뉴로 바뀌어요.'},
 {d:'2026.10.20',t:'새 디자인 적용',b:'Retro PC Web Emulator 화면으로 새롭게 바뀌었어요. 오른쪽 위의 [배경선택]·[아이콘선택]에서 취향대로 바꿀 수 있어요.'},
 {d:'',t:'이용 안내',b:'ROM 파일은 본인이 합법적으로 소유한 게임만 사용하세요. 이 사이트는 게임 파일을 제공하지 않습니다.'}
];

/* =====================================================================
   2) 배경화면 — emuwall/ 폴더 (큰 사진 + 미리보기 th_*.jpg)
      tone: light = 밝은 배경(파란 글씨) / dark = 어두운 배경(흰 글씨)
   ===================================================================== */
const WALLS=[
 {id:'bg13',n:'기본 하늘색',tone:'light'},
 {id:'sky02',n:'구름 하늘',tone:'dark'},
 {id:'sky05',n:'구름 언덕',tone:'dark'},
 {id:'sky04',n:'컬러 블록',tone:'dark'},
 {id:'sky03',n:'푸른 산맥',tone:'dark'},
 {id:'sky06',n:'호수 단풍',tone:'dark'},
 {id:'sky07',n:'양귀비 들판',tone:'light'},
 {id:'sky13',n:'별 궤적',tone:'dark'},
 {id:'sky12',n:'바다 노을',tone:'dark'},
 {id:'sky11',n:'불타는 노을',tone:'dark'},
 {id:'sky09',n:'붉은 바다',tone:'dark'},
 {id:'sky10',n:'보랏빛 호수',tone:'dark'},
 {id:'sky01',n:'밤 네온',tone:'dark'},
 {id:'sky14',n:'숲 줄무늬',tone:'dark'},
 {id:'sky08',n:'다크 메탈',tone:'dark'}
];
const K_BG='skyemu.bg',K_IC='skyemu.ic2',K_TH='skyemu.theme2',K_BGC='skyemu.bgc',K_BGX='skyemu.bgx';
/* 크리스마스 테마 전용 배경(직접 그린 겨울 풍경) */
const XMW=[
 {id:'xmas1',n:'오두막 겨울밤',tone:'dark'},
 {id:'xmas2',n:'크리스마스 트리',tone:'dark'},
 {id:'xmas3',n:'오로라 마을',tone:'dark'},
 {id:'xmas4',n:'눈사람',tone:'dark'}
];
/* 테마: sky = 기본(하늘색 글라스) / cyber = 사이버펑크. 배경은 테마마다 따로 기억합니다. */
const CYW={id:'cyber',n:'네온 도시',tone:'dark'};   /* 사이버펑크 테마 전용 배경(그려서 만든 도시) */
let thK=['xmas','sky','cyber'].includes(LS.get(K_TH))?LS.get(K_TH):'xmas';
let bgX=LS.get(K_BGX);if(!XMW.some(w=>w.id===bgX)&&!WALLS.some(w=>w.id===bgX))bgX='xmas1';
let bgSky=LS.get(K_BG);if(!WALLS.some(w=>w.id===bgSky))bgSky='bg13';
let bgCy=LS.get(K_BGC);if(bgCy!=='cyber'&&!WALLS.some(w=>w.id===bgCy))bgCy='cyber';
let bgId=thK==='cyber'?bgCy:thK==='xmas'?bgX:bgSky;
function applyBg(id){
 const cy=thK==='cyber'&&id==='cyber';
 const pool=thK==='xmas'?XMW.concat(WALLS):WALLS;
 const w=cy?CYW:(pool.find(x=>x.id===id)||pool[0]);
 bgId=w.id;if(thK==='cyber')bgCy=w.id;else if(thK==='xmas')bgX=w.id;else bgSky=w.id;
 document.documentElement.toggleAttribute('data-cybg',cy);
 document.documentElement.toggleAttribute('data-xmas',thK==='xmas');
 if(window.CyberBG){if(cy)CyberBG.on();else CyberBG.off()}
 if(window.XmasSnow){if(thK==='xmas')XmasSnow.on(-1);else XmasSnow.off()}
 if(!cy)q('#pagebg').style.backgroundImage=`url("emuwall/${w.id}.jpg")`;
 root.dataset.tone=w.tone;
 const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',cy?'#05050f':(thK==='xmas'?'#1b1f4b':(w.tone==='dark'?'#141a2a':'#8fc3f0')));
 LS.set(thK==='cyber'?K_BGC:(thK==='xmas'?K_BGX:K_BG),w.id);
}
function applyTheme(t){
 thK=['xmas','sky','cyber'].includes(t)?t:'xmas';
 root.dataset.theme=thK;LS.set(K_TH,thK);
 applyBg(thK==='cyber'?bgCy:(thK==='xmas'?bgX:bgSky));
}

/* =====================================================================
   3) 아이콘 스타일
      단선 아이콘은 직접 그린 선 그림(SVG)이고, '컬러'는 기존 아이콘(icons/ 폴더 PNG)입니다.
   ===================================================================== */
const ICS=[
 {k:'color',n:'컬러 · 크리스마스 아이콘',d:'귀엽고 따뜻한 크리스마스 컬러 아이콘 (기본)'},
 {k:'auto',n:'단선 · 자동',d:'배경 밝기에 맞춰 선 색이 바뀌어요'},
 {k:'sky',n:'단선 · 하늘색',d:'하늘색 가는 선'},
 {k:'white',n:'단선 · 흰색',d:'흰색 가는 선'},
 {k:'navy',n:'단선 · 진한 파랑',d:'또렷한 남색 선'},
 {k:'bold',n:'단선 · 굵게',d:'선을 조금 더 굵게'}
];
let icK=LS.get(K_IC);if(!ICS.some(x=>x.k===icK))icK='color';
function applyIc(k){icK=k;root.dataset.ic=k==='color'?'auto':k;LS.set(K_IC,k)}

/* 64x64 칸 안에 그린 단선 그림 (선 굵기·색은 CSS 가 정함) */
const GL={
 atari2600:'<path d="M10 52h44l-5-14H15z"/><path d="M32 38V22"/><circle cx="32" cy="16" r="5.5"/><path d="M44 44h4"/>',
 nes:'<rect x="6" y="18" width="52" height="28" rx="2"/><path d="M17 26v14M10 33h14"/><circle cx="45" cy="34" r="3.6"/><circle cx="52" cy="34" r="3.6"/><path d="M27 39h5M35 39h5"/>',
 sms:'<rect x="6" y="36" width="52" height="16" rx="2"/><rect x="18" y="12" width="28" height="24"/><path d="M24 19h16M24 25h10"/><path d="M12 44h14M46 44h.1"/>',
 pce:'<rect x="10" y="26" width="44" height="26" rx="3"/><rect x="22" y="14" width="20" height="12"/><path d="M16 40h16"/><circle cx="44" cy="40" r="2.2"/>',
 md:'<path d="M6 48V34l8-8h36l8 8v14z"/><circle cx="32" cy="36" r="6"/><path d="M12 42h8M44 42h8M20 26v-6h24v6"/>',
 gb:'<rect x="17" y="5" width="30" height="54" rx="3"/><rect x="22" y="10" width="20" height="17"/><path d="M26 38v10M21 43h10"/><circle cx="41" cy="39" r="2.6"/><circle cx="36" cy="44" r="2.6"/><path d="M25 54h5M33 54h5"/>',
 lynx:'<rect x="5" y="17" width="54" height="30" rx="6"/><rect x="19" y="22" width="26" height="20"/><path d="M12 29v10M7 34h10"/><circle cx="52" cy="29" r="2.3"/><circle cx="52" cy="37" r="2.3"/>',
 snes:'<path d="M11 22h42a7 7 0 0 1 7 7v10a7 7 0 0 1-7 7H11a7 7 0 0 1-7-7V29a7 7 0 0 1 7-7z"/><path d="M17 28v12M11 34h12"/><circle cx="48" cy="29" r="2.4"/><circle cx="48" cy="39" r="2.4"/><circle cx="43" cy="34" r="2.4"/><circle cx="53" cy="34" r="2.4"/><path d="M28 38h4M35 38h4"/>',
 gg:'<rect x="4" y="16" width="56" height="32" rx="7"/><rect x="17" y="20" width="30" height="24"/><path d="M11 29v9M6.5 33.5h9"/><circle cx="53" cy="29" r="2.4"/><circle cx="53" cy="38" r="2.4"/>',
 psx:'<path d="M18 20h28c7 0 11 5 12 12l2 14c.4 4-4 6-7 3l-7-8H20l-7 8c-3 3-7 1-7-3l2-14c1-7 5-12 12-12z"/><path d="M20 28v8M16 32h8"/><circle cx="44" cy="28" r="1.8"/><circle cx="44" cy="36" r="1.8"/><circle cx="40" cy="32" r="1.8"/><circle cx="48" cy="32" r="1.8"/><path d="M30 32h4"/>',
 vb:'<rect x="6" y="10" width="52" height="24" rx="5"/><circle cx="22" cy="22" r="5"/><circle cx="42" cy="22" r="5"/><path d="M32 34v10M20 56l12-12 12 12"/>',
 n64:'<path d="M5 46V32c0-7 4-12 11-12h32c7 0 11 5 11 12v14a3.5 3.5 0 0 1-7 0V34a2 2 0 0 0-2-2H14a2 2 0 0 0-2 2v12a3.5 3.5 0 0 1-7 0z"/><path d="M28 33v14a4 4 0 0 0 8 0V33"/><circle cx="32" cy="26" r="3"/><path d="M17 23v7M13.5 26.5h7"/><circle cx="46" cy="25" r="1.8"/><circle cx="51" cy="28" r="1.8"/>',
 ngp:'<rect x="5" y="14" width="54" height="36" rx="7"/><rect x="14" y="19" width="36" height="16"/><circle cx="17" cy="42.5" r="3.5"/><circle cx="45" cy="43" r="2.3"/><circle cx="51" cy="39.5" r="2.3"/>',
 gbc:'<rect x="17" y="5" width="30" height="54" rx="6"/><rect x="22" y="10" width="20" height="17" rx="1"/><circle cx="32" cy="18.5" r="4"/><path d="M26 38v10M21 43h10"/><circle cx="41" cy="39" r="2.6"/><circle cx="36" cy="44" r="2.6"/>',
 gba:'<rect x="4" y="20" width="56" height="26" rx="9"/><rect x="20" y="24" width="24" height="18"/><path d="M12 29v10M7 34h10"/><circle cx="51" cy="31" r="2.3"/><circle cx="55" cy="37" r="2.3"/><path d="M8 16h10M46 16h10"/>',
 nds:'<rect x="9" y="4" width="46" height="25" rx="3"/><rect x="16" y="8" width="32" height="17"/><rect x="9" y="33" width="46" height="27" rx="3"/><rect x="22" y="37" width="20" height="19"/><path d="M15.5 43v7M12 46.5h7"/><circle cx="49" cy="43" r="1.8"/><circle cx="49" cy="50" r="1.8"/>',
 mamegame:'<rect x="15" y="5" width="34" height="8"/><rect x="17" y="15" width="30" height="19"/><path d="M12 38h40l4 9H8z"/><path d="M10 47v12M54 47v12M10 59h44"/><path d="M24 42.5h.1M34 42.5h.1M41 42.5h.1M47 42.5h.1"/>',
 dos:'<rect x="7" y="9" width="50" height="37" rx="2"/><path d="M15 21l8 6-8 6M28 34h12"/><path d="M24 54h16M32 46v8"/>',
 win10:'<rect x="8" y="10" width="48" height="42"/><path d="M8 22h48M30 22v30M30 38h26"/><path d="M13 16h.1M18 16h.1"/>',
 win20:'<path d="M22 36H6V10h34v16"/><path d="M6 17h34"/><rect x="22" y="26" width="34" height="26"/><path d="M22 33h34"/>',
 win30:'<rect x="6" y="8" width="52" height="44"/><path d="M6 16h52"/><rect x="12" y="23" width="9" height="9"/><rect x="27" y="23" width="9" height="9"/><rect x="42" y="23" width="9" height="9"/><path d="M12 42h12M42 42h9"/>',
 win31:'<rect x="6" y="10" width="52" height="42"/><path d="M6 18h52M11 14h5"/><path d="M49 12.5l3 3 3-3"/><rect x="14" y="25" width="10" height="9"/><rect x="30" y="25" width="10" height="9"/><rect x="14" y="39" width="10" height="9"/><rect x="30" y="39" width="10" height="9"/>',
 win95:'<path d="M10 15l20-4v19H10z"/><path d="M34 10l22-5v25H34z"/><path d="M10 34h20v20l-20-4z"/><path d="M34 34h22v25l-22-4z"/>',
 win98:'<rect x="6" y="6" width="52" height="38" rx="2"/><path d="M16 14l10-2v10H16z"/><path d="M29 11l13-2v13H29z"/><path d="M16 25h10v10l-10-2z"/><path d="M29 25h13v14l-13-2z"/><path d="M24 54h16M32 44v10"/>',
 _:'<rect x="10" y="10" width="44" height="44" rx="3"/><path d="M24 32h16M32 24v16"/>'
};
/* 기타기능(ETC) 그림은 기존 100칸 그림을 선 그림으로 바꿔서 사용 */
function etcGlyph(e){
 const g=String(e.g||'').replace(/ fill="#fff"/g,' fill="none"').replace(/ stroke="none"/g,'');
 return `<g transform="scale(.64)" style="stroke-width:calc(var(--sw)/.64*1px)">${g}</g>`;
}
function lineSvg(x){
 const g=x.t==='e'?etcGlyph(x.it):(GL[x.id]||GL._);
 return `<svg class="ln" viewBox="0 0 64 64" aria-hidden="true">${g}</svg>`;
}
function artHtml(x){
 if(icK==='color')return x.t==='e'?etcIcon(x.it):icon(x.it);   /* 기존 컬러 아이콘 */
 return lineSvg(x);
}

/* =====================================================================
   4) 기종 목록 (분류 · 검색 · 목록보기)
   ===================================================================== */
const BRAND={nintendo:['nes','gb','snes','vb','n64','gbc','gba','nds','gc','wii'],sega:['sms','md','gg','segacd','saturn','s32x','dc'],atari:['atari2600','lynx','jaguar'],etc:['psx','ps2','3do','pce','ngp'],mamegame:['mamegame']};
const pick=ids=>ids.map(id=>C.find(c=>c.id===id)).filter(Boolean);
const mk=(it,t)=>({t,it,id:it.id,n:it.n,y:it.y||'',kw:(window.S_KW&&S_KW[it.id])||''});
const CATS=[
 {k:'all',n:'전체',items:()=>C.map(c=>mk(c,'c')).concat(P.map(p=>mk(p,'p')))},
 {k:'nintendo',n:'닌텐도',items:()=>pick(BRAND.nintendo).map(c=>mk(c,'c'))},
 {k:'sega',n:'세가',items:()=>pick(BRAND.sega).map(c=>mk(c,'c'))},
 {k:'atari',n:'아타리',items:()=>pick(BRAND.atari).map(c=>mk(c,'c'))},
 {k:'mamegame',n:'마메게임',items:()=>pick(BRAND.mamegame).map(c=>mk(c,'c'))},
 {k:'etc',n:'소니 · 기타',items:()=>pick(BRAND.etc).map(c=>mk(c,'c'))},
 {k:'pc',n:'윈도우 · DOS',items:()=>P.map(p=>mk(p,'p'))},
 {k:'tool',n:'기타기능',items:()=>ETC.map(e=>mk(e,'e'))}
];
let cat='all',view='grid',query='';

function cellHtml(x,i){
 const soon=(x.t==='e'||x.t==='c')&&x.it.soon;
 const tag=x.t==='p'?'<span class="sk-tag">PC</span>':(soon?'<span class="sk-tag">준비중</span>':(x.t==='c'&&x.it.pc?'<span class="sk-tag">PC용</span>':''));
 const st=x.t==='p'?'<em class="st"></em><i class="pb"><i></i></i>':'';
 return `<div class="sk-cell" style="--d:${Math.min(i,30)*24}ms"><button type="button" class="sk-tile${soon?' soon':''}" data-t="${x.t}" data-id="${x.id}" title="${esc(x.n)}">`+
  `<span class="sk-box">${tag}${artHtml(x)}</span><span class="sk-nm">${esc(x.n)}</span>${st}</button></div>`;
}
function matches(x,s){
 const hay=(x.n+' '+x.id+' '+x.kw+' '+(x.it.l||'')+' '+(x.it.fn||'')).toLowerCase();
 return s.split(/\s+/).every(w=>hay.includes(w));
}
function renderCats(){
 q('#cats').innerHTML=CATS.map(c=>`<button type="button" data-k="${c.k}" class="${c.k===cat?'on':''}">${c.n}<small>(${c.items().length})</small></button>`).join('');
}
function render(){
 const cur=CATS.find(c=>c.k===cat)||CATS[0];
 const s=query.trim().toLowerCase();
 let items;
 if(s){
  const seen=new Set();items=[];
  CATS.filter(c=>c.k==='all'||c.k==='tool').forEach(c=>c.items().forEach(x=>{const key=x.t+x.id;if(!seen.has(key)&&matches(x,s)){seen.add(key);items.push(x)}}));
 }else items=cur.items();
 const box=q('#cards');
 box.className='sk-grid'+(view==='list'?' lv':'');
 box.innerHTML=items.length?items.map(cellHtml).join(''):`<div class="sk-none">${s?'검색 결과가 없어요':'표시할 항목이 없어요'}</div>`;
 /* 이미 불러온 윈도우 이미지 상태 표시 유지 */
 if(window.__pcBadge)Object.keys(__pcBadge).forEach(id=>{const b=__pcBadge[id];window.badge&&badge(id,b.t,b.p)});
}
function refreshAll(){renderCats();render()}

q('#cats').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.k;query='';q('#q').value='';refreshAll();q('#list').scrollTop=0};
q('#q').oninput=e=>{query=e.target.value;render()};
q('#bView').onclick=()=>{view=view==='grid'?'list':'grid';q('#bView').textContent=view==='grid'?'☰':'▦';q('#bView').title=view==='grid'?'목록으로 보기':'아이콘으로 보기';render()};

/* 기종 아이콘을 누르면 → 기존 에뮬레이터 기능으로 연결 (openEmu / openPc / winOpen 은 emulator.html 의 기존 코드) */
q('#cards').onclick=e=>{
 const b=e.target.closest('.sk-tile');if(!b)return;
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
 if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test((document.activeElement||{}).tagName||'')&&!q('#emu').classList.contains('show')&&!q('#pc').classList.contains('show')&&!q('#skm').classList.contains('on')){e.preventDefault();q('#q').focus()}
 if(e.key==='Escape')closeModal();
});

/* =====================================================================
   5) 팝업창 (공지사항 · 안내 · 배경선택 · 아이콘선택)
   ===================================================================== */
const M=q('#skm');
function openModal(title,html,wide){
 M.innerHTML=`<div class="skm-box${wide?' wide':''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="skm-h"><b>${esc(title)}</b><button type="button" class="skm-x" aria-label="닫기">✕</button></div><div class="skm-b">${html}</div></div>`;
 M.classList.add('on');
 return M.querySelector('.skm-b');
}
function closeModal(){M.classList.remove('on');M.innerHTML=''}
M.addEventListener('click',e=>{if(e.target===M||e.target.closest('.skm-x'))closeModal()});

q('#bNotice').onclick=()=>{
 openModal('공지사항',NOTICES.map(n=>`<div class="skm-note"><h4>${esc(n.t)}</h4>${n.d?`<time>${esc(n.d)}</time>`:''}<p>${esc(n.b)}</p></div>`).join('')||'<p class="sub">등록된 공지사항이 없어요.</p>');
};
q('#bInfo').onclick=()=>{
 openModal('안내','<p>ROM 파일은 본인이 합법적으로 소유한 게임만 사용하세요.</p><p>이 사이트는 게임 파일을 제공하지 않습니다.</p><p class="sub">EmulatorJS · v86 으로 동작합니다.</p>');
};
q('#bVer').onclick=()=>{location.href='index.html?select=1'};

q('#bBg').onclick=()=>{
 const list=thK==='cyber'?[CYW].concat(WALLS):(thK==='xmas'?XMW.concat(WALLS):WALLS);
 const tile=w=>w.id==='cyber'
  ?`<button type="button" class="sk-wp cy${w.id===bgId?' on':''}" data-id="cyber" title="${esc(w.n)}"><span>${esc(w.n)}</span></button>`
  :`<button type="button" class="sk-wp${w.id===bgId?' on':''}" data-id="${w.id}" title="${esc(w.n)}"><img src="emuwall/th_${w.id}.jpg" alt="" loading="lazy" draggable="false"><span>${esc(w.n)}</span></button>`;
 const b=openModal('배경선택',`<div class="sk-wps">${list.map(tile).join('')}</div>`,true);
 b.onclick=e=>{
  const t=e.target.closest('.sk-wp');if(!t)return;
  applyBg(t.dataset.id);
  b.querySelectorAll('.sk-wp').forEach(x=>x.classList.toggle('on',x===t));
 };
};

/* 테마선택 : 크리스마스 / 하늘색 / 사이버펑크 */
const THEMES=[
 {k:'xmas',n:'크리스마스',d:'눈 내리는 포근한 겨울 · 귀여운 크리스마스 (기본)',p:'xm'},
 {k:'sky',n:'하늘색 글라스',d:'밝고 투명한 하늘색 화면 (이전 기본)',p:'sky'},
 {k:'cyber',n:'사이버펑크',d:'네온 도시 배경 · 각진 네온 메뉴 · 스캔라인',p:'cy'}
];
q('#bTheme').onclick=()=>{
 const b=openModal('테마선택',`<div class="sk-ths">${THEMES.map(o=>`<button type="button" class="sk-th${o.k===thK?' on':''}" data-k="${o.k}"><span class="thp ${o.p}"><i></i><i></i><i></i></span><span><b>${esc(o.n)}</b><small>${esc(o.d)}</small></span></button>`).join('')}</div><p class="sub" style="margin-top:12px">테마를 바꿔도 아이콘 스타일 선택은 그대로 유지돼요. 배경은 테마마다 따로 기억해요.</p>`);
 b.onclick=e=>{
  const t=e.target.closest('.sk-th');if(!t)return;
  applyTheme(t.dataset.k);
  b.querySelectorAll('.sk-th').forEach(x=>x.classList.toggle('on',x===t));
 };
};

const PREV=['nes','gb','win95'];
function previewHtml(k){
 const cells=PREV.map(id=>{
  if(k==='color')return `<span class="pb1"><img src="${WT.src(IMG[id])}" alt="" draggable="false"></span>`;
  return `<span class="pb1"><svg class="ln" viewBox="0 0 64 64" aria-hidden="true">${GL[id]}</svg></span>`;
 }).join('');
 return `<span class="sk-pv" data-ic="${k==='color'?'auto':k}">${cells}</span>`;
}
q('#bIc').onclick=()=>{
 const b=openModal('아이콘선택',`<div class="sk-ics">${ICS.map(o=>`<button type="button" class="sk-ico${o.k===icK?' on':''}" data-k="${o.k}">${previewHtml(o.k)}<span class="tx"><b>${esc(o.n)}</b><small>${esc(o.d)}</small></span></button>`).join('')}</div>`);
 b.onclick=e=>{
  const t=e.target.closest('.sk-ico');if(!t)return;
  applyIc(t.dataset.k);
  b.querySelectorAll('.sk-ico').forEach(x=>x.classList.toggle('on',x===t));
  render();
 };
};

/* =====================================================================
   6) 시계 · 접속 시간 (맨 아래)
   ===================================================================== */
const p2=n=>String(n).padStart(2,'0'),t0=Date.now();
function tick(){
 const d=new Date();
 q('#clk').textContent=`${d.getFullYear()}.${p2(d.getMonth()+1)}.${p2(d.getDate())} - ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
 const s=Math.floor((Date.now()-t0)/1000);
 q('#up').textContent=`${p2(Math.floor(s/3600))}:${p2(Math.floor(s%3600/60))}:${p2(s%60)}`;
}
tick();setInterval(tick,1000);

/* ---------- 시작 ---------- */
applyTheme(thK);applyIc(icK);
ICONS_READY.then(()=>{if(icK==='color')refreshAll()});
refreshAll();
})();
