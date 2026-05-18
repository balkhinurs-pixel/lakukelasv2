
# Log Pembaruan LakuKelas

## V22.0: AI Multi-modal Support (Materi Sendiri) - SELESAI
Implementasi fitur canggih yang memungkinkan AI membaca materi langsung dari unggahan guru (PDF/Foto) tanpa membebani penyimpanan database.

### 1. Fitur AI Generatif Terbaru
- **Multimodal Gemini**: Flow AI ditingkatkan untuk memproses gambar dan dokumen PDF secara bersamaan dengan instruksi teks.
- **Materi Mandiri**: Guru kini bisa memotret halaman buku cetak atau mengunggah modul PDF untuk dijadikan bank soal dalam hitungan detik.
- **Auto-Extraction**: AI memprioritaskan ekstraksi data dari materi yang diunggah untuk akurasi konten yang lebih tinggi.

### 2. Optimisasi Storage (Zero-Byte Policy)
- **Ephemeral Processing**: File materi diubah menjadi Base64 Data URI di sisi klien, dikirim ke AI, dan langsung dibuang dari memori server setelah proses selesai.
- **No Supabase Storage Load**: Tidak ada file sampah yang tersimpan di bucket Supabase, menjaga performa dan kuota penyimpanan tetap aman.

### 3. Pembaruan UI/UX
- **Dropzone Materi**: Menambahkan komponen unggah file di sidebar Generate Soal dengan dukungan drag-and-drop.
- **Smart Validation**: Validasi ukuran file (max 10MB) dan tipe file otomatis sebelum dikirim ke AI.

---

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
