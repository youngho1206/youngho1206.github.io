/* =====================================================================
   netplay.js — '친구와 함께' (온라인 같이 하기) 공통 스크립트

   방식(화면 중계)
   · 방장  : 평소처럼 게임 ROM 을 불러와 실행합니다. '친구와 함께 → 방 만들기' 를 누르면
             6자리 연결코드가 나옵니다.
   · 친구  : 같은 사이트에서 '친구와 함께 → 코드로 참가하기' 에 코드를 넣으면
             방장의 게임 화면·소리가 실시간으로 나오고, 친구의 버튼 입력은 방장 게임의
             2P(3P·4P) 조작으로 전달됩니다. (친구도 같은 ROM 으로 게임을 먼저 실행해야 합니다)
   · 연결 : WebRTC(PeerJS 무료 공개 연결서버) — 별도 서버·PHP 필요 없음.
            게임 화면/소리/버튼은 방장과 친구 사이에 직접 오갑니다.

   각 페이지에는  <script src="netplay.js"></script>  한 줄만 넣으면 됩니다.
   ===================================================================== */
(function () {
  'use strict';
  if (window.__NETPLAY__) return;
  window.__NETPLAY__ = 1;

  var PEER_SRC = [
    'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js',
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js'
  ];
  var PREFIX = 'yhgame-';
  var MAX_GUESTS = 3; /* 친구 최대 3명 → 2P·3P·4P */
  var ICE = { iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ] };

  /* ---------- 작은 도우미 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, css, html, parent) {
    var e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function rand6() { return String(Math.floor(Math.random() * 900000) + 100000); }
  function fmt(code) { return code.slice(0, 3) + ' ' + code.slice(3); }

  var peerLoading = null;
  function loadPeer() {
    if (window.Peer) return Promise.resolve();
    if (peerLoading) return peerLoading;
    peerLoading = new Promise(function (ok, fail) {
      var i = 0;
      (function next() {
        if (window.Peer) return ok();
        if (i >= PEER_SRC.length) { peerLoading = null; return fail(new Error('연결 라이브러리를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')); }
        var s = document.createElement('script');
        s.src = PEER_SRC[i++];
        s.onload = function () { window.Peer ? ok() : next(); };
        s.onerror = next;
        document.head.appendChild(s);
      })();
    });
    return peerLoading;
  }

  /* ---------- 에뮬레이터 찾기 (이 창 + 같은 사이트의 iframe 안쪽까지) ---------- */
  function eachWindow(win, fn, depth) {
    depth = depth || 0;
    if (depth > 4) return;
    try { fn(win); } catch (e) {}
    var n = 0;
    try { n = win.frames.length; } catch (e) {}
    for (var i = 0; i < n; i++) {
      try { var f = win.frames[i]; void f.document; eachWindow(f, fn, depth + 1); } catch (e) { /* 다른 사이트 iframe 은 건너뜀 */ }
    }
  }
  function findEmu() {
    var found = null;
    eachWindow(window, function (w) {
      if (found) return;
      var e = w.EJS_emulator;
      if (!e || !e.gameManager) return;
      var gm = e.gameManager;
      var canvas = e.canvas || (w.document && w.document.querySelector('canvas'));
      if (!canvas || !(gm.simulateInput || (gm.functions && gm.functions.simulateInput))) return;
      found = { emu: e, gm: gm, canvas: canvas, win: w };
    });
    return found;
  }
  function simTarget(info) { return (typeof info.gm.simulateInput === 'function') ? info.gm : info.gm.functions; }
  function simulate(info, player, idx, val) {
    try { var t = simTarget(info); (t.__npOrig || t.simulateInput).call(t, player, idx, val); } catch (e) {}
  }

  /* ---------- 같은 ROM 확인 (파일 내용 해시) ---------- */
  function hex(buf) { var a = new Uint8Array(buf), o = ''; for (var i = 0; i < a.length; i++) o += (a[i] < 16 ? '0' : '') + a[i].toString(16); return o; }
  function romSig(info) {
    var w = info.win, u = w.EJS_gameUrl;
    if (info.sigCache && info.sigCache.u === u) return Promise.resolve(info.sigCache.v);
    var pr;
    if (u && u.arrayBuffer) {
      var size = u.size, BIG = 32 * 1048576;
      pr = (size > BIG
        ? Promise.all([u.slice(0, 4194304).arrayBuffer(), u.slice(size - 4194304).arrayBuffer()]).then(function (p) { var c = new Uint8Array(p[0].byteLength + p[1].byteLength); c.set(new Uint8Array(p[0]), 0); c.set(new Uint8Array(p[1]), p[0].byteLength); return c.buffer; })
        : u.arrayBuffer()).then(function (buf) { return { buf: buf, size: size }; });
    } else if (typeof u === 'string') {
      pr = fetch(u).then(function (r) { return r.arrayBuffer(); }).then(function (buf) { return { buf: buf, size: buf.byteLength }; });
    } else return Promise.resolve(null);
    return pr.then(function (r) { return crypto.subtle.digest('SHA-256', r.buf).then(function (h) { return { hash: hex(h), size: r.size, core: String(w.EJS_core || '') }; }); })
      .then(function (v) { info.sigCache = { u: u, v: v }; return v; }, function () { return null; });
  }

  /* ---------- 게임 소리 가져오기 ----------
     에뮬레이터가 소리를 스피커로 보낼 때 같은 소리를 '녹음용 출구(MediaStreamDestination)'
     로도 보내 두었다가, 친구에게 영상과 함께 보냅니다. */
  var taps = [];
  function tap(node, ctx) {
    var d = ctx.__npd;
    if (!d) {
      try { d = ctx.__npd = ctx.createMediaStreamDestination(); taps.push({ ctx: ctx, d: d }); } catch (e) { return; }
    }
    node.__npt = node.__npt || [];
    if (node.__npt.indexOf(d) >= 0) return;
    node.__npt.push(d);
    try { node.connect(d); } catch (e) {}
  }
  function hookAudio(w) {
    if (w.__npHooked) return;
    w.__npHooked = 1;
    try {
      var P = w.AudioNode && w.AudioNode.prototype;
      if (!P || P.__npc) return;
      var oc = P.connect;
      P.__npc = 1;
      P.connect = function (dest) {
        try {
          if (dest && w.AudioDestinationNode && dest instanceof w.AudioDestinationNode && this.context === dest.context) tap(this, dest.context);
        } catch (e) {}
        return oc.apply(this, arguments);
      };
    } catch (e) {}
  }
  function scanWindows() { eachWindow(window, hookAudio); }
  setInterval(scanWindows, 400);
  scanWindows();

  /* 이미 소리가 시작된 뒤에 방을 열었을 때를 위한 보조 방법 */
  function fallbackAudio(info) {
    try {
      var M = info.emu.Module || (info.gm && info.gm.Module);
      var S = M && M.SDL2;
      if (S && S.audioContext && S.audio) {
        var node = S.audio.scriptProcessorNode || S.audio.queueNode || S.audio.node;
        if (node) tap(node, S.audioContext);
      }
    } catch (e) {}
  }
  function audioTrack() {
    for (var i = taps.length - 1; i >= 0; i--) {
      try {
        if (taps[i].ctx.state === 'closed') continue;
        var t = taps[i].d.stream.getAudioTracks()[0];
        if (t && t.readyState === 'live') return t;
      } catch (e) {}
    }
    return null;
  }

  /* ======================================================================
     '같은 ROM 방식' 공통 : 각자 게임을 실행하고 버튼 입력만 서로 주고받음
     ====================================================================== */
  var net = { on: false, role: null, slot: 1, rtt: 0, D: 0, sent: 0, recv: 0, resyncT: 0, wrapT: 0, pingT: 0, lastSync: 0, stateKB: 0 };
  function netWrap() {
    var info = findEmu(); if (!info) return;
    var t = simTarget(info);
    if (t.__npOrig) return;
    var orig = t.simulateInput; t.__npOrig = orig;
    t.simulateInput = function (p, i, v) {
      if (!net.on || p !== 0) return orig.call(t, p, i, v);   /* 내 조작은 항상 1P 로 들어옴 */
      var slot = net.role === 'host' ? 0 : net.slot, self = this;
      net.sent++;
      if (net.role === 'host') hostBroadcast({ t: 'in', p: 0, i: i, v: v });
      else if (guest.conn && guest.conn.open) { try { guest.conn.send({ t: 'in', i: i, v: v }); } catch (e) {} }
      /* 상대 쪽에 도착하는 시간과 맞추려고 내 조작도 통신 지연의 절반만큼 늦춰서 적용 */
      if (net.D > 3) setTimeout(function () { orig.call(t, slot, i, v); }, net.D);
      else return orig.call(t, slot, i, v);
    };
  }
  function netUnwrap() {
    try { eachWindow(window, function (w) { var e = w.EJS_emulator; if (!e || !e.gameManager) return; var gm = e.gameManager, t = (typeof gm.simulateInput === 'function') ? gm : gm.functions; if (t.__npOrig) { t.simulateInput = t.__npOrig; delete t.__npOrig; } }); } catch (e) {}
  }
  function netStart(role) {
    net.on = true; net.role = role; net.sent = net.recv = 0;
    netWrap(); clearInterval(net.wrapT); net.wrapT = setInterval(function () { if (net.on) netWrap(); }, 1000);
  }
  function netStop() { net.on = false; clearInterval(net.wrapT); clearInterval(net.pingT); clearTimeout(net.resyncT); netUnwrap(); net.rtt = 0; net.D = 0; }
  function toU8(x) {
    if (x instanceof Uint8Array) return x;
    if (x instanceof ArrayBuffer) return new Uint8Array(x);
    if (x && x.buffer) return new Uint8Array(x.buffer, x.byteOffset || 0, x.byteLength);
    return new Uint8Array(x);
  }
  function loadSyncState(u8) {
    var info = findEmu(); if (!info) return;
    try { info.gm.loadState(toU8(u8)); net.lastSync = Date.now(); } catch (e) {}
  }
  function pingLoop(send) {
    clearInterval(net.pingT);
    net.pingT = setInterval(function () { send({ t: 'ping', ts: performance.now() }); }, 2000);
  }
  function onRtt(ms) { net.rtt = net.rtt ? net.rtt * 0.7 + ms * 0.3 : ms; }

  /* ======================================================================
     화면(UI)
     ====================================================================== */
  var ui = {};
  var css = 'font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;';

  /* '친구와 함께' 버튼을 각 페이지의 에뮬레이터 상단 메뉴에 넣습니다.
     (메뉴가 다시 만들어져도 0.5초마다 확인해서 다시 붙여 줍니다) */
  function labelText(kind) {
    var t = guest.local ? '🟢 ' + guest.player + 'P · ' + Math.round(net.rtt) + 'ms' : host.active && host.code ? '🟢 방 ' + host.code + (connectedCount() ? ' · ' + connectedCount() + '명' : '') : (document.body && document.body.classList.contains('wide') ? '👥 친구와 같이하기' : '👥 친구와 함께');
    return kind === 'br' ? '[' + t + ']' : t;
  }
  function makeBtn(kind, cls) {
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'npBtn'; b.setAttribute('data-np', kind);
    if (cls) b.className = cls;
    b.textContent = labelText(kind);
    b.addEventListener('click', function (e) { e.preventDefault(); openPanel(); });
    return b;
  }
  function ensureBtn() {
    if (document.getElementById('npBtn')) return;
    var bar = document.getElementById('bar'), hide = document.getElementById('bHide');
    if (bar && hide) { bar.insertBefore(makeBtn('plain'), hide); return; }          /* emulator · mobile · classic · lowend */
    var full = document.getElementById('mFull');
    if (full && full.parentNode) { var shot = document.getElementById('mShot'); (shot || full).parentNode.insertBefore(makeBtn('plain'), (shot || full).nextSibling); return; } /* pcgameemulator */
    var eb = document.getElementById('ebar');
    if (eb && eb.children.length) { eb.appendChild(makeBtn('br', 'btn')); return; }  /* tablet */
  }
  function buildPill() { ensureBtn(); setInterval(ensureBtn, 500); }

  function toast(msg) {
    try {
      var t = el('div', css + 'position:fixed;left:50%;bottom:70px;transform:translateX(-50%);z-index:2147483200;background:rgba(20,24,48,.92);color:#fff;font-size:14px;font-weight:700;padding:11px 18px;border-radius:22px;box-shadow:0 6px 20px rgba(0,0,0,.5);max-width:88vw;text-align:center;pointer-events:none', msg, document.body);
      setTimeout(function () { t.remove(); }, 3500);
    } catch (e) {}
  }
  function statsHTML() {
    var l = [];
    if (net.on) {
      l.push('📶 지연 ' + Math.round(net.rtt) + 'ms (입력 보정 ' + net.D + 'ms)');
      l.push('🎮 보낸 입력 ' + net.sent + ' · 받은 입력 ' + net.recv);
      l.push('🔄 마지막 동기화 ' + (net.lastSync ? Math.round((Date.now() - net.lastSync) / 1000) + '초 전' : '-') + (net.stateKB ? ' (' + net.stateKB + 'KB)' : ''));
    }
    return l.join('<br>');
  }
  setInterval(function () {
    refreshPill();
    if (ui.statEl && ui.statEl.isConnected && ui.bg && ui.bg.style.display === 'flex') ui.statEl.innerHTML = statsHTML();
  }, 1000);
  function buildPanel() {
    var bg = el('div', css + 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.6);display:none;align-items:center;justify-content:center;padding:14px;box-sizing:border-box', null, document.body);
    var box = el('div', 'width:100%;max-width:380px;max-height:92vh;overflow:auto;background:#151a35;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:18px;box-sizing:border-box;box-shadow:0 20px 60px rgba(0,0,0,.6)', null, bg);
    var head = el('div', 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px', '<b style="font-size:17px">👥 친구와 함께</b>', box);
    var x = el('button', 'border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:6px 12px;font-size:14px;cursor:pointer', '닫기', head);
    var body = el('div', '', null, box);
    bg.addEventListener('pointerdown', function (e) { if (e.target === bg) closePanel(); });
    x.onclick = closePanel;
    ui.bg = bg; ui.body = body;
  }
  function btn(parent, text, bgc, fn) {
    var b = el('button', 'display:block;width:100%;border:0;border-radius:12px;padding:14px;margin:8px 0 0;font-size:15px;font-weight:700;color:#fff;cursor:pointer;background:' + bgc, text, parent);
    b.onclick = fn; return b;
  }
  function openPanel() { ui.bg.style.display = 'flex'; renderPanel(); }
  function closePanel() { ui.bg.style.display = 'none'; }

  var view = 'home'; /* home | host | join */
  function renderPanel() {
    var b = ui.body; b.innerHTML = '';
    if (guest.local) view = 'glocal'; else if (host.active) view = 'host';
    if (view === 'home') {
      el('div', 'font-size:13px;line-height:1.55;color:#cdd3f5', '같은 사이트에 접속한 친구와 연결코드(번호)로 바로 함께 할 수 있어요.<br>방장과 친구 모두 같은 게임 ROM 이 있어야 해요.', b);
      btn(b, '🏠 방 만들기 (내가 방장)', '#4b6bff', function () { view = 'host'; hostStart(); renderPanel(); });
      btn(b, '🔑 코드로 참가하기', '#2fa36b', function () { view = 'join'; renderPanel(); });
      el('div', 'margin-top:12px;font-size:12px;line-height:1.55;color:#9aa3d8', '💡 같은 ROM 방식 : 방장과 친구가 <b>둘 다 같은 게임을 먼저 실행</b>한 뒤 연결하면, 각자 기기에서 게임이 돌아가서 속도가 빨라요.<br>친구가 같은 ROM 으로 게임을 실행하지 않았다면 연결되지 않아요 (화면 중계 없음).', b);
    } else if (view === 'glocal') {
      ui.gBox = el('div', '', null, b);
      renderGuestLocal();
    } else if (view === 'host') {
      ui.hostBox = el('div', '', null, b);
      renderHost();
    } else if (view === 'join') {
      el('div', 'font-size:13px;color:#cdd3f5;margin-bottom:6px', '방장에게 받은 6자리 연결코드를 입력하세요.', b);
      var inp = el('input', 'width:100%;box-sizing:border-box;font-size:26px;letter-spacing:6px;text-align:center;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:#0d1128;color:#fff', null, b);
      inp.setAttribute('inputmode', 'numeric'); inp.setAttribute('maxlength', '8'); inp.setAttribute('placeholder', '000000'); inp.setAttribute('autocomplete', 'off');
      var msg = el('div', 'min-height:20px;margin-top:8px;font-size:13px;color:#ffd27a', '', b);
      var go = btn(b, '🎮 연결하기', '#2fa36b', function () {
        var code = inp.value.replace(/\D/g, '');
        if (code.length !== 6) { msg.textContent = '숫자 6자리를 입력해 주세요.'; return; }
        go.disabled = true; msg.style.color = '#cdd3f5'; msg.textContent = '연결 중…';
        guestStart(code, function (m, ok) { msg.style.color = ok ? '#9be7b8' : '#ffd27a'; msg.textContent = m; if (!ok) go.disabled = false; });
      });
      btn(b, '← 뒤로', 'rgba(255,255,255,.14)', function () { view = 'home'; renderPanel(); });
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 50);
    }
  }
  function renderGuestLocal() {
    var b = ui.gBox; if (!b) return; b.innerHTML = '';
    el('div', 'font-size:15px;font-weight:700;margin-bottom:6px', '✅ 같은 ROM 방식으로 연결됨', b);
    el('div', 'font-size:13px;color:#cdd3f5;line-height:1.6', '나는 <b>' + guest.player + 'P</b> 로 들어왔어요.<br>내 기기에서 게임이 실행되고, 버튼 입력만 서로 주고받아요.', b);
    ui.statEl = el('div', 'margin-top:10px;font-size:13px;line-height:1.6;color:#cdd3f5;background:rgba(255,255,255,.07);border-radius:12px;padding:10px 12px', statsHTML(), b);
    btn(b, '🚪 연결 끊기', '#c0392b', function () { guestStop(); view = 'home'; renderPanel(); });
  }
  function renderHost() {
    var b = ui.hostBox; if (!b) return; b.innerHTML = '';
    if (!host.code) {
      el('div', 'font-size:14px;color:#cdd3f5;padding:14px 0', host.err || '방을 만드는 중…', b);
      if (host.err) btn(b, '다시 시도', '#4b6bff', function () { hostStart(); });
      return;
    }
    el('div', 'font-size:13px;color:#cdd3f5', '친구에게 이 코드를 알려주세요', b);
    el('div', 'font-size:40px;font-weight:800;letter-spacing:5px;text-align:center;margin:8px 0;color:#fff;font-variant-numeric:tabular-nums', fmt(host.code), b);
    btn(b, '📋 코드 복사', 'rgba(255,255,255,.16)', function (e) {
      var t = host.code, me = e.target;
      try { navigator.clipboard.writeText(t); me.textContent = '✅ 복사됨'; setTimeout(function () { me.textContent = '📋 코드 복사'; }, 1500); } catch (x) { me.textContent = t; }
    });
    var n = connectedCount(), nl = localGuests().length, ns = n - nl;
    var st = el('div', 'margin-top:12px;font-size:13px;line-height:1.6;color:#cdd3f5;background:rgba(255,255,255,.07);border-radius:12px;padding:10px 12px', '', b);
    var lines = [];
    var info = findEmu();
    lines.push(info ? '🎮 게임 실행 중' : '📂 게임 ROM 을 불러오면 친구 화면에 나와요');
    lines.push(n ? '👥 연결된 친구 ' + n + '명 (같은 ROM ' + nl + ' · 화면중계 ' + ns + ')' : '⏳ 친구를 기다리는 중…');
    st.innerHTML = lines.join('<br>');
    if (nl) {
      ui.statEl = el('div', 'margin-top:8px;font-size:13px;line-height:1.6;color:#cdd3f5;background:rgba(255,255,255,.07);border-radius:12px;padding:10px 12px', statsHTML(), b);
      btn(b, '🔄 지금 동기화', 'rgba(255,255,255,.16)', function () { sendState(localGuests()); toast('동기화했어요'); });
    }
    el('div', 'margin-top:8px;font-size:12px;color:#9aa3d8;line-height:1.5', '※ 친구는 2P 조작으로 들어와요. 2인 플레이가 되는 게임에서 사용하세요. 같은 ROM 방식은 친구도 같은 게임 파일을 먼저 실행해야 해요. 이 창은 닫아도 방은 유지돼요.', b);
    btn(b, '🚪 방 닫기', '#c0392b', function () { hostStop(); view = 'home'; renderPanel(); });
  }
  function refreshPill() {
    var list = document.querySelectorAll('[data-np]');
    for (var i = 0; i < list.length; i++) list[i].textContent = labelText(list[i].getAttribute('data-np'));
  }

  /* ======================================================================
     방장(host)
     ====================================================================== */
  var host = { active: false, code: null, peer: null, guests: [], err: '' };
  function connectedCount() { var n = 0; host.guests.forEach(function (g) { if (g && g.open) n++; }); return n; }

  function hostStart() {
    host.err = ''; host.code = null; host.active = true;
    renderHost(); refreshPill();
    loadPeer().then(function () { openHostPeer(0); }, function (e) { host.err = e.message; host.active = false; renderHost(); refreshPill(); });
  }
  function openHostPeer(tries) {
    var code = rand6();
    var p = new window.Peer(PREFIX + code, { config: ICE });
    host.peer = p;
    p.on('open', function () { host.code = code; renderHost(); refreshPill(); });
    p.on('error', function (err) {
      if (err && err.type === 'unavailable-id' && tries < 5) { try { p.destroy(); } catch (e) {} openHostPeer(tries + 1); return; }
      if (err && err.type === 'peer-unavailable') return;
      host.err = '연결 서버에 접속하지 못했어요. 잠시 뒤 다시 시도해 주세요. (' + (err && err.type || 'error') + ')';
      if (!host.code) { host.active = false; }
      renderHost(); refreshPill();
    });
    p.on('disconnected', function () { try { if (host.peer === p && !p.destroyed) p.reconnect(); } catch (e) {} });
    p.on('connection', onGuest);
  }
  function onGuest(conn) {
    var slot = -1;
    for (var i = 0; i < MAX_GUESTS; i++) if (!host.guests[i] || !host.guests[i].open) { slot = i; break; }
    conn.on('open', function () {
      if (slot < 0) { try { conn.send({ t: 'full' }); } catch (e) {} setTimeout(function () { try { conn.close(); } catch (e) {} }, 300); return; }
      var g = { conn: conn, id: conn.peer, slot: slot + 1, open: true, down: {}, call: null, sig: '', mode: null, rtt: 0 };
      host.guests[slot] = g;
      renderHost(); refreshPill();
    });
    conn.on('data', function (d) {
      var g = host.guests[slot]; if (!g || g.conn !== conn || !d) return;
      if (d.t === 'b') {
        return; /* 화면 중계 방식 입력 차단 */
      } else if (d.t === 'hello') {
        onHello(g, d);
      } else if (d.t === 'in' && g.mode === 'local') {
        var inf = findEmu(); if (!inf) return;
        if (d.i < 16) g.down[d.i] = d.v ? 1 : 0;
        simulate(inf, g.slot, d.i, d.v); net.recv++;
        hostBroadcast({ t: 'in', p: g.slot, i: d.i, v: d.v }, g);
      } else if (d.t === 'ping') {
        try { conn.send({ t: 'pong', ts: d.ts }); } catch (e) {}
      } else if (d.t === 'pong') {
        var ms = performance.now() - d.ts; g.rtt = g.rtt ? g.rtt * 0.7 + ms * 0.3 : ms; hostNetUpdate();
      }
    });
    function gone() {
      var g = host.guests[slot]; if (!g || g.conn !== conn) return;
      g.open = false;
      var info = findEmu();
      if (info) Object.keys(g.down).forEach(function (k) { if (g.down[k]) simulate(info, g.slot, +k, 0); });
      try { g.call && g.call.close(); } catch (e) {}
      host.guests[slot] = null;
      hostNetUpdate();
      renderHost(); refreshPill();
    }
    conn.on('close', gone); conn.on('error', gone);
  }
  /* ----- 같은 ROM 방식 : 방장 쪽 ----- */
  function localGuests() { return host.guests.filter(function (g) { return g && g.open && g.mode === 'local'; }); }
  function hostBroadcast(msg, except) {
    host.guests.forEach(function (g) { if (g && g.open && g.mode === 'local' && g !== except) { try { g.conn.send(msg); } catch (e) {} } });
  }
  function hostNetUpdate() {
    var L = localGuests();
    if (L.length && !(net.on && net.role === 'host')) {
      netStart('host');
      pingLoop(function (m) { hostBroadcast(m); });
      scheduleResync(3000);
    } else if (!L.length && net.on && net.role === 'host') netStop();
    var mx = 0; L.forEach(function (g) { mx = Math.max(mx, g.rtt || 0); });
    net.rtt = mx; net.D = Math.min(100, Math.round(mx / 2));
  }
  function sendState(targets) {
    var info = findEmu(); if (!info || !targets.length) return;
    var st; try { st = info.gm.getState(); } catch (e) { return; }
    var u = new Uint8Array(toU8(st));          /* 복사본 */
    net.stateKB = Math.round(u.length / 1024); net.lastSync = Date.now();
    targets.forEach(function (g) { try { g.conn.send({ t: 'state', d: u }); } catch (e) {} });
  }
  function scheduleResync(ms) {
    clearTimeout(net.resyncT);
    net.resyncT = setTimeout(function () {
      if (!(net.on && net.role === 'host')) return;
      sendState(localGuests());
      var kb = net.stateKB;
      scheduleResync(kb < 512 ? 5000 : kb < 2048 ? 8000 : kb < 8192 ? 15000 : 30000);
    }, ms);
  }
  function onHello(g, d) {
    /* 화면 중계(stream) 방식 완전 차단 : 같은 ROM 이 확인된 친구만 연결 허용 */
    if (d.mode !== 'local' || !d.sig) { try { g.conn.send({ t: 'norom' }); } catch (e) {} setTimeout(function () { try { g.conn.close(); } catch (e) {} }, 300); return; }
    var info = findEmu();
    if (!info) { try { g.conn.send({ t: 'nohost' }); } catch (e) {} setTimeout(function () { try { g.conn.close(); } catch (e) {} }, 300); return; }
    romSig(info).then(function (my) {
      var ok = my && d.sig && my.hash === d.sig.hash && my.size === d.sig.size && (!d.core || !my.core || d.core === my.core);
      if (!ok) { try { g.conn.send({ t: 'mismatch' }); } catch (e) {} setTimeout(function () { try { g.conn.close(); } catch (e) {} }, 300); return; }
      g.mode = 'local';
      try { g.conn.send({ t: 'ok', mode: 'local', player: g.slot + 1 }); } catch (e) {}
      hostNetUpdate(); sendState([g]);
      toast('✅ 친구가 연결됐어요 (' + (g.slot + 1) + 'P) · 같은 게임 확인됨');
      renderHost(); refreshPill();
    });
  }
  function hostStop() {
    netStop();
    host.guests.forEach(function (g) { if (g) { try { g.call && g.call.close(); } catch (e) {} try { g.conn.close(); } catch (e) {} } });
    host.guests = [];
    try { host.peer && host.peer.destroy(); } catch (e) {}
    host.peer = null; host.active = false; host.code = null; host.err = '';
    refreshPill();
  }

  /* 친구에게 게임 화면+소리 보내기 (게임이 시작되면 자동으로 / 게임을 다시 불러오면 다시) */
  function makeStream(info) {
    var vs;
    try { vs = info.canvas.captureStream(60); } catch (e) { return null; }
    var vt = vs.getVideoTracks()[0];
    try { vt.contentHint = 'motion'; } catch (e) {}
    var ms = new MediaStream([vt]);
    fallbackAudio(info);
    var at = audioTrack();
    if (at) ms.addTrack(at);
    return { stream: ms, sig: (info.canvas.__npid || (info.canvas.__npid = Math.random().toString(36).slice(2))) + ':' + (at ? at.id : 'na') };
  }
  function tune(call, info) {
    setTimeout(function () {
      try {
        var cw = (info && info.canvas && info.canvas.width) || 0;
        call.peerConnection.getSenders().forEach(function (s) {
          if (!s.track || s.track.kind !== 'video') return;
          var p = s.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}];
          p.encodings[0].maxBitrate = 8000000; p.encodings[0].maxFramerate = 60;
          /* 큰 화면(PS1 고해상도 등)은 방장 컴퓨터가 영상 압축하느라 느려지지 않게 가로 960 이하로 줄여서 보냄 */
          if (cw > 960) p.encodings[0].scaleResolutionDownBy = cw / 960;
          p.degradationPreference = 'maintain-framerate';
          s.setParameters(p).catch(function () {});
        });
      } catch (e) {}
    }, 600);
  }
  setInterval(function () {
    if (!host.active || !host.peer) return;
    var info = findEmu(), any = false;
    host.guests.forEach(function (g) {
      if (!g || !g.open || g.mode !== 'stream') return; /* stream 모드는 더 이상 없음 */
      any = true;
      if (!info) {
        if (g.call) { try { g.call.close(); } catch (e) {} g.call = null; g.sig = ''; try { g.conn.send({ t: 'wait' }); } catch (e) {} }
        return;
      }
      var ms = makeStream(info); if (!ms) return;
      if (g.call && g.call.open !== false && g.sig === ms.sig) return;
      try { g.call && g.call.close(); } catch (e) {}
      try { g.call = host.peer.call(g.id, ms.stream); g.sig = ms.sig; tune(g.call, info); } catch (e) {}
    });
    var sig = (host.code || '') + '|' + connectedCount() + '|' + (info ? 1 : 0);
    if (sig !== host.lastSig) { host.lastSig = sig; if (view === 'host') renderHost(); refreshPill(); }
  }, 900);

  /* ======================================================================
     친구(guest)
     ====================================================================== */
  var guest = { peer: null, conn: null, call: null, ov: null, cur: {}, src: { k: {}, t: {}, g: {} }, raf: 0, player: 2 };

  var KEYS = { ArrowUp: 4, ArrowDown: 5, ArrowLeft: 6, ArrowRight: 7, KeyX: 8, KeyZ: 0, KeyS: 9, KeyA: 1, KeyQ: 10, KeyE: 11, Enter: 3, ShiftRight: 2, ShiftLeft: 2, Space: 2 };

  function gset(srcName, i, v) {
    guest.src[srcName][i] = v;
    var m = !!(guest.src.k[i] || guest.src.t[i] || guest.src.g[i]);
    if (m !== !!guest.cur[i]) {
      guest.cur[i] = m;
      try { guest.conn && guest.conn.open && guest.conn.send({ t: 'b', i: i, v: m ? 1 : 0 }); } catch (e) {}
    }
  }
  function releaseAll() { for (var s in guest.src) for (var i in guest.src[s]) if (guest.src[s][i]) gset(s, +i, 0); }

  /* 영상 속도 개선 : 시작부터 높은 화질/속도로 받도록 요청하고, 받는 쪽 대기시간을 최소로 */
  function boostSdp(sdp) {
    try {
      var lines = sdp.split('\r\n'), out = [], inVideo = false, pts = {}, has = {};
      lines.forEach(function (l) {
        if (l.indexOf('m=') === 0) inVideo = l.indexOf('m=video') === 0;
        var m = inVideo && l.match(/^a=rtpmap:(\d+) (VP8|VP9|H264|AV1)\//);
        if (m) pts[m[1]] = 1;
        var f = inVideo && l.match(/^a=fmtp:(\d+) /);
        if (f) has[f[1]] = 1;
      });
      var X = 'x-google-min-bitrate=3000;x-google-start-bitrate=6000;x-google-max-bitrate=8000';
      inVideo = false;
      lines.forEach(function (l) {
        if (l.indexOf('m=') === 0) inVideo = l.indexOf('m=video') === 0;
        var f = inVideo && l.match(/^a=fmtp:(\d+) /);
        if (f && pts[f[1]]) l = l + ';' + X;
        out.push(l);
        var m = inVideo && l.match(/^a=rtpmap:(\d+) /);
        if (m && pts[m[1]] && !has[m[1]]) out.push('a=fmtp:' + m[1] + ' ' + X);
      });
      return out.join('\r\n');
    } catch (e) { return sdp; }
  }
  function lowLatency(call) {
    function go() {
      try {
        call.peerConnection.getReceivers().forEach(function (r) {
          if (!r.track || r.track.kind !== 'video') return;
          try { r.playoutDelayHint = 0; } catch (e) {}
          try { r.jitterBufferTarget = 0; } catch (e) {}
        });
      } catch (e) {}
    }
    go(); setTimeout(go, 1500);
    /* 화면 위 작은 표시: 초당 프레임 / 지연 */
    clearInterval(guest.statT);
    guest.statT = setInterval(function () {
      try {
        if (!guest.statEl || !call.peerConnection) return;
        call.peerConnection.getStats().then(function (rep) {
          var fps = 0, rtt = 0;
          rep.forEach(function (r) {
            if (r.type === 'inbound-rtp' && r.kind === 'video' && r.framesPerSecond) fps = Math.round(r.framesPerSecond);
            if (r.type === 'candidate-pair' && r.nominated && r.currentRoundTripTime != null) rtt = Math.round(r.currentRoundTripTime * 1000);
          });
          guest.statEl.textContent = fps ? '📶 ' + fps + 'fps · ' + rtt + 'ms' : '';
        });
      } catch (e) {}
    }, 1000);
  }

  function guestStart(code, report) {
    guestStop(true);
    loadPeer().then(function () {
      var p = new window.Peer({ config: ICE });
      guest.peer = p;
      var done = false;
      var timer = setTimeout(function () { if (!done) { report('연결 시간이 초과됐어요. 코드를 다시 확인해 주세요.', false); guestStop(true); } }, 15000);
      p.on('error', function (err) {
        clearTimeout(timer);
        var t = err && err.type;
        report(t === 'peer-unavailable' ? '해당 코드의 방을 찾을 수 없어요. 코드를 확인해 주세요.' : '연결에 실패했어요. (' + (t || 'error') + ')', false);
        if (!done) guestStop(true);
      });
      p.on('call', function (call) { try { call.close(); } catch (e) {} }); /* 화면 중계 수신 차단 */
      p.on('open', function () {
        var conn = p.connect(PREFIX + code, { reliable: true });
        guest.conn = conn;
        conn.on('open', function () {
          done = true; clearTimeout(timer);
          var info = findEmu();
          if (info) {
            /* 게임을 이미 실행 중 → '같은 ROM 방식' : 방장과 같은 파일인지 확인 후 각자 실행 */
            report('방장과 같은 게임 파일인지 확인 중…', true);
            guest.pending = true;
            romSig(info).then(function (sg) {
              if (!guest.pending) return;
              if (!sg) { report('게임 파일을 확인하지 못했어요.', false); guestStop(true); return; }
              try { conn.send({ t: 'hello', mode: 'local', sig: { hash: sg.hash, size: sg.size }, core: sg.core }); } catch (e) {}
              guest.helloT = setTimeout(function () { if (guest.pending) { report('방장의 응답이 없어요.', false); guestStop(true); } }, 25000);
            });
          } else {
            /* 게임(ROM)이 없으면 연결 불가 : 화면 중계 없음 */
            report('게임을 먼저 실행해야 연결할 수 있어요. 방장과 같은 ROM 파일로 게임을 실행한 뒤 다시 시도해 주세요.', false);
            guestStop(true);
          }
        });
        conn.on('data', function (d) {
          if (!d) return;
          if (d.t === 'hi') { guest.player = d.player; setStatus('방장의 게임을 기다리는 중… (나는 ' + d.player + 'P)'); }
          else if (d.t === 'wait') { setStatus('방장이 게임을 불러오면 화면이 나와요…'); }
          else if (d.t === 'full') { report('방이 가득 찼어요.', false); guestStop(true); }
          else if (d.t === 'ok') {
            guest.pending = false; clearTimeout(guest.helloT);
            guest.local = true; guest.player = d.player; net.slot = d.player - 1;
            netStart('guest'); pingLoop(function (m) { try { conn.send(m); } catch (e) {} });
            report('✅ 같은 게임이에요! 연결됐어요.', true);
            setTimeout(closePanel, 900);
            toast('✅ 방장과 연결됐어요 · 나는 ' + d.player + 'P');
            refreshPill();
          }
          else if (d.t === 'mismatch') { guest.pending = false; report('방장과 게임 파일이 달라요. 같은 ROM 파일(같은 zip)로 실행해 주세요.', false); guestStop(true); }
          else if (d.t === 'norom') { guest.pending = false; report('방장과 같은 ROM 으로 게임을 실행해야 연결할 수 있어요.', false); guestStop(true); }
          else if (d.t === 'nohost') { guest.pending = false; report('방장이 아직 게임을 실행하지 않았어요. 방장이 게임을 켠 뒤 다시 시도해 주세요.', false); guestStop(true); }
          else if (d.t === 'in') { var inf = findEmu(); if (inf) { simulate(inf, d.p, d.i, d.v); net.recv++; } }
          else if (d.t === 'state') { loadSyncState(d.d); }
          else if (d.t === 'ping') { try { conn.send({ t: 'pong', ts: d.ts }); } catch (e) {} }
          else if (d.t === 'pong') { onRtt(performance.now() - d.ts); net.D = Math.min(100, Math.round(net.rtt / 2)); }
        });
        conn.on('close', function () {
          setStatus('방장과 연결이 끊어졌어요.'); releaseAll();
          if (guest.local) { guest.local = false; netStop(); toast('방장과 연결이 끊어졌어요'); refreshPill(); if (view === 'glocal') { view = 'home'; renderPanel(); } }
        });
        conn.on('error', function () { setStatus('연결 오류가 발생했어요.'); });
      });
    }, function (e) { report(e.message, false); });
  }
  function guestStop(silent) {
    clearTimeout(guest.helloT); guest.pending = false;
    if (guest.local || net.role === 'guest') { guest.local = false; netStop(); }
    try { releaseAll(); } catch (e) {}
    cancelAnimationFrame(guest.raf); clearInterval(guest.statT);
    try { guest.call && guest.call.close(); } catch (e) {}
    try { guest.conn && guest.conn.close(); } catch (e) {}
    try { guest.peer && guest.peer.destroy(); } catch (e) {}
    guest.call = guest.conn = guest.peer = null; guest.cur = {}; guest.src = { k: {}, t: {}, g: {} };
    if (guest.ov) { guest.ov.remove(); guest.ov = null; }
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKey, true);
    refreshPill();
  }
  function setStatus(t) { if (guest.st) { guest.st.textContent = t; guest.st.style.display = t ? 'block' : 'none'; } }

  function showStream(s) {
    if (!guest.video) return;
    guest.video.srcObject = s;
    setStatus('');
    var pr = guest.video.play();
    if (pr && pr.catch) pr.catch(function () {
      guest.video.muted = true; guest.video.play().catch(function () {});
      setStatus('🔇 화면을 한 번 터치하면 소리가 켜져요');
    });
  }

  function onKey(e) {
    if (!guest.ov) return;
    var i = KEYS[e.code]; if (i == null) return;
    e.preventDefault(); e.stopPropagation();
    if (e.repeat) return;
    gset('k', i, e.type === 'keydown' ? 1 : 0);
  }

  function openGuestUI() {
    var ov = el('div', css + 'position:fixed;inset:0;z-index:2147483500;background:#000;touch-action:none;-webkit-user-select:none;user-select:none;overflow:hidden', null, document.body);
    guest.ov = ov;
    var v = el('video', 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000', null, ov);
    v.setAttribute('playsinline', ''); v.setAttribute('autoplay', ''); v.autoplay = true; v.playsInline = true;
    guest.video = v;
    ov.addEventListener('pointerdown', function () { if (v.muted && v.srcObject) { v.muted = false; v.play().catch(function () {}); setStatus(''); } }, true);
    guest.st = el('div', 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#fff;background:rgba(0,0,0,.6);padding:12px 16px;border-radius:12px;font-size:15px;text-align:center;max-width:80%;pointer-events:none', '방장의 게임을 기다리는 중…', ov);
    var top = el('div', 'position:absolute;left:8px;top:calc(8px + env(safe-area-inset-top,0px));display:flex;gap:6px;z-index:3', null, ov);
    var q = el('button', 'border:0;border-radius:18px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff;background:rgba(200,50,50,.85)', '✕ 나가기', top);
    q.onclick = function () { guestStop(); };
    guest.statEl = el('span', 'align-self:center;color:#fff;font-size:12px;text-shadow:0 1px 3px #000;opacity:.85', '', top);
    var tp = el('button', 'border:0;border-radius:18px;padding:8px 12px;font-size:13px;font-weight:700;color:#fff;background:rgba(40,50,100,.8)', '🎮 버튼', top);
    var padOn = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    var pad = buildPad(ov);
    pad.style.display = padOn ? 'block' : 'none';
    tp.onclick = function () { padOn = !padOn; pad.style.display = padOn ? 'block' : 'none'; };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
    pollPad();
  }

  /* 화면 위 조작 버튼 */
  function buildPad(ov) {
    var pad = el('div', 'position:absolute;inset:0;pointer-events:none;z-index:2', null, ov);
    function hold(node, i) {
      var ids = {};
      node.style.pointerEvents = 'auto';
      node.addEventListener('pointerdown', function (e) { e.preventDefault(); ids[e.pointerId] = 1; try { node.setPointerCapture(e.pointerId); } catch (x) {} gset('t', i, 1); node.style.background = 'rgba(255,255,255,.45)'; });
      function off(e) { delete ids[e.pointerId]; if (!Object.keys(ids).length) { gset('t', i, 0); node.style.background = node.__bg; } }
      node.addEventListener('pointerup', off); node.addEventListener('pointercancel', off); node.addEventListener('lostpointercapture', off);
    }
    var base = 'position:absolute;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;border:1px solid rgba(255,255,255,.4);box-sizing:border-box;touch-action:none;';
    var bg0 = 'rgba(20,24,48,.5)';
    function round(txt, i, x, y, s) {
      var b = el('div', base + 'width:' + s + 'px;height:' + s + 'px;border-radius:50%;font-size:' + (s * .4) + 'px;background:' + bg0 + ';' + x + ';' + y, txt, pad);
      b.__bg = bg0; hold(b, i); return b;
    }
    function pill(txt, i, x, y) {
      var b = el('div', base + 'height:30px;padding:0 14px;border-radius:15px;font-size:12px;background:' + bg0 + ';' + x + ';' + y, txt, pad);
      b.__bg = bg0; hold(b, i); return b;
    }
    var bot = 'bottom:calc(26px + env(safe-area-inset-bottom,0px))';
    /* 방향키 : 한 덩어리로 만들어 대각선도 가능 */
    var dp = el('div', base + 'left:18px;' + bot + ';width:132px;height:132px;border-radius:50%;background:' + bg0 + ';pointer-events:auto;font-size:15px', '', pad);
    el('div', 'position:absolute;left:50%;top:6px;transform:translateX(-50%)', '▲', dp);
    el('div', 'position:absolute;left:50%;bottom:6px;transform:translateX(-50%)', '▼', dp);
    el('div', 'position:absolute;left:8px;top:50%;transform:translateY(-50%)', '◀', dp);
    el('div', 'position:absolute;right:8px;top:50%;transform:translateY(-50%)', '▶', dp);
    function dir(e) {
      var r = dp.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), t = r.width * 0.16;
      gset('t', 6, dx < -t ? 1 : 0); gset('t', 7, dx > t ? 1 : 0); gset('t', 4, dy < -t ? 1 : 0); gset('t', 5, dy > t ? 1 : 0);
    }
    function dirOff() { [4, 5, 6, 7].forEach(function (i) { gset('t', i, 0); }); }
    dp.addEventListener('pointerdown', function (e) { e.preventDefault(); try { dp.setPointerCapture(e.pointerId); } catch (x) {} dir(e); });
    dp.addEventListener('pointermove', function (e) { if (e.buttons || e.pressure > 0) dir(e); });
    dp.addEventListener('pointerup', dirOff); dp.addEventListener('pointercancel', dirOff); dp.addEventListener('lostpointercapture', dirOff);
    /* 버튼 A B X Y (오른쪽 아래) */
    round('A', 8, 'right:18px', 'bottom:calc(76px + env(safe-area-inset-bottom,0px))', 54);
    round('B', 0, 'right:76px', 'bottom:calc(30px + env(safe-area-inset-bottom,0px))', 54);
    round('X', 9, 'right:76px', 'bottom:calc(112px + env(safe-area-inset-bottom,0px))', 46);
    round('Y', 1, 'right:134px', 'bottom:calc(70px + env(safe-area-inset-bottom,0px))', 46);
    pill('L', 10, 'left:18px', 'bottom:calc(172px + env(safe-area-inset-bottom,0px))');
    pill('R', 11, 'right:18px', 'bottom:calc(172px + env(safe-area-inset-bottom,0px))');
    pill('SELECT', 2, 'left:calc(50% - 76px)', 'bottom:calc(14px + env(safe-area-inset-bottom,0px))');
    pill('START', 3, 'left:calc(50% + 6px)', 'bottom:calc(14px + env(safe-area-inset-bottom,0px))');
    return pad;
  }

  /* 게임패드(컨트롤러) */
  var PADMAP = { 0: 0, 1: 8, 2: 1, 3: 9, 4: 10, 5: 11, 6: 12, 7: 13, 8: 2, 9: 3, 10: 14, 11: 15, 12: 4, 13: 5, 14: 6, 15: 7 };
  function pollPad() {
    if (!guest.ov) return;
    try {
      var gp = (navigator.getGamepads && navigator.getGamepads()) || [];
      for (var n = 0; n < gp.length; n++) {
        var g = gp[n]; if (!g || !g.connected) continue;
        var on = {};
        for (var b = 0; b < g.buttons.length; b++) if (PADMAP[b] != null && g.buttons[b].pressed) on[PADMAP[b]] = 1;
        var ax = g.axes[0] || 0, ay = g.axes[1] || 0;
        if (ax < -.5) on[6] = 1; if (ax > .5) on[7] = 1; if (ay < -.5) on[4] = 1; if (ay > .5) on[5] = 1;
        for (var i = 0; i < 16; i++) gset('g', i, on[i] ? 1 : 0);
        break;
      }
    } catch (e) {}
    guest.raf = requestAnimationFrame(pollPad);
  }

  /* ======================================================================
     시작
     ====================================================================== */
  function init() {
    if (!document.body) return setTimeout(init, 50);
    buildPill(); buildPanel(); refreshPill();
  }
  init();

  window.NetPlay = { open: function () { openPanel(); }, host: host };
})();
