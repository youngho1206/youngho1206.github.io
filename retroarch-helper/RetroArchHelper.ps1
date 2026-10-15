# ============================================================================
#  RetroArch 도우미 (PC 에서 실행)
#  홈페이지의 "레트로아크 스트리밍" 기종 카드 -> 이 PC 의 레트로아크를 실행합니다.
#  * 이 스크립트는 이 PC 의 같은 네트워크(집 와이파이) 안에서만 쓰도록 만들었습니다.
#  * 공유기에서 포트포워딩으로 인터넷에 직접 열지 마세요.
# ============================================================================

# ===== 설정 (여기만 고치세요) ==============================================
$RetroArch  = 'C:\RetroArch-Win64'          # retroarch.exe 가 있는 폴더
$RomRoot    = 'C:\RetroArch-Win64\roms'     # 게임 폴더 (이 아래에 기종별 폴더를 만들어 게임을 넣습니다)
$Port       = 8765
$Key        = 'changeme'                    # 비밀키: 꼭 바꾸세요 (홈페이지 '연결 설정'의 비밀키와 같게)
$StreamUrl  = ''                            # (선택) 실행 후 자동으로 이동할 스트리밍 화면 주소. 예) Sunshine/Moonlight 웹, Parsec 등
# 레트로아크 코어가 없는 기종은 별도 에뮬레이터 exe 의 전체 경로를 적으면 그 프로그램을 엽니다.
$Standalone = @{
    psvita = ''     # 예) 'C:\Vita3K\Vita3K.exe'
    ngage  = ''     # 예) 'C:\EKA2L1\eka2l1_qt.exe'
}
# ===========================================================================

# 기종 번호 -> 게임 폴더 이름 / 실행할 수 있는 확장자  (홈페이지 기종 id 와 같아야 합니다)
$Sys = @{
    'ra-neogeo' = @{ dir='neogeo';    ext='zip' }
    'saturn'    = @{ dir='saturn';    ext='cue,chd,iso,ccd' }
    'neocd'     = @{ dir='neogeocd';  ext='cue,chd,iso' }
    'dc'        = @{ dir='dreamcast'; ext='chd,cdi,gdi,cue' }
    'naomi'     = @{ dir='naomi';     ext='zip,7z,chd' }
    'ngpc'      = @{ dir='ngpc';      ext='ngc,ngp,zip' }
    'gc'        = @{ dir='gamecube';  ext='iso,gcm,gcz,rvz,ciso' }
    'j2me'      = @{ dir='j2me';      ext='jar' }
    'ngage'     = @{ dir='ngage';     ext='' }
    'wii'       = @{ dir='wii';       ext='iso,wbfs,rvz,ciso,gcz' }
    'psvita'    = @{ dir='psvita';    ext='' }
    '3ds'       = @{ dir='3ds';       ext='3ds,cci,cxi,3dsx' }
    'ra-mame'   = @{ dir='mame';      ext='zip,7z,chd' }
}

$ErrorActionPreference = 'Stop'
if ($Key -eq 'changeme' -or $Key.Length -lt 6) {
    Write-Host '[!] RetroArchHelper.ps1 맨 위의 $Key (비밀키)를 6자 이상으로 바꾼 뒤 다시 실행하세요.' -ForegroundColor Yellow
    Read-Host '엔터를 누르면 닫힙니다'; exit 1
}
if (-not (Test-Path -LiteralPath (Join-Path $RetroArch 'retroarch.exe'))) {
    Write-Host "[!] retroarch.exe 를 찾을 수 없습니다: $RetroArch  (맨 위의 `$RetroArch 경로를 확인하세요)" -ForegroundColor Yellow
    Read-Host '엔터를 누르면 닫힙니다'; exit 1
}

function H([string]$t) { [System.Net.WebUtility]::HtmlEncode($t) }

function Page([string]$title, [string]$body, [string]$head = '') {
    "<!DOCTYPE html><html lang=ko><head><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><meta name=referrer content=no-referrer><title>$(H $title)</title>$head" +
    "<style>body{margin:0;padding:18px;background:#0f0f14;color:#f2f2f7;font:16px/1.55 sans-serif}h2{margin:6px 0 14px}a.g{display:block;padding:14px 16px;margin:8px 0;border-radius:14px;background:#1d1d26;color:#fff;text-decoration:none;word-break:break-all}" +
    "input{width:100%;box-sizing:border-box;padding:12px;border-radius:12px;border:1px solid #444;background:#000;color:#fff;font-size:16px;margin-bottom:10px}p.s{opacity:.65;font-size:13px}</style></head><body>$body</body></html>"
}

