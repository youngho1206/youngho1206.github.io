/* 에뮬레이터 목록 데이터 — index.html 과 search.html 이 함께 사용합니다.
   새 에뮬레이터를 추가할 때는 이 파일만 고치면 됩니다. */
const C=[
 {id:'atari2600',n:'Atari 2600',fn:'ATARI2600',core:'atari2600',y:1977,a:'#a0693a',b:'#35200f',g:'stick',l:'2600',x:'.a26 .bin'},
 {id:'nes',n:'Famicom / NES',fn:'NES',core:'nes',y:1983,a:'#f0384f',b:'#6d1020',g:'pad',l:'NES',x:'.nes .zip'},
 {id:'sg1000',n:'SG-1000',fn:'SG1000',core:'segaMS',y:1983,a:'#e0457b',b:'#4a0f26',g:'pad',l:'SG-1000',x:'.sg .zip'},
 {id:'sms',n:'Master System',fn:'SEGAMS',core:'segaMS',y:1985,a:'#2f6bff',b:'#0c1b55',g:'pad',l:'SMS',x:'.sms .zip'},
 {id:'pce',n:'PC Engine',fn:'PCENGINE',core:'pce',y:1987,a:'#ffb020',b:'#8a3b08',g:'pad',l:'PCE',x:'.pce .cue .chd .zip'},
 {id:'md',n:'Mega Drive / Genesis',fn:'MEGADRIVE',core:'segaMD',y:1988,a:'#3a3f4d',b:'#050609',g:'pad',l:'MD',x:'.md .gen .bin .zip'},
 {id:'gb',n:'Game Boy',fn:'GAMEBOY',core:'gb',y:1989,a:'#a8c93a',b:'#2f4a12',g:'hand',l:'GB',x:'.gb .zip'},
 {id:'lynx',n:'Atari Lynx',fn:'LYNX',core:'lynx',y:1989,a:'#ff8a2b',b:'#6b2208',g:'land',l:'LYNX',x:'.lnx .zip'},
 {id:'snes',n:'Super Famicom / SNES',fn:'SNES',core:'snes',y:1990,a:'#8b5cf6',b:'#2e1270',g:'pad',l:'SNES',x:'.sfc .smc .zip'},
 {id:'gg',n:'Game Gear',fn:'GAMEGEAR',core:'segaGG',y:1990,a:'#12b5ee',b:'#06364f',g:'land',l:'GG',x:'.gg .zip'},
 {id:'scd',n:'Sega CD / Mega-CD',fn:'SEGACD',core:'segaCD',y:1991,a:'#5b7cfa',b:'#101a5c',g:'pad',l:'SCD',x:'.cue .bin .iso .chd .zip'},
 {id:'s32x',n:'Sega 32X',fn:'SEGA32X',core:'sega32x',y:1994,a:'#ef4444',b:'#4a0a0a',g:'pad',l:'32X',x:'.32x .bin .zip'},
 {id:'sat',n:'Sega Saturn',fn:'SATURN',core:'segaSaturn',y:1994,a:'#6b7fa8',b:'#10172e',g:'pad',l:'SAT',x:'.cue .bin .iso .chd .zip'},
 {id:'psx',n:'PlayStation',fn:'PLAYSTATION',core:'psx',y:1994,a:'#7b8aa3',b:'#0b1226',g:'pad',l:'PS1',x:'.bin .cue .iso .zip'},
 {id:'vb',n:'Virtual Boy',fn:'VIRTUALBOY',core:'vb',y:1995,a:'#e82020',b:'#1a0303',g:'land',l:'VB',x:'.vb .zip'},
 {id:'n64',n:'Nintendo 64',fn:'NINTENDO64',core:'n64',y:1996,a:'#22c55e',b:'#063b19',g:'n64',l:'N64',x:'.z64 .n64 .v64 .zip'},
 {id:'ngp',n:'Neo Geo Pocket',fn:'NGPOCKET',core:'ngp',y:1998,a:'#ff5a5a',b:'#4a0a0a',g:'hand',l:'NGP',x:'.ngp .ngc .zip'},
 {id:'gbc',n:'Game Boy Color',fn:'GAMEBOYCOLOR',core:'gb',y:1998,a:'#1fd1c0',b:'#0a4a45',g:'hand',l:'GBC',x:'.gbc .zip'},
 {id:'gba',n:'Game Boy Advance',fn:'GBA',core:'gba',y:2001,a:'#7478ff',b:'#1b1a63',g:'land',l:'GBA',x:'.gba .zip'},
 {id:'nds',n:'Nintendo DS',fn:'NINTENDODS',core:'nds',y:2004,a:'#aab6c8',b:'#26324a',g:'ds',l:'NDS',x:'.nds .zip'},
 {id:'psp',n:'PlayStation Portable',fn:'PSP',core:'psp',y:2004,a:'#1e90ff',b:'#06214a',g:'land',l:'PSP',x:'.iso .cso .pbp .zip'},
 {id:'amiga',n:'Commodore Amiga',fn:'AMIGA',core:'amiga',y:1985,a:'#ef6c2f',b:'#4a1a05',g:'pad',l:'AMIGA',x:'.adf .zip .ipf .hdf .lha'},
 {id:'a7800',n:'Atari 7800',fn:'ATARI7800',core:'atari7800',y:1986,a:'#c2884a',b:'#3a2208',g:'pad',l:'7800',x:'.a78 .bin .zip'},
 {id:'3do',n:'3DO',fn:'3DO',core:'3do',y:1993,a:'#f2b134',b:'#4a3004',g:'pad',l:'3DO',x:'.iso .cue .bin .chd',bios:'panafz10.bin'},
 {id:'jag',n:'Atari Jaguar',fn:'JAGUAR',core:'jaguar',y:1993,a:'#d9382c',b:'#3d0a06',g:'pad',l:'JAG',x:'.j64 .jag .rom .abs .zip'},
 {id:'pcfx',n:'PC-FX',fn:'PCFX',core:'pcfx',y:1994,a:'#a78bfa',b:'#2a1670',g:'pad',l:'PC-FX',x:'.cue .bin .iso .chd',bios:'pcfx.rom'},
 {id:'neogeo',n:'Neo Geo / AES (MVS)',fn:'NEOGEO',core:'arcade',y:1990,a:'#fbbf24',b:'#4a2d02',g:'pad',l:'NEO',x:'.zip'},
 {id:'mame',n:'아케이드 (MAME)',fn:'MAME',core:'mame2003',y:'',a:'#f59e0b',b:'#4a2a02',g:'pad',l:'MAME',x:'.zip'}
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

const S_KW={atari2600:'아타리 아타리2600 2600',nes:'패미컴 패미콤 닌텐도 엔이에스 famicom',sms:'마스터시스템 마스터 시스템 세가 sega',pce:'피씨엔진 pc엔진 엔진 pcengine nec turbografx turbografx-16 turbografx16 cd 터보그래픽스 pc엔진cd',md:'메가드라이브 메가 드라이브 제네시스 세가 sega megadrive genesis',gb:'게임보이 보이 닌텐도 gameboy',lynx:'링스 링크스 아타리',snes:'슈퍼패미컴 슈패 슈퍼 패미컴 닌텐도 에스엔이에스 superfamicom',gg:'게임기어 기어 세가 sega gamegear',psx:'플레이스테이션 플스 플레이 스테이션 소니 sony ps1 psx playstation',vb:'버추얼보이 버추얼 가상 닌텐도 virtualboy',n64:'닌텐도64 닌텐도 64 엔64 nintendo64',ngp:'네오지오 네오지오포켓 포켓 snk neogeo',gbc:'게임보이컬러 컬러 닌텐도 gameboycolor',gba:'게임보이어드밴스 어드밴스 닌텐도 gameboyadvance',sg1000:'세가 sega sg1000 sg-1000 에스지1000',scd:'세가시디 세가 시디 메가시디 메가cd segacd megacd sega',s32x:'세가32x 32x 세가 sega 메가드라이브 sega32x',sat:'세가새턴 새턴 세가 sega saturn',amiga:'아미가 암가 commodore 코모도어 amiga',a7800:'아타리7800 아타리 7800 atari7800','3do':'3do 쓰리디오 파나소닉 panasonic',jag:'재규어 자가 아타리 atari jaguar',pcfx:'pcfx pc-fx 피씨에프엑스 nec',neogeo:'네오지오 neogeo neo geo aes mvs snk 네오지오cd',mame:'마메 아케이드 오락실 arcade mame 네오지오 neogeo 캡콤 capcom',psp:'피에스피 플스포터블 플레이스테이션포터블 소니 sony playstation portable psp 휴대용',nds:'닌텐도ds 닌텐도 디에스 듀얼스크린 nintendods',dos:'도스 엠에스도스 msdos 마이크로소프트',win10:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우1',win20:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우2',win30:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3',win31:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우3.1',win95:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우95',win98:'윈도우 윈도우즈 윈도 windows 마이크로소프트 윈도우98'};

/* 아이콘 이미지가 따로 없는 기종은 색상 + 약어 글자로 직접 그린 아이콘을 사용합니다 */
const fbIcon=c=>{const id='fb_'+c.id,t=String(c.l||c.n),fs=t.length>4?22:t.length>3?27:34;
 return `<svg viewBox="0 0 100 100" width="256" height="256" aria-label="${c.n}" draggable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.a}"/><stop offset="1" stop-color="${c.b}"/></linearGradient></defs><rect width="100" height="100" rx="22.5" fill="url(#${id})"/><rect width="100" height="50" rx="22.5" fill="#fff" opacity=".12"/><text x="50" y="${50+fs*0.35}" text-anchor="middle" font-family="-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif" font-weight="800" font-size="${fs}" fill="#fff" style="paint-order:stroke" stroke="rgba(0,0,0,.25)" stroke-width="2">${t}</text></svg>`};
