/* savebridge.js — 다른 에뮬레이터와 세이브를 주고받는 공통 모듈
   ─────────────────────────────────────────────────────────────────────────
   ■ 내보내기(저장): 게임 안에서 저장한 기록(SRAM / 메모리카드)을 표준 형식으로 내려받습니다.
       · .sav / .srm / .mcr / .mcd  … ROM 이름과 똑같은 이름으로 만들어 줍니다.
       · N64 는 RetroArch 용 .srm 과 단독 에뮬용 .eep/.sra/.fla/.mpk 묶음(zip) 둘 다 제공합니다.
       · 즉시저장(Save State)은 RetroArch 호환 이름(.state) 과 백업용(.GSV) 으로 저장합니다.
   ■ 불러오기: 다른 에뮬레이터에서 만든 세이브 파일(zip 포함, 여러 개 동시 선택 가능)을 자동으로 판별해 적용합니다.
       · 확장자·내용으로 게임 내 저장 / 즉시저장 / N64 조각 / 사이트 자체 형식(.GSV .WES .SAVEDATA)을 구분합니다.
       · 메모리카드의 DexDrive(.gme) 머리말, DeSmuME(.dsv) 꼬리말은 자동으로 떼어 냅니다.
   ■ 사용법:  SaveBridge.openSave(ctx)  /  SaveBridge.openLoad(ctx)  /  SaveBridge.importFiles(files, ctx)
       ctx = { win: 에뮬레이터 iframe 의 window, id: 기종 id(예 'gba'), fn: 파일 접두어, name: ROM 이름(확장자 없이),
               toast: 알림 함수(선택), verifyMeta: 사이트 자체 형식(.SAVEDATA) 확인 함수(선택) }
   ─────────────────────────────────────────────────────────────────────────
   주의: 즉시저장(State)은 '같은 코어 · 같은 버전'끼리만 호환됩니다(RetroArch 등 libretro 코어 사용 시).
        게임 내 저장(SRAM/메모리카드)은 형식이 표준이라 대부분의 에뮬레이터와 호환됩니다. */
