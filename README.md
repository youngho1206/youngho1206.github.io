# Web Version (GitHub Pages용)

사진 / 음악 / 메모를 올리고 보는 모바일풍 웹페이지입니다. 업로드한 파일은 이 저장소의
`photo/`, `music/`, `memo/` 폴더에 자동으로 커밋됩니다. (PHP 없이 동작)

## 설치
1. 이 폴더의 **모든 파일**(`.nojekyll`, `.gitkeep` 포함)을 저장소 맨 위에 올립니다.
2. 저장소 Settings → Pages → Source를 `main` 브랜치 `/ (root)`로 설정합니다.
3. 주소(`https://아이디.github.io/저장소/`)로 들어가면 메인이 바로 열립니다.

## 올리기/삭제용 토큰 (처음 한 번, 기기마다)
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate
2. Repository access: **이 저장소만**, Permissions → **Contents: Read and write**
3. 사이트 메인 오른쪽 위 설정 버튼에서 소유자 / 저장소 이름 / 토큰을 입력하고 저장합니다.

보기는 토큰 없이도 되고, 올리기·메모저장·삭제는 토큰이 있어야 합니다.
삭제할 때는 삭제 암호도 묻습니다.
