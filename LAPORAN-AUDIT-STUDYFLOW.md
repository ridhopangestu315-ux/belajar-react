# Laporan Audit StudyFlow

Tanggal audit: 2 November 2026  
Lingkungan yang diperiksa: React 19, Vite 8, PHP 8.3.30, Apache Laragon, MySQL 8.4.3.

## 1. Ringkasan

Build produksi berhasil, Oxlint selesai tanpa peringatan, seluruh file PHP lolos pemeriksaan sintaks, dan Apache berhasil menghubungkan PDO ke database `studyflow`. Database aktif memiliki 10 tabel; kolom akun dan unique index email sesuai dengan endpoint autentikasi.

Aplikasi berfungsi sebagai aplikasi belajar sisi-klien dengan autentikasi akun PHP. Tugas, mata pelajaran, catatan, kegiatan, pengingat, Focus Mode, profil, dan preferensi masih disimpan di LocalStorage per ID akun; data belajar belum disimpan atau disinkronkan ke MySQL.

## 2. Temuan, keparahan, dan tindakan

| ID | Keparahan | Temuan dan penyebab | Tindakan |
|---|---|---|---|
| A-01 | Medium | Kalender menampilkan entri feed aktivitas (misalnya aktivitas menambah tugas) seolah-olah kegiatan terjadwal. Kegiatan kalender tidak memiliki kontrol edit/hapus, dan penyimpanan edit membuat entri baru. | Kalender kini hanya menandai kegiatan/jadwal bertipe kalender; entri kegiatan dapat diedit/dihapus dan edit memperbarui entri yang ada. |
| A-02 | Low | Status tugas tanpa nilai `status` sebelumnya menampilkan prioritas sebagai status. | Fallback kini menampilkan “Belum dikerjakan”; label tombol checklist juga mengikuti status tugas. |
| A-03 | Low | Ringkasan Focus Mode menampilkan durasi tetap 25/5 walaupun pengguna mengatur durasi lain. | Ringkasan durasi fokus, istirahat pendek, dan panjang kini mengambil nilai pengaturan akun. |
| A-04 | Low | Oxlint melaporkan hari dalam bulan yang tidak digunakan, tanggal dibuat langsung saat render, dan akses ref saat render. | Nilai yang tidak dipakai dihapus; tanggal header menggunakan state jam aplikasi; animasi statistik tidak lagi membaca ref saat render. |
| A-05 | Medium | Warning/notices PHP berpotensi mencemari respons JSON, sementara beberapa kegagalan autentikasi tidak tercatat di log. | API menonaktifkan tampilan error ke respons dan mengaktifkan log PHP; error login, sesi, logout, serta tes database dicatat di log server. |
| A-06 | High | Belum ada alur lupa password, pembuatan OTP, pengiriman email, verifikasi OTP, atau reset password. Tabel `password_resets` saja belum menyediakan fitur tersebut. | Belum dapat diselesaikan tanpa konfigurasi dan layanan email. Tombol pemulihan masih memberi pesan bahwa fitur belum tersedia. |
| A-07 | High | Data belajar belum memakai tabel MySQL atau endpoint CRUD. Data hanya tersedia di browser tempat data dibuat. | Tidak dimigrasikan dalam audit ini untuk menghindari kehilangan/perubahan data. Kunci LocalStorage sekarang dipisahkan per ID akun. |
| A-08 | Medium | Login dan registrasi tidak memiliki pembatasan percobaan di sisi server. | Belum diubah; perlu mekanisme rate limit yang sesuai dengan kemampuan hosting sebelum penggunaan publik. |
| A-09 | Medium | Pengingat hanya disimpan dan ditampilkan di aplikasi; tidak ada scheduler/cron atau kanal push/email untuk mengirimkannya saat aplikasi tertutup. | Tidak ada scheduler yang tersedia di proyek; perlu dirancang terpisah jika notifikasi terjadwal diwajibkan. |

Tidak ditemukan temuan Critical dalam pemeriksaan statis dan tes API yang dapat dijalankan. Query database yang tersedia memakai PDO; operasi perubahan email/password mengambil ID dari session dan memakai prepared statements. Password disimpan sebagai hash dan verifikasi memakai `password_verify()`.

## 3. Audit database dan isolasi

Koneksi PDO aktif menggunakan database `studyflow`. Pemeriksaan metadata database menemukan tabel `users`, `mata_pelajaran`, `tugas`, `jadwal`, `catatan`, `pengingat`, `riwayat_fokus`, `pengaturan_pengguna`, `aktivitas`, dan `password_resets`. Tabel `users` memiliki kolom `id`, `name`, `email`, `password_hash`, serta kolom profil. `email` memiliki unique index `uq_users_email`.

Definisi primary key, index, dan foreign key pada `database/studyflow.sql` mencakup relasi data berdasarkan `pengguna_id`; foreign key gabungan membatasi tautan tugas/jadwal/catatan ke mata pelajaran milik pengguna yang sama. Database tidak di-reset dan tidak ada baris akun yang dibuat atau diubah selama audit.

LocalStorage lama disalin ke namespace akun pertama yang masuk setelah pemisahan akun diterapkan; salinan lama tidak dihapus otomatis. Karena format lama tidak menyimpan ID pemilik, kepemilikan data lama tidak dapat dibuktikan secara retroaktif. Pengguna perlu memastikan akun pertama tersebut memang pemilik data lama.

## 4. Keamanan dan hosting

