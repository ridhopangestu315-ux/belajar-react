<?php
declare(strict_types=1);

require_once __DIR__ . '/config/http.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    kirimJson([
        'berhasil' => false,
        'pesan' => 'Endpoint pengujian hanya menerima metode GET.',
    ], 405);
    exit;
}

try {
    require_once __DIR__ . '/config/database.php';
    $koneksi = buatKoneksiDatabase();
    $pernyataan = $koneksi->prepare('SELECT 1');
    $pernyataan->execute();

    kirimJson([
        'berhasil' => true,
        'pesan' => 'PHP berjalan dan koneksi database berhasil.',
        'php' => PHP_VERSION,
        'database' => 'terhubung',
    ]);
} catch (PDOException $kesalahan) {
    // Beri diagnosis yang berguna tanpa mengirim DSN, username, atau password ke browser.
    $kodeMySql = (int) ($kesalahan->errorInfo[1] ?? 0);
    switch ($kodeMySql) {
        case 1045:
            $diagnosis = 'Username/password MySQL salah atau pengguna tidak memiliki izin ke database studyflow.';
            break;
        case 1049:
            $diagnosis = 'Database tidak ditemukan. Impor database/studyflow.sql atau periksa nama database.';
            break;
        case 2002:
        case 2003:
            $diagnosis = 'MySQL tidak dapat dijangkau. Pastikan MySQL Laragon berjalan dan host/port benar.';
            break;
        case 2005:
            $diagnosis = 'Nama host MySQL tidak dikenali. Periksa nilai host di config.local.php.';
            break;
        default:
            $diagnosis = 'Periksa host, port, nama database, izin pengguna, dan ekstensi PDO MySQL.';
    }

    kirimJson([
        'berhasil' => false,
        'pesan' => 'PHP berjalan, tetapi koneksi PDO ke MySQL gagal.',
        'diagnosis' => $diagnosis,
        'php' => PHP_VERSION,
        'database' => 'tidak terhubung',
    ], 503);
} catch (RuntimeException $kesalahan) {
    kirimJson([
        'berhasil' => false,
        'pesan' => 'Konfigurasi database lokal belum siap.',
        'diagnosis' => $kesalahan->getMessage(),
        'php' => PHP_VERSION,
        'database' => 'tidak terhubung',
    ], 503);
} catch (Throwable $kesalahan) {
    // Detail exception lain tetap dirahasiakan dari browser.
    kirimJson([
        'berhasil' => false,
        'pesan' => 'PHP berjalan, tetapi terjadi kesalahan saat menguji koneksi database.',
        'diagnosis' => 'Periksa log error PHP di Laragon untuk detail teknis.',
        'php' => PHP_VERSION,
        'database' => 'tidak terhubung',
    ], 503);
}
