<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');
$masukan = bacaMasukanJson();
$passwordLama = (string) ($masukan['current_password'] ?? '');
$passwordBaru = (string) ($masukan['new_password'] ?? '');
$konfirmasi = (string) ($masukan['confirm_password'] ?? '');

if ($passwordLama === '') {
    kirimJson(['berhasil' => false, 'pesan' => 'Masukkan password lama.'], 422);
    exit;
}
if (strlen($passwordBaru) < 8 || strlen($passwordBaru) > 72) {
    kirimJson(['berhasil' => false, 'pesan' => 'Password baru harus terdiri dari 8 sampai 72 karakter.'], 422);
    exit;
}
if ($passwordBaru !== $konfirmasi) {
    kirimJson(['berhasil' => false, 'pesan' => 'Konfirmasi password baru belum sama.'], 422);
    exit;
}

try {
    mulaiSesiAman();
    $penggunaSesi = $_SESSION['user'] ?? null;
    if (!is_array($penggunaSesi) || empty($penggunaSesi['id'])) {
        kirimJson(['berhasil' => false, 'pesan' => 'Sesi berakhir. Silakan masuk kembali.'], 401);
        exit;
    }

    $pdo = buatKoneksiDatabase();
    $cari = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $cari->execute(['id' => (int) $penggunaSesi['id']]);
    $hashSaatIni = $cari->fetchColumn();
    if (!is_string($hashSaatIni) || !password_verify($passwordLama, $hashSaatIni)) {
        kirimJson(['berhasil' => false, 'pesan' => 'Password lama tidak cocok.'], 401);
        exit;
    }

    $hashBaru = password_hash($passwordBaru, PASSWORD_DEFAULT);
    $ubah = $pdo->prepare('UPDATE users SET password_hash = :password_hash WHERE id = :id');
    $ubah->execute(['password_hash' => $hashBaru, 'id' => (int) $penggunaSesi['id']]);
    kirimJson(['berhasil' => true, 'pesan' => 'Password berhasil diubah.']);
} catch (Throwable $kesalahan) {
    error_log('StudyFlow change-password error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
}
