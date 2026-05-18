
# Log Pembaruan LakuKelas

## V19.7: Master Blueprint Database (Ultimate) - SELESAI
Restrukturisasi total infrastruktur database untuk mendukung instalasi bersih dan fitur Admin otomatis.

### 1. Perubahan SQL & Keamanan
- **Auto-Admin Logic**: Pendaftar pertama pada database kosong kini 100% dijamin menjadi `admin` dan berstatus `is_activated = true`.
- **Global Admin Privileges**: Admin sekarang memiliki izin `ALL` pada seluruh tabel master (`school_years`, `classes`, `subjects`, `students`) tanpa terhalang `teacher_id`.
- **Monitoring Read-Only**: Kepala Sekolah (`headmaster`) diberikan hak akses `SELECT` pada seluruh data guru untuk pemantauan.
- **Wali Kelas Integration**: Izin akses khusus ditambahkan agar Wali Kelas dapat melihat Leger (nilai/absen) siswanya meskipun data diinput oleh guru lain.
- **Explicit Grants**: Menambahkan perintah `GRANT ALL` di akhir skrip untuk memastikan Middleware Vercel tidak mengalami error "permission denied".
- **AI & Cloud Foundations**: Tabel `questions` dan `google_drive_integrations` diintegrasikan secara resmi.

### 2. Alur Pengguna Baru
- Login Google -> Deteksi Database Kosong -> User 1 Jadi Admin.
- Login Google -> Database Sudah Ada Isinya -> User Berikutnya Jadi Guru (Pending Approval).
- Admin masuk ke `/admin/users` untuk menyetujui Guru.

## V19.5: Perbaikan RLS Master Data & Izin Admin - SELESAI
Mengatasi error "new row violates row-level security policy" saat Admin melakukan konfigurasi sistem.
