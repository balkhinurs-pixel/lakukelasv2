
# Log Pembaruan LakuKelas

## V21.0: Master Blueprint Ultimate (Final Gold) - SELESAI
Konsolidasi total seluruh skema database ke dalam satu file `schema.sql` untuk memudahkan instalasi bersih dan sinkronisasi fitur.

### 1. Struktur Database
- **Tabel Profiles**: Mendukung penyimpanan `gemini_api_key` dan metadata sekolah dalam satu tempat.
- **Tabel AI & Drive**: Integrasi `questions` (Bank Soal), `google_drive_integrations`, dan `ai_documents` siap pakai.
- **Tabel Holidays**: Sistem libur nasional dan sekolah untuk otomasi absensi guru.
- **Tabel Settings**: Konfigurasi global (Year ID, WA Token, Koordinat GPS).

### 2. Logika RLS & Keamanan (Lengkap)
- **Admin**: Akses `ALL` tanpa syarat ke tabel master (`school_years`, `classes`, `students`, dll).
- **Kepala Sekolah**: Akses `SELECT` global ke seluruh aktivitas guru untuk monitoring.
- **Wali Kelas**: Akses `SELECT` cerdas ke nilai dan absen siswa di kelas perwaliannya (mendukung Leger lintas Mapel).
- **Guru**: Akses penuh ke data miliknya sendiri.

### 3. Otomasi & Fail-Safe
- **Auto-Admin**: Trigger `handle_new_user` menjamin pendaftar pertama pada database kosong menjadi Admin aktif.
- **Explicit Grants**: Perintah `GRANT ALL` menyeluruh untuk mencegah error "permission denied" pada Vercel Middleware.
- **Rich Views**: View `attendance_history` dan `grades_history` untuk performa tampilan tabel yang cepat.

### 4. Instruksi Instalasi
1. Hapus seluruh tabel di database Supabase (Project Settings > General > Reset Database atau hapus manual di SQL Editor).
2. Jalankan `schema.sql` V21.0.
3. Login sebagai user pertama untuk mendapatkan hak Admin secara otomatis.
