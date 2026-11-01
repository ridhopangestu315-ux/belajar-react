<?php
declare(strict_types=1);

require_once __DIR__ . '/session.php';
pastikanMetode('GET');
try {
    mulaiSesiAman();
} catch (Throwable $kesalahan) {
    kirimJson(['berhasil' => false, 'pesan' => 'Sesi belum dapat dimulai. Periksa konfigurasi server.'], 503);
    exit;
}

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    kirimJson(['berhasil' => true, 'authenticated' => false, 'user' => null]);
    exit;
}

kirimJson(['berhasil' => true, 'authenticated' => true, 'user' => dataPenggunaSesi($_SESSION['user'])]);
