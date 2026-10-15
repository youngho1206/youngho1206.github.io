[레트로아크 스트리밍 기종 — PC 도우미 설치 방법]

홈페이지의 "레트로아크 스트리밍" 기종(게임큐브 · 닌텐도 3DS · Wii · PS Vita · 드림캐스트 · 세가 나오미 ·
세가 새턴 · J2ME · MAME · Neo Geo · Neo Geo Pocket Color · Neo Geo CD · N-Gage)은
웹 브라우저 안에서 돌리는 것이 아니라, "레트로아크가 설치된 내 PC"에서 실행합니다.

[동작 순서]
1) 홈페이지에서 기종 카드를 누르고 [▶ 플레이]
2) 이 PC 의 도우미가 열리고 게임 목록이 나옵니다 (폰 · 태블릿 · PC 어디서든)
3) 게임을 누르면 이 PC 에서 레트로아크가 전체화면으로 실행됩니다
4) 도우미에 스트리밍 주소($StreamUrl)를 넣어 두었다면, 실행 후 그 화면으로 자동 이동합니다
   (화면을 폰/태블릿으로 보려면 Sunshine+Moonlight, Steam Link, Parsec 같은 스트리밍 프로그램이 따로 필요합니다)

[설치]
1. 이 retroarch-helper 폴더를 레트로아크가 설치된 PC 에 복사합니다.
2. RetroArchHelper.ps1 을 메모장으로 열어 맨 위 설정을 고칩니다.
   - $RetroArch : retroarch.exe 가 있는 폴더 (예: C:\RetroArch-Win64)
   - $RomRoot   : 게임 폴더 (기본: C:\RetroArch-Win64\roms)
   - $Key       : 비밀키 (꼭 바꾸세요. 6자 이상)
   - $StreamUrl : (선택) 스트리밍 화면 주소
   - $Standalone: PS Vita / N-Gage 처럼 레트로아크 코어가 없는 기종은 별도 에뮬레이터 exe 경로 입력
3. start-helper.bat 을 실행합니다. 검은 창에 "PC 주소:포트"(예: 192.168.0.10:8765)가 나옵니다.
   - 처음 실행하면 Windows 방화벽 창이 뜹니다 → "개인 네트워크" 허용
4. 홈페이지에서 기종 카드 → [⚙ 연결 설정] 에 입력 후 저장
   - PC 도우미 주소: 위 검은 창에 나온 주소 (예: 192.168.0.10:8765)
   - 비밀키: $Key 와 같은 값
   (이 설정은 기기마다 한 번만 하면 되고, 그 기기에 저장됩니다)
   (주소를 모든 기기에 미리 넣어 두려면 사이트 폴더의 retroarch.json 의 "helper" 값을 고치세요. 비밀키는 공개되므로 넣지 마세요.)

[게임 폴더 구조]  $RomRoot 아래에 기종별 폴더를 만들고 게임을 넣습니다.
  neogeo      Neo Geo (MAME/FBNeo 방식 zip)      saturn     세가 새턴 (.cue .chd .iso)
  neogeocd    Neo Geo CD                         dreamcast  드림캐스트 (.chd .cdi .gdi)
  naomi       세가 나오미 (zip)                   ngpc       Neo Geo Pocket Color
  gamecube    게임큐브                            wii        Wii
  3ds         닌텐도 3DS                          j2me       J2ME 자바 (.jar)
  mame        MAME (zip)                          psvita / ngage  (별도 에뮬레이터를 여는 기종 — 폴더 불필요)

[코어 · BIOS]
- 코어는 레트로아크 [메인 메뉴 → 온라인 업데이터 → 코어 다운로더]에서 받아야 합니다.
  (dolphin / citra / flycast / mednafen_saturn / neocd / fbneo / mednafen_ngp / mame / freej2me 등)
- BIOS 는 기종 카드를 누르면 나오는 안내를 참고해 레트로아크 system 폴더에 넣으세요.
- PS Vita(Vita3K) 와 N-Gage(EKA2L1)는 레트로아크용 코어가 없어서 별도 에뮬레이터를 열어 줍니다.
- 게임 파일은 본인이 합법적으로 소유한 것만 사용하세요.

[안전]
- 도우미는 같은 집 네트워크(와이파이)에서만 쓰세요. 공유기 포트포워딩으로 인터넷에 열지 마세요.
- 게임 폴더 안의 파일만 실행하며, 비밀키가 맞아야 동작합니다.
