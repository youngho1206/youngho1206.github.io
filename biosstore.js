/* =====================================================================
   biosstore.js — 바이오스 보관함 (내 기기 → 이 브라우저에만 저장, 서버 업로드 없음)

   · 사이트에는 바이오스 파일이 들어 있지 않습니다. (저작권)
   · 사용자가 '내 기기'에서 직접 고른 바이오스는 이 브라우저(IndexedDB)에만 저장되고
     서버로 전송되지 않습니다. 다음에 접속해도 유지되며, [이 브라우저에 기억하기]를 끄면
     탭을 닫는 순간 사라집니다.
   · 바이오스가 필요한 게임을 시작할 때 없으면 안내창이 열려 바로 불러올 수 있습니다.
   · 🔑 바이오스 관리 : 기종별 필요한 파일 확인 · 추가 · 삭제 (RomM 의 Firmware 화면과 비슷한 구성)

   사용법(다른 코드에서)
     BIOSSTORE.ready()                 저장된 목록 불러오기(Promise)
     BIOSSTORE.forNames(['a.bin',...]) 첫 번째로 있는 바이오스 → [{name,url,src}] (없으면 안내창 후 다시 확인)
     BIOSSTORE.apply(win, list)        에뮬레이터 창(win)에 바이오스를 연결 (EJS_biosUrl 등)
     BIOSSTORE.open()                  관리 화면 열기
   기종을 더 추가하려면 아래 CATALOG 에 한 줄만 넣으면 됩니다.
   ===================================================================== */
(function(){
'use strict';

/* ---------- 기종별 바이오스 목록 ---------- */
var CATALOG=[
 {id:'neogeo',n:'네오지오 (마메게임)',ic:'🕹️',files:['neogeo.zip'],any:false,why:'네오지오 롬(킹 오브 파이터·메탈슬러그 등)을 실행할 때 필요해요. zip 그대로 선택하세요.'},
 {id:'segacd',n:'세가 CD',ic:'💿',files:['bios_CD_U.bin','bios_CD_E.bin','bios_CD_J.bin'],any:true,why:'지역별 파일 중 1개만 있으면 돼요.'},
 {id:'saturn',n:'세가 새턴',ic:'🪐',files:['saturn_bios.bin','sega_101.bin','mpr-17933.bin'],any:true,why:'파일 중 1개만 있으면 돼요.'},
 {id:'3do',n:'3DO',ic:'🎛️',files:['panafz10.bin','panafz1.bin'],any:true,why:'파일 중 1개만 있으면 돼요.'}
];
var DB='yh-bios-store',ST='files',KEEP='yh.bios.keep',FAKE='__bios__/';

function lc(s){return String(s||'').toLowerCase()}
function canon(n){ /* 파일 이름(대소문자 무시) → 사이트가 쓰는 정식 이름, 모르면 '' */
 n=lc(String(n||'').split(/[\\/]/).pop());
 for(var i=0;i<CATALOG.length;i++)for(var j=0;j<CATALOG[i].files.length;j++)if(lc(CATALOG[i].files[j])===n)return CATALOG[i].files[j];
 return '';
}
function sysOf(name){for(var i=0;i<CATALOG.length;i++)if(CATALOG[i].files.indexOf(name)>=0)return CATALOG[i];return null}
function fmt(n){return n>=1048576?(n/1048576).toFixed(1)+'MB':n>=1024?Math.round(n/1024)+'KB':n+'B'}
function readBuf(f){
 if(f.arrayBuffer)return f.arrayBuffer();
 return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){rej(r.error)};r.readAsArrayBuffer(f)});
}

