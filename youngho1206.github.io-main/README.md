# 영호의 게임에뮬레이터
정적 사이트(PHP 없음) — GitHub Pages에 그대로 업로드하세요.
- index.html : 사이트 전체 (콘솔 + 마메게임 EmulatorJS + DOS/Windows v86)
- dex.html   : 바탕화면 모드 (DeX 스타일 · 앱 서랍(게임 에뮬레이터 2D 아이콘 · 기종 검색) · 소프트키 · 시작 메뉴 · 키 없이 쓰는 유튜브 게임 검색 브라우저)
- mamegame.js: 마메게임 공통 코드 (게임 목록 · 코어 자동 전환)
- MAME/      : 마메게임 ROM(zip) 목록 폴더
- os/        : DOS·Windows 이미지 폴더 (저작권 보호로 이미지는 제공하지 않음 — '이미지 불러오기'로 직접 선택)
- v86/       : (선택) v86 로컬 파일

[윈도우 에뮬레이터]
- 윈도우/DOS 에뮬레이터는 index.html 안의 PC 에뮬레이터 화면(test1206 버전)을 사용합니다. (pcemu 폴더는 제거됨)
- index 접속 시에는 os/ 폴더의 이미지를 불러오지 않습니다.
- 윈도우 항목을 눌러 에뮬레이터에 들어가는 순간, 해당 버전의 이미지(os/<id>/<id>.zip)만 서버에서 받으며 진행률·남은 시간이 표시된 뒤 자동으로 시작합니다.
- Windows 이미지는 제공하지 않습니다. 직접 구한 이미지를 '이미지 불러오기'로 선택하세요.

[마메게임]
- MAME/ 폴더에 롬(zip)을 올리면 '마메게임' 화면 목록에 자동으로 나타납니다. (자세한 방법: MAME/README.txt)
- 내 기기의 롬(zip)을 직접 불러와 실행할 수도 있습니다.
- 엔진: FinalBurn Neo → MAME 2003-Plus (시작이 안 되면 자동 전환, 화면 위 '코어' 버튼으로 수동 변경)

[PC용 추가 기종] (10월 29일)
- 추가된 기종: 세가 CD · 3DO · 아타리 재규어 · 세가 새턴 · 세가 32X  (PC 사양에 맞춘 설정 적용, 처음 실행할 때 PC용 안내창 표시)
- 준비중 카드: 드림캐스트 · PS2 · 게임큐브 · Wii — 사용 중인 엔진(EmulatorJS)에 코어가 없어 아직 실행할 수 없습니다.
- emudata.js 항목의 pc:1 = PC용 안내·PC 옵션 적용, soon:1 = 준비중. (공통 코드: pcnotice.js)
- 저사양 전용 화면(lowend.html)에는 PC용·준비중 기종이 나오지 않습니다.

[세이브 호환] (savebridge.js)
- 💾 저장 / 📥 불러오기가 다른 에뮬레이터와 세이브를 주고받을 수 있게 개편: 게임 내 저장(.sav .srm .mcr .mcd + N64 .eep .sra .fla .mpk)과 즉시저장(.state)을 지원, 불러올 때 종류 자동 판별(zip·여러 파일 가능)
- 자세한 사용법·한계: SAVE-GUIDE.md
- 적용 페이지: emulator · classic · lowend · mobile · tablet · dex · webthema/thema01

[저작권 · 파일 안내]
- 상용 게임기 BIOS 첨부 기능은 제거했습니다.
- v86 PC 가상머신에 필요한 SeaBIOS/Bochs 오픈소스 구성요소는 유지합니다.
- 이 사이트는 게임 ROM 및 Windows/DOS 이미지를 기본 제공하지 않습니다.


2026년 11월 21일 : 메인 메뉴(상단 4버튼·로고·PC/휴대폰 버튼)와 PC/휴대폰 기종선택 화면 디자인 변경. 이미지: newui/ 폴더, 공용 스타일: newui/select.css. 기종선택 화면의 버튼은 '처음페이지'(index.html?select=1)로 가기만 남김.
