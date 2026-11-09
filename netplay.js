/* =====================================================================
   netplay.js — '친구와 함께' (온라인 같이 하기) 공통 스크립트

   방식(화면 중계)
   · 방장  : 평소처럼 게임 ROM 을 불러와 실행합니다. '친구와 함께 → 방 만들기' 를 누르면
             6자리 연결코드가 나옵니다.
   · 친구  : 같은 사이트에서 '친구와 함께 → 코드로 참가하기' 에 코드를 넣으면
             방장의 게임 화면·소리가 실시간으로 나오고, 친구의 버튼 입력은 방장 게임의
             2P(3P·4P) 조작으로 전달됩니다. (친구는 ROM 파일이 필요 없습니다)
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
  function simulate(info, player, idx, val) {
    var gm = info.gm;
    try {
      if (typeof gm.simulateInput === 'function') gm.simulateInput(player, idx, val);
      else gm.functions.simulateInput(player, idx, val);
    } catch (e) {}
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
     화면(UI)
     ====================================================================== */
  var ui = {};
  var css = 'font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif;';

  /* '친구와 함께' 버튼을 각 페이지의 에뮬레이터 상단 메뉴에 넣습니다.
     (메뉴가 다시 만들어져도 0.5초마다 확인해서 다시 붙여 줍니다) */
  function labelText(kind) {
    var t = host.active && host.code ? '🟢 방 ' + host.code + (connectedCount() ? ' · ' + connectedCount() + '명' : '') : '👥 친구와 함께';
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
    if (host.active) view = 'host';
    if (view === 'home') {
      el('div', 'font-size:13px;line-height:1.55;color:#cdd3f5', '같은 사이트에 접속한 친구와 연결코드(번호)로 바로 함께 할 수 있어요.<br>방장만 게임 ROM 이 있으면 돼요.', b);
      btn(b, '🏠 방 만들기 (내가 방장)', '#4b6bff', function () { view = 'host'; hostStart(); renderPanel(); });
      btn(b, '🔑 코드로 참가하기', '#2fa36b', function () { view = 'join'; renderPanel(); });
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
    var n = connectedCount();
    var st = el('div', 'margin-top:12px;font-size:13px;line-height:1.6;color:#cdd3f5;background:rgba(255,255,255,.07);border-radius:12px;padding:10px 12px', '', b);
    var lines = [];
    var info = findEmu();
    lines.push(info ? '🎮 게임 실행 중' : '📂 게임 ROM 을 불러오면 친구 화면에 나와요');
    lines.push(n ? '👥 연결된 친구 ' + n + '명 (2P' + (n > 1 ? '~' + (n + 1) + 'P' : '') + ')' : '⏳ 친구를 기다리는 중…');
    st.innerHTML = lines.join('<br>');
    el('div', 'margin-top:8px;font-size:12px;color:#9aa3d8;line-height:1.5', '※ 친구는 2P 조작으로 들어와요. 2인 플레이가 되는 게임에서 사용하세요. 이 창은 닫아도 방은 유지돼요.', b);
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
      var g = { conn: conn, id: conn.peer, slot: slot + 1, open: true, down: {}, call: null, sig: '' };
      host.guests[slot] = g;
      try { conn.send({ t: 'hi', player: g.slot + 1 }); } catch (e) {}
      renderHost(); refreshPill();
    });
    conn.on('data', function (d) {
      var g = host.guests[slot]; if (!g || g.conn !== conn || !d) return;
      if (d.t === 'b' && d.i >= 0 && d.i < 16) {
        g.down[d.i] = d.v ? 1 : 0;
        var info = findEmu(); if (info) simulate(info, g.slot, d.i, d.v ? 1 : 0);
      }
    });
    function gone() {
      var g = host.guests[slot]; if (!g || g.conn !== conn) return;
      g.open = false;
      var info = findEmu();
      if (info) Object.keys(g.down).forEach(function (k) { if (g.down[k]) simulate(info, g.slot, +k, 0); });
      try { g.call && g.call.close(); } catch (e) {}
      host.guests[slot] = null;
      renderHost(); refreshPill();
    }
    conn.on('close', gone); conn.on('error', gone);
  }
  function hostStop() {
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
  function tune(call) {
    setTimeout(function () {
      try {
        call.peerConnection.getSenders().forEach(function (s) {
          if (!s.track || s.track.kind !== 'video') return;
          var p = s.getParameters(); if (!p.encodings || !p.encodings.length) p.encodings = [{}];
          p.encodings[0].maxBitrate = 5000000; p.encodings[0].maxFramerate = 60;
          p.degradationPreference = 'maintain-framerate';
          s.setParameters(p).catch(function () {});
        });
      } catch (e) {}
    }, 1200);
  }
  setInterval(function () {
    if (!host.active || !host.peer) return;
    var info = findEmu(), any = false;
    host.guests.forEach(function (g) {
      if (!g || !g.open) return;
      any = true;
      if (!info) {
        if (g.call) { try { g.call.close(); } catch (e) {} g.call = null; g.sig = ''; try { g.conn.send({ t: 'wait' }); } catch (e) {} }
        return;
      }
      var ms = makeStream(info); if (!ms) return;
      if (g.call && g.call.open !== false && g.sig === ms.sig) return;
      try { g.call && g.call.close(); } catch (e) {}
      try { g.call = host.peer.call(g.id, ms.stream); g.sig = ms.sig; tune(g.call); } catch (e) {}
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
      p.on('call', function (call) {
        call.answer();
        guest.call = call;
        call.on('stream', function (s) { showStream(s); });
      });
      p.on('open', function () {
        var conn = p.connect(PREFIX + code, { reliable: true });
        guest.conn = conn;
        conn.on('open', function () {
          done = true; clearTimeout(timer);
          report('연결됐어요!', true);
          closePanel();
          openGuestUI();
        });
        conn.on('data', function (d) {
          if (!d) return;
          if (d.t === 'hi') { guest.player = d.player; setStatus('방장의 게임을 기다리는 중… (나는 ' + d.player + 'P)'); }
          else if (d.t === 'wait') { setStatus('방장이 게임을 불러오면 화면이 나와요…'); }
          else if (d.t === 'full') { report('방이 가득 찼어요.', false); guestStop(true); }
        });
        conn.on('close', function () { setStatus('방장과 연결이 끊어졌어요.'); releaseAll(); });
        conn.on('error', function () { setStatus('연결 오류가 발생했어요.'); });
      });
    }, function (e) { report(e.message, false); });
  }
  function guestStop(silent) {
    try { releaseAll(); } catch (e) {}
    cancelAnimationFrame(guest.raf);
    try { guest.call && guest.call.close(); } catch (e) {}
    try { guest.conn && guest.conn.close(); } catch (e) {}
    try { guest.peer && guest.peer.destroy(); } catch (e) {}
    guest.call = guest.conn = guest.peer = null; guest.cur = {}; guest.src = { k: {}, t: {}, g: {} };
    if (guest.ov) { guest.ov.remove(); guest.ov = null; }
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKey, true);
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
