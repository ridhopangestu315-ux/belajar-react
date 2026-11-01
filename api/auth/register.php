<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('POST');
$masukan = bacaMasukanJson();
$nama = trim((string) ($masukan['name'] ?? ''));
$email = strtolower(trim((string) ($masukan['email'] ?? '')));
$password = (string) ($masukan['password'] ?? '');
$jumlahKarakterNama = preg_match_all('/./us', $nama);

if ($nama === '' || $jumlahKarakterNama === false || $jumlahKarakterNama > 100) {
    kirimJson(['berhasil' => false, 'pesan' => 'Nama wajib diisi dan maksimal 100 karakter.'], 422);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    kirimJson(['berhasil' => false, 'pesan' => 'Masukkan alamat email yang valid.'], 422);
    exit;
}
if (strlen($password) < 8 || strlen($password) > 72) {
    kirimJson(['berhasil' => false, 'pesan' => 'Password harus terdiri dari 8 sampai 72 karakter.'], 422);
    exit;
}

try {
    mulaiSesiAman();
    $pdo = buatKoneksiDatabase();
    $periksa = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $periksa->execute(['email' => $email]);
    if ($periksa->fetch()) {
        kirimJson(['berhasil' => false, 'pesan' => 'Email tersebut sudah terdaftar. Silakan masuk.'], 409);
        exit;
    }

    $hashPassword = password_hash($password, PASSWORD_DEFAULT);
    $pdo->beginTransaction();
    $simpan = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)');
    $simpan->execute(['name' => $nama, 'email' => $email, 'password_hash' => $hashPassword]);
    $pengguna = ['id' => (int) $pdo->lastInsertId(), 'name' => $nama, 'email' => $email];

    $simpanPengaturan = $pdo->prepare('INSERT INTO pengaturan_pengguna (pengguna_id) VALUES (:pengguna_id)');
    $simpanPengaturan->execute(['pengguna_id' => $pengguna['id']]);
    $pdo->commit();

    session_regenerate_id(true);
    $_SESSION['user'] = $pengguna;

    kirimJson(['berhasil' => true, 'pesan' => 'Akun berhasil dibuat. Selamat belajar!', 'user' => dataPenggunaSesi($pengguna)], 201);
} catch (PDOException $kesalahan) {
    if ($kesalahan->getCode() === '23000') {
        kirimJson(['berhasil' => false, 'pesan' => 'Email tersebut sudah terdaftar. Silakan masuk.'], 409);
        exit;
    }
    kirimKesalahanServer();
} catch (Throwable $kesalahan) {
    kirimKesalahanServer();
}
