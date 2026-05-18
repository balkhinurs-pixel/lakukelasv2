
# Log Pembaruan LakuKelas

## V21.0: Master Blueprint Ultimate (Restored & Complete) - SELESAI
Restorasi total seluruh skema database ke dalam satu file `schema.sql` V21.0. Menghilangkan ketergantungan pada file-file fix lainnya dan memastikan semua fitur (Guru, Wali Kelas, Kepala Sekolah, Admin, AI, Drive) memiliki fondasi data yang lengkap.

### 1. Perbaikan Kritis & Restorasi
- **Struktur Tabel**: Mengembalikan seluruh 18+ tabel inti tanpa ada yang tertinggal.
- **Relasi Foreign Key**: Memastikan `profiles(id)` terhubung langsung ke `auth.users(id)` untuk stabilitas login & Middleware.
- **Fungsi RLS Cerdas**: Restorasi fungsi `is_homeroom_teacher` agar Wali Kelas bisa melihat leger siswa secara otomatis.
- **Monitoring Global**: Memulihkan hak akses Kepala Sekolah (`headmaster`) untuk melihat aktivitas dan absensi seluruh staf.

### 2. Fitur AI & Cloud (Finalized)
- **Bank Soal AI**: Tabel `questions` lengkap dengan dukungan LaTeX, status review, dan media AI.
- **Integrasi Google Drive**: Infrastruktur tabel `google_drive_integrations` dan `ai_documents` siap pakai.

### 3. Otomasi & Fail-Safe
- **Auto-Admin Trigger**: Menjamin pendaftar pertama pada database kosong menjadi Admin aktif dengan izin penuh.
- **Explicit PostgreSQL Grants**: Menambahkan perintah `GRANT ALL` menyeluruh untuk mencegah error "permission denied" pada Vercel Middleware yang sering muncul di proyek baru.
- **Semester Logic**: Semua data transaksional (nilai, absen, jurnal) kini terikat pada `school_year_id` aktif.

### 4. Instruksi Instalasi Bersih
1. Hapus seluruh tabel di database Supabase melalui SQL Editor: `DROP TABLE IF EXISTS ... CASCADE;` (atau Reset Database di Settings).
2. Jalankan `schema.sql` V21.0.
3. Login sebagai user pertama untuk mendapatkan hak Admin otomatis.
