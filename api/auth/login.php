<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');
$masukan = bacaMasukanJson();
$email = strtolower(trim((string) ($masukan['email'] ?? '')));
$password = (string) ($masukan['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || $password === '') {
    kirimJson(['berhasil' => false, 'pesan' => 'Masukkan email dan password yang valid.'], 422);
    exit;
}

try {
    $pdo = buatKoneksiDatabase();
    $pernyataan = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $pernyataan->execute(['email' => $email]);
    $pengguna = $pernyataan->fetch();

    if (!$pengguna || !password_verify($password, $pengguna['password_hash'])) {
        kirimJson(['berhasil' => false, 'pesan' => 'Email atau password tidak cocok.'], 401);
        exit;
    }

    mulaiSesiAman();
    session_regenerate_id(true);
    unset($pengguna['password_hash']);
    $_SESSION['user'] = dataPenggunaSesi($pengguna);
    kirimJson(['berhasil' => true, 'pesan' => 'Berhasil masuk. Selamat belajar!', 'user' => dataPenggunaSesi($pengguna)]);
} catch (Throwable $kesalahan) {
    kirimKesalahanServer();
}