/* ---------- 저장소 (메모리 + IndexedDB) ---------- */
var mem={},urls={},skipped={},readyP=null;
function keep(){try{return localStorage.getItem(KEEP)!=='0'}catch(e){return true}}
function setKeep(v){try{localStorage.setItem(KEEP,v?'1':'0')}catch(e){}}
function idb(){return new Promise(function(res,rej){
 if(!window.indexedDB)return rej(new Error('no idb'));
 var r=indexedDB.open(DB,1);
 r.onupgradeneeded=function(){r.result.createObjectStore(ST,{keyPath:'name'})};
 r.onsuccess=function(){res(r.result)};r.onerror=function(){rej(r.error)};
})}
function tx(mode,fn){return idb().then(function(db){return new Promise(function(res,rej){
 var t=db.transaction(ST,mode),q=fn(t.objectStore(ST));
 t.oncomplete=function(){db.close();res(q&&q.result)};t.onerror=t.onabort=function(){db.close();rej(t.error)};
})})}
function ready(){
 if(readyP)return readyP;
 readyP=(keep()?tx('readonly',function(s){return s.getAll()}).then(function(a){(a||[]).forEach(function(r){if(r&&r.name&&r.buf)mem[r.name]=r})}):Promise.resolve())
  .catch(function(){});
 return readyP;
}
function save(rec){return keep()?tx('readwrite',function(s){return s.put(rec)}).catch(function(){}):Promise.resolve()}
function drop(name){
 if(urls[name]){try{URL.revokeObjectURL(urls[name])}catch(e){}delete urls[name]}
 delete mem[name];
 return tx('readwrite',function(s){return s.delete(name)}).catch(function(){});
}
function has(n){return !!mem[n]}
function list(){return Object.keys(mem).map(function(k){return mem[k]})}

/* 바이오스 한 개 → 에뮬레이터에 넘길 항목. url 은 '파일 이름이 올바른' 가짜 주소, src 는 실제 데이터(blob) 주소 */
function entry(n){
 if(!mem[n])return null;
 if(!urls[n])urls[n]=URL.createObjectURL(new Blob([mem[n].buf],{type:'application/octet-stream'}));
 var u;try{u=new URL(FAKE+n,location.href).href}catch(e){u=FAKE+n}
 return{name:n,url:u,src:urls[n]};
}
function find(names){
 for(var i=0;i<(names||[]).length;i++){var e=entry(names[i]);if(e)return[e]}
 return[];
}
function ok(s){ /* 이 기종에 쓸 수 있는 바이오스가 있는가 */
 return s.files.some(has);
}

/* 파일 추가 (이름이 목록에 있는 것만) */
function add(files){
 files=[].slice.call(files||[]);
 var good=[],bad=[];
 return ready().then(function(){
  return files.reduce(function(p,f){return p.then(function(){
   var n=canon(f.name);
   if(!n){bad.push(f.name);return}
   return readBuf(f).then(function(buf){
    if(urls[n]){try{URL.revokeObjectURL(urls[n])}catch(e){}delete urls[n]}
    var rec={name:n,size:buf.byteLength,t:Date.now(),buf:buf};
    mem[n]=rec;good.push(n);return save(rec);
   },function(){bad.push(f.name)});
  })},Promise.resolve());
 }).then(function(){changed();return{ok:good,bad:bad}});
}
function clearAll(){
 var ks=Object.keys(mem);
 return Promise.all(ks.map(drop)).then(changed);
}
function changed(){try{render()}catch(e){}}

