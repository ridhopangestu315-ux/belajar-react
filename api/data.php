<?php
declare(strict_types=1);

require_once __DIR__ . '/auth/session.php';

$metode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (!in_array($metode, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    kirimJson(['berhasil' => false, 'pesan' => 'Metode permintaan tidak didukung.'], 405);
    exit;
}

try {
    mulaiSesiAman();
    $pengguna = $_SESSION['user'] ?? null;
    if (!is_array($pengguna) || empty($pengguna['id'])) {
        kirimJson(['berhasil' => false, 'pesan' => 'Sesi berakhir. Silakan masuk kembali.'], 401);
        exit;
    }

    $pdo = buatKoneksiDatabase();
    // Data aplikasi disimpan sebagai JSON per pengguna dan jenis. Tabel dibuat
    // otomatis agar instalasi lama dapat memakai API tanpa mengubah tabel akun.
    $pdo->exec('CREATE TABLE IF NOT EXISTS user_app_data (
        pengguna_id BIGINT UNSIGNED NOT NULL,
        jenis VARCHAR(64) NOT NULL,
        isi_json LONGTEXT NOT NULL,
        diperbarui_pada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (pengguna_id, jenis)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci');

    $penggunaId = (int) $pengguna['id'];
    if ($metode === 'GET') {
        $ambil = $pdo->prepare('SELECT jenis, isi_json FROM user_app_data WHERE pengguna_id = :pengguna_id');
        $ambil->execute(['pengguna_id' => $penggunaId]);
        $data = [];
        foreach ($ambil->fetchAll() as $baris) {
            $nilai = json_decode((string) $baris['isi_json'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data[$baris['jenis']] = $nilai;
            }
        }
        kirimJson(['berhasil' => true, 'data' => $data]);
        exit;
    }

    pastikanCsrf();
    $masukan = bacaMasukanJson();
    $data = $masukan['data'] ?? [];
    $perubahan = $masukan['changes'] ?? [];
    $hapus = $masukan['deletes'] ?? [];
    $migrasi = ($masukan['migrasi'] ?? false) === true;
    $jenisDiizinkan = [
        'studyflow_tasks', 'studyflow_subjects', 'studyflow_notes',
        'studyflow_reminders', 'studyflow_activities', 'studyflow_settings', 'studyflow_profile_photo',
        'studyflow_focus_history', 'studyflow_focus_sessions',
        'studyflow_timer_running', 'studyflow_timer_mode',
        'studyflow_timer_seconds', 'studyflow_timer_duration_seconds',
    ];
    if (!is_array($data) || !is_array($perubahan) || !is_array($hapus)
        || count($data) + count($perubahan) + count($hapus) > count($jenisDiizinkan) * 3) {
        kirimJson(['berhasil' => false, 'pesan' => 'Format data tidak valid.'], 422);
        exit;
    }
    foreach ([[$data, 'data'], [$perubahan, 'changes'], [$hapus, 'deletes']] as [$kelompok, $modeKelompok]) {
        foreach ($kelompok as $jenis => $nilai) {
        if (!in_array($jenis, $jenisDiizinkan, true)) {
            kirimJson(['berhasil' => false, 'pesan' => 'Jenis data tidak diizinkan.'], 422);
            exit;
        }
        if ($modeKelompok !== 'data') {
            if (!in_array($jenis, ['studyflow_tasks', 'studyflow_subjects', 'studyflow_notes', 'studyflow_reminders', 'studyflow_activities', 'studyflow_focus_history'], true) || !is_array($nilai)) {
                kirimJson(['berhasil' => false, 'pesan' => 'Format perubahan koleksi tidak valid.'], 422);
                exit;
            }
            foreach ($nilai as $item) {
                $id = $modeKelompok === 'changes' && is_array($item) ? ($item['id'] ?? null) : ($modeKelompok === 'deletes' ? $item : null);
                if ((!is_string($id) && !is_int($id)) || (string) $id === '') {
                    kirimJson(['berhasil' => false, 'pesan' => 'Setiap perubahan harus memiliki ID.'], 422);
                    exit;
                }
            }
        }
        $json = json_encode($nilai, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($json) || strlen($json) > 4000000) {
            kirimJson(['berhasil' => false, 'pesan' => 'Ukuran data terlalu besar atau tidak valid.'], 422);
            exit;
        }
        }
    }

    $simpan = $pdo->prepare('INSERT INTO user_app_data (pengguna_id, jenis, isi_json)
        VALUES (:pengguna_id, :jenis, :isi_json)
        ON DUPLICATE KEY UPDATE isi_json = VALUES(isi_json)');
    $simpanMigrasi = $pdo->prepare('INSERT IGNORE INTO user_app_data (pengguna_id, jenis, isi_json)
        VALUES (:pengguna_id, :jenis, :isi_json)');
    $buatKoleksi = $pdo->prepare("INSERT IGNORE INTO user_app_data (pengguna_id, jenis, isi_json) VALUES (:pengguna_id, :jenis, '[]')");
    $ambilKoleksi = $pdo->prepare('SELECT isi_json FROM user_app_data WHERE pengguna_id = :pengguna_id AND jenis = :jenis FOR UPDATE');
    $pdo->beginTransaction();
    foreach ($data as $jenis => $nilai) {
        $json = json_encode($nilai, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        ($migrasi ? $simpanMigrasi : $simpan)->execute([
            'pengguna_id' => $penggunaId,
            'jenis' => $jenis,
            'isi_json' => $json,
        ]);
    }
    foreach ($perubahan as $jenis => $itemBerubah) {
        $buatKoleksi->execute(['pengguna_id' => $penggunaId, 'jenis' => $jenis]);
        $ambilKoleksi->execute(['pengguna_id' => $penggunaId, 'jenis' => $jenis]);
        $tersimpan = json_decode((string) $ambilKoleksi->fetchColumn(), true);
        $tersimpan = is_array($tersimpan) ? $tersimpan : [];
        $berdasarkanId = [];
        foreach ($tersimpan as $index => $item) {
            if (is_array($item) && isset($item['id']) && (is_string($item['id']) || is_int($item['id']))) {
                $berdasarkanId[(string) $item['id']] = $item;
            } else {
                $berdasarkanId['legacy:' . $index] = $item;
            }
        }
        foreach (($hapus[$jenis] ?? []) as $id) {
            unset($berdasarkanId[(string) $id]);
        }
        foreach ($itemBerubah as $item) {
            $berdasarkanId[(string) $item['id']] = $item;
        }
        $json = json_encode(array_values($berdasarkanId), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $simpan->execute(['pengguna_id' => $penggunaId, 'jenis' => $jenis, 'isi_json' => $json]);
    }
    foreach ($hapus as $jenis => $ids) {
        if (array_key_exists($jenis, $perubahan)) {
            continue;
        }
        $buatKoleksi->execute(['pengguna_id' => $penggunaId, 'jenis' => $jenis]);
        $ambilKoleksi->execute(['pengguna_id' => $penggunaId, 'jenis' => $jenis]);
        $tersimpan = json_decode((string) $ambilKoleksi->fetchColumn(), true);
        $tersimpan = is_array($tersimpan) ? $tersimpan : [];
        $hapusSet = array_fill_keys(array_map('strval', $ids), true);
        $tersimpan = array_values(array_filter($tersimpan, static function ($item) use ($hapusSet): bool {
            return !is_array($item) || !isset($item['id']) || !isset($hapusSet[(string) $item['id']]);
        }));
        $simpan->execute([
            'pengguna_id' => $penggunaId,
            'jenis' => $jenis,
            'isi_json' => json_encode($tersimpan, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    }
    $pdo->commit();
    kirimJson(['berhasil' => true, 'pesan' => 'Data berhasil disimpan.']);
} catch (Throwable $kesalahan) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('StudyFlow data API error: ' . $kesalahan->getMessage());
    kirimKesalahanServer();
}
