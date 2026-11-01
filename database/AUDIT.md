# Audit Penyimpanan dan Backend StudyFlow

Audit ini membandingkan alur pada `src/Aplikasi.jsx`, halaman/komponen React, endpoint di `api/`, dan skema `database/studyflow.sql`. Tabel di SQL menyediakan ruang penyimpanan, tetapi saat ini sebagian besar fitur belum memakai tabel tersebut: UI masih membaca dan menulis LocalStorage dan belum ada endpoint CRUD.

## Hasil per fitur

| Fitur | Data/state React | Skema MySQL | Endpoint/proses PHP | Status |
|---|---|---|---|---|
| Register | Nama, email, password dari `HalamanAutentikasi` | `users.name`, `email`, `password_hash`; `pengaturan_pengguna` | `POST /api/auth/register.php`, hash password, membuat pengaturan default dalam transaksi, lalu memulai session | Didukung untuk pembuatan akun dan preferensi awal |
| Login | Email dan password | `users` | `POST /api/auth/login.php`, `password_verify()` dan session | Didukung |
| Pemeriksaan session dan logout | Gate aplikasi di `Aplikasi.jsx` | Tidak perlu tabel tambahan | `GET /api/auth/check-session.php`, `POST /api/auth/logout.php` | Didukung |
| Lupa password / OTP email | Tombol hanya menampilkan toast bahwa pemulihan belum tersedia | `password_resets` berisi hash OTP, expiry, attempts, verified time | Tidak ada endpoint OTP, pengiriman email, verifikasi, atau penggantian password | Belum didukung; tabel saja belum menjadi proses pemulihan |
| Profil pengguna | Nama, jenjang, kelas, institusi, tema, dan foto disimpan melalui `studyflow_settings` / state foto | Kolom profil pada `users`; preferensi pada `pengaturan_pengguna` | Tidak ada endpoint baca/perbarui profil | Skema tersedia; belum terhubung. `foto_profil` diperbesar menjadi `MEDIUMTEXT` karena React mengirim data URL |
| Mata pelajaran | `studyflow_subjects`; nama, kode, pengajar, kategori, tingkat, warna, deskripsi, jadwal mingguan | `mata_pelajaran`; slot jadwal dapat diwakili `jadwal.hari` | Tidak ada endpoint mata pelajaran | Skema tersedia; belum terhubung |
| Tugas dan deadline | `studyflow_tasks`; judul, deskripsi, subjek, deadline, jam, prioritas, status | `tugas` dan relasi opsional ke `mata_pelajaran` | Tidak ada endpoint tugas | Skema tersedia; belum terhubung |
| Kalender dan jadwal | `studyflow_activities` untuk kegiatan kalender; jadwal mingguan berasal dari `subject.schedule` | `jadwal` untuk kegiatan/timetable; `aktivitas` untuk feed aktivitas dan data kalender yang dipakai statistik | Tidak ada endpoint kalender/jadwal/aktivitas | Penyimpanan skema tersedia di SQL utama; belum terhubung |
| Catatan | `studyflow_notes`; judul, deskripsi/isi, subjek, tanggal dibuat/diubah | `catatan.isi_catatan` bertipe `LONGTEXT`, relasi subjek opsional | Tidak ada endpoint catatan | Skema tersedia; belum terhubung |
| Pengingat | `studyflow_reminders`; judul, deskripsi, tanggal, jam, status selesai | `pengingat.waktu_pengingat` dan `status` | Tidak ada endpoint pengingat atau scheduler | Penyimpanan skema tersedia; proses backend/notifikasi waktu belum ada |
| Focus Mode | Timer, mode, sisa detik, durasi, jumlah sesi dan `studyflow_focus_history` | `riwayat_fokus.durasi_detik`, `waktu_mulai`, `waktu_selesai`; durasi timer dalam `pengaturan_pengguna` | Tidak ada endpoint Focus Mode | Skema tersedia. Waktu mulai bisa dihitung dari `completedAt - durationSeconds`; belum terhubung |
| Statistik/progres | Agregat tugas, aktivitas, dan riwayat fokus | Dapat dihitung dari `tugas`, `aktivitas`, dan `riwayat_fokus` dengan filter `pengguna_id` | Tidak ada endpoint statistik | Tidak perlu tabel statistik terpisah; belum ada query/backend dan UI menghitung dari LocalStorage |
| Tema/pengaturan | `studyflow_settings` dengan tema, durasi fokus, jeda | `pengaturan_pengguna` satu baris per pengguna | Tidak ada endpoint pengaturan | Skema tersedia; belum terhubung |
| Notifikasi | Toast `PusatPemberitahuan` bersifat sementara; pengingat tersimpan di LocalStorage | `pengingat` dan preferensi notifikasi pada `pengaturan_pengguna` | Tidak ada endpoint; tidak ada cron/scheduler atau pengiriman push | Toast tidak memerlukan tabel; pengingat persisten dan pengiriman otomatis belum didukung |

## Isolasi dan kompatibilitas

- Endpoint autentikasi saat ini memakai nama tabel/kolom `users`, `name`, `email`, dan `password_hash`; semuanya dipertahankan pada skema.
- Setiap tabel data memiliki `pengguna_id`. Foreign key gabungan pada tugas, jadwal, dan catatan mencegah relasi ke mata pelajaran milik akun lain.
- `ON DELETE CASCADE` menghapus data turunan ketika pengguna dihapus. Penghapusan mata pelajaran ditolak jika masih dipakai tugas, jadwal, atau catatan.
- Formulir React belum memanggil API CRUD. Karena itu isolasi data per akun belum berlaku pada LocalStorage: akun berbeda di browser yang sama dapat melihat kumpulan kunci LocalStorage yang sama. Jangan menganggap tabel SQL saja sudah mengisolasi data aplikasi.
- Data lama di LocalStorage belum dimigrasikan ke MySQL. Tidak ada proses yang menghapus LocalStorage pada audit ini.

## Perbaikan yang diterapkan

- `database/studyflow.sql` kini menambahkan tabel `aktivitas` untuk data kalender/feed yang tidak tercakup riwayat fokus.
- `users.foto_profil` kini `MEDIUMTEXT`, sesuai data URL JPEG yang dibuat `ModalFotoProfil`.
- Perubahan tersebut juga disertakan secara idempoten dalam `database/studyflow.sql`, sehingga satu file dapat dipakai untuk instalasi baru maupun melengkapi tabel `users` lama tanpa menghapus baris akun.
- Tidak ada endpoint yang namanya belum cocok dengan tabel: CRUD endpoint memang belum dibuat. Implementasi autentikasi tetap kompatibel.

## Pekerjaan backend yang masih diperlukan

1. Tambahkan endpoint CRUD GET/POST untuk mata pelajaran, tugas, jadwal, catatan, pengingat, aktivitas, riwayat fokus, profil, dan pengaturan. Tiap query harus mengambil `pengguna_id` dari session server, bukan dari input React.
2. Pindahkan pembacaan/penyimpanan fitur dari LocalStorage ke endpoint tersebut. Rencanakan migrasi data lama secara eksplisit agar data lokal tidak tertimpa atau tercampur antar akun.
3. Implementasikan alur OTP reset password: buat token acak, simpan hash dan masa berlaku, batasi attempts, kirim OTP melalui layanan email yang dikonfigurasi server, verifikasi, lalu ubah `users.password_hash`.
4. Jika pengingat harus terkirim saat aplikasi tertutup, tambahkan scheduler/cron dan kanal notifikasi hosting; tabel dan toast saja tidak dapat menjalankan pengiriman terjadwal.
