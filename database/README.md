# Database StudyFlow

Skema kanonis ada di `database/studyflow.sql`. File ini membuat database `studyflow` dan sepuluh tabel kosong; tidak ada akun, mata pelajaran, tugas, jadwal, catatan, atau data contoh.

## Impor melalui Laragon dan phpMyAdmin

1. Buka Laragon dan jalankan MySQL.
2. Buka phpMyAdmin, pilih tab **Import**, lalu pilih `database/studyflow.sql` dari proyek ini.
3. Jalankan impor. SQL membuat database `studyflow`, memilihnya, lalu membuat tabel dan relasi.
4. Salin `api/config/config.example.php` menjadi `api/config/config.local.php`. Atur `host`, `database`, `username`, dan `password` menurut MySQL lokal. Jangan commit atau unggah `config.local.php`.
5. Buka `/api/test.php` pada virtual host proyek. JSON dengan `berhasil: true` memastikan koneksi PDO dapat mengakses database.

Jika database lama sudah berisi tabel `users` dari skema sebelumnya, impor `database/studyflow.sql` yang sama. Script melengkapi kolom profil yang belum ada dan membuat tabel yang belum ada tanpa menghapus akun. Impor satu file ini saja.

## Hosting InfinityFree

Buat database lewat panel InfinityFree. Jika nama database yang diberikan hosting memakai prefix, sesuaikan baris `USE studyflow` di salinan SQL sebelum mengimpor, dan hapus perintah `CREATE DATABASE` bila panel tidak memberi izin membuat database lewat SQL. Isi kredensial hosting hanya pada konfigurasi PHP server; jangan masukkan ke React atau repository.

## Tabel dan relasi

- `users` menyimpan akun. Nama tabel dan kolom `name`, `email`, serta `password_hash` dipertahankan agar endpoint registrasi/login yang ada tetap kompatibel.
- `mata_pelajaran` dimiliki satu pengguna.
- `tugas`, `jadwal`, dan `catatan` dimiliki satu pengguna dan dapat ditautkan ke mata pelajaran pengguna yang sama. Foreign key gabungan mencegah tautan lintas pengguna. Mata pelajaran yang masih dipakai tidak dapat dihapus sebelum relasinya dilepas.
- `pengingat`, `riwayat_fokus`, `pengaturan_pengguna`, dan `password_resets` terhubung langsung ke pengguna. Hanya satu baris pengaturan diperbolehkan per pengguna.
- `aktivitas` menyimpan aktivitas kalender dan feed yang dipakai ringkasan/progres.
- Penghapusan pengguna menghapus data terkait melalui `ON DELETE CASCADE`; penghapusan mata pelajaran dibatasi selama masih direferensikan oleh tugas, jadwal, atau catatan.

Durasi Focus Mode disimpan dalam detik supaya data timer yang digunakan aplikasi tetap presisi. `jadwal.tanggal` dipakai untuk kegiatan pada tanggal tertentu, sedangkan `jadwal.hari` mendukung jadwal mingguan.

Tabel `password_resets` menyiapkan struktur untuk OTP/reset. Endpoint pemulihan password dan pengiriman email belum tersedia. Lihat [AUDIT.md](AUDIT.md) untuk status integrasi tiap fitur.
