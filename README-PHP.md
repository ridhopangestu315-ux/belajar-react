# Backend PHP StudyFlow

Dokumen ini menjelaskan cara menjalankan API PHP dan MySQL secara lokal dengan Laragon.

## Persiapan Laragon

1. Jalankan Laragon, lalu mulai Apache dan MySQL.
2. Buka phpMyAdmin dari menu Laragon dan buat database bernama `studyflow` dengan collation `utf8mb4_unicode_ci`.
3. Salin `api/config/config.example.php` menjadi `api/config/config.local.php`. Isi host, nama database, username, dan password sesuai konfigurasi MySQL lokal. File lokal ini dikecualikan dari Git.
4. Pastikan ekstensi PDO MySQL aktif di PHP Laragon.
5. Buka `http://belajar-react.test/api/test.php`. Respons JSON dengan `berhasil: true` menandakan PHP serta koneksi database berfungsi.

Jika virtual host otomatis Laragon belum tersedia, buka proyek melalui `http://localhost/belajar-react/api/test.php` dan atur `VITE_API_PROXY_TARGET` ke `http://localhost/belajar-react` saat menjalankan Vite.

## Pemanggilan dari React

Gunakan path relatif agar permintaan tetap menuju hostname frontend, misalnya:

```js
const respons = await fetch('/api/test.php', { method: 'GET' })
const hasil = await respons.json()
```

Vite meneruskan `/api` ke `http://belajar-react.test` selama development. Jika alamat Laragon berbeda, atur `VITE_API_PROXY_TARGET` ke origin Laragon (tanpa akhiran `/api`). Pada hosting, unggah isi build React ke root web dan folder `api/` ke `/api/` pada hostname yang sama; path relatif akan memanggil API pada domain itu.

## Keamanan konfigurasi

- Jangan menyimpan kredensial database dalam berkas React, `public/`, atau berkas yang diunggah ke repository.
- `config.local.php` berisi kredensial server dan dikecualikan dari Git.
- Query database berikutnya harus memakai PDO prepared statements, misalnya `$stmt = $pdo->prepare('SELECT ... WHERE id = :id');`, lalu mengikat nilai menggunakan `execute(['id' => $id])`.
- Endpoint yang dibuat sekarang hanya pengujian koneksi; autentikasi, skema tabel, dan operasi data belum dibuat.
- API menggunakan `GET` untuk membaca dan `POST` untuk perubahan. Jangan mengandalkan `PUT`, `PATCH`, atau `DELETE` di hosting ini.
