<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');
mulaiSesiAman();
pastikanCsrf();
$masukan = bacaMasukanJson();
$email = strtolower(trim((string) ($masukan['email'] ?? '')));
$password = (string) ($masukan['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || $password === '') {
    kirimJson(['berhasil' => false, 'pesan' => 'Masukkan alamat email dengan benar dan isi kata sandi.'], 422);
    exit;
}

try {
    $pdo = buatKoneksiDatabase();
    $bucket = hash('sha256', $email . "\0" . (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $batas = $pdo->prepare('SELECT blocked_until FROM auth_login_attempts WHERE bucket_hash = :bucket LIMIT 1');
    $batas->execute(['bucket' => $bucket]);
    $blokirSampai = $batas->fetchColumn();
    if (is_string($blokirSampai) && strtotime($blokirSampai) > time()) {
        kirimJson(['berhasil' => false, 'pesan' => 'Terlalu banyak percobaan. Coba masuk lagi dalam 15 menit.'], 429);
        exit;
    }
    $pernyataan = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = :email LIMIT 1');
    $pernyataan->execute(['email' => $email]);
    $pengguna = $pernyataan->fetch();

    if (!$pengguna || !password_verify($password, $pengguna['password_hash'])) {
        $catat = $pdo->prepare("INSERT INTO auth_login_attempts (bucket_hash, attempt_count, window_started_at, blocked_until) VALUES (:bucket, 1, NOW(), NULL) ON DUPLICATE KEY UPDATE attempt_count = IF(window_started_at < NOW() - INTERVAL 15 MINUTE, 1, attempt_count + 1), blocked_until = IF(window_started_at < NOW() - INTERVAL 15 MINUTE, NULL, IF(attempt_count >= 5, NOW() + INTERVAL 15 MINUTE, blocked_until)), window_started_at = IF(window_started_at < NOW() - INTERVAL 15 MINUTE, NOW(), window_started_at)");
        $catat->execute(['bucket' => $bucket]);
        kirimJson(['berhasil' => false, 'pesan' => 'Email atau kata sandi salah. Periksa kembali, lalu coba lagi.'], 401);
        exit;
    }

    $hapusBatas = $pdo->prepare('DELETE FROM auth_login_attempts WHERE bucket_hash = :bucket');
    $hapusBatas->execute(['bucket' => $bucket]);
    session_regenerate_id(true);
    unset($pengguna['password_hash']);
    $_SESSION['user'] = dataPenggunaSesi($pengguna);
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    kirimJson(['berhasil' => true, 'pesan' => 'Berhasil masuk. Selamat belajar!', 'user' => dataPenggunaSesi($pengguna), 'csrfToken' => tokenCsrf()]);
} catch (Throwable $kesalahan) {
    error_log('StudyFlow login error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
}
