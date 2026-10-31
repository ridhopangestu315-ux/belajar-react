<?php
declare(strict_types=1);

/** Membuat koneksi PDO dari konfigurasi lokal yang tidak disimpan di Git. */
function buatKoneksiDatabase(): PDO
{
    $berkasKonfigurasi = __DIR__ . '/config.local.php';
    if (!is_file($berkasKonfigurasi)) {
        throw new RuntimeException('Konfigurasi database belum dibuat.');
    }

    $konfigurasi = require $berkasKonfigurasi;
    $host = $konfigurasi['host'] ?? '127.0.0.1';
    $database = $konfigurasi['database'] ?? '';
    $charset = $konfigurasi['charset'] ?? 'utf8mb4';
    $dsn = "mysql:host={$host};dbname={$database};charset={$charset}";

    return new PDO($dsn, $konfigurasi['username'] ?? '', $konfigurasi['password'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}
