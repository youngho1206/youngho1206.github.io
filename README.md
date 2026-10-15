# 영호의 게임에뮬레이터
정적 사이트(PHP 없음) — GitHub Pages에 그대로 업로드하세요.
- index.html : 사이트 전체 (콘솔 16종 EmulatorJS + DOS/Windows v86)
- os/        : DOS·Windows 이미지 폴더 (예: os/win31/win31.zip)
- v86/       : (선택) v86 로컬 파일

[윈도우 에뮬레이터]
- 윈도우/DOS 에뮬레이터는 index.html 안의 PC 에뮬레이터 화면(test1206 버전)을 사용합니다. (pcemu 폴더는 제거됨)
- index 접속 시에는 os/ 폴더의 이미지를 불러오지 않습니다.
- 윈도우 항목을 눌러 에뮬레이터에 들어가는 순간, 해당 버전의 이미지(os/<id>/<id>.zip)만 서버에서 받으며 진행률·남은 시간이 표시된 뒤 자동으로 시작합니다.
- Windows 95 이미지: os/win95/win95.zip
