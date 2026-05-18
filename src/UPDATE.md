
# Log Pembaruan LakuKelas

## V19.6: Integrasi AI & Google Drive (Blueprint Ultimate) - SELESAI
Penggabungan seluruh fitur inti dengan infrastruktur AI dan Cloud Storage.

### 1. Perubahan SQL
- **Tabel `questions`**: Menampung data Bank Soal AI lengkap dengan metadata kurikulum, tingkat kesulitan, rumus LaTeX, dan link ilustrasi AI.
- **Tabel `google_drive_integrations`**: Menyimpan status koneksi OAuth Google Drive dan Folder ID aplikasi per guru.
- **Tabel `ai_documents`**: Mencatat riwayat dokumen (RPP/Soal) yang telah diekspor ke Google Drive.
- **RLS AI**: Memastikan soal dan dokumen bersifat pribadi (hanya guru pembuat yang bisa melihat), namun Admin/Kepala Sekolah memiliki izin `SELECT` untuk keperluan monitoring kualitas.
- **Fix Gemini Key**: Menambahkan kolom `gemini_api_key` langsung di tabel `profiles` untuk memudahkan akses fitur AI Mandiri.

## V19.5: Perbaikan RLS Master Data & Izin Admin - SELESAI
Mengatasi error "new row violates row-level security policy" saat Admin melakukan konfigurasi sistem.

### 1. Perubahan SQL (Kritikal)
- **Global Admin Access**: Memperbarui RLS pada tabel `school_years`, `classes`, `subjects`, `students`, `holidays`, dan `settings`. Sekarang, pengguna dengan role `admin` memiliki hak akses penuh (`ALL`) tanpa terikat pada kolom `teacher_id`.
- **Inherited Privileges**: Memastikan `headmaster` tetap memiliki hak `SELECT` pada seluruh data monitoring.

## V19.4: Finalisasi Blueprint Database & Akses Monitoring - SELESAI
Penyempurnaan total skema SQL untuk mendukung seluruh skenario peran pengguna dan manajemen sekolah.
