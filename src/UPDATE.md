
# Log Pembaruan LakuKelas

## V18.8: Perbaikan Error Sintaks Blueprint
Perbaikan kritikal pada skrip SQL untuk menangani error saat instalasi database baru.

### 1. Perbaikan Bug SQL
- **Syntax Correction**: Menghapus duplikasi kata kunci `uuid primary_id` pada definisi tabel `questions`. Sekarang menggunakan standar `id uuid primary key`.
- **Integritas Skema**: Memastikan urutan pembuatan tabel AI diletakkan dengan benar di dalam skrip `schema.sql`.

---

## V18.7: Solusi RLS Recursion & Middleware Admin
Pembaruan untuk mengatasi masalah Admin yang terjebak di halaman persetujuan.

### 1. Perbaikan Keamanan Database
- **RLS Anti-Recursion**: Menyederhanakan kebijakan (policy) RLS pada tabel `profiles`. Sebelumnya terjadi loop pengecekan role yang menyebabkan data profil gagal dibaca.
- **Admin Access Bypass**: Memastikan Admin dapat membaca profil mereka sendiri tanpa terhalang kebijakan keamanan yang kompleks.

---

## V18.6: Solusi Admin Pertama (Database Baru)
Pembaruan pada logika pendaftaran untuk menangani instalasi pada database kosong.

### 1. Logika Auto-Admin
- **Smart Assignment**: Fungsi `handle_new_user` sekarang menghitung jumlah user yang ada.
- **First User Privilege**: Jika pendaftar adalah orang pertama, sistem otomatis memberikan role `admin` and status `is_activated = true`.
- **Security**: Pendaftar kedua dan seterusnya tetap mendapatkan role `teacher` dan wajib menunggu persetujuan dari Admin pertama.
