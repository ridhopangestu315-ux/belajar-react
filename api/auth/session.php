<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/http.php';
require_once __DIR__ . '/../config/database.php';

/** Memulai sesi dengan cookie yang dibatasi untuk hostname aplikasi. */
function mulaiSesiAman(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    $httpsAktif = (!empty($_SERVER['HTTPS']) && strtolower((string) $_SERVER['HTTPS']) !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443);

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $httpsAktif,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    if (!@session_start() || session_status() !== PHP_SESSION_ACTIVE) {
        throw new RuntimeException('Sesi tidak dapat dimulai.');
    }
}

/** Memastikan endpoint hanya menerima metode yang diminta. */
function pastikanMetode(string $metode): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== $metode) {
        header('Allow: ' . $metode);
        kirimJson(['berhasil' => false, 'pesan' => 'Metode permintaan tidak didukung.'], 405);
        exit;
    }
}

/** Membaca body JSON tanpa menampilkan detail kesalahan server. */
function bacaMasukanJson(): array
{
    $data = json_decode((string) file_get_contents('php://input'), true);
    if (!is_array($data)) {
        kirimJson(['berhasil' => false, 'pesan' => 'Format data permintaan tidak valid.'], 400);
        exit;
    }
    return $data;
}

function dataPenggunaSesi(array $pengguna): array
{
    return [
        'id' => (int) $pengguna['id'],
        'name' => $pengguna['name'],
        'email' => $pengguna['email'],
    ];
}

function kirimKesalahanServer(): void
{
    kirimJson(['berhasil' => false, 'pesan' => 'Layanan sedang bermasalah. Coba lagi beberapa saat.'], 500);
}
