/* mobilepad.js — 스마트폰 게임 화면
   · 상단 : 아이콘 바(게임 · 친구 · 버튼 · 전체화면 · 나가기). 아이콘을 누르면 아래로 보조메뉴가 열립니다.
   · 게임을 불러오기 전 : 안내 화면(컨트롤러 그림 + 확장자 + 게임불러오기 버튼)
   · 하단 : 조작 패드(게임/롬 종류에 따라 버튼이 자동으로 바뀜). 에뮬레이터 화면 속 가상 버튼은 표시하지 않습니다.
   · 블루투스 컨트롤러(게임패드)나 키보드가 연결되면 하단 패드는 자동으로 숨겨집니다.
   · 폰(화면 짧은 쪽 600px 미만)에서만 동작합니다. PC·태블릿은 그대로입니다. */
(function () {
  'use strict';
  function $(s) { return document.querySelector(s); }
  var body = document.body;
  if (!body || !body.classList.contains('mob')) return;
  if (Math.min(screen.width, screen.height) >= 600) return;
  var emu = $('#emu'), bar = $('#bar'), drop = $('#drop'), fr = $('#fr'), stage = $('#stage');
  if (!emu || !bar || !fr || !stage) return;
  body.classList.add('gp');

  /* ---------------- 아이콘 (메뉴 아이콘 스타일: 흰색 단색 · 둥근 선) ---------------- */
  function SV(inner, cls) { return '<svg viewBox="0 0 24 24" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + inner + '</svg>'; }
  var ICO = {
    game: SV("<path fill-rule='evenodd' d='M7 5.5h10a5.2 5.2 0 0 1 5.1 4.2l.9 5.2a3.6 3.6 0 0 1-6.4 2.7L14.9 15.6H9.1l-1.7 2a3.6 3.6 0 0 1-6.4-2.7l.9-5.2A5.2 5.2 0 0 1 7 5.5zM7.2 8.6v1.7H5.5v1.6h1.7v1.7h1.6v-1.7h1.7v-1.6H8.8V8.6zm8.3.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3zm2.5 2.5a1.15 1.15 0 1 0 0 2.3 1.15 1.15 0 0 0 0-2.3z'/>"),
    ppl: SV("<circle cx='12' cy='7.6' r='3.4'/><path d='M5.6 19.6c0-3.9 2.8-6.3 6.4-6.3s6.4 2.4 6.4 6.3z'/><circle cx='4.9' cy='9.6' r='2.3'/><path d='M.6 17.6c0-2.6 1.7-4.4 4.2-4.4.7 0 1.3.1 1.9.4-1.3 1.2-2.1 2.9-2.2 4z'/><circle cx='19.1' cy='9.6' r='2.3'/><path d='M23.4 17.6c0-2.6-1.7-4.4-4.2-4.4-.7 0-1.3.1-1.9.4 1.3 1.2 2.1 2.9 2.2 4z'/>"),
    eye: SV("<path d='M2.2 12S5.8 5.6 12 5.6 21.8 12 21.8 12s-3.6 6.4-9.8 6.4S2.2 12 2.2 12z'/><circle cx='12' cy='12' r='3.1'/><path d='M4.2 3.8l15.6 16.4'/>", 's'),
    fs: SV("<path d='M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5'/>", 's'),
    pw: SV("<path d='M12 3.2v8.2'/><path d='M7 6.2a8 8 0 1 0 10 0'/>", 's'),
    chev: SV("<path d='M9 5l7 7-7 7'/>", 's')
  };
  var BADGE = 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 36'><rect x='1' y='3' width='58' height='30' rx='15' fill='#d9dbe6'/><path d='M13 12h4v4h4v4h-4v4h-4v-4H9v-4h4z' fill='#2d4fb5'/><circle cx='44' cy='13' r='3' fill='#2d6cf0'/><circle cx='37' cy='19' r='3' fill='#37b34a'/><circle cx='51' cy='19' r='3' fill='#e5352b'/><circle cx='44' cy='25' r='3' fill='#f2b01e'/></svg>") + '")';

  /* 안내 화면의 컨트롤러 그림(네온 선) */
  var PADSVG = '<svg class="gd-pad" viewBox="0 0 340 150" aria-hidden="true"><defs><linearGradient id="gdg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2273"/><stop offset="1" stop-color="#110b3a"/></linearGradient></defs>' +
    '<path d="M70 14C40 14 8 44 8 76c0 36 26 62 58 62 26 0 40-16 64-22h80c24 6 38 22 64 22 32 0 58-26 58-62 0-32-32-62-62-62-20 0-32 8-46 8H116c-14 0-26-8-46-8z" fill="url(#gdg)" stroke="#7b5ff2" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M68 48h20v14h14v20H88v14H68V82H54V62h14z" fill="#4a3fad" stroke="#6a5ce0" stroke-width="2" stroke-linejoin="round"/>' +
    '<rect x="139" y="76" width="28" height="9" rx="4.5" transform="rotate(-24 153 80)" fill="#4a3f9e"/><rect x="171" y="76" width="28" height="9" rx="4.5" transform="rotate(-24 185 80)" fill="#4a3f9e"/>' +
    '<circle cx="264" cy="46" r="13" fill="#2347e0"/><circle cx="290" cy="70" r="13" fill="#e0243c"/><circle cx="264" cy="95" r="13" fill="#c99a14"/><circle cx="238" cy="70" r="13" fill="#0d7a5a"/></svg>';

  /* ---------------- 스타일 ---------------- */
  var css = [
    'body.gp{--gv:#7a4dff;--gv2:#9d7bff;--gvl:rgba(124,77,255,.55);--gvg:rgba(110,70,255,.45)}',
    /* 기존 상단 바는 숨기고(안의 버튼은 그대로 살아 있어 아이콘 메뉴가 대신 눌러 줌) 새 아이콘 바를 씀 */
    'body.gp #bar{display:none!important}',
    'body.gp #topzone,body.gp #fab{display:none!important}',
    'body.gp #dl:not(.on){visibility:hidden}',   /* 평소엔 화면 아래로 살짝 삐져나오던 안내창을 숨김 */
    /* ===== 상단 아이콘 바 ===== */
    '#gtop{display:none}',
    'body.gp #gtop{display:flex;position:relative;z-index:42;flex:none;align-items:stretch;gap:8px;padding:8px;background:linear-gradient(180deg,#0b0830,#06051a);border-bottom:1px solid rgba(124,77,255,.35)}',
    '.gt-name{flex:1;min-width:0;display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 9px;box-sizing:border-box;border:1px solid var(--gvl);border-radius:14px;background:linear-gradient(180deg,#171050,#0c0834);box-shadow:0 0 14px rgba(110,70,255,.3),inset 0 0 12px rgba(110,70,255,.16)}',
    '.gt-badge{flex:none;width:32px;height:19px;background:' + BADGE + ' center/contain no-repeat}',
    '.gt-title{min-width:0;font:600 12.5px/1.15 system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;color:#f1eeff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;letter-spacing:0}',
    '.gt-ics{flex:none;display:flex;height:42px;box-sizing:border-box;border:1px solid var(--gvl);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,#171050,#0c0834);box-shadow:0 0 14px rgba(110,70,255,.3),inset 0 0 12px rgba(110,70,255,.16)}',
    '.gt-ic{position:relative;flex:none;width:38px;height:100%;padding:0;margin:0;border:0;border-radius:0;background:transparent;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-appearance:none;appearance:none;transition:background .15s,opacity .15s}',
    '.gt-ic svg{width:22px;height:22px;display:block;fill:currentColor;stroke:none}',
    '.gt-ic svg.s{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.gt-ic:active{background:rgba(255,255,255,.14)}',
    '.gt-ic.on{background:linear-gradient(180deg,rgba(150,115,255,.34),rgba(110,70,255,.12))}',
    '.gt-ic.on::after{content:"";position:absolute;left:16%;right:16%;bottom:0;height:2px;border-radius:2px;background:var(--gv2);box-shadow:0 0 8px var(--gv)}',
    '.gt-ic.dim svg{opacity:.5}',
    '.gt-ic.live::before{content:"";position:absolute;top:7px;right:7px;width:8px;height:8px;border-radius:50%;background:#35e06a;box-shadow:0 0 6px #35e06a}',
    '@media (orientation:landscape) and (max-height:520px){body.gp #gtop{padding:4px 8px}.gt-name,.gt-ics{height:34px}.gt-ic{width:36px}.gt-ic svg{width:20px;height:20px}}',
    /* ===== 보조메뉴 ===== */
    '#gscrim{display:none;position:absolute;inset:0;z-index:35;background:rgba(2,2,12,.3);touch-action:none}',
    '#gscrim.on{display:block}',
    '#gmenu{display:none;position:absolute;z-index:43;min-width:180px;max-width:calc(100% - 16px);box-sizing:border-box;padding:6px;border-radius:16px;background:rgba(14,10,44,.97);border:1px solid var(--gvl);box-shadow:0 14px 36px rgba(0,0,0,.65),0 0 18px rgba(110,70,255,.35);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}',
    '#gmenu.on{display:block;animation:gmin .16s ease-out}',
    '@keyframes gmin{from{opacity:0;transform:translateY(-6px)}}',
    '#gmenu::before{content:"";position:absolute;top:-6px;left:var(--cx,24px);width:10px;height:10px;transform:rotate(45deg);background:#0e0a2c;border-left:1px solid var(--gvl);border-top:1px solid var(--gvl)}',
    '#gmenu button{position:relative;display:flex;align-items:center;justify-content:space-between;gap:14px;width:100%;min-height:46px;margin:0;padding:0 14px;border:0;border-radius:11px;background:none;color:#f1eeff;font:500 15px system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;letter-spacing:0;text-align:left;cursor:pointer;-webkit-appearance:none;appearance:none}',
    '#gmenu button+button{margin-top:2px}',
    '#gmenu button:active{background:rgba(124,77,255,.3)}',
    '#gmenu button.off{opacity:.38}',
    '#gmenu button.danger{color:#ff8da1}',
    '#gmenu .s{flex:none;font-size:11.5px;color:#cdbfff;background:rgba(124,77,255,.22);padding:2px 9px;border-radius:99px}',
    /* ===== 게임을 불러오기 전 안내 화면 ===== */
    'body.gp #drop{background:radial-gradient(ellipse at 50% 108%,rgba(70,40,190,.4),transparent 55%),radial-gradient(ellipse at 50% -8%,rgba(70,40,190,.22),transparent 50%),#05050f!important;padding:0!important;gap:0!important}',
    'body.gp #drop>.big,body.gp #drop>h2,body.gp #drop>p,body.gp #drop>#dBtn{display:none!important}',
    'body.gp #drop::before{content:"";position:absolute;inset:8px;border-radius:16px;border:1.5px solid #5b3df0;box-shadow:0 0 14px rgba(110,70,255,.55),inset 0 0 22px rgba(110,70,255,.2);pointer-events:none}',
    'body.gp #drop::after{content:"";position:absolute;inset:8px;border-radius:16px;pointer-events:none;background:linear-gradient(135deg,rgba(130,100,255,.3) 0,transparent 20%),linear-gradient(315deg,rgba(130,100,255,.3) 0,transparent 20%)}',
    '.gd{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;width:100%;max-height:100%;overflow:hidden;box-sizing:border-box;padding:26px 22px;text-align:center;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif}',
    '.gd-pad{width:min(72vw,270px);height:auto;flex:none;filter:drop-shadow(0 0 9px rgba(120,90,255,.7))}',
    '.gd-col{display:flex;flex-direction:column;align-items:center;gap:16px;min-width:0}',
    '.gd-msg{color:#fff;font-size:15px;line-height:1.75;letter-spacing:0;word-break:keep-all}',
    '.gd-msg b{color:#b58cff;font-weight:600}',
    '.gd-ext{display:inline-block;max-width:100%;padding:8px 20px;box-sizing:border-box;border:1.5px solid #3c3a80;border-radius:99px;background:rgba(14,12,44,.7);color:#d4d6ff;font-size:14px;letter-spacing:0;word-break:break-all}',
    '.gd-ext b{color:#8f62ff;font-weight:700}',
    '.gd-hint{max-width:300px;margin:-4px 0 0;color:#8f8fc4;font-size:12px;line-height:1.65;white-space:pre-line;word-break:keep-all}',
    '.gd-btn{display:flex;align-items:center;justify-content:center;gap:12px;width:min(78vw,290px);height:62px;margin:2px 0 0;padding:0 18px;box-sizing:border-box;border:1.5px solid #8b5cff;border-radius:20px;background:linear-gradient(180deg,#2c1c80,#150a42);color:#fff;font:600 18px system-ui,-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;letter-spacing:0;cursor:pointer;-webkit-appearance:none;appearance:none;box-shadow:0 0 18px rgba(124,77,255,.55),inset 0 0 14px rgba(124,77,255,.35);transition:transform .12s,filter .15s}',
    '.gd-btn:active{transform:scale(.97);filter:brightness(1.25)}',
    '.gd-btn svg{flex:none;width:34px;height:34px;fill:#fff}',
    '.gd-btn svg.s{width:18px;height:18px;fill:none;stroke:#fff;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}',
    '@media (orientation:landscape) and (max-height:520px){.gd{flex-direction:row;gap:26px;padding:14px 26px}.gd-pad{width:min(38vw,230px)}.gd-col{gap:9px}.gd-msg{font-size:13px;line-height:1.6}.gd-ext{padding:5px 16px;font-size:12.5px}.gd-btn{width:min(46vw,250px);height:48px;font-size:16px}.gd-btn svg{width:28px;height:28px}.gd-hint{font-size:11px;max-width:none}}',
    /* ===== 하단 패드 ===== */
    '#gpad{--ph:clamp(215px,36vh,340px);--ps:min(42vw,calc(var(--ph) - 66px));display:none;position:relative;flex:none;height:var(--ph);box-sizing:border-box;background:linear-gradient(180deg,#0d0a24,#09071a 60%,#06050f);border-top:1px solid #5b3df0;box-shadow:0 -1px 18px rgba(110,70,255,.45),inset 0 1px 0 rgba(170,140,255,.25);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    'body.gp.gp-on #gpad{display:block}',
    '#gpad *{-webkit-tap-highlight-color:transparent}',
    '.gp-plate{position:absolute;bottom:14px;width:var(--ps);height:var(--ps);border-radius:50%;background:radial-gradient(circle at 50% 40%,#1d1650,#100c30 70%);border:2px solid #6a45f0;box-shadow:0 0 14px rgba(110,70,255,.45),inset 0 0 18px rgba(0,0,0,.6);touch-action:none}',
    '.gp-pl{left:5%}.gp-pr{right:5%}',
    /* 십자키 */
    '.gp-cross{position:absolute;inset:14%}',
    '.gp-cross{filter:drop-shadow(0 3px 4px rgba(0,0,0,.8))}',
    '.gp-cx{position:absolute;inset:0;background:linear-gradient(160deg,#3d414b,#22252c 70%);clip-path:polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)}',
    '.gp-cross u{position:absolute;left:41%;top:41%;width:18%;height:18%;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a4e58,#1b1d23)}',
    '.gp-a{position:absolute;width:0;height:0;border:solid transparent;opacity:.35}',
    '.gp-au{left:42%;top:6%;border-width:0 8% 12% 8%;border-bottom-color:#a9a4c8}',
    '.gp-ad{left:42%;bottom:6%;border-width:12% 8% 0 8%;border-top-color:#a9a4c8}',
    '.gp-al{top:42%;left:6%;border-width:8% 12% 8% 0;border-right-color:#a9a4c8}',
    '.gp-ar{top:42%;right:6%;border-width:8% 0 8% 12%;border-left-color:#a9a4c8}',
    '.gp-a.on{opacity:1;filter:drop-shadow(0 0 4px #a98bff)}',
    /* 아날로그 스틱 */
    '.gp-stick{position:absolute;inset:16%;border-radius:50%;background:radial-gradient(circle at 50% 50%,#10142a,#1a2040);box-shadow:inset 0 0 14px #000}',
    '.gp-nub{position:absolute;left:50%;top:50%;width:46%;height:46%;margin:-23% 0 0 -23%;border-radius:50%;background:radial-gradient(circle at 38% 32%,#6a7088,#2a2e3e 70%);box-shadow:0 4px 8px rgba(0,0,0,.6),inset 0 2px 3px rgba(255,255,255,.25)}',
    /* 얼굴 버튼 */
    '.gp-b{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.55);box-shadow:0 4px 8px rgba(0,0,0,.55),inset 0 2px 3px rgba(255,255,255,.35),inset 0 -3px 5px rgba(0,0,0,.3);pointer-events:none;transition:transform .05s,filter .05s}',
    '.gp-b.on,.gp-pill.on{transform:scale(.9);filter:brightness(1.35)}',
    /* 어깨·가운데 버튼 */
    '.gp-sh{position:absolute;top:8px;display:flex;gap:6px}.gp-shl{left:5%}.gp-shr{right:5%}',
    '.gp-mid{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:8px}',
    '.gp-pill{height:34px;min-width:56px;padding:0 12px;box-sizing:border-box;border-radius:17px;background:linear-gradient(#2f2768,#1b1546);border:1px solid #5a47b8;color:#ded6ff;font:700 12px system-ui,-apple-system,"Noto Sans KR",sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none;box-shadow:0 2px 6px rgba(0,0,0,.5)}',
    '.gp-tight .gp-pill{min-width:40px;padding:0 8px;font-size:10.5px}',
    /* 가로 화면·전체화면: 게임 화면 위에 반투명하게 겹침 */
    '@media (orientation:landscape){body.gp #gpad{position:absolute;left:0;right:0;top:0;bottom:0;height:auto;background:none;border:0;box-shadow:none;pointer-events:none;z-index:6;--ps:min(42vh,26vw)}',
    'body.gp #gpad .gp-plate{bottom:6%;opacity:.88;pointer-events:auto}body.gp #gpad .gp-pl{left:3%}body.gp #gpad .gp-pr{right:3%}',
    'body.gp #gpad .gp-pill{pointer-events:auto;opacity:.88}body.gp #gpad .gp-sh,body.gp #gpad .gp-mid{top:auto;bottom:6%}body.gp #gpad .gp-sh{bottom:calc(6% + var(--ps) + 10px)}',
    'body.gp #gpad .gp-mid{bottom:8%}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'gpStyle'; st.textContent = css; document.head.appendChild(st);

  /* ---------------- 작은 도우미 ---------------- */
  function note(m) { try { if (typeof toast === 'function') toast(m); } catch (x) {} }
  function getCur() { try { return (typeof cur !== 'undefined') ? cur : null; } catch (x) { return null; } }
  function getFile() { try { return (typeof lastFile !== 'undefined') ? lastFile : null; } catch (x) { return null; } }
  function frWin() { try { return fr.contentWindow; } catch (x) { return null; } }
  function frDoc() { try { return fr.contentDocument; } catch (x) { return null; } }
  function running() { return emu.classList.contains('show') && (!drop || drop.classList.contains('hidden')); }
  function clickBtn(id) { var b = document.getElementById(id); if (b) b.click(); return b; }

  /* ---------------- 에뮬레이터 입력 ---------------- */
  function emuGM() { try { var w = fr.contentWindow, e = w && w.EJS_emulator; return e && e.gameManager || null; } catch (x) { return null; } }
  function sim(idx, val) {
    var gm = emuGM(); if (!gm) return;
    var t = (typeof gm.simulateInput === 'function') ? gm : gm.functions;
    try { t.simulateInput(0, idx, val); } catch (x) {}
  }
  var down = {};
  function press(s) { var k = s.i; down[k] = (down[k] || 0) + 1; if (down[k] === 1) sim(s.i, s.v || 1); }
  function release(s) { var k = s.i; if (!down[k]) return; down[k]--; if (down[k] === 0) sim(s.i, 0); }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(6); } catch (x) {} }

  /* ---------------- 게임(롬) 종류별 버튼 구성 ---------------- */
  var COL = { red: '#e5352b', blue: '#2f6cf0', green: '#35b34a', yellow: '#f2b01e', pink: '#e0629a', gray: '#59607a', purple: '#7a5bd6', mag: '#c0306e', navy: '#3b4a8c', orange: '#f08a24' };
  function B(t, i, c, x, y, d, v) { return { t: t, i: i, c: c, x: x, y: y, d: d || 34, v: v }; }
  function dia(T, L, R, Bt, d) { return [B(T[0], T[1], T[2], 50, 17, d), B(L[0], L[1], L[2], 17, 50, d), B(R[0], R[1], R[2], 83, 50, d), B(Bt[0], Bt[1], Bt[2], 50, 83, d)]; }
  function two(b, a, cb, ca) { return [B(b[0], b[1], cb, 30, 62, 40), B(a[0], a[1], ca, 70, 40, 40)]; }
  var SS = [['SELECT', 2], ['START', 3]];
  var SP = {
    snes: { dp: 1, f: dia(['X', 9, 'blue'], ['Y', 1, 'green'], ['A', 8, 'red'], ['B', 0, 'yellow']), l: [['L', 10]], r: [['R', 11]], m: SS },
    nes: { dp: 1, f: two(['B', 0], ['A', 8], 'red', 'red'), m: SS },
    gb: { dp: 1, f: two(['B', 0], ['A', 8], 'mag', 'mag'), m: SS },
    gba: { dp: 1, f: two(['B', 0], ['A', 8], 'purple', 'purple'), l: [['L', 10]], r: [['R', 11]], m: SS },
    md: { dp: 1, f: [B('X', 10, 'gray', 20, 32, 28), B('Y', 9, 'gray', 50, 32, 28), B('Z', 11, 'gray', 80, 32, 28), B('A', 1, 'navy', 20, 68, 28), B('B', 0, 'navy', 50, 68, 28), B('C', 8, 'navy', 80, 68, 28)], m: [['MODE', 2], ['START', 3]] },
    sms: { dp: 1, f: two(['1', 0], ['2', 8], 'gray', 'navy'), m: [['START', 3]] },
    pce: { dp: 1, f: two(['II', 0], ['I', 8], 'blue', 'red'), m: [['SELECT', 2], ['RUN', 3]] },
    psx: { dp: 1, f: dia(['▲', 9, 'green'], ['■', 1, 'pink'], ['●', 8, 'red'], ['✕', 0, 'blue']), l: [['L2', 12], ['L1', 10]], r: [['R1', 11], ['R2', 13]], m: SS },
    psp: { dp: 1, f: dia(['▲', 9, 'green'], ['■', 1, 'pink'], ['●', 8, 'red'], ['✕', 0, 'blue']), l: [['L', 10]], r: [['R', 11]], m: SS },
    n64: { stick: 1, f: [B('A', 0, 'blue', 66, 74, 32), B('B', 1, 'green', 34, 62, 30),
      B('C▲', 23, 'yellow', 72, 11, 20, 32767), B('C▼', 22, 'yellow', 72, 45, 20, 32767), B('C◀︎', 21, 'yellow', 55, 28, 20, 32767), B('C▶︎', 20, 'yellow', 89, 28, 20, 32767)],
      l: [['Z', 12], ['L', 10]], r: [['R', 11]], m: [['START', 3]] },
    nds: { dp: 1, f: dia(['X', 9, 'gray'], ['Y', 1, 'gray'], ['A', 8, 'gray'], ['B', 0, 'gray']), l: [['L', 10]], r: [['R', 11]], m: SS },
    atari: { dp: 1, f: [B('FIRE', 0, 'red', 50, 50, 54)], m: [['SELECT', 2], ['RESET', 3]] },
    neo: { dp: 1, f: [B('A', 0, 'red', 20, 72, 26), B('B', 8, 'yellow', 42, 56, 26), B('C', 1, 'green', 64, 40, 26), B('D', 9, 'blue', 86, 24, 26)], m: [['COIN', 2], ['START', 3]] },
    arc: { dp: 1, f: [B('Y', 1, 'blue', 20, 32, 28), B('X', 9, 'blue', 50, 32, 28), B('L', 10, 'blue', 80, 32, 28), B('B', 0, 'red', 20, 68, 28), B('A', 8, 'red', 50, 68, 28), B('R', 11, 'red', 80, 68, 28)], m: [['COIN', 2], ['START', 3]] },
    gen: { dp: 1, f: dia(['X', 9, 'blue'], ['Y', 1, 'green'], ['A', 8, 'red'], ['B', 0, 'yellow']), l: [['L', 10]], r: [['R', 11]], m: SS }
  };
  var NAMES = { snes: '슈퍼패미컴', nes: '패미컴', gb: '게임보이', gba: 'GBA', md: '메가드라이브', sms: '마스터시스템', pce: 'PC엔진', psx: '플레이스테이션', psp: 'PSP', n64: '닌텐도64', nds: '닌텐도DS', atari: '아타리', neo: '네오지오', arc: '아케이드', gen: '기본' };
  var EXT = { sfc: 'snes', smc: 'snes', fig: 'snes', swc: 'snes', nes: 'nes', fds: 'nes', unf: 'nes', gb: 'gb', gbc: 'gb', gba: 'gba', nds: 'nds', z64: 'n64', n64: 'n64', v64: 'n64', md: 'md', gen: 'md', smd: 'md', sms: 'sms', gg: 'sms', pce: 'pce', sgx: 'pce', a26: 'atari', cue: 'psx', pbp: 'psx', chd: 'psx', iso: 'psx', ngp: 'gen', ngc: 'gen', ws: 'gen', wsc: 'gen', lnx: 'gen', vb: 'gen' };
  function detect() {
    var c = getCur(), f = getFile();
    var name = f && f.name ? String(f.name).toLowerCase() : '', m = name.match(/\.([a-z0-9]+)$/), ext = m ? m[1] : '';
    if (EXT[ext] && SP[EXT[ext]]) return EXT[ext];                       /* 롬 파일 확장자로 먼저 인식 */
    var s = c ? ((c.id || '') + ' ' + (c.core || '') + ' ' + (c.n || '') + ' ' + (c.fn || '')).toLowerCase() : '';
    var rules = [
      ['n64', /n64|nintendo ?64|mupen|parallel/], ['nds', /\bnds\b|desmume|melonds|nintendo ?ds/], ['psp', /psp|ppsspp/],
      ['psx', /psx|playstation|pcsx|mednafen_psx|플레이스테이션/], ['gba', /gba|mgba|vba|advance/], ['snes', /snes|sfc|super ?famicom|super ?nintendo|슈퍼/],
      ['nes', /\bnes\b|famicom|fceumm|nestopia|quicknes|패미컴/], ['gb', /\bgbc?\b|gambatte|game ?boy|게임보이/], ['neo', /neo ?geo|neogeo|네오지오/],
      ['md', /genesis|mega ?drive|sega ?md|segamd|picodrive|gearsystem.*md|메가|제네시스|segacd|32x/], ['sms', /master ?system|sms|game ?gear|\bgg\b|segams|seggagg/],
      ['pce', /pce|pc ?engine|turbo ?graf|엔진/], ['atari', /atari|stella|2600|7800/], ['arc', /mame|arcade|fbneo|fba|아케이드|마메/]
    ];
    for (var i = 0; i < rules.length; i++) if (rules[i][1].test(s)) return rules[i][0];
    return 'gen';
  }

  /* ---------------- 하단 패드 만들기 ---------------- */
  var pad = document.createElement('div'); pad.id = 'gpad'; pad.setAttribute('aria-label', '조작 패드');
  emu.appendChild(pad);
  pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  var zones = [], curKey = '';

  function bindZone(zone, els) {
    var ptr = {};
    function hit(x, y) {
      var out = [];
      els.forEach(function (b) { var r = b.getBoundingClientRect(), p = 4; if (x >= r.left - p && x <= r.right + p && y >= r.top - p && y <= r.bottom + p) out.push(b); });
      if (out.length > 1) {
        var best = null, bd = 1e9;
        out.forEach(function (b) { var r = b.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = b; } });
        return [best];
      }
      return out;
    }
    function set(id, list) {
      var old = ptr[id] || [];
      old.forEach(function (b) { if (list.indexOf(b) < 0) { b.classList.remove('on'); release(b._s); } });
      list.forEach(function (b) { if (old.indexOf(b) < 0) { b.classList.add('on'); press(b._s); buzz(); } });
      ptr[id] = list;
    }
    zone.addEventListener('pointerdown', function (e) { e.preventDefault(); try { zone.setPointerCapture(e.pointerId); } catch (x) {} set(e.pointerId, hit(e.clientX, e.clientY)); });
    zone.addEventListener('pointermove', function (e) { if (ptr[e.pointerId]) set(e.pointerId, hit(e.clientX, e.clientY)); });
    function up(e) { if (ptr[e.pointerId]) { set(e.pointerId, []); delete ptr[e.pointerId]; } }
    zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up); zone.addEventListener('lostpointercapture', up);
    zones.push(function () { Object.keys(ptr).forEach(function (id) { set(id, []); }); ptr = {}; });
  }

  function bindDpad(zone) {
    var S = { u: { i: 4 }, d: { i: 5 }, l: { i: 6 }, r: { i: 7 } }, A = { u: zone.querySelector('.gp-au'), d: zone.querySelector('.gp-ad'), l: zone.querySelector('.gp-al'), r: zone.querySelector('.gp-ar') };
    var pid = null, cu = { u: 0, d: 0, l: 0, r: 0 };
    function apply(n) {
      ['u', 'd', 'l', 'r'].forEach(function (k) {
        if (n[k] && !cu[k]) { press(S[k]); A[k].classList.add('on'); buzz(); }
        if (!n[k] && cu[k]) { release(S[k]); A[k].classList.remove('on'); }
      });
      cu = n;
    }
    function calc(e) {
      var r = zone.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.hypot(dx, dy);
      if (m < r.width * 0.1) return { u: 0, d: 0, l: 0, r: 0 };
      var nx = dx / m, ny = dy / m;
      return { u: ny < -0.38 ? 1 : 0, d: ny > 0.38 ? 1 : 0, l: nx < -0.38 ? 1 : 0, r: nx > 0.38 ? 1 : 0 };
    }
    zone.addEventListener('pointerdown', function (e) { if (pid !== null) return; e.preventDefault(); pid = e.pointerId; try { zone.setPointerCapture(pid); } catch (x) {} apply(calc(e)); });
    zone.addEventListener('pointermove', function (e) { if (e.pointerId === pid) apply(calc(e)); });
    function up(e) { if (e.pointerId === pid) { pid = null; apply({ u: 0, d: 0, l: 0, r: 0 }); } }
    zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up); zone.addEventListener('lostpointercapture', up);
    zones.push(function () { pid = null; apply({ u: 0, d: 0, l: 0, r: 0 }); });
  }

  function bindStick(zone, nub) {
    var pid = null, last = [0, 0, 0, 0];
    function out(v) { for (var k = 0; k < 4; k++) if (v[k] !== last[k]) { sim(16 + k, v[k]); last[k] = v[k]; } }
    function calc(e) {
      var r = zone.getBoundingClientRect(), R = r.width * 0.34, dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), m = Math.hypot(dx, dy);
      var k = m > R ? R / m : 1; dx *= k; dy *= k; m = Math.min(m, R);
      nub.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      var mag = m / R; if (mag < 0.14) { out([0, 0, 0, 0]); return; }
      var nx = dx / R, ny = dy / R, q = function (v) { return Math.round(Math.abs(v) * 32) * 1000; };   /* 16 → 오른쪽, 17 → 왼쪽, 18 → 아래, 19 → 위 */
      out([nx > 0 ? q(nx) : 0, nx < 0 ? q(nx) : 0, ny > 0 ? q(ny) : 0, ny < 0 ? q(ny) : 0]);
    }
    function stop() { nub.style.transform = ''; out([0, 0, 0, 0]); }
    zone.addEventListener('pointerdown', function (e) { if (pid !== null) return; e.preventDefault(); pid = e.pointerId; try { zone.setPointerCapture(pid); } catch (x) {} calc(e); });
    zone.addEventListener('pointermove', function (e) { if (e.pointerId === pid) calc(e); });
    function up(e) { if (e.pointerId === pid) { pid = null; stop(); } }
    zone.addEventListener('pointerup', up); zone.addEventListener('pointercancel', up); zone.addEventListener('lostpointercapture', up);
    zones.push(function () { pid = null; stop(); });
  }

  function mkPills(list) {
    var f = document.createDocumentFragment();
    list.forEach(function (p) {
      var el = document.createElement('div'); el.className = 'gp-pill'; el.textContent = p[0]; el._s = { i: p[1] };
      bindZone(el, [el]); f.appendChild(el);
    });
    return f;
  }

  function resetAll() {
    zones.forEach(function (z) { try { z(); } catch (x) {} });
    Object.keys(down).forEach(function (k) { if (down[k]) sim(+k, 0); }); down = {};
  }

  function build(key) {
    resetAll(); zones = []; pad.innerHTML = '';
    var sp = SP[key] || SP.gen; curKey = key;
    pad.setAttribute('data-sys', key); pad.title = NAMES[key] || '';
    pad.classList.toggle('gp-tight', ((sp.l || []).length > 1 || (sp.r || []).length > 1));
    /* 어깨 버튼 */
    if (sp.l) { var sl = document.createElement('div'); sl.className = 'gp-sh gp-shl'; sl.appendChild(mkPills(sp.l)); pad.appendChild(sl); }
    if (sp.r) { var sr = document.createElement('div'); sr.className = 'gp-sh gp-shr'; sr.appendChild(mkPills(sp.r)); pad.appendChild(sr); }
    if (sp.m) { var mid = document.createElement('div'); mid.className = 'gp-mid'; mid.appendChild(mkPills(sp.m)); pad.appendChild(mid); }
    /* 왼쪽: 십자키 / 아날로그 스틱 */
    var pl = document.createElement('div'); pl.className = 'gp-plate gp-pl';
    if (sp.stick) {
      pl.innerHTML = '<div class="gp-stick"><i class="gp-nub"></i></div>'; pad.appendChild(pl); bindStick(pl, pl.querySelector('.gp-nub'));
    } else {
      pl.innerHTML = '<div class="gp-cross"><i class="gp-cx"></i><b class="gp-a gp-au"></b><b class="gp-a gp-ad"></b><b class="gp-a gp-al"></b><b class="gp-a gp-ar"></b><u></u></div>';
      pad.appendChild(pl); bindDpad(pl);
    }
    /* 오른쪽: 얼굴 버튼 */
    var pr = document.createElement('div'); pr.className = 'gp-plate gp-pr';
    var els = [];
    sp.f.forEach(function (b) {
      var el = document.createElement('div'); el.className = 'gp-b'; el.textContent = b.t; el._s = { i: b.i, v: b.v };
      var col = COL[b.c] || b.c;
      el.style.cssText = 'left:' + (b.x - b.d / 2) + '%;top:' + (b.y - b.d / 2) + '%;width:' + b.d + '%;height:' + b.d + '%;background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.55),' + col + ' 45%,rgba(0,0,0,.35) 135%),' + col + ';font-size:calc(var(--ps)*' + (b.d * (b.t.length > 2 ? 0.0042 : b.t.length > 1 ? 0.0056 : 0.0072)).toFixed(4) + ')';
      pr.appendChild(el); els.push(el);
    });
    pad.appendChild(pr); bindZone(pr, els);
  }

  /* ---------------- 상단 아이콘 바 ---------------- */
  var gtop = document.createElement('div'); gtop.id = 'gtop';
  gtop.innerHTML =
    '<div class="gt-name"><i class="gt-badge"></i><span class="gt-title" id="gtTitle"></span></div>' +
    '<div class="gt-ics">' +
    '<button type="button" class="gt-ic" data-m="game" aria-label="게임" aria-haspopup="true">' + ICO.game + '</button>' +
    '<button type="button" class="gt-ic" data-m="friend" aria-label="친구와 같이하기" aria-haspopup="true">' + ICO.ppl + '</button>' +
    '<button type="button" class="gt-ic" data-m="btn" aria-label="버튼" aria-haspopup="true">' + ICO.eye + '</button>' +
    '<button type="button" class="gt-ic" data-a="fs" aria-label="전체화면">' + ICO.fs + '</button>' +
    '<button type="button" class="gt-ic" data-a="exit" aria-label="나가기">' + ICO.pw + '</button>' +
    '</div>';
  emu.insertBefore(gtop, stage);
  var gmenu = document.createElement('div'); gmenu.id = 'gmenu'; gmenu.setAttribute('role', 'menu');
  var gscrim = document.createElement('div'); gscrim.id = 'gscrim';
  emu.appendChild(gscrim); emu.appendChild(gmenu);
  var gTitle = $('#gtTitle');
  function setTitle() { var c = getCur(); gTitle.textContent = c ? c.n : (($('#eTitle') || {}).textContent || ''); }
  try { new MutationObserver(setTitle).observe($('#eTitle'), { childList: true, characterData: true, subtree: true }); } catch (x) {}
  setTitle();

  /* ---------------- 상태: 버튼 숨김 · 외부 기기 ---------------- */
  var padHidden = false;       /* 내가 '게임버튼 숨기기'를 누름 */
  var extHidden = false;       /* 블루투스 컨트롤러(게임패드)가 연결되어 자동 숨김 */
  var kbHidden = false;        /* 키보드가 감지되어 자동 숨김 (게임 화면을 터치하면 다시 표시) */
  var inBar = false;           /* 화면속 버튼(에뮬레이터 자체 메뉴바) 표시 여부 — 기본은 숨김 */
  var extN = 0;
  function padOn() { return !padHidden && !extHidden && !kbHidden; }

  function toggleGamePad() {
    if (extHidden || kbHidden) {                       /* 자동으로 숨겨진 상태에서 누르면 → 표시 */
      extHidden = false; kbHidden = false; padHidden = false; note('게임버튼을 표시합니다');
    } else {
      padHidden = !padHidden; note(padHidden ? '게임버튼을 숨겼어요' : '게임버튼을 표시합니다');
    }
    if (!padOn()) resetAll();
    sync();
  }
  function toggleInBar() {
    inBar = !inBar; note(inBar ? '화면속 버튼을 표시합니다' : '화면속 버튼을 숨겼어요');
    sync();
  }

  /* 게임패드(블루투스 컨트롤러 등) 개수 — 이 페이지와 게임 화면(iframe) 양쪽에서 확인 */
  function padCount() {
    var n = 0, ws = [window, frWin()];
    ws.forEach(function (w) {
      try {
        var g = w && w.navigator && w.navigator.getGamepads ? w.navigator.getGamepads() : null, c = 0;
        if (g) for (var i = 0; i < g.length; i++) if (g[i] && g[i].connected) c++;
        if (c > n) n = c;
      } catch (x) {}
    });
    return n;
  }
  function checkExt() {
    var n = padCount();
    if (n > 0 && extN === 0) {
      extN = n; extHidden = true;
      if (running()) note('🎮 컨트롤러가 연결되어 화면 버튼을 숨겼어요');
    } else if (n === 0 && extN > 0) {
      extN = 0; extHidden = false;
      if (running()) note('컨트롤러 연결이 끊겨 화면 버튼을 다시 표시합니다');
    } else extN = n;
  }
  function onKey(e) {
    if (!e.isTrusted || e.isComposing || e.keyCode === 229 || e.key === 'Unidentified') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '')) return;
    if (!running() || kbHidden || extHidden) return;
    kbHidden = true; resetAll(); sync();
    note('⌨ 키보드가 연결되어 화면 버튼을 숨겼어요 (화면을 터치하면 다시 나타나요)');
  }
  function onTouch(e) {
    if (!kbHidden || extN > 0) return;
    if (e.pointerType && e.pointerType !== 'touch') return;
    kbHidden = false; sync();
  }
  /* 게임 화면(iframe)은 새로 만들어질 때마다 다시 연결 */
  function hookFrame() {
    var w = frWin(); if (!w || w.__gpHook) return;
    try {
      w.__gpHook = 1;
      w.addEventListener('keydown', onKey, true);
      w.addEventListener('pointerdown', onTouch, true);
      w.addEventListener('gamepadconnected', function () { checkExt(); sync(); });
      w.addEventListener('gamepaddisconnected', function () { setTimeout(function () { checkExt(); sync(); }, 50); });
    } catch (x) {}
  }
  window.addEventListener('keydown', onKey, true);
  window.addEventListener('gamepadconnected', function () { checkExt(); sync(); });
  window.addEventListener('gamepaddisconnected', function () { setTimeout(function () { checkExt(); sync(); }, 50); });

  /* ---------------- 보조메뉴 ---------------- */
  var openM = null, sig = '';
  function netActive() { try { return !!(window.NetPlay && window.NetPlay.active && window.NetPlay.active()); } catch (x) { return false; } }
  function menuItems(name) {
    var bS = $('#bSave'), bR = $('#bRest');
    if (name === 'game') return [
      { t: '게임불러오기', f: function () { clickBtn('bLoad'); } },
      { t: '세이브열기', off: !!(bR && bR.disabled), f: function () { clickBtn('bRest'); } },
      { t: '세이브저장', off: !!(bS && bS.disabled), f: function () { clickBtn('bSave'); } }
    ];
    if (name === 'friend') {
      var a = [
        { t: '게임방만들기', f: function () { if (window.NetPlay) window.NetPlay.createRoom(); else note('같이하기 기능을 불러오지 못했어요'); } },
        { t: '게임코드입력', f: function () { if (window.NetPlay) window.NetPlay.joinRoom(); else note('같이하기 기능을 불러오지 못했어요'); } }
      ];
      if (netActive()) a.push({ t: '방닫기', danger: 1, f: function () { if (window.NetPlay && window.NetPlay.closeRoom()) note('같이 하기를 끝냈어요'); } });
      return a;
    }
    var gh = !padOn();
    return [
      { t: '게임버튼 ' + (gh ? '표시' : '숨기기'), s: gh ? '숨김' : '표시중', f: toggleGamePad },
      { t: '화면속 버튼 ' + (inBar ? '숨기기' : '표시'), s: inBar ? '표시중' : '숨김', f: toggleInBar }
    ];
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function renderMenu() {
    if (!openM) return;
    var list = menuItems(openM);
    sig = openM + '|' + list.map(function (x) { return x.t + (x.off ? '!' : '') + (x.s || ''); }).join('|');
    gmenu.innerHTML = list.map(function (x, i) {
      return '<button type="button" role="menuitem" data-i="' + i + '" class="' + (x.off ? 'off ' : '') + (x.danger ? 'danger' : '') + '"><span>' + esc(x.t) + '</span>' + (x.s ? '<span class="s">' + esc(x.s) + '</span>' : '') + '</button>';
    }).join('');
    gmenu._items = list;
    placeMenu();
  }
  function placeMenu() {
    var b = gtop.querySelector('[data-m="' + openM + '"]'); if (!b) return;
    var er = emu.getBoundingClientRect(), gr = gtop.getBoundingClientRect(), br = b.getBoundingClientRect();
    var w = gmenu.offsetWidth, cx = br.left + br.width / 2 - er.left;
    var left = Math.max(8, Math.min(cx - w / 2, er.width - w - 8));
    gmenu.style.left = left + 'px'; gmenu.style.top = (gr.bottom - er.top - 1) + 'px';
    gmenu.style.setProperty('--cx', Math.max(12, Math.min(cx - left - 5, w - 24)) + 'px');
  }
  function openMenu(name) {
    if (openM === name) { closeMenu(); return; }
    openM = name; gmenu.classList.add('on'); gscrim.classList.add('on');
    renderMenu(); markIcons();
  }
  function closeMenu() {
    if (!openM) return;
    openM = null; gmenu.classList.remove('on'); gscrim.classList.remove('on'); markIcons();
  }
  function markIcons() {
    gtop.querySelectorAll('[data-m]').forEach(function (b) { b.classList.toggle('on', b.dataset.m === openM); });
  }

  gtop.addEventListener('click', function (e) {
    var b = e.target.closest('.gt-ic'); if (!b) return;
    if (b.dataset.m) { openMenu(b.dataset.m); return; }
    closeMenu();
    if (b.dataset.a === 'fs') clickBtn('bFs');
    else if (b.dataset.a === 'exit') { try { if (window.NetPlay) window.NetPlay.closeRoom(); } catch (x) {} clickBtn('bHome'); }
  });
  gmenu.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var it = (gmenu._items || [])[+b.dataset.i]; if (!it) return;
    if (it.off) { note('게임을 먼저 실행해 주세요'); return; }
    closeMenu();
    try { it.f(); } catch (x) {}
    setTimeout(sync, 0);
  });
  gscrim.addEventListener('pointerdown', function (e) { e.preventDefault(); closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { setTimeout(placeMenu, 80); });
  window.addEventListener('orientationchange', function () { setTimeout(placeMenu, 200); });

  /* ---------------- 게임을 불러오기 전 안내 화면 ---------------- */
  var gd = document.createElement('div'); gd.className = 'gd';
  gd.innerHTML = PADSVG +
    '<div class="gd-col">' +
    '<div class="gd-msg"><span id="gdName"></span>의 게임을 하시려면<br>파일 관리자를 통해 다운로드한 <b>롬 파일</b>을<br>불러와야 합니다.</div>' +
    '<div class="gd-ext">확장자 : <b id="gdExt"></b></div>' +
    '<div class="gd-hint" id="gdHint"></div>' +
    '<button type="button" class="gd-btn" id="gdBtn">' + ICO.game + '<span>게임불러오기</span>' + ICO.chev + '</button>' +
    '</div>';
  if (drop) drop.appendChild(gd);
  function renderDrop() {
    var c = getCur(); if (!c) return;
    $('#gdName').textContent = c.n;
    $('#gdExt').textContent = String(c.x || '').split(/\s+/).filter(Boolean).join(', ');
    var h = [];
    try { if (typeof MG !== 'undefined' && MG.is(c) && MG.hint) h.push(MG.hint); } catch (x) {}
    if (c.hint) h.push(c.hint);
    var he = $('#gdHint'); he.textContent = h.join('\n'); he.style.display = h.length ? '' : 'none';
  }
  $('#gdBtn').addEventListener('click', function () { clickBtn('dBtn'); });
  try { new MutationObserver(renderDrop).observe($('#dName'), { childList: true, characterData: true, subtree: true }); } catch (x) {}
  renderDrop();

  /* ---------------- 상태 감시 ---------------- */
  var wasOn = false, seenCur = null, seenFile = null;
  function nudge() { [80, 400].forEach(function (t) { setTimeout(function () { try { fr.contentWindow.dispatchEvent(new Event('resize')); } catch (x) {} }, t); }); }
  var STY = '.ejs_virtualGamepad_parent,.ejs_virtualGamepad_open,.ejs_virtualGamepad_button{display:none!important}body.gpnobar .ejs_menu_bar{display:none!important}';

  function sync() {
    try {
      var c = getCur(), f = getFile();
      if (c !== seenCur || f !== seenFile) { seenCur = c; seenFile = f; padHidden = false; inBar = false; }   /* 새 기종·새 게임이면 처음 상태로 */
      hookFrame();
      var run = running();
      if (!emu.classList.contains('show')) closeMenu();
      var on = run && padOn();
      if (run) { var k = detect(); if (k !== curKey || !pad.firstChild) build(k); }
      body.classList.toggle('gp-on', on);
      if (on !== wasOn) { wasOn = on; if (!on) resetAll(); nudge(); }
      /* 에뮬레이터 화면 속 가상 버튼은 항상 숨김 · 화면속 메뉴바는 '화면속 버튼' 설정에 따름 */
      if (run) {
        var d = frDoc();
        if (d && d.body) {
          d.body.classList.add('gphide'); d.body.classList.toggle('gpnobar', !inBar);
          if (d.head && !d.getElementById('gpHide')) { var s = d.createElement('style'); s.id = 'gpHide'; s.textContent = STY; d.head.appendChild(s); }
        }
      }
      /* 아이콘 표시 */
      var bi = gtop.querySelector('[data-m="btn"]'); if (bi) bi.classList.toggle('dim', !padOn() || inBar);
      var fi = gtop.querySelector('[data-m="friend"]'); if (fi) fi.classList.toggle('live', netActive());
      /* 열려 있는 메뉴 내용이 바뀌면 다시 그림 (예: 방을 만들면 '방닫기'가 나타남) */
      if (openM) {
        var list = menuItems(openM), s2 = openM + '|' + list.map(function (x) { return x.t + (x.off ? '!' : '') + (x.s || ''); }).join('|');
        if (s2 !== sig) renderMenu();
      }
    } catch (x) {}
  }
  function tick() { checkExt(); sync(); }
  setInterval(tick, 500);
  tick();
  document.addEventListener('visibilitychange', function () { if (document.hidden) resetAll(); });
  window.addEventListener('blur', resetAll);
  window.addEventListener('pagehide', resetAll);
})();
