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
    $emailBaru = strtolower(trim((string) ($masukan['email'] ?? '')));
    $password = (string) ($masukan['password'] ?? '');
    if (!filter_var($emailBaru, FILTER_VALIDATE_EMAIL) || strlen($emailBaru) > 254) {
        kirimJson(['berhasil' => false, 'pesan' => 'Masukkan alamat email baru yang valid.'], 422); exit;
    }
    if ($password === '') {
        kirimJson(['berhasil' => false, 'pesan' => 'Masukkan password untuk memverifikasi perubahan email.'], 422); exit;
    }

    $pdo = buatKoneksiDatabase();
    $cari = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE id = :id LIMIT 1');
    $cari->execute(['id' => (int) $penggunaSesi['id']]);
    $pengguna = $cari->fetch();
    if (!$pengguna || !password_verify($password, $pengguna['password_hash'])) {
        kirimJson(['berhasil' => false, 'pesan' => 'Password tidak cocok. Perubahan email dibatalkan.'], 401);
        exit;
    }

    $ubah = $pdo->prepare('UPDATE users SET email = :email WHERE id = :id');
    $ubah->execute(['email' => $emailBaru, 'id' => (int) $pengguna['id']]);
    $dataPengguna = ['id' => (int) $pengguna['id'], 'name' => $pengguna['name'], 'email' => $emailBaru];
    $_SESSION['user'] = $dataPengguna;
    kirimJson(['berhasil' => true, 'pesan' => 'Email akun berhasil diubah.', 'user' => $dataPengguna]);
} catch (PDOException $kesalahan) {
    if ($kesalahan->getCode() === '23000' && (int) ($kesalahan->errorInfo[1] ?? 0) === 1062) {
        kirimJson(['berhasil' => false, 'pesan' => 'Email tersebut sudah digunakan akun lain.'], 409);
        exit;
    }
    error_log('StudyFlow change-email PDO error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
} catch (Throwable $kesalahan) {
    error_log('StudyFlow change-email error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
}
