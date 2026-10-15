/* =====================================================================
   retrostream.js — 레트로아크(RetroArch) 스트리밍 기종 (mobile.html · iosemulator.html · desktop.html 공용)
   · 웹(EmulatorJS)이 아니라, "내 PC 의 레트로아크"를 실행하는 기종들입니다.
   · 기종 카드를 누르면 → PC 의 도우미(retroarch-helper)가 열리고 → 게임 고르기 → PC 에서 레트로아크 실행
     → (도우미에 스트리밍 주소를 넣어 두었다면) 그 화면으로 이동합니다.
   · 새 기종은 아래 SYS 목록에 한 줄만 추가하면 세 화면에 모두 나타납니다.
   ===================================================================== */
(function(){
'use strict';
/* id · n 이름 · y 출시년 · l 아이콘 글자 · a/b 색 · cores 레트로아크 코어(앞쪽이 기본) · x 형식 · k 검색어 · st 코어가 없는 기종(별도 에뮬레이터를 도우미에 연결) */
const SYS=[
 {id:'ra-neogeo',n:'Neo Geo (레트로아크)',y:1990,l:'NEO',a:'#fbbf24',b:'#7a4a06',cores:['fbneo_libretro','geolith_libretro'],web:{id:'neogeo',core:'arcade',fn:'NEOGEO'},x:'.zip',k:'네오지오 neogeo neo geo snk aes mvs fbneo 레트로아크',note:'BIOS(neogeo.zip)가 게임과 같은 폴더(또는 레트로아크 system 폴더)에 있어야 합니다.'},
 {id:'saturn',n:'세가 새턴',y:1994,l:'SAT',a:'#4f7bd9',b:'#14264f',cores:['mednafen_saturn_libretro','kronos_libretro','yabasanshiro_libretro'],web:{id:'saturn',core:'segaSaturn',fn:'SATURN'},x:'.cue .chd .iso .ccd',k:'세가 sega 새턴 saturn 레트로아크',note:'BIOS 필요: system 폴더에 sega_101.bin(일본) 또는 mpr-17933.bin(미국·유럽).'},
 {id:'neocd',n:'Neo Geo CD',y:1994,l:'NEO CD',a:'#f59e0b',b:'#5b3203',cores:['neocd_libretro'],x:'.cue .chd .iso',k:'네오지오 cd neogeo neocd snk 레트로아크',note:'BIOS 필요: 레트로아크 system 폴더 안 neocd 폴더.'},
 {id:'dc',n:'드림캐스트',y:1998,l:'DC',a:'#ff8a3d',b:'#7a2a05',cores:['flycast_libretro'],x:'.chd .cdi .gdi .cue',k:'세가 sega 드림캐스트 dreamcast dc flycast 레트로아크',note:'BIOS 필요: system/dc 폴더에 dc_boot.bin, dc_flash.bin.'},
 {id:'naomi',n:'세가 나오미',y:1998,l:'NAOMI',a:'#e8483f',b:'#5a0f0b',cores:['flycast_libretro'],x:'.zip .7z .chd',k:'세가 sega 나오미 naomi 아케이드 flycast 레트로아크',note:'BIOS 필요: system/dc 폴더에 naomi.zip. 게임 zip 이름을 바꾸지 마세요.'},
 {id:'ngpc',n:'Neo Geo Pocket Color',y:1999,l:'NGPC',a:'#2dd4bf',b:'#0b4a45',cores:['mednafen_ngp_libretro','race_libretro'],web:{id:'ngp',core:'ngp',fn:'NGPOCKET'},x:'.ngc .ngp .zip',k:'네오지오 포켓 컬러 neogeo pocket color ngpc snk 휴대용 레트로아크',note:'BIOS 없이 실행됩니다.'},
 {id:'gc',n:'게임큐브',y:2001,l:'GC',a:'#8b7cf6',b:'#241a5c',cores:['dolphin_libretro'],x:'.iso .gcm .gcz .rvz .ciso',k:'닌텐도 nintendo 게임큐브 gamecube gc dolphin 레트로아크',heavy:1,note:'고사양 PC 권장. Dolphin 시스템 파일(Sys 폴더)이 레트로아크 system 폴더에 있어야 합니다.'},
 {id:'j2me',n:'J2ME (자바)',y:2001,l:'J2ME',a:'#38bdf8',b:'#0c3a5e',cores:['freej2me_libretro','squirreljme_libretro'],x:'.jar',k:'j2me 자바 java 피처폰 휴대폰 게임 모바일 freej2me 레트로아크',note:'피처폰용 .jar 게임을 사용합니다.'},
 {id:'ngage',n:'N-Gage',y:2003,l:'N-GAGE',a:'#84cc16',b:'#2f4a08',cores:[],st:1,x:'(별도 에뮬레이터)',k:'엔게이지 노키아 nokia ngage n-gage 휴대용 레트로아크',note:'레트로아크 코어가 없는 기종입니다. EKA2L1 같은 N-Gage 에뮬레이터를 도우미 스크립트에 연결해 PC 에서 엽니다.'},
 {id:'wii',n:'닌텐도 Wii',y:2006,l:'Wii',a:'#38bdf8',b:'#0c3552',cores:['dolphin_libretro'],x:'.iso .wbfs .rvz .ciso .gcz',k:'닌텐도 nintendo 위 wii dolphin 레트로아크',heavy:1,note:'고사양 PC 권장. Dolphin 시스템 파일(Sys 폴더)이 레트로아크 system 폴더에 있어야 합니다.'},
 {id:'psvita',n:'PS Vita',y:2011,l:'VITA',a:'#3b82f6',b:'#0b2a6b',cores:[],st:1,x:'(별도 에뮬레이터)',k:'플스비타 ps vita 비타 소니 sony psvita vita3k 휴대용 레트로아크',heavy:1,note:'레트로아크 코어가 없는 기종입니다. Vita3K 를 도우미 스크립트에 연결해 PC 에서 엽니다.'},
 {id:'3ds',n:'닌텐도 3DS',y:2011,l:'3DS',a:'#ef4444',b:'#5a0f0f',cores:['citra_libretro'],x:'.3ds .cci .cxi .3dsx',k:'닌텐도 nintendo 3ds 쓰리디에스 citra 휴대용 레트로아크',heavy:1,note:'고사양 PC 권장. 암호화되지 않은 .3ds / .cci / .cxi 파일을 권장합니다.'},
 {id:'ra-mame',n:'MAME (레트로아크)',y:'',l:'MAME',a:'#f59e0b',b:'#4a2a02',cores:['mame_libretro','mame2003_plus_libretro','mame2010_libretro'],web:{id:'mame',core:'mame2003',fn:'MAME'},x:'.zip .7z .chd',k:'마메 mame 아케이드 오락실 arcade 레트로아크',note:'게임 zip 이름을 바꾸지 마세요. 코어 버전에 맞는 ROM 세트가 필요합니다.'}
];
SYS.forEach(s=>{s.fn=s.k});
/* 웹(EmulatorJS)으로 바로 플레이할 수 없는 기종(드림캐스트·나오미·GC·Wii·3DS·NeoCD·J2ME·N-Gage·Vita)은 목록에서 제외합니다.
   (다시 넣고 싶으면 이 줄을 지우세요 — 그 기종들은 PC 도우미가 필요합니다) */
for(let i=SYS.length-1;i>=0;i--)if(!SYS[i].web)SYS.splice(i,1);

/* ---------- 설정 (이 기기에 저장 · retroarch.json 이 있으면 도우미 주소 기본값으로 사용) ---------- */
const KEY='rsCfg';
const cfg={helper:'',key:''};
try{Object.assign(cfg,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
fetch('retroarch.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():{}).catch(()=>({})).then(j=>{if(j&&j.helper&&!cfg.helper)cfg.helper=String(j.helper)});
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({helper:cfg.helper,key:cfg.key}))}catch(e){}};
const esc=t=>String(t).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

/* ---------- 아이콘 (색 + 글자 + RA 표시) ---------- */
let uid=0;
function icon(s){
 const t=String(s.l),fs=t.length>5?15:t.length>4?18:t.length>3?22:t.length>2?27:34,g='rsg'+(++uid);
 return `<svg viewBox="0 0 100 100" width="256" height="256" aria-label="${esc(s.n)}" draggable="false"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.a}"/><stop offset="1" stop-color="${s.b}"/></linearGradient></defs><rect width="100" height="100" rx="22.5" fill="url(#${g})"/><rect width="100" height="50" rx="22.5" fill="#fff" opacity=".12"/><text x="50" y="${46+fs*.2}" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="800" font-size="${fs}" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="1.6" style="paint-order:stroke">${esc(t)}</text><rect x="${s.web?31:35}" y="69" width="${s.web?38:30}" height="16" rx="8" fill="#fff"/><text x="50" y="80.6" text-anchor="middle" font-family="sans-serif" font-weight="800" font-size="10.5" fill="${s.b}">${s.web?'WEB':'RA'}</text></svg>`;
}

/* ---------- 스타일 · 창 ---------- */
const st=document.createElement('style');
st.textContent=`
#rsgrid .app .ico svg{display:block;width:100%;height:100%;border-radius:22.5%}
.rs-h{margin:34px 4px 14px;text-align:center;font:600 18px/1.3 'Noto Sans KR',-apple-system,system-ui,sans-serif}
.rs-h small{display:block;margin-top:6px;font:400 11px/1.4 'Noto Sans KR',sans-serif;opacity:.6;letter-spacing:.12em}
#rsp{position:fixed;inset:0;z-index:2147483000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.62);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
#rsp.on{display:flex}
#rsp .bx{width:min(440px,100%);max-height:92vh;max-height:92dvh;overflow:auto;border-radius:22px;background:#17171d;color:#f2f2f7;border:1px solid rgba(255,255,255,.16);box-shadow:0 30px 80px rgba(0,0,0,.6);padding:18px;font:400 14px/1.55 'Noto Sans KR',-apple-system,system-ui,sans-serif;word-break:keep-all}
#rsp .hd{display:flex;align-items:center;gap:14px}
#rsp .ic{flex:none;width:64px;height:64px}#rsp .ic svg{width:100%;height:100%;display:block}
#rsp .hd div{flex:1;min-width:0}#rsp .hd b{display:block;font-size:18px}#rsp .hd small{opacity:.65;font-size:12px}
#rsp .x{flex:none;border:0;background:rgba(255,255,255,.1);color:#fff;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer}
#rsp .nt{margin:14px 0 6px;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.07);font-size:13px}
#rsp .fm{font-size:12px;opacity:.65;margin:0 2px 12px}
#rsp label{display:block;margin:10px 0 0;font-size:12px;opacity:.85}
#rsp select,#rsp input{display:block;width:100%;margin-top:5px;padding:11px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:#0d0d12;color:#fff;font:15px 'Noto Sans KR',sans-serif}
#rsp .bt{display:flex;gap:10px;margin-top:16px}
#rsp .bt button,#rsp .sv{flex:1;border:0;border-radius:14px;padding:13px 10px;font:700 15px 'Noto Sans KR',sans-serif;cursor:pointer;color:#fff;background:rgba(255,255,255,.14)}
#rsp .bt .go,#rsp .sv{background:linear-gradient(160deg,#ff7a45,#e0381f)}
#rsp .bt .go:disabled{opacity:.45}
#rsp .set{display:none;margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.14)}
#rsp .set.on{display:block}
#rsp .set .sv{display:block;width:100%;margin-top:14px}
#rsp .set p{margin:10px 0 0;font-size:12px;line-height:1.55;opacity:.7}
#rsp .set a{color:#7fb0ff}
#rsp .msg{margin-top:10px;color:#ffd75e;font-size:13px}
`;
document.head.appendChild(st);

const box=document.createElement('div');
box.id='rsp';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
box.innerHTML='<div class="bx"></div>';
document.body.appendChild(box);
const bx=box.firstChild;
let cur=null,core='';

function norm(u){u=String(u||'').trim();if(!u)return'';if(!/^https?:\/\//i.test(u))u='http://'+u;return u.replace(/\/+$/,'')}
function panel(s,msg,showSet){
 cur=s;core=core&&s.cores.includes(core)?core:(s.cores[0]||'');
 const sel=s.cores.length>1?`<label>코어 선택<select id="rsC">${s.cores.map(c=>`<option value="${c}"${c===core?' selected':''}>${c}${c===s.cores[0]?'  (기본)':''}</option>`).join('')}</select></label>`:'';
 bx.innerHTML=`<div class="hd"><span class="ic">${icon(s)}</span><div><b>${esc(s.n)}</b><small>${s.st?'별도 에뮬레이터 연결':'코어: '+esc(s.cores[0])}</small></div><button type="button" class="x" id="rsX" aria-label="닫기">✕</button></div>
 <p class="nt">${esc(s.note||'')}${s.heavy?'<br>※ 고사양 기종이라 PC 성능에 따라 느릴 수 있어요.':''}</p>
 <p class="fm">지원 형식: ${esc(s.x)}</p>${sel}
 <div class="bt"><button type="button" class="go" id="rsGo">▶ 플레이</button><button type="button" id="rsCf">⚙ 연결 설정</button></div>
 <p class="msg" id="rsM">${esc(msg||'')}</p>
 <div class="set${showSet?' on':''}" id="rsS"><label>PC 도우미 주소<input id="rsH" inputmode="url" autocapitalize="off" autocomplete="off" placeholder="192.168.0.10:8765" value="${esc(cfg.helper)}"></label>
 <label>비밀키 (도우미 스크립트에 적은 것)<input id="rsK" type="password" autocomplete="off" value="${esc(cfg.key)}"></label>
 <button type="button" class="sv" id="rsSv">저장</button>
 <p>레트로아크가 설치된 PC 에서 <b>retroarch-helper</b> 폴더의 <b>start-helper.bat</b> 을 먼저 실행해 두세요. 설치 방법은 <a href="retroarch-helper/README.txt" target="_blank" rel="noopener">여기</a>를 보세요.</p></div>`;
 box.classList.add('on');
 const q=i=>bx.querySelector('#'+i);
 q('rsX').onclick=close;
 if(q('rsC'))q('rsC').onchange=e=>{core=e.target.value};
 q('rsCf').onclick=()=>q('rsS').classList.toggle('on');
 q('rsSv').onclick=()=>{cfg.helper=norm(q('rsH').value);cfg.key=q('rsK').value.trim();save();panel(cur,cfg.helper?'저장했습니다.':'',false)};
 q('rsGo').onclick=play;
}
function close(){box.classList.remove('on')}
function play(){
 if(!cfg.helper){panel(cur,'먼저 PC 도우미 주소를 입력해 주세요.',true);return}
 const u=cfg.helper+'/play?sys='+encodeURIComponent(cur.id)+(core?'&core='+encodeURIComponent(core):'')+'&key='+encodeURIComponent(cfg.key||'');
 const w=window.open(u,'_blank');if(!w)location.href=u;
}
box.addEventListener('click',e=>{if(e.target===box)close()});
addEventListener('keydown',e=>{if(e.key==='Escape')close()});

/* 웹 레트로아크 기종은 전용 실행 화면(ra.html)으로 이동합니다. (코어 자동 전환 · 실패 원인 표시) */
function openWeb(s){
 if(!s.web)return false;
 location.href='ra.html?sys='+encodeURIComponent(s.web.id);
 return true;
}
window.RS={list:SYS,icon:icon,open:id=>{const s=SYS.find(x=>x.id===id);if(!s)return;if(openWeb(s))return;core='';panel(s)}};

/* ---------- 모바일 · 아이폰/아이패드 화면 : 기종 목록 아래에 "레트로아크" 구역 추가 (PC 화면은 arcade.js 가 담당) ---------- */
function mount(){
 const grid=document.getElementById('grid');
 if(!grid||document.getElementById('cards'))return;
 const mobile=!!document.getElementById('etcgrid');   /* mobile.html 은 .sec 제목 스타일이 있음 */
 const head=document.createElement('h2');
 head.className=mobile?'sec':'rs-h';
 head.innerHTML='레트로아크<small>RETROARCH · 웹에서 바로 실행</small>';
 const g=document.createElement('div');g.className='grid';g.id='rsgrid';
 grid.insertAdjacentElement('afterend',g);grid.insertAdjacentElement('afterend',head);
 const tabs=document.getElementById('tabs'),q=document.getElementById('q');
 const eraOf=y=>y<1990?1:y<2000?2:3;
 function draw(){
  let fi=0;const on=tabs&&tabs.querySelector('button.on[data-i]');if(on)fi=+on.dataset.i||0;   /* 아이폰 화면의 연대 탭 */
  const s=(q&&q.value||'').trim().toLowerCase();
  const list=SYS.filter(c=>(!fi||eraOf(c.y)===fi)&&(!s||(c.n+' '+c.k+' '+c.y).toLowerCase().includes(s)));
  g.innerHTML=list.map((c,i)=>`<button class="app" type="button" data-rs="${c.id}" style="--ac:${c.a};--d:${i*35}ms;animation-delay:${i*45}ms"><span class="ico">${icon(c)}</span><b>${esc(c.n)}</b><small>${c.y||'ARCADE'}</small>${c.heavy&&!mobile?'<em>고사양</em>':''}</button>`).join('');
  head.style.display=g.style.display=list.length?'':'none';
 }
 g.onclick=e=>{const b=e.target.closest('.app');if(b)RS.open(b.dataset.rs)};
 if(q)q.addEventListener('input',draw);
 if(tabs)tabs.addEventListener('click',()=>setTimeout(draw,0));
 draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
