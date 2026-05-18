
# Log Pembaruan LakuKelas

## V18.9: Solusi Total Redirect Admin & Sesi RLS
Pembaruan kritikal untuk memastikan Admin pertama tidak terjebak di halaman persetujuan profil.

### 1. Perbaikan Keamanan Database
- **RLS Recursion Fix**: Menyederhanakan kebijakan RLS pada tabel `profiles`. Admin sekarang dapat memvalidasi peran mereka sendiri tanpa menyebabkan loop rekursif yang membuat data profil gagal terbaca di middleware.
- **Admin Select Policy**: Menambahkan kebijakan eksplisit agar Admin dapat melihat seluruh data profil staf untuk keperluan approval.

### 2. Optimasi Middleware
- **Admin-First Priority**: Middleware sekarang memprioritaskan deteksi Admin. Jika user terdeteksi sebagai Admin, sistem akan langsung mengalihkan ke `/admin/users`, melewati seluruh blok pengecekan profil pendaftar baru.
- **Resilient Redirect**: Memperbaiki alur navigasi dari `/` agar lebih cerdas dalam membagi akses antara Admin, Kepala Sekolah, dan Guru.

---

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
