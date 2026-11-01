# Laporan Keamanan StudyFlow

Tanggal pemeriksaan: 2 November 2026  
Ruang lingkup: API PHP/PDO, autentikasi berbasis sesi, skema MySQL, koneksi React/Vite, penyimpanan browser, dan alur backup. Tidak ada akun atau data belajar pengguna yang dibuat, diubah, atau dihapus selama pemeriksaan.

## Ringkasan

API autentikasi lokal terhubung ke MySQL `studyflow` melalui PDO. Endpoint kini memakai token CSRF untuk semua POST berbasis sesi, membatasi percobaan masuk, memvalidasi `Content-Type`, dan mengembalikan JSON. Build produksi dan pemeriksaan sintaks/lint berhasil.

**Keamanan kepemilikan data server-side belum dapat dinyatakan teruji.** Fitur belajar seperti tugas, mata pelajaran, jadwal, catatan, pengingat, riwayat fokus, dan foto profil masih dikelola pada LocalStorage React; tidak tersedia endpoint CRUD PHP untuk data tersebut. Pemisahan LocalStorage berdasarkan id akun membantu UI memilih ruang belajar, tetapi bukan batas keamanan: pengguna/browser yang menguasai origin dapat membaca atau mengubah storage. Fitur tersebut juga tidak tersinkron di perangkat lain.

## Temuan, risiko, dan perbaikan

| Risiko | Temuan | Perbaikan / status |
|---|---|---|
| Tinggi | Data belajar berada di LocalStorage, tidak ada API untuk mengikat setiap baris ke `user_id` sesi. | Dilaporkan sebagai risiko yang masih ada. Migrasi memerlukan API CRUD dan migrasi data yang direncanakan; tidak dilakukan otomatis agar data browser tidak hilang. |
| Tinggi | Cookie session membuat POST rentan CSRF jika tidak memiliki token. | Token acak per sesi diberikan `check-session.php`, diverifikasi via `X-CSRF-Token` pada login, register, logout, ubah email, dan ubah password; token diputar sesudah login/register. |
| Sedang | Login sebelumnya tidak membatasi percobaan gagal. | Tabel `auth_login_attempts` baru dibuat lokal/schema; login membatasi pasangan hash email+IP ke 5 kegagalan dalam 15 menit, lalu 429 sampai masa blok berakhir. Baris tidak menyimpan email/IP mentah. |
| Sedang | API JSON sebelumnya menerima body tanpa mewajibkan tipe konten yang benar. | Mutasi JSON autentikasi memerlukan `Content-Type: application/json`; tipe lain ditolak 415. Metode yang salah ditolak 405 dan respons memakai JSON. |
| Sedang | Konfigurasi dan error database perlu mencegah kredensial/stack trace sampai ke browser. | PDO tetap memakai exception mode dan prepared statements. `display_errors` dinonaktifkan untuk API; diagnosis test aman tanpa password/DSN, detail teknis masuk log server. `config.local.php` di-ignore Git (jangan unggah). |
| Sedang | Pengguna akun dan kata sandi berisiko terpapar bila hash/session tidak benar. | Login memakai `password_verify`; registrasi/perubahan password memakai `password_hash`; password tidak dimasukkan ke respons API. Sesi memakai cookie HttpOnly, SameSite=Lax, Secure saat HTTPS dan ID diputar setelah autentikasi. Logout menghapus cookie sesi server/browser dan memerlukan CSRF. |
| Sedang | Backup dan pemulihan sebelumnya belum didokumentasikan. | `database/README.md` kini menjelaskan ekspor phpMyAdmin/`mysqldump`, penyimpanan privat, dan pemulihan ke DB terpisah untuk verifikasi; tanpa reset otomatis. |
| Sedang | Endpoint reset password belum ada; tabel `password_resets` saja tidak mengirim atau memverifikasi OTP. | Belum diimplementasikan karena belum ada konfigurasi layanan email/SMTP dan proses verifikasi akun. UI harus terus menyatakan pemulihan belum tersedia. |
| Rendah saat ini | Foto profil tersimpan di browser dan belum ada endpoint upload PHP. | Tidak ada upload executable server-side yang dapat dieksploitasi saat ini. Validasi MIME/ukuran di browser tidak memberi perlindungan server; bila upload server ditambahkan, perlu validasi MIME/isi, batas ukuran, nama acak, dan penyimpanan di luar jalur eksekusi. |
| Sedang | Aplikasi tidak memiliki endpoint backend untuk jadwal pengingat/push. | Pengingat lokal bukan layanan server dan tidak dapat menjamin notifikasi ketika browser tertutup. |

