# Database StudyFlow

File skema tidak berisi data contoh. Pilih file sesuai lingkungan: `database/studyflow_local.sql` untuk membuat/memilih database Laragon, atau `database/studyflow_infinityfree.sql` setelah database hosting dipilih di phpMyAdmin. `database/studyflow.sql` adalah salinan skema portable tanpa `CREATE DATABASE` dan `USE`.

## Impor melalui Laragon dan phpMyAdmin

1. Buka Laragon dan jalankan MySQL.
2. Pilih salah satu cara impor:
   - **Otomatis:** di phpMyAdmin buka tab **Import** dan pilih `database/studyflow_local.sql`. Akun MySQL Laragon harus memiliki izin membuat database.
   - **Pilih database manual:** buat database bernama `studyflow` dengan charset `utf8mb4` di phpMyAdmin, pilih database itu dari panel kiri, lalu impor `database/studyflow.sql` atau `database/studyflow_infinityfree.sql`.
3. Salin `api/config/config.example.php` menjadi `api/config/config.local.php`. Atur `host`, `port`, `database`, `username`, dan `password` sesuai MySQL lokal. Jangan commit atau unggah `config.local.php`.
4. Buka `http://localhost/belajar-react/api/test.php`. JSON dengan `berhasil: true` memastikan koneksi PDO dapat mengakses database.

Jika database lama sudah berisi tabel `users`, pilih database tersebut dahulu dan impor satu file portable (`studyflow.sql` atau `studyflow_infinityfree.sql`). Script membuat tabel yang belum ada dan melengkapi kolom profil lama tanpa perintah DROP atau penghapusan akun. Jangan mengimpor kedua file portable sekaligus karena isinya sama.

## Hosting InfinityFree

1. Buat database lewat **Control Panel InfinityFree** dan catat nama lengkap yang diberikan hosting (dapat memiliki prefix).
2. Buka phpMyAdmin dari panel hosting, pilih database yang baru dibuat di panel kiri, lalu tab **Import**.
3. Pilih `database/studyflow_infinityfree.sql` dan jalankan impor. File ini tidak mengandung `CREATE DATABASE` atau `USE`, sehingga tidak mengasumsikan nama database dan tidak memerlukan izin membuat database.
4. Isi nama database serta kredensial yang diberikan hosting hanya di konfigurasi PHP server. Jangan menaruh kredensial di React atau repository.

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

Skema keamanan menambahkan tabel `auth_login_attempts` (hash email+IP, tanpa email/IP mentah). Ketiga file skema memakai `CREATE TABLE IF NOT EXISTS`; file portable dapat diimpor setelah memilih database secara manual dan tidak menghapus tabel akun atau data pengguna.
