/* mobilepad.js — 스마트폰 게임 화면 : 상단 아이콘 바 + 하단 조작 패드 (게임/롬 종류에 따라 버튼이 자동으로 바뀜)
   · 폰(화면 짧은 쪽 600px 미만)에서만 동작합니다. PC·태블릿은 그대로입니다.
   · 게임 안쪽(emuhost.html)에 원래 있던 가상 패드는 숨기고, 이 패드가 입력을 에뮬레이터로 직접 보냅니다. */
(function () {
  'use strict';
  function $(s) { return document.querySelector(s); }
  var body = document.body;
  if (!body || !body.classList.contains('mob')) return;
  if (Math.min(screen.width, screen.height) >= 600) return;
  var emu = $('#emu'), bar = $('#bar'), drop = $('#drop'), fr = $('#fr'), bCtl = $('#bCtl');
  if (!emu || !bar || !fr) return;
  body.classList.add('gp');

  /* ---------------- 스타일 ---------------- */
  function ic(inner) { return 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>" + inner + '</svg>') + '")'; }
  var I_PAD = ic("<path fill-rule='evenodd' d='M7 6h10a5 5 0 0 1 4.9 4l1 5.5a3.5 3.5 0 0 1-6.2 2.7L15 16H9l-1.7 2.2a3.5 3.5 0 0 1-6.2-2.7l1-5.5A5 5 0 0 1 7 6zm.5 3v1.5H6V12h1.5v1.5H9V12h1.5v-1.5H9V9zm8.3.6a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2zm2.2 2.2a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z'/>");
  var I_PPL = ic("<circle cx='9' cy='8' r='3.2'/><path d='M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5z'/><circle cx='17' cy='9' r='2.6'/><path d='M16.5 13.7c3 0 5 1.8 5 4.6h-4.2c0-1.9-.5-3.4-.8-4.6z'/>");
  var I_FS = ic("<path d='M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5' fill='none' stroke='black' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'/>");
  var I_EXIT = ic("<path d='M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M16 8l4 4-4 4M20 12H9' fill='none' stroke='black' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'/>");
  var BADGE = 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 36'><rect x='1' y='3' width='58' height='30' rx='15' fill='#d9dbe6'/><path d='M13 12h4v4h4v4h-4v4h-4v-4H9v-4h4z' fill='#2d4fb5'/><circle cx='44' cy='13' r='3' fill='#2d6cf0'/><circle cx='37' cy='19' r='3' fill='#37b34a'/><circle cx='51' cy='19' r='3' fill='#e5352b'/><circle cx='44' cy='25' r='3' fill='#f2b01e'/></svg>") + '")';

  var css = [
    /* 상단 바 */
    'body.gp #bar{gap:0!important;padding:0 8px 0 10px!important;height:60px;min-height:60px;box-sizing:border-box;align-items:center;overflow:visible!important;background:linear-gradient(180deg,#101a3c,#0a1128)!important;border-bottom:1px solid #2c4fd8!important;box-shadow:0 1px 16px rgba(60,100,255,.45)}',
    'body.gp #bar::before{content:"";order:-1;flex:none;width:44px;height:30px;margin-right:10px;background:' + BADGE + ' center/contain no-repeat}',
    'body.gp #bar>*{display:none!important}',
    'body.gp #bar>.t,body.gp #bar>#bCtl,body.gp #bar>#npBtn,body.gp #bar>#bFs,body.gp #bar>#bHome{display:flex!important}',
    'body.gp #bar>.t{order:1;flex:1;min-width:0;align-items:center;font:500 13px/1.2 var(--sans,system-ui,sans-serif)!important;letter-spacing:0!important;color:#e9eeff!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px}',
    'body.gp #bar>button{flex:none;width:38px;height:42px;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:rgba(255,255,255,.08)!important;font-size:0!important;color:#fff!important;align-items:center;justify-content:center;position:relative;transition:background .15s}',
    'body.gp #bar>button:active{background:rgba(255,255,255,.2)!important;transform:none!important}',
    'body.gp #bar>button::before{content:"";width:22px;height:22px;background:#fff;-webkit-mask:var(--ic) center/contain no-repeat;mask:var(--ic) center/contain no-repeat}',
    'body.gp #bar>button:disabled{opacity:.35!important}',
    'body.gp #bar>#bCtl{order:2;--ic:' + I_PAD + ';border-radius:21px 0 0 21px!important;width:42px}',
    'body.gp #bar>#npBtn{order:3;--ic:' + I_PPL + '}',
    'body.gp #bar>#bFs{order:4;--ic:' + I_FS + '}',
    'body.gp #bar>#bHome{order:5;--ic:' + I_EXIT + ';border-radius:0 21px 21px 0!important;width:42px}',
    'body.gp.gp-ctloff #bar>#bCtl{opacity:.55}',
    'body.gp #bar>#npBtn.gp-live::after{content:"";position:absolute;top:7px;right:10px;width:9px;height:9px;border-radius:50%;background:#35e06a;box-shadow:0 0 6px #35e06a}',
    'body.gp #emu.nobar #bar{position:static!important;transform:none!important;visibility:visible!important;pointer-events:auto!important;box-shadow:0 1px 16px rgba(60,100,255,.45)!important}',
    'body.gp #topzone,body.gp #fab{display:none!important}',
    '@media (orientation:landscape) and (max-height:520px){body.gp #bar{height:46px;min-height:46px}body.gp #bar>button{height:34px}body.gp #bar::before{width:40px;height:26px}}',
    /* 하단 패드 */
    '#gpad{--ph:clamp(215px,36vh,340px);--ps:min(42vw,calc(var(--ph) - 66px));display:none;position:relative;flex:none;height:var(--ph);box-sizing:border-box;background:linear-gradient(180deg,#0e1530,#0a0f22 60%,#080b18);border-top:1px solid #2c4fd8;box-shadow:0 -1px 18px rgba(60,100,255,.45),inset 0 1px 0 rgba(120,160,255,.25);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    'body.gp.gp-on #gpad{display:block}',
    '#gpad *{-webkit-tap-highlight-color:transparent}',
    '.gp-plate{position:absolute;bottom:14px;width:var(--ps);height:var(--ps);border-radius:50%;background:radial-gradient(circle at 50% 40%,#1c2548,#0f1630 70%);border:2px solid #3a5ad8;box-shadow:0 0 14px rgba(70,110,255,.45),inset 0 0 18px rgba(0,0,0,.6);touch-action:none}',
    '.gp-pl{left:5%}.gp-pr{right:5%}',
    /* 십자키 */
    '.gp-cross{position:absolute;inset:14%}',
    '.gp-cross{filter:drop-shadow(0 3px 4px rgba(0,0,0,.8))}',
    '.gp-cx{position:absolute;inset:0;background:linear-gradient(160deg,#3d414b,#22252c 70%);clip-path:polygon(34% 0,66% 0,66% 34%,100% 34%,100% 66%,66% 66%,66% 100%,34% 100%,34% 66%,0 66%,0 34%,34% 34%)}',
    '.gp-cross u{position:absolute;left:41%;top:41%;width:18%;height:18%;border-radius:50%;background:radial-gradient(circle at 40% 35%,#4a4e58,#1b1d23)}',
    '.gp-a{position:absolute;width:0;height:0;border:solid transparent;opacity:.35}',
    '.gp-au{left:42%;top:6%;border-width:0 8% 12% 8%;border-bottom-color:#9aa4c8}',
    '.gp-ad{left:42%;bottom:6%;border-width:12% 8% 0 8%;border-top-color:#9aa4c8}',
    '.gp-al{top:42%;left:6%;border-width:8% 12% 8% 0;border-right-color:#9aa4c8}',
    '.gp-ar{top:42%;right:6%;border-width:8% 0 8% 12%;border-left-color:#9aa4c8}',
    '.gp-a.on{opacity:1;filter:drop-shadow(0 0 4px #7aa2ff)}',
    /* 아날로그 스틱 */
    '.gp-stick{position:absolute;inset:16%;border-radius:50%;background:radial-gradient(circle at 50% 50%,#10142a,#1a2040);box-shadow:inset 0 0 14px #000}',
    '.gp-nub{position:absolute;left:50%;top:50%;width:46%;height:46%;margin:-23% 0 0 -23%;border-radius:50%;background:radial-gradient(circle at 38% 32%,#6a7088,#2a2e3e 70%);box-shadow:0 4px 8px rgba(0,0,0,.6),inset 0 2px 3px rgba(255,255,255,.25)}',
    /* 얼굴 버튼 */
    '.gp-b{position:absolute;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-family:system-ui,-apple-system,"Noto Sans KR",sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.55);box-shadow:0 4px 8px rgba(0,0,0,.55),inset 0 2px 3px rgba(255,255,255,.35),inset 0 -3px 5px rgba(0,0,0,.3);pointer-events:none;transition:transform .05s,filter .05s}',
    '.gp-b.on,.gp-pill.on{transform:scale(.9);filter:brightness(1.35)}',
    /* 어깨·가운데 버튼 */
    '.gp-sh{position:absolute;top:8px;display:flex;gap:6px}.gp-shl{left:5%}.gp-shr{right:5%}',
    '.gp-mid{position:absolute;top:8px;left:50%;transform:translateX(-50%);display:flex;gap:8px}',
    '.gp-pill{height:34px;min-width:56px;padding:0 12px;box-sizing:border-box;border-radius:17px;background:linear-gradient(#2a3358,#1a2142);border:1px solid #3a4a86;color:#cfd8ff;font:700 12px system-ui,-apple-system,"Noto Sans KR",sans-serif;display:flex;align-items:center;justify-content:center;touch-action:none;box-shadow:0 2px 6px rgba(0,0,0,.5)}',
    '.gp-tight .gp-pill{min-width:40px;padding:0 8px;font-size:10.5px}',
    /* 가로 화면·전체화면: 게임 화면 위에 반투명하게 겹침 */
    '@media (orientation:landscape){body.gp #gpad{position:absolute;left:0;right:0;top:0;bottom:0;height:auto;background:none;border:0;box-shadow:none;pointer-events:none;z-index:6;--ps:min(42vh,26vw)}',
    'body.gp #gpad .gp-plate{bottom:6%;opacity:.88;pointer-events:auto}body.gp #gpad .gp-pl{left:3%}body.gp #gpad .gp-pr{right:3%}',
    'body.gp #gpad .gp-pill{pointer-events:auto;opacity:.88}body.gp #gpad .gp-sh,body.gp #gpad .gp-mid{top:auto;bottom:6%}body.gp #gpad .gp-sh{bottom:calc(6% + var(--ps) + 10px)}',
    'body.gp #gpad .gp-mid{bottom:8%}}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'gpStyle'; st.textContent = css; document.head.appendChild(st);

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
    psx: { dp: 1, f: dia(['\u25B2', 9, 'green'], ['\u25A0', 1, 'pink'], ['\u25CF', 8, 'red'], ['\u2715', 0, 'blue']), l: [['L2', 12], ['L1', 10]], r: [['R1', 11], ['R2', 13]], m: SS },
    psp: { dp: 1, f: dia(['\u25B2', 9, 'green'], ['\u25A0', 1, 'pink'], ['\u25CF', 8, 'red'], ['\u2715', 0, 'blue']), l: [['L', 10]], r: [['R', 11]], m: SS },
    n64: { stick: 1, f: [B('A', 0, 'blue', 66, 74, 32), B('B', 1, 'green', 34, 62, 30),
      B('C\u25B2', 23, 'yellow', 72, 11, 20, 32767), B('C\u25BC', 22, 'yellow', 72, 45, 20, 32767), B('C\u25C0\uFE0E', 21, 'yellow', 55, 28, 20, 32767), B('C\u25B6\uFE0E', 20, 'yellow', 89, 28, 20, 32767)],
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
    var c = (typeof cur !== 'undefined') ? cur : null, f = (typeof lastFile !== 'undefined') ? lastFile : null;
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

  /* ---------------- 패드 만들기 ---------------- */
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
    var pid = null, cur = { u: 0, d: 0, l: 0, r: 0 };
    function apply(n) {
      ['u', 'd', 'l', 'r'].forEach(function (k) {
        if (n[k] && !cur[k]) { press(S[k]); A[k].classList.add('on'); buzz(); }
        if (!n[k] && cur[k]) { release(S[k]); A[k].classList.remove('on'); }
      });
      cur = n;
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
      var nx = dx / R, ny = dy / R, q = function (v) { return Math.round(Math.abs(v) * 32 ) * 1000; };   /* 16 → 오른쪽, 17 → 왼쪽, 18 → 아래, 19 → 위 */
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

  /* ---------------- 상태 감시 ---------------- */
  var wasOn = false;
  function nudge() { [80, 400].forEach(function (t) { setTimeout(function () { try { fr.contentWindow.dispatchEvent(new Event('resize')); } catch (x) {} }, t); }); }
  /* 🎮 버튼숨기기/표시 : 원래 로직(게임 안쪽 패드 토글) 대신 이 패드를 숨기거나 보여줌 */
  var padHidden = false;
  if (bCtl) {
    bCtl.onclick = function () {
      padHidden = !padHidden;
      bCtl.textContent = padHidden ? '🎮 버튼표시' : '🎮 버튼숨기기';
      if (padHidden) resetAll();
    };
  }
  function tick() {
    try {
      var running = emu.classList.contains('show') && (!drop || drop.classList.contains('hidden'));
      if (bCtl && /숨기기/.test(bCtl.textContent)) padHidden = false;      /* 새 게임을 시작하면 다시 표시 */
      if (bCtl && /표시/.test(bCtl.textContent)) padHidden = true;
      var on = running && !padHidden;
      if (running) { var k = detect(); if (k !== curKey || !pad.firstChild) build(k); }
      body.classList.toggle('gp-on', on);
      body.classList.toggle('gp-ctloff', padHidden);
      if (on !== wasOn) { wasOn = on; if (!on) resetAll(); nudge(); }
      var np = document.getElementById('npBtn'); if (np) np.classList.toggle('gp-live', /🟢/.test(np.textContent));
      if (running) {                                                          /* 게임 안쪽의 기본 가상 패드는 항상 숨김 */
        var d = fr.contentDocument;
        if (d && d.body) {
          d.body.classList.add('hidectl');
          if (d.head && !d.getElementById('gpHide')) { var s = d.createElement('style'); s.id = 'gpHide'; s.textContent = '.ejs_virtualGamepad_parent,.ejs_virtualGamepad_open,.ejs_virtualGamepad_button{display:none!important}'; d.head.appendChild(s); }
        }
      }
    } catch (x) {}
  }
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', function () { if (document.hidden) resetAll(); });
  window.addEventListener('blur', resetAll);
  window.addEventListener('pagehide', resetAll);
})();
