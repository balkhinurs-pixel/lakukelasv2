
# Log Pembaruan LakuKelas

## V10.0: Privilese Admin & Bypass Aktivasi
Menyempurnakan alur pendaftaran untuk administrator.

### 1. Alur Khusus Admin
- **Bypass Aktivasi**: Pengguna dengan peran `admin` kini secara otomatis melewati layar aktivasi token. Status `is_activated` tidak lagi menjadi penghalang bagi Admin.
- **Auto-Admin First User**: Pendaftar pertama pada database baru kini 100% diatur sebagai Admin Aktif melalui *trigger* database dan logika *middleware*.
- **Middleware Update**: Logika pemeriksaan `is_activated` pada `middleware.ts` kini menyertakan pengecualian untuk `role === 'admin'`.

### 2. Master Token Re-Alignment
- **LAKU2025**: Penggunaan Master Token darurat sekarang secara otomatis menetapkan `role = 'admin'` dan `is_activated = true` secara permanen pada database.
- **Upsert Reliability**: Logika pendaftaran Master Token menggunakan `upsert` untuk menjamin pembuatan profil meskipun *trigger* database belum sempat berjalan.

---

## V9.9: Perbaikan Kritis Master Token
Memastikan instalasi baru dapat diaktifkan tanpa kendala profil.

### 1. Robust Master Token Activation
- **Upsert Logic**: Mengganti perintah `update` menjadi `upsert` pada Master Token. Hal ini memungkinkan pendaftar pertama membuat baris data profilnya sendiri jika *trigger* database belum sempat berjalan.
- **Auto-Fill Profile**: Menarik data nama dan foto profil secara otomatis dari metadata Google saat menggunakan Master Token.
- **Error Handling**: Memberikan pesan kesalahan yang lebih jelas jika proses `upsert` gagal (biasanya karena kendala izin RLS).

### 2. Keamanan RLS
- **Izin Pendaftaran**: Memastikan kebijakan database mengizinkan pengguna untuk membuat profilnya sendiri (`INSERT`) di awal pendaftaran agar tidak terjadi *error* hak akses.

---

## V9.8: Solusi Jalan Tengah - Master Token
Menyediakan jalur aktivasi darurat untuk Admin/Database baru.

### 1. Jalur Darurat Aktivasi
- **Master Token**: Menambahkan token hardcoded **`LAKU2025`** yang dapat digunakan di halaman `/activate`.
- **Auto-Promotion**: Menggunakan Master Token otomatis menetapkan pengguna tersebut sebagai **Admin** dan status **Aktif**, tanpa bergantung pada data di tabel `activation_tokens`.
- **Reliability**: Solusi ini menjamin pendaftar pertama di database mana pun (lama maupun baru) tidak akan pernah terkunci dari sistem.