/* ---------- 화면 ---------- */
var css='#bsOv{position:fixed;inset:0;z-index:2147483100;display:none;align-items:center;justify-content:center;padding:14px;background:rgba(6,8,16,.66);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif}'+
'#bsOv.on{display:flex}'+
'#bsOv .bsc{width:min(96vw,520px);max-height:92vh;display:flex;flex-direction:column;border-radius:20px;color:#f4f6fb;background:linear-gradient(180deg,rgba(40,46,74,.98),rgba(20,24,44,.99));border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 50px rgba(0,0,0,.55);overflow:hidden}'+
'#bsOv .bsh{padding:16px 18px 6px}#bsOv .bsh>b{display:block;font-size:17px;font-weight:700}'+
'#bsOv .bsh p{margin:6px 0 0;font-size:12.5px;line-height:1.65;color:#bfc6dc;word-break:keep-all}'+
'#bsOv .bsn{margin:8px 18px 0;padding:10px 12px;border-radius:12px;background:rgba(90,160,255,.16);border:1px solid rgba(90,160,255,.4);font-size:13.5px;line-height:1.6;word-break:keep-all;display:none}'+
'#bsOv .bsn.on{display:block}'+
'#bsOv .bsb{padding:10px 18px;overflow-y:auto;-webkit-overflow-scrolling:touch;flex:1}'+
'#bsOv .bsd{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 12px;margin-bottom:10px;border:2px dashed rgba(255,255,255,.28);border-radius:14px;text-align:center;font-size:13.5px;color:#d6dbea;cursor:pointer}'+
'#bsOv .bsd.over{border-color:#5aa0ff;background:rgba(90,160,255,.12)}'+
'#bsOv button{font-family:inherit;cursor:pointer}'+
'#bsOv .bsp{border:0;border-radius:12px;padding:10px 16px;font-weight:700;font-size:14px;color:#fff;background:linear-gradient(180deg,#5aa0ff,#3a74e8)}'+
'#bsOv .bss{border:1px solid rgba(255,255,255,.22);border-radius:12px;padding:10px 14px;font-weight:600;font-size:14px;color:#e8ecf8;background:rgba(255,255,255,.07)}'+
'#bsOv .bsg{margin-bottom:10px;border-radius:14px;background:rgba(255,255,255,.06);padding:10px 12px}'+
'#bsOv .bsg .t{display:flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600}'+
'#bsOv .bsg .t em{margin-left:auto;font-style:normal;font-size:11.5px;font-weight:600;padding:3px 9px;border-radius:99px}'+
'#bsOv .bsg .t em.y{background:rgba(70,200,120,.2);color:#7be3a0}#bsOv .bsg .t em.n{background:rgba(255,255,255,.1);color:#aab3cf}'+
'#bsOv .bsg small{display:block;margin:3px 0 6px;font-size:11.5px;color:#9aa3c0;line-height:1.5}'+
'#bsOv .bsf{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12.5px;border-top:1px solid rgba(255,255,255,.07)}'+
'#bsOv .bsf code{flex:1;font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all}'+
'#bsOv .bsf.no code{color:#7f88a6}#bsOv .bsf span{color:#9aa3c0;font-size:11.5px}'+
'#bsOv .bsf button{border:0;background:rgba(255,80,80,.18);color:#ff9a9a;border-radius:8px;padding:3px 9px;font-size:12px}'+
'#bsOv .bsk{display:flex;align-items:flex-start;gap:8px;margin-top:4px;font-size:12.5px;line-height:1.55;color:#cfd5ea}'+
'#bsOv .bsk input{margin-top:3px}'+
'#bsOv .bsm{min-height:18px;margin:6px 0 0;font-size:12.5px;color:#ffd48a;white-space:pre-line}'+
'#bsOv .bsa{display:flex;gap:8px;padding:12px 18px 16px;border-top:1px solid rgba(255,255,255,.1)}'+
'#bsOv .bsa .bsp,#bsOv .bsa .bss{flex:1}';
var ov=null,fi=null,onClose=null,focusSys=null,need=null;
function build(){
 if(ov)return ov;
 var st=document.createElement('style');st.textContent=css;(document.head||document.documentElement).appendChild(st);
 ov=document.createElement('div');ov.id='bsOv';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');
 ov.innerHTML='<div class="bsc"><div class="bsh"><b>🔑 바이오스 관리</b>'+
  '<p>바이오스는 이 사이트에 들어 있지 않아요. 본인이 합법적으로 가진 파일을 <b>내 기기에서 직접 선택</b>하면 이 브라우저에만 저장되고, <b>서버로 올라가지 않아요.</b></p></div>'+
  '<div class="bsn" id="bsN"></div>'+
  '<div class="bsb"><div class="bsd" id="bsD"><span>📂 바이오스 파일을 끌어다 놓거나 눌러서 선택</span><span style="font-size:12px;color:#9aa3c0">여러 개를 한 번에 선택할 수 있어요</span></div>'+
  '<div id="bsL"></div>'+
  '<label class="bsk"><input type="checkbox" id="bsK"><span>이 브라우저에 기억하기 <small style="display:block;color:#9aa3c0">끄면 탭을 닫을 때 바이오스가 사라져요. (켜 두면 다음 접속 때도 그대로 쓸 수 있어요)</small></span></label>'+
  '<div class="bsm" id="bsM"></div></div>'+
  '<div class="bsa"><button type="button" class="bss" id="bsX">모두 삭제</button><button type="button" class="bsp" id="bsOk">닫기</button></div></div>';
 document.body.appendChild(ov);
 fi=document.createElement('input');fi.type='file';fi.multiple=true;fi.style.display='none';ov.appendChild(fi);
 var d=ov.querySelector('#bsD');
 d.onclick=function(){fi.value='';fi.click()};
 fi.onchange=function(){take(fi.files)};
 ['dragover','dragenter'].forEach(function(v){d.addEventListener(v,function(e){e.preventDefault();d.classList.add('over')})});
 ['dragleave','drop'].forEach(function(v){d.addEventListener(v,function(e){e.preventDefault();d.classList.remove('over');if(v==='drop')take(e.dataTransfer&&e.dataTransfer.files)})});
 ov.querySelector('#bsOk').onclick=function(){close(true)};
 ov.querySelector('#bsX').onclick=function(){
  if(!list().length)return;
  if(confirm('저장된 바이오스를 모두 삭제할까요?'))clearAll();
 };
 ov.querySelector('#bsK').onchange=function(e){
  var on=e.target.checked;setKeep(on);
  if(!on)tx('readwrite',function(s){return s.clear()}).catch(function(){});
  else Promise.all(list().map(save));
  msg(on?'이 브라우저에 기억합니다.':'이 탭을 닫으면 바이오스가 사라집니다.');
 };
 ov.addEventListener('click',function(e){if(e.target===ov)close(false)});
 addEventListener('keydown',function(e){if(ov.classList.contains('on')&&e.key==='Escape')close(false)});
 return ov;
}
function msg(t){var m=ov&&ov.querySelector('#bsM');if(m)m.textContent=t||''}
function take(files){
 if(!files||!files.length)return;
 add(files).then(function(r){
  var t='';
  if(r.ok.length)t+='✔ 저장됨: '+r.ok.join(', ');
  if(r.bad.length)t+=(t?'\n':'')+'✖ 이름을 알 수 없는 파일: '+r.bad.join(', ')+'\n(파일 이름을 바꾸지 말고 그대로 선택해 주세요)';
  msg(t);
  if(need&&ok(need)){setTimeout(function(){if(ov.classList.contains('on')&&need&&ok(need))close(true)},500)}
 });
}
function render(){
 if(!ov||!ov.classList.contains('on'))return;
 var L=ov.querySelector('#bsL');L.innerHTML='';
 CATALOG.forEach(function(s){
  var g=document.createElement('div');g.className='bsg';
  var good=ok(s);
  g.innerHTML='<div class="t"><span>'+s.ic+'</span><span>'+s.n+'</span><em class="'+(good?'y':'n')+'">'+(good?'사용 가능 ✔':'없음')+'</em></div><small>'+s.why+'</small>';
  s.files.forEach(function(n){
   var r=mem[n],row=document.createElement('div');row.className='bsf'+(r?'':' no');
   var c=document.createElement('code');c.textContent=n;row.appendChild(c);
   if(r){
    var z=document.createElement('span');z.textContent=fmt(r.size);row.appendChild(z);
    var b=document.createElement('button');b.type='button';b.textContent='삭제';b.onclick=function(){drop(n).then(changed)};row.appendChild(b);
   }else{var z2=document.createElement('span');z2.textContent='—';row.appendChild(z2)}
   g.appendChild(row);
  });
  L.appendChild(g);
 });
 var k=ov.querySelector('#bsK');if(k)k.checked=keep();
}
function close(done){
 if(!ov)return;
 ov.classList.remove('on');
 var f=onClose;onClose=null;need=null;
 if(f)try{f(!!done)}catch(e){}
}
function open(opt){
 build();
 return ready().then(function(){
  need=(opt&&opt.need)||null;
  var N=ov.querySelector('#bsN');
  if(need){N.textContent='『'+need.n+'』 게임을 실행하려면 바이오스가 필요해요. 아래에서 내 기기의 파일을 선택하면 바로 이어서 시작합니다.';N.classList.add('on')}
  else{N.classList.remove('on')}
  ov.querySelector('#bsOk').textContent=need?'바이오스 없이 시작':'닫기';
  msg('');
  ov.classList.add('on');render();
  return new Promise(function(res){onClose=res});
 });
}

