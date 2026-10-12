각 폴더에 같은 이름의 이미지를 넣으세요 (img, zip, iso 중 하나).
예) os/win31/win31.img  또는  os/win31/win31.zip
파일 하나는 GitHub 100MB 이하 (큰 이미지는 zip으로 압축)

[Windows 3.1 사용법]
- C:\> 에서 win 입력 -> 기본(386 확장 모드)
- 화면이 DOS로 되돌아가면: wins 입력 -> 표준 모드로 실행 (win /s)
- wine 입력 -> 386 확장 모드를 명시적으로 실행 (win /3)


[v86 엔진 / Windows 에뮬레이터 (winemu.html)]
- Windows 1.0 / 2.0 / 3.0 / 3.1 / 95 / 98 은 winemu.html?os=win10|win20|win30|win31|win95|win98 로 실행됩니다.
- v86 엔진 파일: os/v86/libv86.js, os/v86/v86.wasm (BIOS: os/v86/seabios.bin, vgabios.bin)
  → 이 폴더에 파일이 있으면 그것을 먼저 쓰고, 없으면 CDN에서 받습니다.
- 디스크 이미지: os/<id>/<id>.img 또는 .zip / .iso  (예: os/win98/win98.zip)
- 이미지가 없으면 화면의 '이미지 불러오기'로 내 기기의 파일을 직접 선택할 수 있습니다.

[플로피 / CD 이미지 · 화면캡처 (winemu.html)]
- Windows 1.0 / 2.0 / 3.0 / 3.1 / 95 / 98 모두 상단 메뉴에서 3.5" 플로피(A:)와 CD-ROM 이미지를 넣고 뺄 수 있습니다. (1.0 / 2.0 / 3.0 은 5.25" 플로피(B:)도 가능)
- 도스 기반 윈도우(1.0~3.1)에서 CD를 드라이브 문자(D: 등)로 쓰려면, 하드디스크 이미지 안에 CD-ROM 드라이버가 설정돼 있어야 합니다.
  (CONFIG.SYS 에 DEVICE=...CDROM.SYS /D:MSCD001, AUTOEXEC.BAT 에 MSCDEX /D:MSCD001 — Windows 3.1은 AUTOEXEC.BAT 의 MSCDEX 줄이 자동 정리 때도 유지됩니다)
- '📷 화면캡처' : 지금 에뮬레이터에 보이는 화면(윈도우 화면·도스 글자 화면 모두)을 PNG 사진으로 저장합니다.
