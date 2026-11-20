<?php
// Web Version - 업로드/목록/삭제/메모저장 API (닷홈 무료호스팅용, PHP 5.6+ 호환)
error_reporting(0);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$T = array(
  'photo' => array('ext' => array('jpg','jpeg','png','gif','webp','bmp','heic','mp4','mov','webm','3gp'), 'max' => 50),
  'music' => array('ext' => array('mp3','m4a','wav','ogg','flac','aac'), 'max' => 50),
  'memo'  => array('ext' => array('txt'), 'max' => 2),
);

function out($d, $c = 200) { http_response_code($c); echo json_encode($d); exit; }
function to_utf8($s) {
  if (substr($s, 0, 3) === "\xEF\xBB\xBF") $s = substr($s, 3);
  if (function_exists('mb_check_encoding') && !mb_check_encoding($s, 'UTF-8')) {
    $s = mb_convert_encoding($s, 'UTF-8', 'CP949');
  }
  return $s;
}
function uid() { return date('Ymd_His') . '_' . substr(md5(uniqid('', true)), 0, 6); }

// 삭제 암호 (서버에서만 검사하므로 브라우저 소스에는 보이지 않음)
$USE_PASSWORD = false; // true로 바꾸면 사이트 입장 때도 암호를 묻습니다 (삭제 암호는 항상 켜져 있음)
$DELETE_PASSWORD = '3553';
$HINT_TO = 'youngho7375@naver.com';
$MAIL_FROM = ''; // 비워두면 닷홈 주소에서 자동 생성(예: 아이디@아이디.dothome.co.kr). 필요하면 '아이디@도메인'으로 직접 지정

$a = isset($_REQUEST['a']) ? $_REQUEST['a'] : 'list';
$t = isset($_REQUEST['t']) ? $_REQUEST['t'] : '';

if ($a === 'hint') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(array('ok' => false, 'error' => 'POST only'), 405);
  $lock = sys_get_temp_dir() . '/wv_hint_' . md5(__DIR__);
  if (is_file($lock) && time() - (int)@file_get_contents($lock) < 60) out(array('ok' => false, 'error' => '잠시 후 다시 시도해주세요 (1분에 한 번만 보낼 수 있어요)'));
  @file_put_contents($lock, time());
  $host = preg_replace('/[^A-Za-z0-9.\-]/', '', isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost');
  $from = $MAIL_FROM !== '' ? $MAIL_FROM : (strtok($host, '.') . '@' . $host);
  $headers = "From: Web Version <" . $from . ">\r\nContent-Type: text/plain; charset=UTF-8\r\n";
  $subject = '=?UTF-8?B?' . base64_encode('Web Version 비밀번호 힌트') . '?=';
  $sent = @mail($HINT_TO, $subject, '비밀번호힌트 ' . $DELETE_PASSWORD, $headers);
  out(array('ok' => (bool)$sent, 'error' => $sent ? '' : '메일 발송에 실패했어요'));
}

// 사이트 입장 암호 = 삭제 암호와 동일
$SITE_PASSWORD = $DELETE_PASSWORD;
$TOKEN = hash_hmac('sha256', 'wv-session', $SITE_PASSWORD . __DIR__);

if ($a === 'config') out(array('ok' => true, 'pw' => (bool)$USE_PASSWORD, 'del' => true));

if ($a === 'login') {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(array('ok' => false, 'error' => 'POST only'), 405);
  $pw = isset($_POST['pw']) ? (string)$_POST['pw'] : '';
  if (!hash_equals($SITE_PASSWORD, $pw)) { sleep(1); out(array('ok' => false, 'error' => '암호가 틀렸어요'), 403); }
  out(array('ok' => true, 'token' => $TOKEN));
}

// 로그인(토큰) 없이는 목록/업로드/삭제/저장 모두 불가
$k = isset($_REQUEST['k']) ? (string)$_REQUEST['k'] : '';
if ($USE_PASSWORD && !hash_equals($TOKEN, $k)) out(array('ok' => false, 'need_login' => true, 'error' => '로그인이 필요해요'), 401);

if (!isset($T[$t])) out(array('ok' => false, 'error' => '잘못된 요청'), 400);

$base = __DIR__ . '/' . $t;
if (!is_dir($base)) {
  @mkdir($base, 0755, true);
  if (!is_dir($base)) @mkdir($base, 0777, true);
  @file_put_contents($base . '/index.html', '');
}
if (!is_dir($base) || !is_writable($base)) {
  out(array('ok' => false, 'error' => $t . ' 폴더에 쓸 수 없어요. FTP에서 폴더 권한을 707로 바꿔주세요.'), 500);
}

