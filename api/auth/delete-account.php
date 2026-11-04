<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');

try {
    mulaiSesiAman();
    $penggunaSesi = $_SESSION['user'] ?? null;
    if (!is_array($penggunaSesi) || empty($penggunaSesi['id'])) {
        kirimJson(['berhasil' => false, 'pesan' => 'Sesi berakhir. Silakan masuk kembali.'], 401);
        exit;
    }
    pastikanCsrf();
    $masukan = bacaMasukanJson();
    $password = (string) ($masukan['password'] ?? '');
    if ($password === '' || strlen($password) > 72) {
        kirimJson(['berhasil' => false, 'pesan' => 'Masukkan password akun saat ini.'], 422);
        exit;
    }

    $pdo = buatKoneksiDatabase();
    $pdo->beginTransaction();
    $cari = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1 FOR UPDATE');
    $cari->execute(['id' => (int) $penggunaSesi['id']]);
    $hashPassword = $cari->fetchColumn();
    if (!is_string($hashPassword) || !password_verify($password, $hashPassword)) {
        $pdo->rollBack();
        kirimJson(['berhasil' => false, 'pesan' => 'Password saat ini tidak cocok.'], 401);
        exit;
    }

    // Hapus relasi yang memakai ON DELETE RESTRICT sebelum menghapus akun.
    foreach (['tugas', 'jadwal', 'catatan'] as $tabel) {
        $hapusDataTerkait = $pdo->prepare("DELETE FROM `{$tabel}` WHERE pengguna_id = :id");
        $hapusDataTerkait->execute(['id' => (int) $penggunaSesi['id']]);
    }
    $hapusAkun = $pdo->prepare('DELETE FROM users WHERE id = :id');
    $hapusAkun->execute(['id' => (int) $penggunaSesi['id']]);
    if ($hapusAkun->rowCount() !== 1) {
        throw new RuntimeException('Akun tidak ditemukan saat proses penghapusan.');
    }
    $pdo->commit();

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

    kirimJson(['berhasil' => true, 'pesan' => 'Akun dan data server berhasil dihapus permanen.']);
} catch (Throwable $kesalahan) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('StudyFlow delete-account error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
}