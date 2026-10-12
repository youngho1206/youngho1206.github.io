/* 에뮬레이터 목록 데이터 — index.html 과 search.html 이 함께 사용합니다.
   새 에뮬레이터를 추가할 때는 이 파일만 고치면 됩니다. */
const C=[
 {id:'atari2600',n:'Atari 2600',fn:'ATARI2600',core:'atari2600',y:1977,a:'#a0693a',b:'#35200f',g:'stick',l:'2600',x:'.a26 .bin'},
 {id:'nes',n:'Famicom / NES',fn:'NES',core:'nes',y:1983,a:'#f0384f',b:'#6d1020',g:'pad',l:'NES',x:'.nes .zip'},
 {id:'sg1000',n:'SG-1000',fn:'SG1000',core:'segaMS',y:1983,a:'#e0457b',b:'#4a0f26',g:'pad',l:'SG-1000',x:'.sg .zip'},
 {id:'sms',n:'Master System',fn:'SEGAMS',core:'segaMS',y:1985,a:'#2f6bff',b:'#0c1b55',g:'pad',l:'SMS',x:'.sms .zip'},
 {id:'pce',n:'PC Engine',fn:'PCENGINE',core:'pce',y:1987,a:'#ffb020',b:'#8a3b08',g:'pad',l:'PCE',x:'.pce .zip'},
 {id:'md',n:'Mega Drive / Genesis',fn:'MEGADRIVE',core:'segaMD',y:1988,a:'#3a3f4d',b:'#050609',g:'pad',l:'MD',x:'.md .gen .bin .zip'},
 {id:'gb',n:'Game Boy',fn:'GAMEBOY',core:'gb',y:1989,a:'#a8c93a',b:'#2f4a12',g:'hand',l:'GB',x:'.gb .zip'},
 {id:'lynx',n:'Atari Lynx',fn:'LYNX',core:'lynx',y:1989,a:'#ff8a2b',b:'#6b2208',g:'land',l:'LYNX',x:'.lnx .zip'},
 {id:'snes',n:'Super Famicom / SNES',fn:'SNES',core:'snes',y:1990,a:'#8b5cf6',b:'#2e1270',g:'pad',l:'SNES',x:'.sfc .smc .zip'},
 {id:'gg',n:'Game Gear',fn:'GAMEGEAR',core:'segaGG',y:1990,a:'#12b5ee',b:'#06364f',g:'land',l:'GG',x:'.gg .zip'},
 {id:'s32x',n:'Sega 32X',fn:'SEGA32X',core:'sega32x',y:1994,a:'#ef4444',b:'#4a0a0a',g:'pad',l:'32X',x:'.32x .bin .zip'},
 {id:'psx',n:'PlayStation',fn:'PLAYSTATION',core:'psx',y:1994,a:'#7b8aa3',b:'#0b1226',g:'pad',l:'PS1',x:'.bin .cue .iso .zip'},
 {id:'vb',n:'Virtual Boy',fn:'VIRTUALBOY',core:'vb',y:1995,a:'#e82020',b:'#1a0303',g:'land',l:'VB',x:'.vb .zip'},
 {id:'n64',n:'Nintendo 64',fn:'NINTENDO64',core:'n64',y:1996,a:'#22c55e',b:'#063b19',g:'n64',l:'N64',x:'.z64 .n64 .v64 .zip'},
 {id:'ngp',n:'Neo Geo Pocket',fn:'NGPOCKET',core:'ngp',y:1998,a:'#ff5a5a',b:'#4a0a0a',g:'hand',l:'NGP',x:'.ngp .ngc .zip'},
 {id:'gbc',n:'Game Boy Color',fn:'GAMEBOYCOLOR',core:'gb',y:1998,a:'#1fd1c0',b:'#0a4a45',g:'hand',l:'GBC',x:'.gbc .zip'},
 {id:'gba',n:'Game Boy Advance',fn:'GBA',core:'gba',y:2001,a:'#7478ff',b:'#1b1a63',g:'land',l:'GBA',x:'.gba .zip'},
 {id:'nds',n:'Nintendo DS',fn:'NINTENDODS',core:'desmume2015',y:2004,a:'#aab6c8',b:'#26324a',g:'ds',l:'NDS',x:'.nds .zip'},
 {id:'a7800',n:'Atari 7800',fn:'ATARI7800',core:'atari7800',y:1986,a:'#c2884a',b:'#3a2208',g:'pad',l:'7800',x:'.a78 .bin .zip'},
 {id:'jag',n:'Atari Jaguar',fn:'JAGUAR',core:'jaguar',y:1993,a:'#d9382c',b:'#3d0a06',g:'pad',l:'JAG',x:'.j64 .jag .rom .abs .zip'},
 {id:'neogeo',n:'Neo Geo / AES (MVS)',fn:'NEOGEO',core:'arcade',y:1990,a:'#fbbf24',b:'#4a2d02',g:'pad',l:'NEO',x:'.zip'},
 {id:'mame',n:'아케이드 (MAME)',fn:'MAME',core:'mame2003',y:'',a:'#f59e0b',b:'#4a2a02',g:'pad',l:'MAME',x:'.zip'}
];
const era=y=>y<1990?'1980년대':y<2000?'1990년대':'2000년대';

