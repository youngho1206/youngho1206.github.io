/* =====================================================================
   mame.js — MAME 2003 (0.78) 코어 전용 도우미
   ---------------------------------------------------------------------
   · 게임 ROM(zip) 하나만 고르는 기존 방식에 더해, "BIOS zip"을 함께 넘길 수 있게 합니다.
     예) 세가 ST-V 기판 게임(twcup98 등)  →  twcup98.zip + stvbios.zip
   · BIOS/부모 롬은 압축을 풀지 않고 zip 그대로 가상 파일시스템에 넣습니다.
     (MAME 은 stvbios.zip 같은 zip 파일을 직접 열기 때문입니다)
   · 게임 ROM / BIOS 파일은 이 저장소에 포함되어 있지 않습니다.
     BIOS 를 서버에 두고 싶다면  bios/stvbios.zip  처럼 직접 올려두면 자동으로 사용합니다.
   ===================================================================== */
(function(){
'use strict';

/* 롬셋 이름 → 필요한 BIOS 롬셋 (MAME 2003 / 0.78 기준) */
const STV=('astrass bakubaku batmanfr danchih decathlt diehard dnmtdeka ejihon elandore ffreveng fhboxers finlarch groovef '+
 'hanagumi introdon kiwames maruchan myfairld othellos pblbeach prc2 puyosun rsgun sandor seabass shanhigw shienryu sassisu '+
 'smleague sokyugrt suikoenb sss thunt twcup98 vfkids vmahjong winterht znpwfv').split(' ');
const NEED={};STV.forEach(n=>NEED[n]='stvbios');

/* 파일 이름이 BIOS 롬셋처럼 보이는지 */
const BIOS_NAMES=['stvbios','neogeo','pgm','cpzn1','cpzn2','konamigx','taitofx1','skns','decocass','playch10','megaplay','megatech','nss','hng64','aristmk5','namcoc69'];
const base=n=>String(n||'').replace(/\.[^.]+$/,'').toLowerCase();
const isBios=f=>BIOS_NAMES.includes(base(f.name))||/bios/i.test(f.name);

/* 고른 파일들 → {game, extras[]} */
function split(files){
 files=[].slice.call(files||[]).filter(f=>f&&/\.zip$/i.test(f.name));
 if(!files.length)return null;
 let game=files.find(f=>!isBios(f))||files[0];
 const extras=files.filter(f=>f!==game).slice(0,2); /* BIOS + (필요시) 부모롬 : 최대 2개 */
 return {game,extras};
}

/* 서버(bios/ 폴더)에 BIOS 가 올라와 있으면 가져오기. 없으면 null */
async function fromServer(name){
 try{
  const u=new URL('bios/'+name+'.zip',location.href).href;
  const r=await fetch(u,{headers:{Range:'bytes=0-3'}});
  if(!(r.ok||r.status===206))return null;
  const head=new Uint8Array(await r.clone().arrayBuffer());
  if(!(head[0]===0x50&&head[1]===0x4b))return null; /* zip 이 아니면(404 페이지 등) 무시 */
  const full=await fetch(u);
  if(!full.ok)return null;
  return new File([await full.arrayBuffer()],name+'.zip');
 }catch(e){return null}
}

/* 이 게임에 필요한 BIOS 롬셋 이름 (모르면 null) */
const needed=gameFile=>NEED[base(gameFile.name)]||null;

/* 게임 + 선택한 BIOS 를 준비 → {game, extras[], missing} */
async function prepare(files){
 const s=split(files);if(!s)return null;
 const need=needed(s.game);
 let extras=s.extras.slice();
 if(need&&!extras.some(f=>base(f.name)===need)){
  const sv=await fromServer(need);
  if(sv)extras.unshift(sv);
 }
 const missing=(need&&!extras.some(f=>base(f.name)===need))?need:null;
 return {game:s.game,extras:extras.slice(0,2),missing};
}

/* EmulatorJS(iframe window)에 BIOS 연결
   EmulatorJS 의 BIOS 다운로드 단계는 File 객체를 받으면 멈추므로(Download Game BIOS 에서 정지),
   엔진이 만들어지는 순간 그 단계를 가로채서 BIOS/부모롬 zip 을 가상 파일시스템(/)에 그대로 써 넣습니다. */
function apply(w,extras){
 extras=(extras||[]).filter(Boolean);
 if(!extras.length)return;
 const patch=emu=>{
  emu.downloadBios=()=>new Promise(async resolve=>{
   try{
    for(const f of extras){
     const data=new Uint8Array(await f.arrayBuffer());
     emu.gameManager.FS.writeFile('/'+f.name,data); /* 게임 zip 과 같은 폴더(/) */
    }
   }catch(e){console.error('MAME BIOS 쓰기 실패',e)}
   resolve();
  });
  emu.downloadGameParent=()=>Promise.resolve(); /* 부모롬도 위에서 함께 처리 */
 };
 try{
  delete w.EJS_emulator;
  Object.defineProperty(w,'EJS_emulator',{configurable:true,enumerable:true,
   get(){return undefined},
   set(v){Object.defineProperty(w,'EJS_emulator',{value:v,writable:true,configurable:true,enumerable:true});patch(v)}});
 }catch(e){console.error(e)}
}

window.MAME2003={prepare,apply,split,needed,isBios,STV};
})();
