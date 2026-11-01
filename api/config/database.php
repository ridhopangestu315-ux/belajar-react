<?php
declare(strict_types=1);

/** Membuat koneksi PDO dari konfigurasi lokal yang tidak disimpan di Git. */
function buatKoneksiDatabase(): PDO
{
    $berkasKonfigurasi = __DIR__ . '/config.local.php';
    if (!is_file($berkasKonfigurasi)) {
        throw new RuntimeException('File api/config/config.local.php belum ada. Salin config.example.php dan isi pengaturan MySQL Laragon.');
    }

    $konfigurasi = require $berkasKonfigurasi;
    if (!is_array($konfigurasi)) {
        throw new RuntimeException('config.local.php harus mengembalikan array konfigurasi.');
    }

    $host = trim((string) ($konfigurasi['host'] ?? ''));
    $port = filter_var($konfigurasi['port'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1, 'max_range' => 65535],
    ]);
    $database = trim((string) ($konfigurasi['database'] ?? ''));
    $username = trim((string) ($konfigurasi['username'] ?? ''));
    $passwordAda = array_key_exists('password', $konfigurasi) && is_string($konfigurasi['password']);
    $password = $passwordAda ? $konfigurasi['password'] : '';
    $charset = trim((string) ($konfigurasi['charset'] ?? 'utf8mb4'));

    if ($host === '' || $port === false || $database === '' || $username === '' || !$passwordAda) {
        throw new RuntimeException('Isi host, port, database, username, dan password di api/config/config.local.php.');
    }
    if (!preg_match('/^[A-Za-z0-9_.-]+$/', $host)
        || !preg_match('/^[A-Za-z0-9_]+$/', $database)
        || !preg_match('/^[A-Za-z0-9_]+$/', $charset)) {
        throw new RuntimeException('Nilai host, nama database, atau charset pada konfigurasi tidak valid.');
    }

    $dsn = "mysql:host={$host};port={$port};dbname={$database};charset={$charset}";

    return new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);
}