$metaFile = $base . '/_meta.json';
function load_meta() {
  global $metaFile;
  $j = @file_get_contents($metaFile);
  $m = $j ? json_decode($j, true) : array();
  return is_array($m) ? $m : array();
}
function save_meta($m) {
  global $metaFile;
  @file_put_contents($metaFile, json_encode($m), LOCK_EX);
}
function ok_name($n) { return preg_match('/^[A-Za-z0-9_\-]+\.[A-Za-z0-9]+$/', $n); }

if ($a === 'list') {
  $meta = load_meta();
  $items = array();
  foreach (scandir($base) as $f) {
    if ($f[0] === '.' || $f === 'index.html' || $f === '_meta.json') continue;
    $p = $base . '/' . $f;
    if (!is_file($p)) continue;
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    if (!in_array($ext, $T[$t]['ext'])) continue;
    $it = array(
      'name' => $f,
      'orig' => isset($meta[$f]) ? $meta[$f] : $f,
      'size' => filesize($p),
      'mtime' => filemtime($p),
      'url' => $t . '/' . rawurlencode($f),
    );
    if ($t === 'memo') {
      $s = to_utf8(file_get_contents($p));
      $it['text'] = function_exists('mb_substr') ? mb_substr($s, 0, 400, 'UTF-8') : substr($s, 0, 400);
    }
    $items[] = $it;
  }
  usort($items, function ($x, $y) { return $y['mtime'] - $x['mtime']; });
  out(array('ok' => true, 'items' => $items));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(array('ok' => false, 'error' => 'POST only'), 405);

if ($a === 'upload') {
  if (empty($_FILES['files'])) out(array('ok' => false, 'error' => '파일이 없거나 서버 업로드 용량 제한을 넘었어요.'));
  $F = $_FILES['files'];
  $names = (array)$F['name']; $tmps = (array)$F['tmp_name']; $errs = (array)$F['error']; $sizes = (array)$F['size'];
  $meta = load_meta(); $saved = 0; $errors = array();
  foreach ($names as $i => $orig) {
    if ($errs[$i] !== UPLOAD_ERR_OK) { $errors[] = $orig . ': 업로드 실패(용량 제한 등)'; continue; }
    $ext = strtolower(pathinfo($orig, PATHINFO_EXTENSION));
    if (!in_array($ext, $T[$t]['ext'])) { $errors[] = $orig . ': 지원하지 않는 형식'; continue; }
    if ($sizes[$i] > $T[$t]['max'] * 1024 * 1024) { $errors[] = $orig . ': 용량 초과'; continue; }
    $name = ($t === 'memo' ? 'memo_' : '') . uid() . '.' . $ext;
    $dest = $base . '/' . $name;
    if ($t === 'memo') {
      $ok = file_put_contents($dest, to_utf8(file_get_contents($tmps[$i]))) !== false;
    } else {
      $ok = move_uploaded_file($tmps[$i], $dest);
    }
    if ($ok) { @chmod($dest, 0644); $meta[$name] = $orig; $saved++; } else { $errors[] = $orig . ': 저장 실패'; }
  }
  if ($t !== 'memo') save_meta($meta);
  out(array('ok' => $saved > 0, 'saved' => $saved, 'error' => $errors ? implode(' / ', $errors) : '', 'errors' => $errors));
}

if ($a === 'delete') {
  $pw = isset($_POST['pw']) ? (string)$_POST['pw'] : '';
  if (!hash_equals($DELETE_PASSWORD, $pw)) { sleep(1); out(array('ok' => false, 'auth' => false, 'error' => '암호가 틀렸어요'), 403); }
  $name = basename(isset($_POST['name']) ? $_POST['name'] : '');
  $p = $base . '/' . $name;
  if (!ok_name($name) || !is_file($p)) out(array('ok' => false, 'error' => '파일을 찾을 수 없어요'), 404);
  $meta = load_meta(); unset($meta[$name]); save_meta($meta);
  out(array('ok' => @unlink($p)));
}

if ($a === 'save' && $t === 'memo') {
  $text = isset($_POST['text']) ? $_POST['text'] : '';
  if (strlen($text) > $T['memo']['max'] * 1024 * 1024) out(array('ok' => false, 'error' => '메모가 너무 길어요'));
  $name = basename(isset($_POST['name']) ? $_POST['name'] : '');
  if ($name === '' || !ok_name($name) || !is_file($base . '/' . $name)) $name = 'memo_' . uid() . '.txt';
  $ok = file_put_contents($base . '/' . $name, $text) !== false;
  out(array('ok' => $ok, 'name' => $name));
}

out(array('ok' => false, 'error' => '알 수 없는 요청'), 400);
