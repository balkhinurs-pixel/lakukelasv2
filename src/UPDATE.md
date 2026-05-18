
# Log Pembaruan LakuKelas

## V19.3: Perbaikan Fundamental Relasi Profil & Redirect Admin - SELESAI
Perbaikan pada struktur kunci primer tabel profil yang sebelumnya menyebabkan kegagalan deteksi peran oleh Middleware.

### 1. Perubahan SQL (Kritikal)
- Mengembalikan definisi `id` pada tabel `profiles` menjadi `primary key references auth.users(id)`. Ini memastikan ID di tabel profil sama persis dengan ID di sistem autentikasi Google.
- Memastikan fungsi `handle_new_user` tetap memberikan peran **Admin** secara otomatis kepada pendaftar pertama di database baru.
- Mempertahankan perintah `GRANT` untuk mencegah error `permission denied`.
- Sinkronisasi Middleware untuk prioritas Admin tetap aktif.

---

## V19.2: Perbaikan Izin PostgreSQL (Grant Permissions) - SELESAI
Solusi untuk error `permission denied for table profiles` pada log middleware.

### 1. Perubahan SQL
- Menambahkan perintah `GRANT USAGE ON SCHEMA public` untuk peran `anon` dan `authenticated`.
- Menambahkan `GRANT SELECT ON public.profiles` untuk memastikan Middleware selalu bisa memverifikasi Role pengguna.
