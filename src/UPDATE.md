
# Log Pembaruan LakuKelas

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