(function (W) {
  'use strict';
  if (W.SaveBridge) return;

  /* ═════════════ 기본 도구 ═════════════ */
  function u8(x) {
    if (!x) return new Uint8Array(0);
    if (x instanceof Uint8Array) return x;
    if (x instanceof ArrayBuffer) return new Uint8Array(x);
    if (x.buffer instanceof ArrayBuffer) return new Uint8Array(x.buffer, x.byteOffset || 0, x.byteLength);
    return new Uint8Array(0);
  }
  function cat(list) {
    var n = 0, i, o, p = 0;
    for (i = 0; i < list.length; i++) n += list[i].length;
    o = new Uint8Array(n);
    for (i = 0; i < list.length; i++) { o.set(list[i], p); p += list[i].length; }
    return o;
  }
  function ascii(b, s, n) { var r = '', i; for (i = 0; i < n && s + i < b.length; i++) r += String.fromCharCode(b[s + i]); return r; }
  function rd32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  function rd16(b, o) { return b[o] | (b[o + 1] << 8); }
  function wr32(b, o, v) { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; b[o + 2] = (v >>> 16) & 255; b[o + 3] = (v >>> 24) & 255; }
  function wr16(b, o, v) { b[o] = v & 255; b[o + 1] = (v >>> 8) & 255; }
  function allSame(b, v) { for (var i = 0; i < b.length; i++) if (b[i] !== v) return false; return true; }
  function isBlank(b) { return !b || !b.length || allSame(b, 0) || allSame(b, 255); }
  function same(a, b, n) { n = Math.min(n || 1e9, a.length, b.length); for (var i = 0; i < n; i++) if (a[i] !== b[i]) return false; return n > 0; }
  function pad(b, n) { if (b.length >= n) return b.subarray(0, n); var o = new Uint8Array(n); o.set(b); return o; }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(2).replace(/\.?0+$/, '') + 'MB' : n >= 1024 ? Math.round(n / 1024) + 'KB' : n + 'B'; }
  function safeName(s) { return String(s || 'GAME').replace(/[\\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').trim().slice(0, 80) || 'GAME'; }
  function extOf(n) { var m = /\.([^.\/\\]+)$/.exec(n || ''); return m ? m[1].toLowerCase() : ''; }
  function stampNow() { var n = new Date(), p = function (v) { return String(v).padStart(2, '0'); }; return p(n.getMonth() + 1) + p(n.getDate()) + p(n.getHours()) + p(n.getMinutes()); }
  function download(blob, name) {
    var D = W.document, a = D.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; a.style.display = 'none';
    D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  /* ═════════════ CRC32 · ZIP ═════════════ */
  var CRCT = null;
  function crc32(b) {
    var i, j, c;
    if (!CRCT) { CRCT = new Uint32Array(256); for (i = 0; i < 256; i++) { c = i; for (j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); CRCT[i] = c >>> 0; } }
    c = 0xFFFFFFFF;
    for (i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 255] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  var TE = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  var TD = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

  /* 압축 없는(store) zip 만들기 */
  function zipWrite(files) {
    var parts = [], cd = [], off = 0, i, f, nm, crc, lh, ch, d = new Date();
    var dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    for (i = 0; i < files.length; i++) {
      f = files[i]; nm = TE.encode(f.name); crc = crc32(f.data);
      lh = new Uint8Array(30 + nm.length);
      wr32(lh, 0, 0x04034b50); wr16(lh, 4, 20); wr16(lh, 6, 0x0800); wr16(lh, 8, 0); wr16(lh, 10, tm); wr16(lh, 12, dt);
      wr32(lh, 14, crc); wr32(lh, 18, f.data.length); wr32(lh, 22, f.data.length); wr16(lh, 26, nm.length); wr16(lh, 28, 0);
      lh.set(nm, 30);
      ch = new Uint8Array(46 + nm.length);
      wr32(ch, 0, 0x02014b50); wr16(ch, 4, 20); wr16(ch, 6, 20); wr16(ch, 8, 0x0800); wr16(ch, 10, 0); wr16(ch, 12, tm); wr16(ch, 14, dt);
      wr32(ch, 16, crc); wr32(ch, 20, f.data.length); wr32(ch, 24, f.data.length); wr16(ch, 28, nm.length);
      wr32(ch, 42, off); ch.set(nm, 46);
      parts.push(lh, f.data); cd.push(ch); off += lh.length + f.data.length;
    }
    var cdAll = cat(cd), end = new Uint8Array(22);
    wr32(end, 0, 0x06054b50); wr16(end, 8, files.length); wr16(end, 10, files.length); wr32(end, 12, cdAll.length); wr32(end, 16, off);
    return cat(parts.concat([cdAll, end]));
  }
  function inflate(data, fmt) {
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('NOZLIB'));
    var ds = new DecompressionStream(fmt);
    return new Response(new Blob([data]).stream().pipeThrough(ds)).arrayBuffer().then(u8);
  }
  function isZip(b) { return b.length > 22 && b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5) && (b[3] === 4 || b[3] === 6); }
  /* zip 읽기 → Promise<[{name,data}]> */
  function zipRead(b) {
    var e = -1, i, n, cdo, cnt, p, out = [], jobs = [];
    for (i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) { if (rd32(b, i) === 0x06054b50) { e = i; break; } }
    if (e < 0) return Promise.reject(new Error('BADZIP'));
    cnt = rd16(b, e + 10); cdo = rd32(b, e + 16); p = cdo;
    for (n = 0; n < cnt; n++) {
      if (p + 46 > b.length || rd32(b, p) !== 0x02014b50) break;
      (function (p) {
        var meth = rd16(b, p + 10), cs = rd32(b, p + 20), us = rd32(b, p + 24), nl = rd16(b, p + 28), xl = rd16(b, p + 30), cl = rd16(b, p + 32), lo = rd32(b, p + 42);
        var name = TD.decode(b.subarray(p + 46, p + 46 + nl));
        if (/\/$/.test(name) || /^__MACOSX\//.test(name) || /(^|\/)\._/.test(name)) return;
        if (rd32(b, lo) !== 0x04034b50) return;
        var ds = lo + 30 + rd16(b, lo + 26) + rd16(b, lo + 28), raw = b.subarray(ds, ds + cs);
        if (meth === 0) jobs.push(Promise.resolve({ name: name, data: raw.slice() }));
        else if (meth === 8) jobs.push(inflate(raw, 'deflate-raw').then(function (d) { return { name: name, data: d }; }));
        void us;
      })(p);
      p += 46 + rd16(b, p + 28) + rd16(b, p + 30) + rd16(b, p + 32);
    }
    return Promise.all(jobs);
  }

  /* ═════════════ RetroArch 즉시저장 형식 (RZIP · RASTATE) ═════════════ */
  function isRZip(b) { return b.length > 20 && ascii(b, 0, 6) === '#RZIPv'; }
  function isRaState(b) { return b.length > 16 && ascii(b, 0, 7) === 'RASTATE'; }
  /* RZIP: 20바이트 머리말 뒤에 [4바이트 크기 + zlib 데이터] 조각들이 이어집니다 */
  function rzipDecode(b) {
    var p = 20, jobs = [], sz;
    while (p + 4 <= b.length) {
      sz = rd32(b, p); p += 4;
      if (!sz || p + sz > b.length) break;
      jobs.push(inflate(b.subarray(p, p + sz), 'deflate'));
      p += sz;
    }
    return Promise.all(jobs).then(cat);
  }
  /* RASTATE: 8바이트 머리말 뒤에 [4글자 이름 + 4바이트 크기 + 데이터(8바이트 정렬)] 블록들. 'MEM ' 이 코어 상태입니다 */
  function raStateUnwrap(b) {
    var p = 8, id, sz;
    while (p + 8 <= b.length) {
      id = ascii(b, p, 4); sz = rd32(b, p + 4); p += 8;
      if (id === 'MEM ') return b.subarray(p, Math.min(b.length, p + sz));
      if (id === 'END ') break;
      p += (sz + 7) & ~7;
    }
    return null;
  }
  /* 상태 파일을 '원본 코어 상태(raw)'로 풀어 줍니다 */
  function toRawState(b) {
    var p = Promise.resolve(b);
    if (isRZip(b)) p = rzipDecode(b);
    return p.then(function (x) { if (isRaState(x)) { var m = raStateUnwrap(x); if (m) return m; } return x; });
  }

  /* ═════════════ 사이트 자체 형식 (.SAVEDATA = YHSAVEDATA1 + 메타 + 상태) ═════════════ */
  var SV_MAGIC = 'YHSAVEDATA1';
  function unpackSave(buf) {
    var u = u8(buf), n, t;
    if (u.length < 8) return null;
    n = ((u[0] << 24) | (u[1] << 16) | (u[2] << 8) | u[3]) >>> 0;
    if (n <= SV_MAGIC.length || 4 + n > u.length) return null;
    t = TD.decode(u.subarray(4, 4 + n));
    if (t.indexOf(SV_MAGIC) !== 0) return null;
    try { return { meta: JSON.parse(t.slice(SV_MAGIC.length)), state: u.subarray(4 + n) }; } catch (e) { return null; }
  }

  /* ═════════════ N64 : libretro .srm ↔ 단독 에뮬 .eep/.sra/.fla/.mpk ═════════════
     libretro(mupen64plus-next) .srm 구조 = EEPROM 2KB + 컨트롤러팩 4×32KB + SRAM 32KB + FlashRAM 128KB = 296,960 바이트 */
  var N64 = { EEP: 0x800, MPK: 0x8000, SRA: 0x8000, FLA: 0x20000, TOTAL: 0x48800 };
  N64.O_MPK = N64.EEP; N64.O_SRA = N64.O_MPK + 4 * N64.MPK; N64.O_FLA = N64.O_SRA + N64.SRA;
  function n64Split(b) {
    if (b.length < N64.TOTAL) b = pad(b, N64.TOTAL);
    var eep = b.subarray(0, N64.EEP), mpk = b.subarray(N64.O_MPK, N64.O_SRA), sra = b.subarray(N64.O_SRA, N64.O_FLA), fla = b.subarray(N64.O_FLA, N64.TOTAL), out = {};
    if (!isBlank(eep)) out.eep = allSame(eep.subarray(512), 0) || allSame(eep.subarray(512), 255) ? eep.slice(0, 512) : eep.slice();
    if (!isBlank(mpk)) out.mpk = mpk.slice();
    if (!isBlank(sra)) out.sra = sra.slice();
    if (!isBlank(fla)) out.fla = fla.slice();
    return out;
  }
  /* base: 현재 게임의 .srm(없으면 0으로 채움) 위에 조각을 덮어씁니다 */
  function n64Merge(base, parts) {
    var o = pad(base && base.length ? base.slice() : new Uint8Array(N64.TOTAL), N64.TOTAL).slice(), i, p, r = [];
    for (i = 0; i < parts.length; i++) {
      p = parts[i];
      if (p.ext === 'eep') { o.set(pad(p.data, N64.EEP), 0); r.push('EEPROM'); }
      else if (p.ext === 'sra') { o.set(pad(p.data, N64.SRA), N64.O_SRA); r.push('SRAM'); }
      else if (p.ext === 'fla') { o.set(pad(p.data, N64.FLA), N64.O_FLA); r.push('FlashRAM'); }
      else if (p.ext === 'mpk') {
        if (p.data.length > N64.MPK) { o.set(pad(p.data, 4 * N64.MPK), N64.O_MPK); r.push('컨트롤러팩 1~4'); }
        else { o.set(pad(p.data, N64.MPK), N64.O_MPK); r.push('컨트롤러팩 1'); }
      }
    }
    return { data: o, parts: r };
  }

  /* ═════════════ 기타 형식 보정 ═════════════ */
  /* DeSmuME .dsv : 원본 세이브 뒤에 '|<--Snip above here…' 꼬리말이 붙어 있습니다 */
  function dsStrip(b) {
    var key = '|<--Snip above here', s = ascii(b, Math.max(0, b.length - 400), 400), i = s.indexOf(key);
    return i < 0 ? null : b.subarray(0, Math.max(0, b.length - 400) + i);
  }
  /* DexDrive .gme : 메모리카드 앞에 3904바이트 머리말 */
  function gmeStrip(b) { return (b.length === 131072 + 3904 && ascii(b, 0, 11) === '123-456-STD') ? b.subarray(3904) : null; }

  /* ═════════════ 기종 표 ═════════════
     kind: raw(그대로) · n64 · psx · none(게임 내 저장 없음)
     exts: 내려받기 버튼 [확장자, 설명]   lr: 보통 쓰이는 libretro 코어(RetroArch/Lemuroid 계열) */
  var LR = ['srm', 'RetroArch · Lemuroid · Provenance · OpenEmu 등 libretro 계열'];
  var SYS = {
    nes: { kind: 'raw', lr: 'fceumm', exts: [LR, ['sav', 'FCEUX · Mesen · Nestopia UE · NES.emu · Delta · Ignited · SkyEmu · Folium']] },
    snes: { kind: 'raw', lr: 'snes9x', exts: [LR, ['sav', 'Snes9x · bsnes · Snes9x EX+ · Delta · Ignited · SkyEmu · Folium']] },
    gb: { kind: 'raw', lr: 'gambatte', exts: [LR, ['sav', 'mGBA · SameBoy · Gearboy · Pizza Boy · My OldBoy! · Delta · Ignited · SkyEmu · Folium']] },
    gbc: { kind: 'raw', lr: 'gambatte', exts: [LR, ['sav', 'mGBA · SameBoy · Gearboy · Pizza Boy · My OldBoy! · Delta · Ignited · SkyEmu · Folium']] },
    gba: { kind: 'raw', lr: 'mgba', exts: [LR, ['sav', 'mGBA · VisualBoyAdvance-M · Pizza Boy · My Boy! · Delta · Ignited · SkyEmu · Folium']] },
    md: { kind: 'raw', lr: 'genesis_plus_gx', exts: [LR, ['sav', 'Kega Fusion · Gens · PicoDrive · MD.emu · Genesis Plus GX · Folium']] },
    sms: { kind: 'raw', lr: 'genesis_plus_gx', exts: [LR, ['sav', '그 외 마스터 시스템 에뮬레이터']] },
    gg: { kind: 'raw', lr: 'genesis_plus_gx', exts: [LR, ['sav', '그 외 게임기어 에뮬레이터']] },
    s32x: { kind: 'raw', lr: 'picodrive', exts: [LR, ['sav', 'PicoDrive 등']], exp: 1 },
    pce: { kind: 'raw', lr: 'mednafen_pce_fast', exts: [LR, ['sav', 'Mednafen 등']], exp: 1 },
    atari2600: { kind: 'raw', lr: 'stella2014', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    lynx: { kind: 'raw', lr: 'handy', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    vb: { kind: 'raw', lr: 'beetle_vb', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    ngp: { kind: 'raw', lr: 'mednafen_ngp', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    jaguar: { kind: 'raw', lr: 'virtualjaguar', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    segacd: { kind: 'raw', lr: 'genesis_plus_gx', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    saturn: { kind: 'raw', lr: 'yabause', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    '3do': { kind: 'raw', lr: 'opera', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 },
    nds: { kind: 'raw', lr: 'desmume2015 / melonds', exts: [['sav', 'melonDS · DeSmuME(백업메모리 가져오기) · DraStic · Delta · Ignited · Folium · Manic EMU'], LR] },
    psx: { kind: 'psx', lr: 'pcsx_rearmed', exts: [LR, ['mcd', 'DuckStation · PCSX-Redux · Provenance 등 (128KB 메모리카드)'], ['mcr', 'ePSXe · FPse · 그 외 (128KB 메모리카드)']] },
    n64: { kind: 'n64', lr: 'mupen64plus_next', exts: [LR] },
    mamegame: { kind: 'none', lr: 'fbneo / mame2003_plus', exts: [] }
  };
  var FALLBACK = { kind: 'raw', lr: '', exts: [LR, ['sav', '그 외 에뮬레이터']], exp: 1 };
  function sysOf(ctx) { return SYS[ctx.id] || FALLBACK; }

  /* ═════════════ EmulatorJS 접근 ═════════════ */
  function ejs(ctx) {
    var w = ctx && ctx.win, E = w && w.EJS_emulator, gm = E && E.gameManager;
    if (!gm) { var er = new Error('NOGAME'); er.code = 'NOGAME'; throw er; }
    return { E: E, gm: gm, FS: gm.FS || (E.Module && E.Module.FS) || null };
  }
  function savePath(o) {
    var p, FS = o.FS, d, i, l, j;
    try { if (typeof o.gm.getSaveFilePath === 'function') { p = o.gm.getSaveFilePath(); if (p) return p; } } catch (e) { }
    if (FS) {
      d = ['/data/saves', '/saves', '/home/web_user/retroarch/userdata/saves'];
      for (i = 0; i < d.length; i++) {
        try { if (FS.analyzePath(d[i]).exists) { l = FS.readdir(d[i]); for (j = 0; j < l.length; j++) if (/\.srm$/i.test(l[j])) return d[i] + '/' + l[j]; } } catch (e) { }
      }
    }
    return null;
  }
  /* 게임 내 저장(SRAM) 읽기. 없으면 null */
  function readSram(ctx) {
    var o = ejs(ctx), s = null, p;
    try { if (typeof o.gm.getSaveFile === 'function') s = o.gm.getSaveFile(true); } catch (e) { s = null; }
    if ((!s || !s.length) && o.FS) {
      try { p = savePath(o); if (p && o.FS.analyzePath(p).exists) s = o.FS.readFile(p); } catch (e) { }
    }
    return s && s.length ? new Uint8Array(s) : null;
  }
  /* 게임 내 저장(SRAM) 쓰기 + 코어에 반영. 반영 확인 여부를 돌려줍니다 */
  function writeSram(ctx, bytes) {
    var o = ejs(ctx), p = savePath(o), back, dir;
    if (!o.FS) throw new Error('NOFS');
    if (!p) p = '/data/saves/' + safeName(ctx.name || 'game') + '.srm';
    try { dir = p.replace(/\/[^\/]*$/, ''); if (dir && !o.FS.analyzePath(dir).exists) o.FS.mkdirTree ? o.FS.mkdirTree(dir) : o.FS.mkdir(dir); } catch (e) { }
    o.FS.writeFile(p, bytes);
    if (typeof o.gm.loadSaveFiles !== 'function') { var er = new Error('NOLOAD'); er.code = 'NOLOAD'; throw er; }
    o.gm.loadSaveFiles();
    try { back = readSram(ctx); } catch (e) { back = null; }
    return !!(back && same(back, bytes, Math.min(bytes.length, 65536)));
  }
  function restartGame(ctx) { try { ejs(ctx).gm.restart(); return true; } catch (e) { return false; } }
  function getState(ctx) { var o = ejs(ctx); return u8(o.gm.getState()); }
  function loadState(ctx, bytes) { ejs(ctx).gm.loadState(bytes); }
  /* 이 사이트 엔진이 쓰는 즉시저장의 모양: 'raw' | 'rastate' | 'rzip' */
  function nativeFlavor(ctx) {
    try { var s = getState(ctx); return isRZip(s) ? 'rzip' : isRaState(s) ? 'rastate' : 'raw'; } catch (e) { return 'unknown'; }
  }

  /* ═════════════ 화면(모달) ═════════════ */
  var CSS = '#sb-ov{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.66);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI","Noto Sans KR","Malgun Gothic",sans-serif;-webkit-user-select:none;user-select:none}' +
    '#sb-card{width:100%;max-width:480px;max-height:88vh;max-height:88dvh;overflow:auto;background:#161a26;color:#eef1f8;border:1px solid #2d3550;border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.6);padding:16px 16px 14px;box-sizing:border-box;-webkit-overflow-scrolling:touch}' +
    '#sb-card h3{margin:0 0 4px;font-size:18px;font-weight:800}' +
    '#sb-card .sb-sub{margin:0 0 12px;font-size:12.5px;line-height:1.5;color:#9aa6c4}' +
    '#sb-card .sb-h{margin:14px 0 6px;font-size:13.5px;font-weight:800;color:#8fb4ff}' +
    '#sb-card .sb-note{margin:6px 0 0;font-size:12px;line-height:1.5;color:#9aa6c4}' +
    '#sb-card .sb-warn{margin:6px 0 0;font-size:12px;line-height:1.5;color:#ffcf70}' +
    '#sb-card .sb-st{margin:0 0 8px;font-size:12.5px;color:#c9d3ee}' +
    '#sb-card button{display:block;width:100%;min-height:46px;margin:6px 0 0;padding:9px 12px;border-radius:12px;border:1px solid #38426a;background:#212843;color:#eef1f8;font:inherit;font-size:14px;font-weight:700;text-align:left;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}' +
    '#sb-card button small{display:block;margin-top:2px;font-size:11.5px;font-weight:400;color:#a7b3d3;line-height:1.4}' +
    '#sb-card button:active{background:#2b3560}' +
    '#sb-card button.sb-pri{background:#3563e9;border-color:#4d79ff}#sb-card button.sb-pri small{color:#dbe5ff}' +
    '#sb-card button[disabled]{opacity:.45;cursor:not-allowed}' +
    '#sb-card button.sb-x{text-align:center;background:transparent;margin-top:12px}' +
    '#sb-card label.sb-ck{display:flex;gap:8px;align-items:center;margin:10px 0 0;font-size:13px;color:#dfe6fa}' +
    '#sb-card ul{margin:6px 0 0;padding:0;list-style:none}#sb-card li{margin:4px 0;font-size:13px;line-height:1.45}' +
    '#sb-card .ok{color:#7ee2a0}#sb-card .wn{color:#ffcf70}#sb-card .er{color:#ff8d8d}';
  var ov = null, onEsc = null;
  function closeModal() {
    if (ov) { ov.remove(); ov = null; }
    if (onEsc) { W.document.removeEventListener('keydown', onEsc, true); onEsc = null; }
  }
  function el(tag, cls, txt, parent) {
    var e = W.document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    if (parent) parent.appendChild(e);
    return e;
  }
  function modal(title, sub) {
    var D = W.document;
    closeModal();
    if (!D.getElementById('sb-css')) { var st = el('style'); st.id = 'sb-css'; st.textContent = CSS; (D.head || D.documentElement).appendChild(st); }
    ov = el('div'); ov.id = 'sb-ov';
    var card = el('div', null, null, ov); card.id = 'sb-card';
    el('h3', null, title, card);
    if (sub) el('p', 'sb-sub', sub, card);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    onEsc = function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeModal(); } };
    D.addEventListener('keydown', onEsc, true);
    D.body.appendChild(ov);
    return card;
  }
  function btn(parent, label, small, fn, cls) {
    var b = el('button', cls || '', null, parent);
    b.type = 'button';
    el('span', null, label, b);
    if (small) el('small', null, small, b);
    b.onclick = fn;
    return b;
  }
  function closeBtn(card, label) { return btn(card, label || '닫기', '', closeModal, 'sb-x'); }
  /* 선택 창: buttons=[{t,s,pri}] → Promise<선택한 번호 | -1> */
  function ask(title, msg, buttons) {
    return new Promise(function (res) {
      var card = modal(title, msg), done = false;
      function fin(v) { if (done) return; done = true; res(v); }
      buttons.forEach(function (b, i) { btn(card, b.t, b.s, function () { fin(i); }, b.pri ? 'sb-pri' : ''); });
      btn(card, '취소', '', function () { fin(-1); closeModal(); }, 'sb-x');
      ov.addEventListener('click', function (e) { if (e.target === ov) fin(-1); });
    });
  }
  function say(ctx, m) {
    if (ctx && typeof ctx.toast === 'function') { try { ctx.toast(m); return; } catch (e) { } }
    try { var t = W.document.getElementById('sb-toast'); if (!t) { t = el('div', null, null, W.document.body); t.id = 'sb-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:2147483001;background:#000c;color:#fff;padding:9px 14px;border-radius:99px;font:600 13px system-ui;max-width:90vw'; } t.textContent = m; t.style.display = 'block'; clearTimeout(t._t); t._t = setTimeout(function () { t.style.display = 'none'; }, 2600); } catch (e) { }
  }
  function errMsg(e) {
    var c = e && (e.code || e.message);
    if (c === 'NOGAME') return '게임이 시작된 뒤에 다시 시도해 주세요.';
    if (c === 'NOLOAD') return '이 에뮬레이터 버전에서는 게임 중 세이브 적용을 지원하지 않아요. 새로고침 후 다시 시도해 주세요.';
    if (c === 'NOZLIB') return '이 브라우저는 zip 해제를 지원하지 않아요. zip 을 풀어서 안의 파일을 직접 선택해 주세요.';
    if (c === 'BADZIP') return 'zip 파일을 읽지 못했어요.';
    return (e && e.message) || '알 수 없는 오류';
  }

  /* ═════════════ 내보내기 ═════════════ */
  function romBase(ctx) { return safeName(ctx.name || 'GAME'); }
  function variantBytes(sys, ext, sram) {
    return sram;   /* raw / psx / nds / n64(.srm) 모두 libretro 가 주는 그대로. (n64 단독 조각은 별도 zip) */
  }
  function openSave(ctx) {
    var sys = sysOf(ctx), base = romBase(ctx), card, sram = null, fail = null, flavor;
    try { ejs(ctx); } catch (e) { say(ctx, '먼저 게임을 시작해 주세요'); return; }
    try { sram = readSram(ctx); } catch (e) { fail = e; }
    card = modal('💾 세이브 저장', '저장 파일 이름은 ROM 이름(' + base + ')과 똑같이 만들어요. 다른 에뮬레이터에서는 ROM과 같은 이름이어야 세이브를 찾습니다.');

    /* ─ 게임 내 저장 ─ */
    if (sys.kind !== 'none') {
      el('div', 'sb-h', '① 게임 내 저장 파일 — 다른 에뮬레이터와 호환', card);
      var blank = isBlank(sram);
      el('div', 'sb-st', !sram ? '현재 게임에는 게임 내 저장 기록이 없어요. 게임 메뉴의 "저장(SAVE)"으로 먼저 저장해 주세요.' :
        (blank ? '⚠ 저장 기록이 비어 있는 것처럼 보여요 (' + kb(sram.length) + ')' : '✔ 저장 기록 ' + kb(sram.length) + ' 확인됨'), card);
      sys.exts.forEach(function (x) {
        var ext = x[0], name = base + '.' + ext;
        btn(card, '.' + ext + ' 로 저장', x[1], function () {
          try {
            var d = readSram(ctx);
            if (!d) { say(ctx, '저장할 게임 내 기록이 없어요'); return; }
            download(new Blob([variantBytes(sys, ext, d)]), name);
            say(ctx, '💾 저장됨: ' + name);
          } catch (e) { say(ctx, '저장 실패: ' + errMsg(e)); }
        }, ext === sys.exts[0][0] ? 'sb-pri' : '').disabled = !sram;
      });
      if (sys.kind === 'n64') {
        btn(card, 'N64 단독 에뮬용 묶음(.zip)', 'Project64 · Mupen64Plus · M64Plus FZ 등 — .eep / .sra / .fla / .mpk 로 나눠 담아요', function () {
          try {
            var d = readSram(ctx), p = d && n64Split(d), files = [], k;
            if (!p || !Object.keys(p).length) { say(ctx, '저장할 게임 내 기록이 없어요'); return; }
            for (k in p) files.push({ name: base + '.' + k, data: p[k] });
            download(new Blob([zipWrite(files)], { type: 'application/zip' }), base + '_N64save.zip');
            say(ctx, '💾 저장됨: ' + base + '_N64save.zip (' + files.map(function (f) { return f.name.split('.').pop(); }).join(' · ') + ')');
          } catch (e) { say(ctx, '저장 실패: ' + errMsg(e)); }
        }).disabled = !sram;
      }
      if (sys.exp) el('div', 'sb-warn', '⚠ 이 기종은 에뮬레이터마다 저장 형식이 달라 호환이 보장되지 않아요. (같은 libretro 코어끼리는 대체로 잘 됩니다)', card);
      if (sys.kind === 'n64') el('div', 'sb-note', 'N64: .srm 은 RetroArch/Lemuroid 용(EEPROM·컨트롤러팩·SRAM·Flash 통합 형식), 단독 에뮬은 묶음(zip)을 푼 파일을 쓰세요.', card);
    } else {
      el('div', 'sb-h', '① 게임 내 저장 파일', card);
      el('div', 'sb-note', '아케이드(마메) 게임은 게임 내 저장 파일이 없어 즉시저장만 사용할 수 있어요.', card);
    }

    /* ─ 즉시저장 ─ */
    el('div', 'sb-h', '② 즉시저장 (Save State) — 현재 화면 그대로', card);
    btn(card, '.state 로 저장 (RetroArch 호환 이름)', 'RetroArch 에서 같은 코어' + (sys.lr ? '(' + sys.lr + ')' : '') + '로 실행할 때 "상태 불러오기"로 쓸 수 있어요', function () {
      try { var s = getState(ctx), n = base + '.state'; download(new Blob([s]), n); say(ctx, '💾 저장됨: ' + n); }
      catch (e) { say(ctx, '저장 실패: ' + errMsg(e)); }
    });
    btn(card, '.GSV 로 저장 (사이트 백업용 · 시간 기록)', '이 사이트에서만 다시 불러올 때 편해요', function () {
      try { var s = getState(ctx), g = String(ctx.name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 14) || 'GAME', n = (ctx.fn || '') + g + '_' + stampNow() + '.GSV'; download(new Blob([s]), n); say(ctx, '💾 저장됨: ' + n); }
      catch (e) { say(ctx, '저장 실패: ' + errMsg(e)); }
    });
    el('div', 'sb-warn', '※ 즉시저장은 에뮬레이터 종류·코어 버전이 다르면 열리지 않아요. 다른 에뮬레이터로 옮길 때는 ①게임 내 저장을 쓰세요.', card);
    void flavor; void fail;
    btn(card, '📥 세이브 불러오기…', '', function () { openLoad(ctx); });
    closeBtn(card);
  }

  /* ═════════════ 불러오기 ═════════════ */
  var STATE_RX = /\.(state\d*|state\.auto|gsv|wes|savedata|sstate\d*|st\d|ss\d)$/i;
  var SRAM_EXT = { sav: 1, srm: 1, mcr: 1, mcd: 1, mc: 1, mc2: 1, mcr1: 1, ps: 1, ps1: 1, dsv: 1, brm: 1, bkr: 1, ram: 1, nv: 1, mem: 1, gme: 1, sram: 1 };
  var N64_EXT = { eep: 1, sra: 1, fla: 1, mpk: 1 };

  /* 파일 → 판별: {kind:'state'|'sram'|'n64'|'unknown', ...} */
  function classify(f) {
    var ext = extOf(f.name), pk, r;
    pk = unpackSave(f.data);
    if (pk) return { kind: 'state', name: f.name, data: pk.state, meta: pk.meta, how: '사이트 세이브(.SAVEDATA)' };
    if (isRZip(f.data) || isRaState(f.data)) return { kind: 'state', name: f.name, data: f.data, how: 'RetroArch 즉시저장' };
    if (STATE_RX.test(f.name)) return { kind: 'state', name: f.name, data: f.data, how: ext === 'gsv' || ext === 'wes' ? '사이트 즉시저장(.' + ext.toUpperCase() + ')' : '즉시저장(.' + ext + ')' };
    if (N64_EXT[ext]) return { kind: 'n64', name: f.name, ext: ext, data: f.data, how: 'N64 ' + ext.toUpperCase() };
    if (SRAM_EXT[ext]) {
      r = f.data;
      var x = dsStrip(r); if (x) { r = x; }
      var g = gmeStrip(r); if (g) { r = g; }
      return { kind: 'sram', name: f.name, data: r, how: '게임 내 저장(.' + ext + ')' + (x ? ' · DeSmuME 꼬리말 제거' : '') + (g ? ' · DexDrive 머리말 제거' : '') };
    }
    return { kind: 'unknown', name: f.name, data: f.data };
  }

  function openLoad(ctx) {
    var D = W.document, inp = D.createElement('input');
    try { ejs(ctx); } catch (e) { say(ctx, '먼저 게임을 시작해 주세요'); return; }
    inp.type = 'file'; inp.multiple = true; inp.style.display = 'none';
    inp.onchange = function () { var fl = Array.prototype.slice.call(inp.files || []); inp.remove(); if (fl.length) importFiles(fl, ctx); };
    D.body.appendChild(inp);
    var card = modal('📥 세이브 불러오기', '다른 에뮬레이터에서 만든 세이브 파일을 골라 주세요. 종류는 자동으로 알아봅니다. (여러 개 · zip 가능)');
    el('div', 'sb-note', '지원: .sav .srm .mcr .mcd .dsv .eep .sra .fla .mpk (게임 내 저장) · .state .state1 .GSV .WES .SAVEDATA (즉시저장) · zip', card);
    el('div', 'sb-warn', '※ 먼저 현재 게임의 세이브를 저장해 두세요. 불러오면 지금 진행 상황이 바뀝니다.', card);
    btn(card, '📂 파일 선택', '', function () { inp.click(); }, 'sb-pri');
    closeBtn(card);
  }

  async function importFiles(fileList, ctx) {
    var items = [], i, f, b, ents, j;
    try { ejs(ctx); } catch (e) { say(ctx, '먼저 게임을 시작해 주세요'); return; }
    var wait = modal('📥 세이브 불러오기', '파일을 읽는 중…');
    try {
      for (i = 0; i < fileList.length; i++) {
        f = fileList[i]; b = u8(await f.arrayBuffer());
        if (isZip(b) && !/\.(gsv|wes|savedata|state\d*|sav|srm)$/i.test(f.name)) {
          ents = await zipRead(b);
          for (j = 0; j < ents.length; j++) items.push({ name: ents[j].name.split('/').pop(), data: ents[j].data });
        } else items.push({ name: f.name, data: b });
      }
    } catch (e) { var c0 = modal('📥 세이브 불러오기'); el('div', 'sb-warn', '✖ ' + errMsg(e), c0); closeBtn(c0); return; }
    void wait;

    var cl = items.map(classify), log = [], n64 = [], sramItem = null, stateItem = null, k, it;
    for (k = 0; k < cl.length; k++) {
      it = cl[k];
      if (it.kind === 'unknown') {
        var a = await ask('종류를 알 수 없어요', '"' + it.name + '" (' + kb(it.data.length) + ') — 어떤 파일인가요?', [
          { t: '게임 내 저장 파일', s: '.sav / 메모리카드 같은 일반 세이브' }, { t: '즉시저장(Save State)', s: 'RetroArch .state 같은 상태 파일' }]);
        if (a < 0) { log.push(['wn', '건너뜀: ' + it.name]); continue; }
        it.kind = a === 0 ? 'sram' : 'state'; it.how = a === 0 ? '게임 내 저장(직접 선택)' : '즉시저장(직접 선택)';
      }
      if (it.kind === 'n64') n64.push(it);
      else if (it.kind === 'sram') { if (sramItem) log.push(['wn', '게임 내 저장 파일이 여러 개라 첫 번째만 사용: ' + sramItem.name]); else sramItem = it; }
      else if (it.kind === 'state') { if (stateItem) log.push(['wn', '즉시저장이 여러 개라 첫 번째만 사용: ' + stateItem.name]); else stateItem = it; }
    }
    if (!sramItem && !stateItem && !n64.length) { var c1 = modal('📥 세이브 불러오기'); (log.length ? log : [['er', '적용할 세이브를 찾지 못했어요.']]).forEach(function (l) { el('div', l[0] === 'er' ? 'sb-warn' : 'sb-note', l[1], c1); }); closeBtn(c1); return; }

    /* 적용 전 확인 */
    var sys = sysOf(ctx), lines = [], warn = [];
    if (n64.length) { if (sys.kind !== 'n64') warn.push('N64 파일(.eep/.sra/.fla/.mpk)인데 현재 게임은 N64 가 아니에요.'); lines.push('N64 저장 ' + n64.map(function (x) { return x.ext.toUpperCase(); }).join('+') + ' → 합쳐서 적용'); }
    if (sramItem) lines.push('게임 내 저장: ' + sramItem.name + ' (' + kb(sramItem.data.length) + ', ' + sramItem.how + ')');
    if (stateItem) {
      lines.push('즉시저장: ' + stateItem.name + ' (' + kb(stateItem.data.length) + ', ' + stateItem.how + ')');
      if (stateItem.meta && ctx.verifyMeta) {
        var okm = false; try { okm = await ctx.verifyMeta(stateItem.meta); } catch (e) { okm = false; }
        if (!okm) { var c2 = modal('📥 세이브 불러오기'); el('div', 'sb-warn', '✖ 이 파일은 지금 게임의 세이브가 아니에요. (다른 게임 · 기종의 사이트 세이브)', c2); closeBtn(c2); return; }
      } else if (stateItem.meta && stateItem.meta.sys && ctx.id && stateItem.meta.sys !== ctx.id) warn.push('다른 기종(' + stateItem.meta.sys + ')에서 저장된 파일이에요.');
    }
    var card = modal('이 세이브를 적용할까요?', '현재 진행 중인 게임 내용이 바뀔 수 있어요.'), restart = true, ck;
    var ul = el('ul', null, null, card);
    lines.forEach(function (t) { el('li', null, '• ' + t, ul); });
    warn.forEach(function (t) { el('div', 'sb-warn', '⚠ ' + t, card); });
    if (sramItem || n64.length) {
      var lb = el('label', 'sb-ck', null, card); ck = el('input', null, null, lb); ck.type = 'checkbox'; ck.checked = true; el('span', null, '적용 후 게임 다시 시작 (권장 — 게임이 저장 데이터를 다시 읽어요)', lb);
      ck.onchange = function () { restart = ck.checked; };
    }
    var go = await new Promise(function (res) { btn(card, '적용', '', function () { res(true); }, 'sb-pri'); btn(card, '취소', '', function () { res(false); }, 'sb-x'); ov.addEventListener('click', function (e) { if (e.target === ov) res(false); }); });
    if (!go) { closeModal(); return; }

    /* 적용 */
    var res = [], rs = false;
    try {
      if (n64.length) {
        var cur0 = null; try { cur0 = readSram(ctx); } catch (e) { }
        var mg = n64Merge(cur0, n64.map(function (x) { return { ext: x.ext, data: x.data }; }));
        var v1 = writeSram(ctx, mg.data); rs = true;
        res.push([v1 ? 'ok' : 'wn', (v1 ? '✔ ' : '⚠ 적용 확인 불가 — ') + 'N64 저장(' + mg.parts.join(' · ') + ') 적용']);
      }
      if (sramItem) {
        var cur1 = null; try { cur1 = readSram(ctx); } catch (e) { }
        if (cur1 && cur1.length !== sramItem.data.length) {
          var sa = await ask('저장 파일 크기가 달라요', '지금 게임의 저장 크기 ' + kb(cur1.length) + ' / 가져온 파일 ' + kb(sramItem.data.length) + '\n다른 게임의 세이브일 수 있어요. 그래도 적용할까요?', [{ t: '그래도 적용', s: '' }]);
          if (sa < 0) { res.push(['wn', '게임 내 저장은 건너뜀 (크기 불일치)']); sramItem = null; }
        }
        if (sramItem) { var v2 = writeSram(ctx, sramItem.data); rs = true; res.push([v2 ? 'ok' : 'wn', (v2 ? '✔ ' : '⚠ 적용 확인 불가 — ') + '게임 내 저장 적용 (' + sramItem.how + ')']); }
      }
      if (rs && restart) { res.push(restartGame(ctx) ? ['ok', '✔ 게임을 다시 시작했어요'] : ['wn', '⚠ 자동 재시작에 실패했어요 — 게임을 직접 다시 시작해 주세요']); }
      if (stateItem) {
        var fl = nativeFlavor(ctx), sd = stateItem.data;
        if (fl === 'raw') sd = await toRawState(sd);
        loadState(ctx, sd);
        res.push(['ok', '✔ 즉시저장 불러옴 (' + stateItem.how + ') — 같은 게임·같은 코어가 아니면 화면이 깨지거나 아무 일도 없을 수 있어요']);
      }
    } catch (e) { res.push(['er', '✖ 실패: ' + errMsg(e)]); }
    var out = modal('결과');
    var u2 = el('ul', null, null, out);
    res.concat(log).forEach(function (r) { el('li', r[0], r[1], u2); });
    closeBtn(out, '확인');
    say(ctx, res.some(function (r) { return r[0] === 'er'; }) ? '불러오기 실패' : '📥 불러오기 완료');
  }

  W.SaveBridge = {
    openSave: openSave, openLoad: openLoad, importFiles: importFiles, close: closeModal,
    /* 시험용으로 열어 둔 순수 함수들 */
    _: { zipWrite: zipWrite, zipRead: zipRead, rzipDecode: rzipDecode, raStateUnwrap: raStateUnwrap, toRawState: toRawState, n64Split: n64Split, n64Merge: n64Merge, N64: N64, dsStrip: dsStrip, gmeStrip: gmeStrip, classify: classify, crc32: crc32, unpackSave: unpackSave, isBlank: isBlank, SYS: SYS }
  };
})(typeof window !== 'undefined' ? window : globalThis);
