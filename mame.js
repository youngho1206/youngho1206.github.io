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

/* EmulatorJS 설정(iframe window)에 BIOS 연결 */
function apply(w,extras){
 extras=extras||[];
 w.EJS_dontExtractBIOS=true;      /* BIOS / 부모롬 zip 을 풀지 않고 그대로 저장 */
 if(extras[0])w.EJS_biosUrl=new w.File([extras[0]],extras[0].name);
 if(extras[1])w.EJS_gameParentUrl=new w.File([extras[1]],extras[1].name);
}

window.MAME2003={prepare,apply,split,needed,isBios,STV};
})();
