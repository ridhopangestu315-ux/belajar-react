# Backend PHP StudyFlow

Dokumen ini menjelaskan cara menjalankan API PHP dan MySQL secara lokal dengan Laragon.

## Persiapan Laragon

1. Jalankan Laragon, lalu mulai Apache dan MySQL.
2. Siapkan database melalui phpMyAdmin; skema SQL akan membuat database `studyflow` saat diimpor.
3. Salin `api/config/config.example.php` menjadi `api/config/config.local.php`. Isi host, port, nama database, username, dan password sesuai konfigurasi MySQL lokal. Password contoh adalah placeholder, bukan password default. File lokal ini dikecualikan dari Git.
4. Di phpMyAdmin, buka tab **Import**, lalu jalankan `database/studyflow.sql` untuk membuat database dan seluruh tabel.
5. Pastikan ekstensi PDO MySQL aktif di PHP Laragon.
6. Buka `http://localhost/belajar-react/api/test.php`. Respons JSON dengan `berhasil: true` menandakan PHP serta koneksi database berfungsi.

## Jalankan React dan PHP bersamaan

Biarkan Apache Laragon menyajikan folder proyek di `http://localhost/belajar-react/`, lalu jalankan `npm run dev` dari root proyek. Buka `http://localhost:5173`; proxy Vite meneruskan `/api/...` ke `http://localhost/belajar-react/api/...`.

## Pemanggilan dari React

Gunakan path relatif agar permintaan tetap menuju hostname frontend, misalnya:

```js
const respons = await fetch('/api/test.php', { method: 'GET' })
const hasil = await respons.json()
```

Vite meneruskan `/api` ke Apache Laragon selama development. Pada hosting, unggah isi build React ke root web dan folder `api/` ke `/api/` pada hostname yang sama; path relatif tetap memanggil API pada domain itu.

## Keamanan konfigurasi

- Jangan menyimpan kredensial database dalam berkas React, `public/`, atau berkas yang diunggah ke repository.
- `config.local.php` berisi kredensial server dan dikecualikan dari Git.
- Query database berikutnya harus memakai PDO prepared statements, misalnya `$stmt = $pdo->prepare('SELECT ... WHERE id = :id');`, lalu mengikat nilai menggunakan `execute(['id' => $id])`.
- API autentikasi menggunakan `GET` untuk pemeriksaan sesi dan `POST` untuk registrasi, login, serta logout. Jangan mengandalkan `PUT`, `PATCH`, atau `DELETE` di hosting ini.
- Session memakai cookie `HttpOnly` dan `SameSite=Lax`; atribut `Secure` aktif saat request berjalan melalui HTTPS.
- Registrasi menyimpan hash dari `password_hash()`; password teks biasa tidak disimpan.
- Untuk menguji, buka aplikasi di `http://localhost:5173`, daftarkan akun milik sendiri, keluar, lalu masuk kembali. Tidak ada akun contoh yang dibuat otomatis.
