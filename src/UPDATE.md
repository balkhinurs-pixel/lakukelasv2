
# Log Pembaruan LakuKelas

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
- **Auto-Activation**: Pendaftar pertama pada database kosong kini 100% dipastikan mendapatkan `role = 'admin'` dan `is_activated = true` secara otomatis, sehingga tidak akan terjebak di halaman aktivasi.

### 2. Middleware Sync
- **Reliability**: Mengoptimalkan pemeriksaan `is_activated` di `middleware.ts` untuk menghindari loop pengalihan jika data profil belum sepenuhnya tersinkronisasi saat sesi dibuat.

### 3. Izin RLS Token
- **Akses Aktivasi**: Memperbarui kebijakan RLS pada tabel `activation_tokens` agar pendaftar baru (status non-aktif) diperbolehkan mencari token yang belum terpakai (`used_by IS NULL`) guna keperluan validasi di halaman `/activate`.

---

## V9.6: Perbaikan Logika Aktivasi & Dashboard Admin
Peningkatan pada kejelasan sistem token dan keandalan aktivasi otomatis.

### 1. Fix First-User Auto-Admin (v1)
- **Logic Correction**: Menggunakan variabel `p_count` di dalam trigger `handle_new_user` untuk memastikan deteksi tabel kosong (0 profile) benar-benar akurat sebelum menyematkan role `Admin`. Ini menyelesaikan masalah pendaftar pertama yang tetap diminta token pada database baru.

### 2. Dashboard Admin: Token Clarity
- **Visual Status**: Card token kini memiliki warna yang memudar (opacity) dan label "Sudah Terpakai" yang jelas untuk membedakan token lama dan baru.
- **Used-By tracking**: Menambahkan tampilan nama staf pengajar yang telah mengklaim token tersebut, mempermudah admin melakukan audit pendaftaran.