function Reply($stream, [int]$code, [string]$html) {
    $reason = @{ 200='OK'; 400='Bad Request'; 403='Forbidden'; 404='Not Found'; 500='Internal Server Error' }[$code]
    $body = [Text.Encoding]::UTF8.GetBytes($html)
    $head = "HTTP/1.1 $code $reason`r`nContent-Type: text/html; charset=utf-8`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length); $stream.Write($body, 0, $body.Length); $stream.Flush()
}

function Parse-Query([string]$qs) {
    $h = @{}
    if ($qs) {
        foreach ($p in $qs.Split('&')) {
            if ($p -eq '') { continue }
            $i = $p.IndexOf('=')
            if ($i -lt 0) { $k = $p; $v = '' } else { $k = $p.Substring(0, $i); $v = $p.Substring($i + 1) }
            $h[[uri]::UnescapeDataString($k.Replace('+', ' '))] = [uri]::UnescapeDataString($v.Replace('+', ' '))
        }
    }
    $h
}

function Done([string]$msg) {
    $head = ''; $extra = ''
    if ($StreamUrl) {
        $u = H $StreamUrl
        $head = "<meta http-equiv=refresh content='2;url=$u'>"
        $extra = "<a class=g href='$u'>스트리밍 화면 열기</a>"
    }
    Page '실행' "<h2>&#9654; $(H $msg)</h2>$extra<p class=s>이 창은 닫아도 됩니다.</p>" $head
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
$listener.Start()
Write-Host "RetroArch 도우미 작동 중 (포트 $Port) — 이 창을 닫으면 멈춥니다." -ForegroundColor Green
Write-Host '홈페이지 [연결 설정] 의 "PC 도우미 주소"에 아래 중 하나를 입력하세요:'
Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } |
    ForEach-Object { Write-Host ("   {0}:{1}" -f $_.IPAddress, $Port) -ForegroundColor Cyan }

