/* 에뮬레이터 목록 데이터 — index.html 과 search.html 이 함께 사용합니다.
   새 에뮬레이터를 추가할 때는 이 파일만 고치면 됩니다. */
const C=[
 {id:'atari2600',n:'Atari 2600',fn:'ATARI2600',core:'atari2600',y:1977,a:'#a0693a',b:'#35200f',g:'stick',l:'2600',x:'.a26 .bin'},
 {id:'nes',n:'Famicom / NES',fn:'NES',core:'nes',y:1983,a:'#f0384f',b:'#6d1020',g:'pad',l:'NES',x:'.nes .zip'},
 {id:'sms',n:'Master System',fn:'SEGAMS',core:'segaMS',y:1985,a:'#2f6bff',b:'#0c1b55',g:'pad',l:'SMS',x:'.sms .zip'},
 {id:'pce',n:'PC Engine',fn:'PCENGINE',core:'pce',y:1987,a:'#ffb020',b:'#8a3b08',g:'pad',l:'PCE',x:'.pce .zip'},
 {id:'md',n:'Mega Drive / Genesis',fn:'MEGADRIVE',core:'segaMD',y:1988,a:'#3a3f4d',b:'#050609',g:'pad',l:'MD',x:'.md .gen .bin .zip'},
 {id:'gb',n:'Game Boy',fn:'GAMEBOY',core:'gb',y:1989,a:'#a8c93a',b:'#2f4a12',g:'hand',l:'GB',x:'.gb .zip'},
 {id:'lynx',n:'Atari Lynx',fn:'LYNX',core:'lynx',y:1989,a:'#ff8a2b',b:'#6b2208',g:'land',l:'LYNX',x:'.lnx .zip'},
 {id:'snes',n:'Super Famicom / SNES',fn:'SNES',core:'snes',y:1990,a:'#8b5cf6',b:'#2e1270',g:'pad',l:'SNES',x:'.sfc .smc .zip'},
 {id:'gg',n:'Game Gear',fn:'GAMEGEAR',core:'segaGG',y:1990,a:'#12b5ee',b:'#06364f',g:'land',l:'GG',x:'.gg .zip'},
 {id:'psx',n:'PlayStation',fn:'PLAYSTATION',core:'psx',y:1994,a:'#7b8aa3',b:'#0b1226',g:'pad',l:'PS1',x:'.bin .cue .iso .zip'},
 {id:'vb',n:'Virtual Boy',fn:'VIRTUALBOY',core:'vb',y:1995,a:'#e82020',b:'#1a0303',g:'land',l:'VB',x:'.vb .zip'},
 {id:'n64',n:'Nintendo 64',fn:'NINTENDO64',core:'n64',y:1996,a:'#22c55e',b:'#063b19',g:'n64',l:'N64',x:'.z64 .n64 .v64 .zip'},
 {id:'ngp',n:'Neo Geo Pocket',fn:'NGPOCKET',core:'ngp',y:1998,a:'#ff5a5a',b:'#4a0a0a',g:'hand',l:'NGP',x:'.ngp .ngc .zip'},
 {id:'gbc',n:'Game Boy Color',fn:'GAMEBOYCOLOR',core:'gb',y:1998,a:'#1fd1c0',b:'#0a4a45',g:'hand',l:'GBC',x:'.gbc .zip'},
 {id:'gba',n:'Game Boy Advance',fn:'GBA',core:'gba',y:2001,a:'#7478ff',b:'#1b1a63',g:'land',l:'GBA',x:'.gba .zip'},
 {id:'nds',n:'Nintendo DS',fn:'NINTENDODS',core:'nds',y:2004,a:'#aab6c8',b:'#26324a',g:'ds',l:'NDS',x:'.nds .zip'}
];
const era=y=>y<1990?'1980년대':y<2000?'1990년대':'2000년대';

const IMG={atari2600:'atari2600',nes:'nes',sms:'mastersystem',pce:'pcengine',md:'megadrive',gb:'gameboy',lynx:'lynx',snes:'snes',gg:'gamegear',psx:'playstation',vb:'virtualboy',n64:'nintendo64',ngp:'neogeopocket',gbc:'gameboycolor',gba:'gameboyadvance',nds:'nintendods',dos:'msdos',win10:'windows1',win20:'windows2',win30:'windows3',win31:'windows31',win95:'windows95',win98:'windows98'};

const P=[
 {id:'dos',n:'MS-DOS',y:1981,a:'#4b5563',b:'#030303',g:'dos',l:'DOS',ram:16},
 {id:'win10',n:'Windows 1.0',y:1985,a:'#2dd4bf',b:'#0b4a45',g:'win',l:'1.0',ram:16},
 {id:'win20',n:'Windows 2.0',y:1987,a:'#38bdf8',b:'#0c3a5e',g:'win',l:'2.0',ram:16},
 {id:'win30',n:'Windows 3.0',y:1990,a:'#818cf8',b:'#1e1b4b',g:'win',l:'3.0',ram:32},
 {id:'win31',n:'Windows 3.1',y:1992,a:'#3b82f6',b:'#0b2a6b',g:'win',l:'3.1',ram:16},
 {id:'win95',n:'Windows 95',y:1995,a:'#14b8a6',b:'#0b3d3a',g:'win',l:'95',ram:32},
 {id:'win98',n:'Windows 98',y:1998,a:'#60a5fa',b:'#172554',g:'win',l:'98',ram:32}
];

const S_KW={atari2600:'아타리 아타리2600 2600',nes:'패미컴 패미콤 닌텐도 엔이에스 famicom',sms:'마스터시스템 마스터 시스템 세가 sega',pce:'피씨엔진 pc엔진 엔진 pcengine nec',md:'메가드라이브 메가 드라이브 제네시스 세가 sega megadrive genesis',gb:'게임보이 보이 닌텐도 gameboy',lynx:'링스 링크스 아타리',snes:'슈퍼패미컴 슈패 슈퍼 패미컴 닌텐도 에스엔이에스 superfamicom',gg:'게임기어 기어 세가 sega gamegear',psx:'플레이스테이션 플스 플레이 스테이션 소니 sony ps1 psx playstation',vb:'버추얼보이 버추얼 가상 닌텐도 virtualboy',n64:'닌텐도64 닌텐도 64 엔64 nintendo64',ngp:'네오지오 네오지오포켓 포켓 snk neogeo',gbc:'게임보이컬러 컬러 닌텐도 gameboycolor',gba:'게임보이어드밴스 어드밴스 닌텐도 gameboyadvance',nds:'닌텐도ds 닌텐도 디에스 듀얼스크린 nintendods',dos:'도스 엠에스도스 msdos 마이크로소프트',win10:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우1',win20:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우2',win30:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3',win31:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3.1',win95:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우95',win98:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우98'};
