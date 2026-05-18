
# Log Pembaruan LakuKelas

## V19.5: Perbaikan RLS Master Data & Izin Admin - SELESAI
Mengatasi error "new row violates row-level security policy" saat Admin melakukan konfigurasi sistem.

### 1. Perubahan SQL (Kritikal)
- **Global Admin Access**: Memperbarui RLS pada tabel `school_years`, `classes`, `subjects`, `students`, `holidays`, dan `settings`. Sekarang, pengguna dengan role `admin` memiliki hak akses penuh (`ALL`) tanpa terikat pada kolom `teacher_id`.
- **Inherited Privileges**: Memastikan `headmaster` tetap memiliki hak `SELECT` pada seluruh data monitoring.
- **Fix School Year Creation**: Admin sekarang bisa membuat tahun ajaran baru tanpa terhalang kebijakan kepemilikan baris.

## V19.4: Finalisasi Blueprint Database & Akses Monitoring - SELESAI
Penyempurnaan total skema SQL untuk mendukung seluruh skenario peran pengguna dan manajemen sekolah.

### 1. Perubahan SQL
- **Monitoring Lintas Peran**: Admin dan Kepala Sekolah kini memiliki izin penuh untuk melihat (`SELECT`) seluruh tabel administrasi (`journal_entries`, `attendance_records`, `grade_records`).
- **Privilese Wali Kelas**: Ditambahkan kebijakan RLS yang mengizinkan Wali Kelas melihat data akademik siswa di kelas perwaliannya (mendukung fitur Leger & Progres Siswa).
- **Stabilitas Tahun Ajaran**: Memastikan `active_school_year_id` di tabel `settings` menjadi acuan utama untuk filter data di sisi server.
- **Auto-Admin Pendaftar Pertama**: Mempertahankan logika kemudahan setup bagi pengguna pertama database.

## V19.3: Perbaikan Fundamental Relasi Profil & Redirect Admin - SELESAI
Perbaikan pada struktur kunci primer tabel profil yang sebelumnya menyebabkan kegagalan deteksi peran oleh Middleware.

### 1. Perubahan SQL (Kritikal)
- Mengembalikan definisi `id` pada tabel `profiles` menjadi `primary key references auth.users(id)`.
- Sinkronisasi Middleware untuk prioritas Admin tetap aktif.

## V19.2: Perbaikan Izin PostgreSQL (Grant Permissions) - SELESAI
Solusi untuk error `permission denied for table profiles`.