while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
        $client.ReceiveTimeout = 1500
        $stream = $client.GetStream()
        $rd = New-Object IO.StreamReader($stream, [Text.Encoding]::ASCII)
        $line = $rd.ReadLine()
        while (($h = $rd.ReadLine()) -ne $null -and $h -ne '') { }
        if (-not $line -or $line -notmatch '^GET (\S+) HTTP') { Reply $stream 400 (Page '오류' '<h2>잘못된 요청</h2>'); continue }
        $target = $Matches[1]
        $path = $target; $qs = ''
        $qi = $target.IndexOf('?'); if ($qi -ge 0) { $path = $target.Substring(0, $qi); $qs = $target.Substring($qi + 1) }
        $q = Parse-Query $qs

        if ($path -eq '/favicon.ico') { Reply $stream 404 ''; continue }
        if ($q['key'] -ne $Key) { Reply $stream 403 (Page '비밀키 오류' '<h2>비밀키가 맞지 않습니다</h2><p class=s>홈페이지의 [연결 설정]에서 비밀키를 도우미 스크립트의 $Key 와 같게 입력하세요.</p>'); continue }

        if ($path -eq '/') { Reply $stream 200 (Page '도우미' '<h2>RetroArch 도우미 작동 중 &#10003;</h2>'); continue }

        $sys = $q['sys']
        if (-not $sys -or -not $Sys.ContainsKey($sys)) { Reply $stream 404 (Page '오류' '<h2>알 수 없는 기종입니다</h2>'); continue }
        $info = $Sys[$sys]
        $core = $q['core']
        if ($core -and $core -notmatch '^[a-z0-9_]+$') { Reply $stream 400 (Page '오류' '<h2>코어 이름이 올바르지 않습니다</h2>'); continue }
        $dir = Join-Path $RomRoot $info.dir
        $exts = @(); if ($info.ext) { $exts = $info.ext.Split(',') }
        $keyQ = [uri]::EscapeDataString($Key)

        if ($path -eq '/play') {
            # 코어가 없는 기종 -> 별도 에뮬레이터 열기
            if ($info.ext -eq '') {
                $exe = $Standalone[$sys]
                if (-not $exe -or -not (Test-Path -LiteralPath $exe -PathType Leaf)) {
                    Reply $stream 200 (Page '설정 필요' "<h2>에뮬레이터 경로가 비어 있습니다</h2><p>RetroArchHelper.ps1 맨 위 <b>`$Standalone</b> 의 <b>$(H $sys)</b> 항목에 에뮬레이터 exe 전체 경로를 적어 주세요.</p>"); continue
                }
                Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe)
                Write-Host "$(Get-Date -f HH:mm:ss) 열기: $exe"
                Reply $stream 200 (Done '에뮬레이터를 열었습니다'); continue
            }
            if (-not $core) { Reply $stream 400 (Page '오류' '<h2>코어가 지정되지 않았습니다</h2>'); continue }
            if (-not (Test-Path -LiteralPath (Join-Path $RetroArch "cores\$core.dll"))) {
                Reply $stream 200 (Page '코어 없음' "<h2>코어가 설치되어 있지 않습니다</h2><p><b>$(H $core)</b> — 레트로아크 [메인 메뉴 → 온라인 업데이터 → 코어 다운로더]에서 받아 주세요.</p>"); continue
            }
            if (-not (Test-Path -LiteralPath $dir -PathType Container)) {
                Reply $stream 200 (Page '폴더 없음' "<h2>게임 폴더가 없습니다</h2><p>PC 에 이 폴더를 만들고 게임을 넣어 주세요:<br><b>$(H $dir)</b></p>"); continue
            }
            $files = Get-ChildItem -LiteralPath $dir -File | Where-Object { $exts -contains $_.Extension.TrimStart('.').ToLower() } | Sort-Object Name
            $items = foreach ($f in $files) {
                "<a class=g data-n='$(H $f.Name.ToLower())' href='/run?sys=$([uri]::EscapeDataString($sys))&core=$([uri]::EscapeDataString($core))&key=$keyQ&f=$([uri]::EscapeDataString($f.Name))'>$(H $f.Name)</a>"
            }
            if (-not $items) { $items = "<p class=s>게임 파일이 없습니다. 이 폴더에 넣어 주세요:<br>$(H $dir)<br>(지원 형식: $(H ($exts -join ', ')))</p>" }
            $js = "<script>function f(v){v=v.toLowerCase();document.querySelectorAll('a.g').forEach(function(a){a.style.display=a.dataset.n.indexOf(v)<0?'none':''})}</script>"
            Reply $stream 200 (Page '게임 고르기' "<h2>게임을 고르세요</h2><input placeholder='검색' oninput='f(this.value)'>$($items -join '')$js")
            continue
        }

        if ($path -eq '/run') {
            $f = $q['f']
            if (-not $core -or -not $f -or [IO.Path]::GetFileName($f) -ne $f) { Reply $stream 400 (Page '오류' '<h2>잘못된 요청</h2>'); continue }
            $rom = Join-Path $dir $f
            $dll = Join-Path $RetroArch "cores\$core.dll"
            if (-not (Test-Path -LiteralPath $rom -PathType Leaf) -or -not (Test-Path -LiteralPath $dll -PathType Leaf)) { Reply $stream 404 (Page '오류' '<h2>게임 또는 코어를 찾을 수 없습니다</h2>'); continue }
            if ($exts -notcontains ([IO.Path]::GetExtension($f).TrimStart('.').ToLower())) { Reply $stream 400 (Page '오류' '<h2>지원하지 않는 형식입니다</h2>'); continue }
            Start-Process -FilePath (Join-Path $RetroArch 'retroarch.exe') -WorkingDirectory $RetroArch -ArgumentList @('-f', '-L', ('"' + $dll + '"'), ('"' + $rom + '"'))
            Write-Host "$(Get-Date -f HH:mm:ss) 실행: $core  $f"
            Reply $stream 200 (Done "$f 실행!"); continue
        }

        Reply $stream 404 (Page '오류' '<h2>없는 주소입니다</h2>')
    }
    catch {
        try { Reply $stream 500 (Page '오류' "<h2>도우미 오류</h2><p class=s>$(H $_.Exception.Message)</p>") } catch { }
    }
    finally { $client.Close() }
}
