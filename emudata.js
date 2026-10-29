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
 {id:'segacd',n:'Sega CD',fn:'SEGACD',core:'segaCD',y:1991,a:'#4f6bd8',b:'#0e1a52',g:'pad',l:'SCD',x:'.cue .bin .iso .chd .zip',pc:1,bios:['bios_CD_U.bin','bios_CD_E.bin','bios_CD_J.bin'],hint:'CD 게임은 .cue+.bin 을 zip 한 개로 묶거나 .chd 로 변환해서 불러오세요.\n바이오스: BIOS 폴더에 bios_CD_U.bin(또는 _E/_J) 를 올려 두세요.'},
 {id:'3do',n:'3DO',fn:'3DO',core:'3do',y:1993,a:'#e0a43a',b:'#4a2a05',g:'pad',l:'3DO',x:'.iso .bin .cue .chd',pc:1,bios:['panafz10.bin','panafz1.bin'],hint:'CD 게임은 .cue+.bin 을 zip 한 개로 묶거나 .chd 로 변환해서 불러오세요.\n바이오스: BIOS 폴더에 panafz10.bin 을 올려 두세요.'},
 {id:'jaguar',n:'Atari Jaguar',fn:'JAGUAR',core:'jaguar',y:1993,a:'#d6472f',b:'#3a0c06',g:'pad',l:'JAG',x:'.j64 .jag .rom .zip',pc:1},
 {id:'psx',n:'PlayStation',fn:'PLAYSTATION',core:'psx',y:1994,a:'#7b8aa3',b:'#0b1226',g:'pad',l:'PS1',x:'.bin .cue .iso .img .chd .pbp .m3u .zip'},
 {id:'saturn',n:'Sega Saturn',fn:'SEGASATURN',core:'segaSaturn',y:1994,a:'#6a7ca0',b:'#10162b',g:'pad',l:'SAT',x:'.cue .bin .iso .chd .zip',pc:1,bios:['saturn_bios.bin','sega_101.bin','mpr-17933.bin'],hint:'CD 게임은 .cue+.bin 을 zip 한 개로 묶거나 .chd 로 변환해서 불러오세요.\n바이오스: BIOS 폴더에 saturn_bios.bin 을 올려 두면 호환성이 좋아져요.'},
 {id:'s32x',n:'Sega 32X',fn:'SEGA32X',core:'sega32x',y:1994,a:'#2fb4c9',b:'#06303a',g:'pad',l:'32X',x:'.32x .bin .md .zip',pc:1},
 {id:'vb',n:'Virtual Boy',fn:'VIRTUALBOY',core:'vb',y:1995,a:'#e82020',b:'#1a0303',g:'land',l:'VB',x:'.vb .zip'},
 {id:'n64',n:'Nintendo 64',fn:'NINTENDO64',core:'n64',y:1996,a:'#22c55e',b:'#063b19',g:'n64',l:'N64',x:'.z64 .n64 .v64 .zip'},
 {id:'ngp',n:'Neo Geo Pocket',fn:'NGPOCKET',core:'ngp',y:1998,a:'#ff5a5a',b:'#4a0a0a',g:'hand',l:'NGP',x:'.ngp .ngc .zip'},
 {id:'gbc',n:'Game Boy Color',fn:'GAMEBOYCOLOR',core:'gb',y:1998,a:'#1fd1c0',b:'#0a4a45',g:'hand',l:'GBC',x:'.gbc .zip'},
 {id:'dc',n:'Dreamcast',fn:'DREAMCAST',core:'dreamcast',y:1998,a:'#ff8a2a',b:'#5a2400',g:'pad',l:'DC',x:'.cdi .gdi .chd',soon:1,why:'드림캐스트는 이 사이트의 에뮬레이터 엔진(EmulatorJS)에 코어가 없어 아직 웹에서 실행할 수 없습니다. 지원되는 코어가 생기면 바로 연결할 수 있게 자리만 만들어 두었어요.'},
 {id:'ps2',n:'PlayStation 2',fn:'PLAYSTATION2',core:'ps2',y:2000,a:'#3b6be0',b:'#08142e',g:'pad',l:'PS2',x:'.iso .bin .chd',soon:1,why:'PS2 는 웹 브라우저용 에뮬레이터 코어가 아직 없어 실행할 수 없습니다. (PC·안드로이드 전용 에뮬레이터 사용을 권장)'},
 {id:'gba',n:'Game Boy Advance',fn:'GBA',core:'gba',y:2001,a:'#7478ff',b:'#1b1a63',g:'land',l:'GBA',x:'.gba .zip'},
 {id:'gc',n:'GameCube',fn:'GAMECUBE',core:'gc',y:2001,a:'#7a5cf0',b:'#1a1040',g:'pad',l:'GC',x:'.iso .gcm .rvz',soon:1,why:'게임큐브는 웹 브라우저용 에뮬레이터 코어가 아직 없어 실행할 수 없습니다. (PC·안드로이드 전용 Dolphin 사용을 권장)'},
 {id:'mamegame',n:'마메게임',fn:'MAMEGAME',core:'fbneo',alt:['mame2003_plus'],y:2003,a:'#ff7a1a',b:'#5a2400',g:'stick',l:'MAME',x:'.zip .7z'},
 {id:'nds',n:'Nintendo DS',fn:'NINTENDODS',core:'desmume2015',alt:['melonds','desmume'],y:2004,a:'#aab6c8',b:'#26324a',g:'ds',l:'NDS',x:'.nds .zip'},
 {id:'wii',n:'Wii',fn:'WII',core:'wii',y:2006,a:'#38bdf8',b:'#0a2c44',g:'pad',l:'Wii',x:'.iso .wbfs .rvz',soon:1,why:'Wii 는 웹 브라우저용 에뮬레이터 코어가 아직 없어 실행할 수 없습니다. (PC·안드로이드 전용 Dolphin 사용을 권장)'}
];
const era=y=>y<1990?'1980년대':y<2000?'1990년대':'2000년대';