/* 바이오스가 필요한 게임: 있으면 바로, 없으면 안내창을 띄워 불러오게 함 (한 번 '없이 시작'을 고르면 이 화면에서는 다시 묻지 않음) */
function forSystem(s){
 return ready().then(function(){
  if(ok(s))return find(s.files);
  if(skipped[s.id])return[];
  return open({need:s}).then(function(){if(!ok(s))skipped[s.id]=true;return find(s.files)});
 });
}
function forNames(names){
 return ready().then(function(){
  var f=find(names);if(f.length)return f;
  var s=null;for(var i=0;i<(names||[]).length&&!s;i++)s=sysOf(names[i]);
  return s?forSystem(s):[];
 });
}
function sysById(id){for(var i=0;i<CATALOG.length;i++)if(CATALOG[i].id===id)return CATALOG[i];return null}

/* ---------- 에뮬레이터 창(iframe)에 연결 ----------
   EmulatorJS 는 바이오스 '주소의 마지막 이름'을 파일 이름으로 쓰기 때문에, 이름이 올바른 가짜 주소를 알려 주고
   그 주소로 오는 요청을 내 기기의 데이터(blob)로 바꿔 줍니다. (인터넷으로는 아무것도 나가지 않아요) */
function patchWin(w,pairs){
 try{
  w.__bsMap=w.__bsMap||{};
  pairs.forEach(function(b){if(b.src)w.__bsMap[b.url]=b.src});
  if(w.__bsPatched)return;w.__bsPatched=1;
  var P=w.XMLHttpRequest&&w.XMLHttpRequest.prototype,o=P&&P.open;
  if(o)P.open=function(m,u){
   var a=[].slice.call(arguments);
   try{var r=w.__bsMap[String(u)];if(r){a[0]='GET';a[1]=r}}catch(e){}
   return o.apply(this,a);
  };
  var f=w.fetch;
  if(f)w.fetch=function(u,i){
   try{var s=typeof u==='string'?u:(u&&u.url),r=w.__bsMap[s];if(r){u=r;if(i&&i.method)i=Object.assign({},i,{method:'GET'})}}catch(e){}
   return f.call(this,u,i);
  };
 }catch(e){}
}
function apply(w,bios){
 if(!w||!bios||!bios.length)return;
 patchWin(w,bios);
 w.EJS_biosUrl=bios[0].url;
 var ef={};bios.forEach(function(b){ef[b.name]=b.url});
 w.EJS_externalFiles=ef;
}

/* ---------- 게임 안내 화면에 '🔑 바이오스 관리' 버튼 자동 추가 ---------- */
function hookUi(){
 var x=document.getElementById('dExt');if(!x)return;
 function sync(){
  var b=document.getElementById('bsOpen'),t=x.textContent||'';
  if(/바이오스/.test(t)){
   if(!b){
    b=document.createElement('button');b.type='button';b.id='bsOpen';b.className='btn';b.textContent='🔑 바이오스 관리';
    b.style.cssText='margin-top:10px;font-size:13px';
    b.onclick=function(e){e.stopPropagation();open()};
    x.parentNode.insertBefore(b,x.nextSibling);
   }
  }else if(b)b.remove();
 }
 try{new MutationObserver(sync).observe(x,{childList:true,characterData:true,subtree:true})}catch(e){}
 sync();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hookUi);else hookUi();

window.BIOSSTORE={
 CATALOG:CATALOG,ready:ready,has:has,list:list,add:add,entry:entry,find:find,
 buf:function(n){return mem[n]?mem[n].buf:null},
 forSystem:forSystem,forNames:forNames,sys:sysById,apply:apply,patch:patchWin,open:open,clear:clearAll,keep:keep
};
ready();
})();
