<?php
// MP3 폴더 안의 음악 파일 목록을 JSON으로 알려줍니다. (PHP를 지원하는 호스팅용)
// 이 파일을 MP3 폴더에 두고, 음악 파일만 같은 폴더에 넣으면 플레이어에 자동으로 추가됩니다.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$exts = array('mp3','m4a','aac','ogg','oga','opus','wav','flac','weba');
$out = array();
foreach (scandir(__DIR__) as $f) {
  if ($f[0] === '.') continue;
  if (!is_file(__DIR__ . '/' . $f)) continue;
  if (!in_array(strtolower(pathinfo($f, PATHINFO_EXTENSION)), $exts)) continue;
  $name = mb_check_encoding($f, 'UTF-8') ? $f : mb_convert_encoding($f, 'UTF-8', 'CP949');
  $out[] = array('n' => $name, 'u' => rawurlencode($f));
}
usort($out, function ($a, $b) { return strnatcasecmp($a['n'], $b['n']); });
echo json_encode($out, JSON_UNESCAPED_UNICODE);