const IMG={atari2600:'atari2600',nes:'nes',sms:'mastersystem',pce:'pcengine',md:'megadrive',gb:'gameboy',lynx:'lynx',snes:'snes',gg:'gamegear',psx:'playstation',vb:'virtualboy',n64:'nintendo64',ngp:'neogeopocket',gbc:'gameboycolor',gba:'gameboyadvance',nds:'nintendods',mamegame:'mamegame',segacd:'segacd','3do':'3do',jaguar:'jaguar',saturn:'segasaturn',s32x:'sega32x',dc:'dreamcast',ps2:'playstation2',gc:'gamecube',wii:'nintendowii',dos:'msdos',win10:'windows1',win20:'windows2',win30:'windows3',win31:'windows31',win95:'windows95',win98:'windows98'};

const P=[
 {id:'dos',n:'MS-DOS',y:1981,a:'#4b5563',b:'#030303',g:'dos',l:'DOS',ram:16},
 {id:'win10',n:'Windows 1.0',y:1985,a:'#2dd4bf',b:'#0b4a45',g:'win',l:'1.0',ram:16},
 {id:'win20',n:'Windows 2.0',y:1987,a:'#38bdf8',b:'#0c3a5e',g:'win',l:'2.0',ram:16},
 {id:'win30',n:'Windows 3.0',y:1990,a:'#818cf8',b:'#1e1b4b',g:'win',l:'3.0',ram:32},
 {id:'win31',n:'Windows 3.1',y:1992,a:'#3b82f6',b:'#0b2a6b',g:'win',l:'3.1',ram:16},
 {id:'win95',n:'Windows 95',y:1995,a:'#14b8a6',b:'#0b3d3a',g:'win',l:'95',ram:32},
 {id:'win98',n:'Windows 98',y:1998,a:'#60a5fa',b:'#172554',g:'win',l:'98',ram:32}
];

const S_KW={atari2600:'아타리 아타리2600 2600',nes:'패미컴 패미콤 닌텐도 엔이에스 famicom',sms:'마스터시스템 마스터 시스템 세가 sega',pce:'피씨엔진 pc엔진 엔진 pcengine nec',md:'메가드라이브 메가 드라이브 제네시스 세가 sega megadrive genesis',gb:'게임보이 보이 닌텐도 gameboy',lynx:'링스 링크스 아타리',snes:'슈퍼패미컴 슈패 슈퍼 패미컴 닌텐도 에스엔이에스 superfamicom',gg:'게임기어 기어 세가 sega gamegear',psx:'플레이스테이션 플스 플레이 스테이션 소니 sony ps1 psx playstation',vb:'버추얼보이 버추얼 가상 닌텐도 virtualboy',n64:'닌텐도64 닌텐도 64 엔64 nintendo64',ngp:'네오지오 네오지오포켓 포켓 snk neogeo',gbc:'게임보이컬러 컬러 닌텐도 gameboycolor',gba:'게임보이어드밴스 어드밴스 닌텐도 gameboyadvance',mamegame:'마메 마메게임 mame 오락실 아케이드 arcade 네오지오 철권 킹오브파이터즈 메탈슬러그 캡콤 capcom cps fbneo 2003 플러스',nds:'닌텐도ds 닌텐도 디에스 듀얼스크린 nintendods',dos:'도스 엠에스도스 msdos 마이크로소프트',win10:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우1',win20:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우2',win30:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3',win31:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3.1',win95:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우95',win98:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우98',segacd:'세가cd 세가씨디 메가cd 메가씨디 세가 sega segacd megacd','3do':'3do 쓰리디오 삼디오',jaguar:'재규어 아타리재규어 아타리 jaguar atari',saturn:'세가새턴 새턴 세가 sega saturn',s32x:'세가32x 32x 세가 sega 32엑스',dc:'드림캐스트 드캐 세가 sega dreamcast',ps2:'플레이스테이션2 플스2 피에스투 소니 sony ps2 playstation2',gc:'게임큐브 큐브 닌텐도 gamecube 지씨',wii:'위 닌텐도위 닌텐도 wii 닌텐도wii'};
