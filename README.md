# 최영호의 게임에뮬레이터
정적 사이트(PHP 없음) — GitHub Pages에 그대로 업로드하세요.
- index.html : 사이트 전체 (콘솔 16종 EmulatorJS + DOS/Windows v86)
- os/        : DOS·Windows 이미지 폴더
- v86/       : (선택) v86 로컬 파일

## 일상 (life.html) — 영호의 일상기록용
- 사진: IMG/ 폴더에 사진 업로드 → 자동 표시
- 음악: MUSIC/ 폴더에 mid·wav·wma·mp3 업로드 → 자동 표시
- 영상 링크·일기: data/videos.json, data/diary.json 에 저장 (life.html의 ⚙ 에서 저장소/토큰을 한 번 입력)
- IMG·MUSIC 자동 목록은 GitHub 저장소 API로 읽습니다. 다른 서버라면 폴더 목록(autoindex) 또는 IMG/list.json 사용
