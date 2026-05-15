
# Log Pembaruan LakuKelas

## V9.9: Perbaikan Kritis Master Token
Memastikan instalasi baru dapat diaktifkan tanpa kendala profil.

### 1. Robust Master Token Activation
- **Upsert Logic**: Mengganti perintah `update` menjadi `upsert` pada Master Token. Hal ini memungkinkan pendaftar pertama membuat baris data profilnya sendiri jika *trigger* database belum sempat berjalan.
- **Auto-Fill Profile**: Menarik data nama dan foto profil secara otomatis dari metadata Google saat menggunakan Master Token.

### 2. Keamanan RLS
- **Izin Pendaftaran**: Memastikan kebijakan database mengizinkan pengguna untuk membuat profilnya sendiri (`INSERT`) di awal pendaftaran agar tidak terjadi *error* hak akses.

---

## V9.8: Solusi Jalan Tengah - Master Token
Menyediakan jalur aktivasi darurat untuk Admin/Database baru.

### 1. Jalur Darurat Aktivasi
- **Master Token**: Menambahkan token hardcoded **`LAKU2025`** yang dapat digunakan di halaman `/activate`.
- **Auto-Promotion**: Menggunakan Master Token otomatis menetapkan pengguna tersebut sebagai **Admin** dan status **Aktif**, tanpa bergantung pada data di tabel `activation_tokens`.
- **Reliability**: Solusi ini menjamin pendaftar pertama di database mana pun (lama maupun baru) tidak akan pernah terkunci dari sistem.

---

## V9.7: Perbaikan Gatekeeper Aktivasi (CRITICAL)
Menyelesaikan masalah "ayam dan telur" pada pendaftaran pertama.

### 1. Fix First-User Auto-Admin
- **Logic Refinement**: Memperbarui trigger `handle_new_user` di `schema.sql` untuk menghitung jumlah profil (`p_count`) secara eksplisit sebelum melakukan penyisipan data.
- **Auto-Activation**: Pendaftar pertama pada database kosong kini 100% dipastikan mendapatkan `role = 'admin'` and `is_activated = true` secara otomatis, sehingga tidak akan terjebak di halaman aktivasi.

### 2. Middleware Sync
- **Reliability**: Mengoptimalkan pemeriksaan `is_activated` di `middleware.ts` untuk menghindari loop pengalihan jika data profil belum sepenuhnya tersinkronisasi saat sesi dibuat.

### 3. Izin RLS Token
- **Akses Aktivasi**: Memperbarui kebijakan RLS pada tabel `activation_tokens` agar pendaftar baru (status non-aktif) diperbolehkan mencari token yang belum terpakai (`used_by IS NULL`) guna keperluan validasi di halaman `/activate`.