- File `api/config/config.local.php` diabaikan oleh Git; kredensial tidak dimasukkan ke frontend.
- Cookie session memakai `HttpOnly`, `SameSite=Lax`, dan `Secure` saat HTTPS terdeteksi; ID session diregenerasi saat login/registrasi.
- Endpoint ganti email dan password menolak session yang tidak terautentikasi. Email diverifikasi dengan password lama dan unique constraint; password baru divalidasi lalu di-hash.
- Respons endpoint menggunakan JSON dan metode yang dipakai adalah GET/POST. Error teknis tidak mengirim password atau DSN kepada browser.
- Foto profil memvalidasi MIME, ekstensi, dan ukuran maksimal 5 MB, lalu dikecilkan sebelum disimpan di LocalStorage.
- InfinityFree memerlukan konfigurasi database milik hosting. Nama database ber-prefix dapat memerlukan penyesuaian `CREATE DATABASE`/`USE` saat impor; jangan mengunggah kredensial Laragon.
- Data belajar tetap berada di browser dan dapat diubah oleh pengguna perangkat/browser yang sama. Namespace per akun mengurangi pencampuran antar-login aplikasi, tetapi bukan pengganti penyimpanan dan otorisasi server-side.

## 5. File yang diubah

- `src/Aplikasi.jsx` — isolasi LocalStorage per pengguna, hapus entri legacy saat pengguna memilih hapus semua data, perbaikan animasi/tanggal, serta edit/hapus kegiatan kalender.
- `src/halaman/HalamanPerencanaan.jsx` — filter entri kalender, kontrol edit/hapus, dan fallback status tugas.
- `src/halaman/HalamanFokus.jsx` — ringkasan memakai durasi pengaturan aktual.
- `src/gaya/aplikasi.css` — tata letak kontrol kegiatan kalender.
- `api/config/http.php` — warning/notices tidak ditampilkan ke body JSON.
- `api/auth/session.php`, `login.php`, `logout.php`, `check-session.php`, `api/test.php` — pencatatan error server.
- `database/AUDIT.md` — status integrasi email/password, kalender, PDF, dan LocalStorage diperbarui.
- `LAPORAN-AUDIT-STUDYFLOW.md` — laporan hasil audit ini.

## 6. Hasil pengujian

| Pemeriksaan | Hasil |
|---|---|
| `npm run build` | Lulus; 2.058 modul ditransformasi. |
| `npm run lint` | Lulus tanpa peringatan. |
| `php -l` seluruh file `api/**/*.php` dan konfigurasi | Lulus; tidak ada syntax error. |
| `GET /api/test.php` melalui Apache | HTTP 200; JSON valid; koneksi ke `studyflow` berhasil. |
| `GET /api/auth/register.php` | HTTP 405; JSON valid. |
| Registrasi/login tanpa input | HTTP 422; JSON valid; tidak membuat akun. |
| Ganti email/password tanpa session | HTTP 401; JSON valid; perubahan ditolak. |
| `GET /api/auth/check-session.php` tanpa cookie | HTTP 200; JSON valid; `authenticated=false`. |
| `POST /api/auth/logout.php` tanpa cookie | HTTP 200; JSON valid. |
| Metadata MySQL | 10 tabel ditemukan; kolom akun dan unique index email cocok. |
| `git diff --check` | Tidak ada whitespace error; Git hanya memberi peringatan normal tentang konversi LF/CRLF Windows. |
| Kredensial konfigurasi lokal | `api/config/config.local.php` diabaikan oleh `.gitignore`. |

## 7. Belum diuji dan risiko tersisa

- Tidak ada browser/Playwright/Chrome yang tersedia untuk memeriksa console, network tab, alur klik, cetak PDF, atau ukuran 1440, 1366, 768, 390, dan 360 px. Responsivitas telah diperiksa secara kode, bukan melalui render browser.
- Register, login berhasil, logout dengan session pengguna, ganti email/password sukses, dan duplikasi email tidak dijalankan end-to-end. Tes tersebut memerlukan akun uji; audit tidak membuat akun dummy dan tidak mengubah kredensial akun nyata.
- Dokumen PDF belum dibuka dalam dialog cetak browser; build hanya memastikan kode bundel valid. Tombol menggunakan print browser, sehingga pengguna perlu memilih “Save as PDF”.
- Pemulihan password/OTP dan notifikasi terjadwal belum tersedia karena tidak ada konfigurasi SMTP atau scheduler.
- Belum ada rate limit autentikasi. Sebelum deployment publik, tambahkan pembatasan percobaan login/registrasi dan kebijakan penguncian yang sesuai.

## 8. Rekomendasi sebelum deployment InfinityFree

1. Isi konfigurasi PHP di server dengan kredensial database ber-prefix milik InfinityFree; jangan memasukkan file rahasia ke repository atau folder publik yang bisa diunduh.
2. Impor skema yang disesuaikan dengan nama database hosting, lalu jalankan `/api/test.php` pada domain hosting.
3. Gunakan HTTPS dan uji cookie session pada domain hosting.
4. Jika akun harus membawa data antarperangkat, implementasikan API CRUD terautentikasi untuk setiap tabel dan rencana migrasi LocalStorage dengan ID pengguna; jangan mengandalkan LocalStorage sebagai sumber data akun.
5. Tambahkan rate limiting login/registrasi. Bangun fitur reset password hanya setelah layanan email dan penyimpanan rahasia SMTP tersedia.
6. Uji tampilan dan alur end-to-end di browser pada semua ukuran layar target, termasuk dialog Save as PDF.
