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
