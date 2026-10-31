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
} catch (Throwable $kesalahan) {
    // Detail exception tidak dikirim ke browser agar konfigurasi server tetap rahasia.
    kirimJson([
        'berhasil' => false,
        'pesan' => 'PHP berjalan, tetapi koneksi database gagal atau belum dikonfigurasi.',
        'php' => PHP_VERSION,
        'database' => 'tidak terhubung',
    ], 503);
}