## Pengujian yang dijalankan

| Pemeriksaan | Hasil |
|---|---|
| `GET http://localhost/belajar-react/api/test.php` | Lulus: HTTP 200 JSON, PHP 8.3.30, PDO terhubung, database terpilih `studyflow`. |
| `GET check-session.php` tanpa login | Lulus: HTTP 200 JSON, `authenticated:false`, token CSRF tersedia, cookie sesi dipakai. |
| POST register tanpa token CSRF | Lulus: ditolak HTTP 403 JSON. |
| POST register dengan token tetapi `text/plain` | Lulus: ditolak HTTP 415 JSON. |
| POST register dengan token dan JSON kosong | Lulus: HTTP 422 JSON karena nama wajib; tidak membuat akun. |
| Throttling login, alamat email uji domain `.invalid` | Lulus: lima percobaan salah mendapat 401, percobaan keenam mendapat 429. Hanya satu baris pembatasan untuk identitas uji yang dibuat; tidak ada akun pengguna. |
| PHP 8.3 `php -l` untuk seluruh file endpoint/auth/config relevan | Lulus: tidak ada syntax error. |
| `npm run lint` | Lulus, tanpa temuan. |
| `npm run build` | Lulus; Vite 8.3.5 menghasilkan bundle produksi. |
| Uji dua akun A/B, ubah/hapus data akun lain, duplikasi email secara live | Tidak dijalankan: tidak membuat akun/data uji sesuai batasan; saat ini tidak ada API CRUD data belajar untuk diuji kepemilikannya. |
| Verifikasi format hash baris akun yang ada | Tidak membaca nilai hash atau kredensial akun. Kode registrasi/perubahan password menggunakan `password_hash`; pengujian penyimpanan hash pada akun baru memerlukan membuat akun dan tidak dilakukan. |
| SQL injection, sesi autentikasi/logout penuh, dan request CSRF dari browser lintas origin | Sebagian belum diuji end-to-end; prepared statements terlihat pada query API yang tersedia, uji CSRF token endpoint dan penolakan token hilang berhasil. |

## Backup dan pemulihan

Petunjuk lengkap ada di [database/README.md](database/README.md). Backup database harus disimpan di luar folder web, tidak di-commit, dan diverifikasi dengan pemulihan ke database terpisah sebelum dipakai. Jangan menjalankan reset database. Skema `auth_login_attempts` menggunakan `CREATE TABLE IF NOT EXISTS`; tabel lokal sudah tersedia dan tidak menghapus baris apa pun.

## Risiko tersisa / pekerjaan berikutnya

1. Untuk isolasi yang benar, pindahkan data belajar dari LocalStorage ke endpoint PHP yang mengambil `user_id` hanya dari session dan menambahkan syarat kepemilikan pada setiap baca/ubah/hapus. Rencanakan migrasi LocalStorage agar data lama tidak hilang.
2. Siapkan reset password melalui penyedia email yang dikonfigurasi aman, token sekali pakai dengan masa berlaku, dan pembatasan request.
3. Jangan menganggap data LocalStorage rahasia dari pengguna perangkat/browser yang sama; gunakan kebijakan perangkat dan browser yang sesuai.
4. Di hosting, impor bagian tabel `auth_login_attempts` dari `database/studyflow.sql` sebelum memakai endpoint login versi ini. Pastikan HTTPS aktif agar cookie sesi memiliki atribut Secure.
5. Buat dan uji backup terjadwal di luar web root. Hak DB minimum perlu diatur sesuai dukungan panel hosting; kredensial hanya di konfigurasi PHP yang di-ignore Git.

Tidak ada klaim bahwa seluruh aplikasi sudah aman: perlindungan server-side per data belajar, pemulihan password, dan beberapa pengujian multi-akun masih belum tersedia/terlaksana.
