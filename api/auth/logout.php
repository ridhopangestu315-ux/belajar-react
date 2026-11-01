<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');
try {
    mulaiSesiAman();
} catch (Throwable $kesalahan) {
    kirimJson(['berhasil' => false, 'pesan' => 'Sesi belum dapat dimulai. Periksa konfigurasi server.'], 503);
    exit;
}

$_SESSION = [];
$parameterCookie = session_get_cookie_params();
setcookie(session_name(), '', [
    'expires' => time() - 42000,
    'path' => $parameterCookie['path'],
    'domain' => $parameterCookie['domain'],
    'secure' => $parameterCookie['secure'],
    'httponly' => $parameterCookie['httponly'],
    'samesite' => $parameterCookie['samesite'] ?? 'Lax',
]);
session_destroy();

kirimJson(['berhasil' => true, 'pesan' => 'Anda berhasil keluar.']);
