-- Skema utama StudyFlow untuk MySQL/MariaDB (Laragon dan InfinityFree).
-- Tidak ada INSERT: seluruh tabel mulai tanpa akun atau data contoh.
CREATE DATABASE IF NOT EXISTS `studyflow`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `studyflow`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(254) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `foto_profil` MEDIUMTEXT DEFAULT NULL,
  `tingkat_pendidikan` VARCHAR(80) DEFAULT NULL,
  `tingkat_kelas` VARCHAR(80) DEFAULT NULL,
  `institusi` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lengkapi tabel users lama tanpa menghapus baris akun yang sudah tersimpan.
SET @ada_kolom = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'foto_profil');
SET @perintah = IF(@ada_kolom = 0,
  'ALTER TABLE `users` ADD COLUMN `foto_profil` VARCHAR(2048) DEFAULT NULL AFTER `password_hash`',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

-- Foto dari komponen React berupa data URL; MEDIUMTEXT dapat menampung hasil resize.
ALTER TABLE `users` MODIFY COLUMN `foto_profil` MEDIUMTEXT DEFAULT NULL;

SET @ada_kolom = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tingkat_pendidikan');
SET @perintah = IF(@ada_kolom = 0,
  'ALTER TABLE `users` ADD COLUMN `tingkat_pendidikan` VARCHAR(80) DEFAULT NULL AFTER `foto_profil`',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

SET @ada_kolom = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'tingkat_kelas');
SET @perintah = IF(@ada_kolom = 0,
  'ALTER TABLE `users` ADD COLUMN `tingkat_kelas` VARCHAR(80) DEFAULT NULL AFTER `tingkat_pendidikan`',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

SET @ada_kolom = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'institusi');
SET @perintah = IF(@ada_kolom = 0,
  'ALTER TABLE `users` ADD COLUMN `institusi` VARCHAR(150) DEFAULT NULL AFTER `tingkat_kelas`',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

SET @ada_kolom = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at');
SET @perintah = IF(@ada_kolom = 0,
  'ALTER TABLE `users` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

SET @ada_indeks_email = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'email' AND NON_UNIQUE = 0);
SET @perintah = IF(@ada_indeks_email = 0,
  'ALTER TABLE `users` ADD UNIQUE KEY `uq_users_email` (`email`)',
  'SELECT 1');
PREPARE pernyataan_migrasi FROM @perintah;
EXECUTE pernyataan_migrasi;
DEALLOCATE PREPARE pernyataan_migrasi;

CREATE TABLE IF NOT EXISTS `mata_pelajaran` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `nama_pelajaran` VARCHAR(150) NOT NULL,
  `kode_pelajaran` VARCHAR(40) DEFAULT NULL,
  `pengajar` VARCHAR(150) DEFAULT NULL,
  `kategori` VARCHAR(100) DEFAULT NULL,
  `tingkat` VARCHAR(80) DEFAULT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `warna` CHAR(7) NOT NULL DEFAULT '#D5735B',
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_diperbarui` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mata_pelajaran_pengguna_id` (`pengguna_id`, `id`),
  KEY `idx_mata_pelajaran_nama` (`pengguna_id`, `nama_pelajaran`),
  CONSTRAINT `fk_mata_pelajaran_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tugas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `mata_pelajaran_id` BIGINT UNSIGNED DEFAULT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `tanggal_deadline` DATE NOT NULL,
  `waktu_deadline` TIME DEFAULT NULL,
  `prioritas` ENUM('Rendah', 'Sedang', 'Tinggi') NOT NULL DEFAULT 'Sedang',
  `status` ENUM('Belum dikerjakan', 'Sedang dikerjakan', 'Selesai') NOT NULL DEFAULT 'Belum dikerjakan',
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_diperbarui` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tugas_pengguna_deadline` (`pengguna_id`, `status`, `tanggal_deadline`),
  KEY `idx_tugas_mata_pelajaran` (`pengguna_id`, `mata_pelajaran_id`),
  CONSTRAINT `fk_tugas_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tugas_mata_pelajaran` FOREIGN KEY (`pengguna_id`, `mata_pelajaran_id`)
    REFERENCES `mata_pelajaran` (`pengguna_id`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `jadwal` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `mata_pelajaran_id` BIGINT UNSIGNED DEFAULT NULL,
  `judul_kegiatan` VARCHAR(200) NOT NULL,
  `tanggal` DATE DEFAULT NULL,
  `hari` ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu') DEFAULT NULL,
  `waktu_mulai` TIME DEFAULT NULL,
  `waktu_selesai` TIME DEFAULT NULL,
  `keterangan` TEXT DEFAULT NULL,
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_diperbarui` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jadwal_pengguna_tanggal` (`pengguna_id`, `tanggal`, `hari`),
  KEY `idx_jadwal_mata_pelajaran` (`pengguna_id`, `mata_pelajaran_id`),
  CONSTRAINT `fk_jadwal_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_jadwal_mata_pelajaran` FOREIGN KEY (`pengguna_id`, `mata_pelajaran_id`)
    REFERENCES `mata_pelajaran` (`pengguna_id`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `catatan` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `mata_pelajaran_id` BIGINT UNSIGNED DEFAULT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `isi_catatan` LONGTEXT DEFAULT NULL,
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `tanggal_diperbarui` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_catatan_pengguna_diperbarui` (`pengguna_id`, `tanggal_diperbarui`),
  KEY `idx_catatan_mata_pelajaran` (`pengguna_id`, `mata_pelajaran_id`),
  CONSTRAINT `fk_catatan_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_catatan_mata_pelajaran` FOREIGN KEY (`pengguna_id`, `mata_pelajaran_id`)
    REFERENCES `mata_pelajaran` (`pengguna_id`, `id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pengingat` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `judul` VARCHAR(200) NOT NULL,
  `deskripsi` TEXT DEFAULT NULL,
  `waktu_pengingat` DATETIME NOT NULL,
  `status` ENUM('aktif', 'selesai') NOT NULL DEFAULT 'aktif',
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pengingat_pengguna_waktu` (`pengguna_id`, `status`, `waktu_pengingat`),
  CONSTRAINT `fk_pengingat_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `riwayat_fokus` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `durasi_detik` INT UNSIGNED NOT NULL,
  `jenis_sesi` VARCHAR(40) NOT NULL DEFAULT 'Fokus',
  `waktu_mulai` DATETIME NOT NULL,
  `waktu_selesai` DATETIME NOT NULL,
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_riwayat_fokus_pengguna_selesai` (`pengguna_id`, `waktu_selesai`),
  CONSTRAINT `fk_riwayat_fokus_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pengaturan_pengguna` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `tema` ENUM('light', 'dark', 'system') NOT NULL DEFAULT 'light',
  `format_waktu` ENUM('12', '24') NOT NULL DEFAULT '24',
  `pengaturan_notifikasi` TINYINT(1) NOT NULL DEFAULT 1,
  `durasi_fokus_menit` SMALLINT UNSIGNED NOT NULL DEFAULT 25,
  `istirahat_pendek_menit` SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  `istirahat_panjang_menit` SMALLINT UNSIGNED NOT NULL DEFAULT 15,
  `tanggal_diperbarui` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pengaturan_pengguna` (`pengguna_id`),
  CONSTRAINT `fk_pengaturan_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `aktivitas` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `pengguna_id` BIGINT UNSIGNED NOT NULL,
  `jenis` ENUM('belajar', 'tugas', 'kegiatan', 'pengingat') NOT NULL DEFAULT 'belajar',
  `teks` VARCHAR(255) DEFAULT NULL,
  `judul` VARCHAR(200) DEFAULT NULL,
  `tanggal` DATE NOT NULL,
  `tanggal_dibuat` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_aktivitas_pengguna_tanggal` (`pengguna_id`, `tanggal`),
  CONSTRAINT `fk_aktivitas_pengguna` FOREIGN KEY (`pengguna_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `otp_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `attempts` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `verified_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_password_resets_user_expiry` (`user_id`, `expires_at`),
  CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
