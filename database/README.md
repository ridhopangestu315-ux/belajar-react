# Database StudyFlow

Skema kanonis ada di `database/studyflow.sql`. File ini membuat database `studyflow` dan sepuluh tabel kosong; tidak ada akun, mata pelajaran, tugas, jadwal, catatan, atau data contoh.

## Impor melalui Laragon dan phpMyAdmin

1. Buka Laragon dan jalankan MySQL.
2. Buka phpMyAdmin, pilih tab **Import**, lalu pilih `database/studyflow.sql` dari proyek ini.
3. Jalankan impor. SQL membuat database `studyflow`, memilihnya, lalu membuat tabel dan relasi.
4. Salin `api/config/config.example.php` menjadi `api/config/config.local.php`. Atur `host`, `port`, `database`, `username`, dan `password` menurut MySQL lokal. Jangan commit atau unggah `config.local.php`.
5. Buka `http://localhost/belajar-react/api/test.php`. JSON dengan `berhasil: true` memastikan koneksi PDO dapat mengakses database.

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

## Backup dan pemulihan

Sebelum perubahan skema atau pemindahan hosting, buat ekspor penuh database dari phpMyAdmin (**Export → Quick → SQL**) atau gunakan `mysqldump`. Jalankan perintah dari terminal Laragon; masukkan password ketika diminta, jangan menuliskannya pada command line:

```powershell
mysqldump --host=127.0.0.1 --port=3306 --user=studyflow_user --password --single-transaction --routines --triggers studyflow > studyflow-backup.sql
```

Sesuaikan username dan port dengan konfigurasi setempat. Simpan file backup di lokasi privat di luar folder web proyek, batasi aksesnya, dan jangan commit/unggah ke GitHub. Backup berisi data pribadi; opsi `--password` tanpa nilai meminta password interaktif dan tidak menyertakannya dalam file.

Untuk pemulihan, buat database tujuan kosong/terpisah lewat phpMyAdmin atau panel hosting, lalu pilih **Import** dan unggah file SQL. Untuk memeriksa backup, pulihkan dulu ke database uji terpisah dan cocokkan jumlah tabel/baris sebelum pemulihan produksi. Jangan mengimpor ke database berisi data tanpa meninjau SQL karena `INSERT`/DDL dapat menggandakan atau mengubah isi. Simpan salinan backup asli dan jangan menjalankan reset database otomatis.

Skema keamanan menambahkan tabel `auth_login_attempts` (hash email+IP, tanpa email/IP mentah). `database/studyflow.sql` memakai `CREATE TABLE IF NOT EXISTS`; mengimpor ulang bagian ini aman dan tidak menghapus tabel akun atau data pengguna.