const IMG={atari2600:'atari2600',nes:'nes',sms:'mastersystem',pce:'pcengine',md:'megadrive',gb:'gameboy',lynx:'lynx',snes:'snes',gg:'gamegear',psx:'playstation',vb:'virtualboy',n64:'nintendo64',ngp:'neogeopocket',gbc:'gameboycolor',gba:'gameboyadvance',nds:'nintendods',dos:'msdos',sg1000:'sg1000',s32x:'sega32x',a7800:'atari7800',jag:'jaguar',neogeo:'neogeo',mame:'arcade',win10:'windows1',win20:'windows2',win30:'windows3',win31:'windows31',win95:'windows95',win98:'windows98'};

const P=[
 {id:'dos',n:'MS-DOS',y:1981,a:'#4b5563',b:'#030303',g:'dos',l:'DOS',ram:16},
 {id:'win10',n:'Windows 1.0',y:1985,a:'#2dd4bf',b:'#0b4a45',g:'win',l:'1.0',ram:16},
 {id:'win20',n:'Windows 2.0',y:1987,a:'#38bdf8',b:'#0c3a5e',g:'win',l:'2.0',ram:16},
 {id:'win30',n:'Windows 3.0',y:1990,a:'#818cf8',b:'#1e1b4b',g:'win',l:'3.0',ram:32},
 {id:'win31',n:'Windows 3.1',y:1992,a:'#3b82f6',b:'#0b2a6b',g:'win',l:'3.1',ram:16},
 {id:'win95',n:'Windows 95',y:1995,a:'#14b8a6',b:'#0b3d3a',g:'win',l:'95',ram:32},
 {id:'win98',n:'Windows 98',y:1998,a:'#60a5fa',b:'#172554',g:'win',l:'98',ram:32}
];

const S_KW={atari2600:'아타리 아타리2600 2600',nes:'패미컴 패미콤 닌텐도 엔이에스 famicom',sms:'마스터시스템 마스터 시스템 세가 sega',pce:'피씨엔진 pc엔진 엔진 pcengine nec turbografx turbografx-16 turbografx16 cd 터보그래픽스 pc엔진cd',md:'메가드라이브 메가 드라이브 제네시스 세가 sega megadrive genesis',gb:'게임보이 보이 닌텐도 gameboy',lynx:'링스 링크스 아타리',snes:'슈퍼패미컴 슈패 슈퍼 패미컴 닌텐도 에스엔이에스 superfamicom',gg:'게임기어 기어 세가 sega gamegear',psx:'플레이스테이션 플스 플레이 스테이션 소니 sony ps1 psx playstation',vb:'버추얼보이 버추얼 가상 닌텐도 virtualboy',n64:'닌텐도64 닌텐도 64 엔64 nintendo64',ngp:'네오지오 네오지오포켓 포켓 snk neogeo',gbc:'게임보이컬러 컬러 닌텐도 gameboycolor',gba:'게임보이어드밴스 어드밴스 닌텐도 gameboyadvance',sg1000:'세가 sega sg1000 sg-1000 에스지1000',s32x:'세가32x 32x 세가 sega 메가드라이브 sega32x',a7800:'아타리7800 아타리 7800 atari7800',jag:'재규어 자가 아타리 atari jaguar',neogeo:'네오지오 neogeo neo geo aes mvs snk 네오지오cd',mame:'마메 아케이드 오락실 arcade mame 네오지오 neogeo 캡콤 capcom',nds:'닌텐도ds 닌텐도 디에스 듀얼스크린 nintendods',dos:'도스 엠에스도스 msdos 마이크로소프트',win10:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우1',win20:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우2',win30:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3',win31:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3.1',win95:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우95',win98:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우98'};

/* 아이콘 이미지가 따로 없는 기종은 색상 + 약어 글자로 직접 그린 아이콘을 사용합니다 */
const fbIcon=c=>{const t=String(c.l||c.n),fs=t.length>4?20:t.length>3?25:32;
 return `<svg viewBox="0 0 100 100" width="256" height="256" aria-label="${c.n}" draggable="false"><rect x="1.5" y="1.5" width="97" height="97" rx="22" fill="${c.a}" fill-opacity=".28" stroke="#26263f" stroke-width="3"/><rect x="16" y="26" width="68" height="40" rx="9" fill="${c.a}" stroke="#26263f" stroke-width="3"/><rect x="22" y="31" width="56" height="9" rx="4" fill="#fff" opacity=".35"/><rect x="22" y="72" width="56" height="18" rx="9" fill="#fff" stroke="#26263f" stroke-width="2.5"/><text x="50" y="${52+fs*0.1}" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="800" font-size="${fs*0.62}" fill="#fff" stroke="#26263f" stroke-width="2" style="paint-order:stroke">${t}</text></svg>`};
