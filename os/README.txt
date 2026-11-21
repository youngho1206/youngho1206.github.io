[os 폴더 안내]
저작권 보호를 위해 이 사이트는 MS-DOS·Windows 디스크 이미지를 제공하지 않습니다.
윈도우 에뮬레이터(winemu.html 등)는 '이미지 불러오기'로 내가 직접 구한 디스크 이미지를 선택해서 사용하세요.
(원하면 os/<id>/<id>.img 또는 .zip 으로 직접 올려 둘 수도 있습니다. 파일 하나는 GitHub 100MB 이하)

[Windows 3.1 사용법]
- C:\> 에서 win 입력 -> 기본(386 확장 모드)
- 화면이 DOS로 되돌아가면: wins 입력 -> 표준 모드로 실행 (win /s)
- wine 입력 -> 386 확장 모드를 명시적으로 실행 (win /3)

[v86 엔진 (winemu.html)]
- v86 엔진 파일: os/v86/libv86.js, os/v86/v86.wasm
- os/v86/seabios.bin, vgabios.bin, bochs-*.bin 은 오픈소스(SeaBIOS / Bochs, LGPL) 가상 PC 바이오스라 그대로 둡니다.
  (라이선스: v86/COPYING.LESSER)
