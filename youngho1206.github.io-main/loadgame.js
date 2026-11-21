/* 로딩 미니게임 + 플레이스테이션(PS1) 대기시간 도우미
   - 롬파일을 불러와 게임이 시작되기 전까지 기다리는 동안 '뱀 게임(스네이크)'을 할 수 있습니다.
   - 직접 만든 간단한 게임이라 저작권 문제가 없습니다.
   - 게임이 시작되면(LoadGame.stop 호출) 자동으로 사라집니다.
   사용법(mobile.html / desktop.html / classic.html 공통):
     LoadGame.has('psx')        → 미니게임이 나오는 기종인지
     LoadGame.start(stageEl)    → 잠깐(1.5초) 뒤 미니게임 화면을 띄움 (빠르게 로딩되면 안 나옴)
     LoadGame.stop()            → 미니게임 닫기
     LoadGame.waitMs(바이트)    → 시작을 기다리는 최대 시간 (3분 ~ 5분, 파일이 클수록 길게)
     LoadGame.TOO_LONG          → 시간이 지났을 때 보여줄 메시지
*/
(function(W,D){
'use strict';
if(W.LoadGame)return;

var SYS=['psx'];                 /* 미니게임이 나올 기종 (다른 기종도 넣고 싶으면 id 를 추가) */
var MIN_WAIT=180000,MAX_WAIT=300000;   /* 3분 ~ 5분 */
var TOO_LONG='불러오기가 너무 오래걸립니다.';
var DELAY=1500;                  /* 로딩이 이 시간 넘게 걸릴 때만 미니게임을 보여줌 */

/* 100MB 이하 → 3분, 500MB 이상 → 5분, 그 사이는 용량에 비례 */
function waitMs(bytes){
 var mb=(+bytes||0)/1048576;
 var r=Math.max(0,Math.min(1,(mb-100)/400));
 return Math.round(MIN_WAIT+r*(MAX_WAIT-MIN_WAIT));
}

var CSS=''
+'#lgame{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;box-sizing:border-box;padding:calc(36vh + 12px) 10px 12px;align-items:flex-start;background:radial-gradient(circle at 50% 35%,#1b1a14,#050507 72%);color:#eee;font:13px/1.5 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:none}'
+'#lgame .lg-box{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%}'
+'#lgame .lg-top{display:flex;align-items:center;gap:10px;width:100%;justify-content:space-between}'
+'#lgame .lg-top b{color:var(--acc2,#f0d9a0);font-weight:600;font-size:14px}'
+'#lgame .lg-x{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;border-radius:99px;padding:5px 12px;font:inherit;font-size:12px;cursor:pointer}'
+'#lgame .lg-sub{display:none}'
+'#lgame .lg-main{display:flex;flex-direction:column;align-items:center;gap:10px}'
+'#lgame canvas{--s:clamp(120px,min(66vw,calc(64vh - 290px)),300px);width:var(--s);height:var(--s);border-radius:14px;border:1px solid rgba(255,255,255,.18);background:#0b0c10;touch-action:none;display:block}'
+'#lgame .lg-score{color:#cfcfcf;font-size:12.5px}#lgame .lg-score b{color:var(--acc2,#f0d9a0);font-weight:600}'
+'#lgame .lg-pad{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(2,46px);gap:6px}'
+'#lgame .lg-pad button{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);color:#fff;border-radius:12px;font-size:18px;cursor:pointer;touch-action:none;padding:0}'
+'#lgame .lg-pad button:active{background:rgba(255,255,255,.2)}'
+'#lgame .lg-pad .u{grid-column:2;grid-row:1}#lgame .lg-pad .l{grid-column:1;grid-row:2}#lgame .lg-pad .d{grid-column:2;grid-row:2}#lgame .lg-pad .r{grid-column:3;grid-row:2}'
+'@media (orientation:landscape) and (max-height:540px){'
+'#lgame{padding:10px 10px 10px 50%}#lgame .lg-sub{display:none}#lgame .lg-main{flex-direction:row;gap:14px}'
+'#lgame canvas{--s:clamp(110px,calc(100vh - 150px),280px)}}'
+'#lgchip{position:absolute;right:12px;top:12px;z-index:3;border:1px solid rgba(255,255,255,.28);background:rgba(12,12,14,.82);color:#fff;border-radius:99px;padding:8px 14px;font:500 12px -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo",system-ui,sans-serif;cursor:pointer}';

/* 로딩 창(#loadbox)을 화면 가운데쪽으로: PS1 로딩 동안에만 적용 */
var MIDCSS=''
+'#loadbox.mid{bottom:auto;top:36vh;transform:translate(-50%,-50%);opacity:0;pointer-events:none;transition:opacity .3s;z-index:2000}'
+'#loadbox.mid.on{transform:translate(-50%,-50%);opacity:1}'
+'@media (orientation:landscape) and (max-height:540px){#loadbox.mid,#loadbox.mid.on{left:26%;top:50%;width:min(46vw,460px)}}';

var N=15;                        /* 15 x 15 칸 */
var st=null;                     /* 현재 실행 중인 상태 (없으면 null) */

function best(v){
 try{
  if(v==null)return +(W.localStorage.getItem('lgSnakeBest')||0)||0;
  W.localStorage.setItem('lgSnakeBest',String(v));
 }catch(e){}
 return +v||0;
}

function start(host){
 if(!host||st)return;
 var t=setTimeout(function(){build(host)},DELAY);
 var ms=D.createElement('style');ms.id='lgmid';ms.textContent=MIDCSS;D.head.appendChild(ms);
 var lb=D.getElementById('loadbox');if(lb)lb.classList.add('mid');
 st={t:t,built:false,ms:ms,lb:lb};
}

function build(host){
 if(!st||st.built)return;
 st.built=true;

 var style=D.createElement('style');style.id='lgstyle';style.textContent=CSS;
 D.head.appendChild(style);

 var box=D.createElement('div');box.id='lgame';
 box.innerHTML=''
  +'<div class="lg-box">'
  +'<div class="lg-top"><b>🐍 기다리는 동안 미니게임</b><button type="button" class="lg-x">숨기기</button></div>'
  +'<div class="lg-sub">게임이 준비되면 자동으로 사라져요 · 방향키/WASD/스와이프/아래 버튼</div>'
  +'<div class="lg-main"><canvas width="300" height="300"></canvas>'
  +'<div style="display:flex;flex-direction:column;align-items:center;gap:8px">'
  +'<div class="lg-score">점수 <b class="s">0</b> · 최고 <b class="b">0</b></div>'
  +'<div class="lg-pad"><button type="button" class="u" aria-label="위">▲</button><button type="button" class="l" aria-label="왼쪽">◀</button><button type="button" class="d" aria-label="아래">▼</button><button type="button" class="r" aria-label="오른쪽">▶</button></div>'
  +'</div></div></div>';
 host.appendChild(box);

 var chip=D.createElement('button');chip.type='button';chip.id='lgchip';chip.textContent='🎮 미니게임';chip.style.display='none';
 host.appendChild(chip);

 var cv=box.querySelector('canvas'),cx=cv.getContext('2d');
 var elS=box.querySelector('.s'),elB=box.querySelector('.b');
 var cell=cv.width/N;

 var g={box:box,chip:chip,style:style,host:host,timer:0,state:'ready',open:true,
        snake:[],dir:{x:1,y:0},q:[],food:null,score:0,hi:best(),speed:150};
 st.g=g;elB.textContent=g.hi;

 function reset(){
  g.snake=[{x:6,y:7},{x:5,y:7},{x:4,y:7}];g.dir={x:1,y:0};g.q=[];
  g.score=0;g.speed=150;elS.textContent=0;put();draw();
 }
 function put(){
  var tries=0,p;
  do{p={x:(Math.random()*N)|0,y:(Math.random()*N)|0};tries++}
  while(g.snake.some(function(s){return s.x===p.x&&s.y===p.y})&&tries<300);
  g.food=p;
 }
 function loop(){
  clearInterval(g.timer);g.timer=0;
  if(g.state!=='run'||!g.open||D.hidden)return;
  g.timer=setInterval(tick,g.speed);
 }
 function turn(x,y){
  /* 반대 방향으로는 바로 돌 수 없음 (최대 2개까지 입력 저장) */
  var last=g.q.length?g.q[g.q.length-1]:g.dir;
  if(x===-last.x&&y===-last.y)return;
  if(x===last.x&&y===last.y)return;
  if(g.q.length<2)g.q.push({x:x,y:y});
 }
 function input(x,y){
  if(g.state==='over'){reset();g.state='ready'}
  if(g.state==='ready'){g.state='run';turn(x,y);loop();return}
  turn(x,y);
 }
 function tick(){
  if(g.q.length)g.dir=g.q.shift();
  var h=g.snake[0],n={x:h.x+g.dir.x,y:h.y+g.dir.y};
  var dead=n.x<0||n.y<0||n.x>=N||n.y>=N||g.snake.some(function(s,i){return i<g.snake.length-1&&s.x===n.x&&s.y===n.y});
  if(dead){
   g.state='over';clearInterval(g.timer);g.timer=0;
   if(g.score>g.hi){g.hi=g.score;best(g.hi);elB.textContent=g.hi}
   draw();return;
  }
  g.snake.unshift(n);
  if(n.x===g.food.x&&n.y===g.food.y){
   g.score++;elS.textContent=g.score;put();
   if(g.speed>70){g.speed-=4;loop()}
  }else g.snake.pop();
  draw();
 }
 function draw(){
  cx.fillStyle='#0b0c10';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='rgba(255,255,255,.035)';
  for(var i=0;i<N;i++)for(var j=0;j<N;j++)if((i+j)%2)cx.fillRect(i*cell,j*cell,cell,cell);
  if(g.food){cx.fillStyle='#ff5d73';cx.beginPath();cx.arc((g.food.x+.5)*cell,(g.food.y+.5)*cell,cell*.36,0,7);cx.fill()}
  g.snake.forEach(function(s,i){
   cx.fillStyle=i?'#7fd6a4':'#d9ffe9';
   cx.fillRect(s.x*cell+1.5,s.y*cell+1.5,cell-3,cell-3);
  });
  if(g.state!=='run'){
   cx.fillStyle='rgba(0,0,0,.55)';cx.fillRect(0,0,cv.width,cv.height);
   cx.fillStyle='#fff';cx.textAlign='center';
   cx.font='600 17px sans-serif';
   cx.fillText(g.state==='over'?'게임 오버':'준비됐나요?',cv.width/2,cv.height/2-8);
   cx.font='13px sans-serif';
   cx.fillText(g.state==='over'?'방향 버튼이나 화면을 눌러 다시 시작':'방향 버튼이나 화면을 눌러 시작',cv.width/2,cv.height/2+16);
  }
 }

 /* 키보드 (미니게임이 열려 있을 때만 방향키가 페이지를 움직이지 않게 막음) */
 g.onKey=function(e){
  if(!g.open)return;
  var k=e.key,m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],W:[0,-1],s:[0,1],S:[0,1],a:[-1,0],A:[-1,0],d:[1,0],D:[1,0]}[k];
  if(!m)return;
  e.preventDefault();input(m[0],m[1]);
 };
 D.addEventListener('keydown',g.onKey,true);

 /* 화면 버튼 — click 대신 pointerdown (연타해도 확대/무시되지 않게) */
 var dirs={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
 Object.keys(dirs).forEach(function(c){
  var b=box.querySelector('.lg-pad .'+c);
  b.addEventListener('pointerdown',function(e){e.preventDefault();input(dirs[c][0],dirs[c][1])});
 });

 /* 스와이프 (캔버스를 손가락으로 밀기) / 게임오버·준비 상태에서는 탭으로 시작 */
 var sx=0,sy=0,sd=false;
 cv.addEventListener('pointerdown',function(e){
  e.preventDefault();sx=e.clientX;sy=e.clientY;sd=true;
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
 });
 cv.addEventListener('pointerup',function(e){
  if(!sd)return;sd=false;
  var dx=e.clientX-sx,dy=e.clientY-sy,ax=Math.abs(dx),ay=Math.abs(dy);
  if(Math.max(ax,ay)<22){if(g.state!=='run')input(g.dir.x,g.dir.y);return}
  if(ax>ay)input(dx>0?1:-1,0);else input(0,dy>0?1:-1);
 });
 cv.addEventListener('pointercancel',function(){sd=false});

 /* 숨기기 / 다시 열기 */
 function show(on){
  g.open=on;box.style.display=on?'':'none';chip.style.display=on?'none':'';
  if(!on){clearInterval(g.timer);g.timer=0}else loop();
 }
 box.querySelector('.lg-x').addEventListener('pointerdown',function(e){e.preventDefault();show(false)});
 chip.addEventListener('pointerdown',function(e){e.preventDefault();show(true)});

 g.onVis=function(){loop()};
 D.addEventListener('visibilitychange',g.onVis);

 reset();
}

function stop(){
 if(!st)return;
 clearTimeout(st.t);
 try{if(st.lb)st.lb.classList.remove('mid')}catch(e){}
 try{if(st.ms)st.ms.remove()}catch(e){}
 var g=st.g;
 if(g){
  clearInterval(g.timer);
  D.removeEventListener('keydown',g.onKey,true);
  D.removeEventListener('visibilitychange',g.onVis);
  try{g.box.remove()}catch(e){}
  try{g.chip.remove()}catch(e){}
  try{g.style.remove()}catch(e){}
 }
 st=null;
}

/* ===== 플레이스테이션 실행 도우미 ===== */

/* 기기 사양 추정: 0 = 보통, 1 = 저사양 (메모리 4GB 이하 / CPU 코어 4개 이하) */
function autoLevel(){
 var n=W.navigator||{},mem=+n.deviceMemory||0,cores=+n.hardwareConcurrency||0;
 return ((mem&&mem<=4)||(cores&&cores<=4))?1:0;
}

/* 단계별 PS1(pcsx_rearmed) 설정 — 0 보통 · 1 저사양(소리효과·디더링 끔) · 2 안전모드(다이내믹 리컴파일러 끄고 프레임 건너뛰기 고정) */
function psxOptions(lv){
 var o={
  'pcsx_rearmed_drc':'enabled',
  'pcsx_rearmed_frameskip_type':'auto',
  'pcsx_rearmed_frameskip_threshold':'33',
  'pcsx_rearmed_neon_enhancement_enable':'disabled',
  'pcsx_rearmed_neon_interlace_enable':'disabled',
  'pcsx_rearmed_show_bios_bootlogo':'disabled',
  'pcsx_rearmed_spu_interpolation':'off',
  'pcsx_rearmed_spu_reverb':'enabled'
 };
 if(lv>=1){
  o['pcsx_rearmed_spu_reverb']='disabled';
  o['pcsx_rearmed_dithering']='disabled';
  o['pcsx_rearmed_gpu_thread_rendering']='disabled';
  o['pcsx_rearmed_display_internal_fps']='disabled';
 }
 if(lv>=2){
  o['pcsx_rearmed_drc']='disabled';
  o['pcsx_rearmed_frameskip_type']='fixed_interval';
  o['pcsx_rearmed_frameskip_interval']='2';
 }
 return o;
}

/* 단독으로는 실행할 수 없는 파일(.cue/.m3u 는 bin 파일을 같이 읽어야 함)을 미리 알려줌 */
function badFormat(file){
 var n=String(file&&file.name||'');
 if(/\.(cue|m3u)$/i.test(n))
  return n+' 파일만 선택하면 게임을 시작할 수 없어요.\n게임 파일(.bin)과 .cue 를 함께 zip 으로 묶어서 선택하거나, .chd / .iso / .pbp 파일 하나를 선택해 주세요.';
 return '';
}

/* 용량이 큰 파일을 저사양 기기에서 열 때의 안내 */
function advice(file){
 var mb=((file&&file.size)||0)/1048576,n=W.navigator||{},mem=+n.deviceMemory||0;
 if(mb>=400&&(autoLevel()>=1||(mem&&mem<=4)))
  return '용량이 커서(약 '+Math.round(mb)+'MB) 저사양 기기에서는 시작이 안 될 수 있어요. 가능하면 .chd / .pbp 로 줄인 파일을 사용하세요.';
 return '';
}

function explain(){
 return '플레이스테이션 게임을 시작하지 못했어요.\n① 게임 파일 확인: bin+cue 는 zip 으로 묶거나 .chd/.iso/.pbp 하나를 선택하세요.\n② 기기 메모리가 부족하면 용량이 작은 .chd/.pbp 로 바꿔 보세요.\n③ 다른 탭·앱을 모두 닫고 새로고침한 뒤 다시 시도하세요.';
}

/* 에뮬레이터 창(win) 안에 'Failed to start game' 같은 실패 문구가 뜨는지 감시.
   alive() 가 false 가 되거나 한 번 감지하면 감시를 끝냄. 반환값: 감시 중지 함수 */
function watchError(win,alive,cb){
 var done=false,iv=0;
 function end(){done=true;clearInterval(iv)}
 function chk(){
  if(done)return;
  if(!alive()){end();return}
  var d;try{d=win.document}catch(e){end();return}
  if(!d||!d.querySelector)return;
  var el=d.querySelector('.ejs_error_text'),txt='';
  if(el)txt=el.textContent||'Failed to start game';
  else{
   var g=d.getElementById('game');
   var m=g&&/Failed to (start|load|initialize)[^\n]{0,40}/i.exec(g.textContent||'');
   if(m)txt=m[0];
  }
  if(txt){end();try{cb(String(txt))}catch(e){}}
 }
 iv=setInterval(chk,1000);
 return end;
}


/* ===== PS1 zip 직접 풀기 =====
   'Decompress Game Data 94%'에서 멈추는 문제 해결:
   에뮬레이터(EmulatorJS) 내부 압축해제는 용량의 몇 배 메모리를 써서 폰에서 94% 근처에서 멈추곤 합니다.
   그래서 zip 안의 게임 이미지(.chd .pbp .iso .img .bin)를 브라우저 자체 기능(DecompressionStream)으로
   조각조각 풀어서(메모리 적게) 에뮬레이터에는 압축이 없는 파일 하나만 넘겨줍니다.
   - 풀 수 없는 경우(여러 트랙의 bin, 암호 zip, 미지원 브라우저 등)는 원래 파일을 그대로 사용합니다. */
function needUnzip(file){
 return !!(file&&/\.zip$/i.test(file.name||'')&&!file.__psReady&&typeof DecompressionStream==='function'&&file.slice&&file.stream);
}
function rd(file,a,b){return file.slice(a,b).arrayBuffer().then(function(x){return new DataView(x)})}
function big(dv,o){return dv.getUint32(o,true)+dv.getUint32(o+4,true)*4294967296}
async function readDir(file){
 var size=file.size,tailLen=Math.min(size,65557+22);
 var tail=await rd(file,size-tailLen,size),i=-1;
 for(var k=tail.byteLength-22;k>=0;k--){if(tail.getUint32(k,true)===0x06054b50){i=k;break}}
 if(i<0)throw new Error('zip');
 var cnt=tail.getUint16(i+10,true),cdSize=tail.getUint32(i+12,true),cdOff=tail.getUint32(i+16,true);
 if(cnt===0xFFFF||cdSize===0xFFFFFFFF||cdOff===0xFFFFFFFF){
  var loc=size-tailLen+i-20;
  var l=await rd(file,loc,loc+20);
  if(l.getUint32(0,true)!==0x07064b50)throw new Error('zip64');
  var z64=big(l,8),z=await rd(file,z64,z64+56);
  if(z.getUint32(0,true)!==0x06064b50)throw new Error('zip64');
  cnt=big(z,32);cdSize=big(z,40);cdOff=big(z,48);
 }
 var cd=await rd(file,cdOff,cdOff+cdSize),out=[],o=0,dec=new TextDecoder('utf-8');
 for(var n=0;n<cnt&&o+46<=cd.byteLength;n++){
  if(cd.getUint32(o,true)!==0x02014b50)break;
  var flag=cd.getUint16(o+8,true),method=cd.getUint16(o+10,true);
  var comp=cd.getUint32(o+20,true),unc=cd.getUint32(o+24,true);
  var nl=cd.getUint16(o+28,true),el=cd.getUint16(o+30,true),cl=cd.getUint16(o+32,true),off=cd.getUint32(o+42,true);
  var name=dec.decode(new Uint8Array(cd.buffer,cd.byteOffset+o+46,nl));
  if(el){
   var e=o+46+nl,end=e+el;
   while(e+4<=end){
    var id=cd.getUint16(e,true),len=cd.getUint16(e+2,true);
    if(id===1){
     var q=e+4;
     if(unc===0xFFFFFFFF){unc=big(cd,q);q+=8}
     if(comp===0xFFFFFFFF){comp=big(cd,q);q+=8}
     if(off===0xFFFFFFFF){off=big(cd,q);q+=8}
    }
    e+=4+len;
   }
  }
  out.push({name:name,method:method,comp:comp,unc:unc,off:off,enc:(flag&1)===1});
  o+=46+nl+el+cl;
 }
 return out;
}
function pickEntry(list){
 var ok=list.filter(function(e){return !/\/$/.test(e.name)&&!/(^|\/)(__MACOSX|\._)/.test(e.name)});
 var cue=ok.filter(function(e){return /\.cue$/i.test(e.name)}).length;
 var bins=ok.filter(function(e){return /\.bin$/i.test(e.name)});
 if(bins.length>1)return null;   /* 여러 트랙 bin → 에뮬레이터 기본 방식 사용 */
 var order=['chd','pbp','iso','img','bin'];
 for(var r=0;r<order.length;r++){
  var re=new RegExp('\\.'+order[r]+'$','i');
  var c=ok.filter(function(e){return re.test(e.name)}).sort(function(a,b){return b.unc-a.unc});
  if(c.length)return c[0];
 }
 return null;
}
async function extract(file,e,prog){
 var h=await rd(file,e.off,e.off+30);
 if(h.getUint32(0,true)!==0x04034b50)throw new Error('zip');
 var start=e.off+30+h.getUint16(26,true)+h.getUint16(28,true);
 var raw=file.slice(start,start+e.comp);
 if(e.method===0){prog(100);return raw}
 if(e.method!==8)throw new Error('method');
 var rdr=raw.stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
 var parts=[],got=0,last=0;
 for(;;){
  var r=await rdr.read();
  if(r.done)break;
  parts.push(r.value);got+=r.value.length;
  var p=e.unc?Math.min(99,Math.floor(got/e.unc*100)):50;
  if(p!==last){last=p;prog(p)}
 }
 return new Blob(parts);
}
/* 반환: Promise<File> (풀었으면 새 파일, 못 풀었으면 원래 파일) — 절대 실패로 끝나지 않음 */
function unzip(file,cb){
 cb=cb||function(){};
 var done=function(f){try{f.__psReady=true}catch(e){}return f};
 if(!needUnzip(file))return Promise.resolve(done(file));
 return (async function(){
  try{
   cb(3,'압축 파일 확인 중…');
   var e=pickEntry(await readDir(file));
   if(!e||e.enc)return done(file);
   var base=e.name.split('/').pop();
   var mb=Math.round(e.unc/1048576);
   var blob=await extract(file,e,function(p){cb(Math.max(3,Math.min(55,Math.round(p*0.55))),'압축 푸는 중… '+p+'% ('+mb+'MB) · 기기 메모리를 아끼는 방식')});
   cb(56,'압축 풀기 완료 · 에뮬레이터 시작 중…');
   return done(new File([blob],base,{type:'application/octet-stream'}));
  }catch(err){
   return done(file);
  }
 })();
}

W.LoadGame={
 has:function(id){return SYS.indexOf(id)>=0},
 start:start,
 stop:stop,
 running:function(){return !!st},
 waitMs:waitMs,
 autoLevel:autoLevel,
 psxOptions:psxOptions,
 badFormat:badFormat,
 advice:advice,
 explain:explain,
 watchError:watchError,
 TOO_LONG:TOO_LONG,
 needUnzip:needUnzip,
 unzip:unzip
};
})(window,document);
