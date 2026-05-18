
# Log Pembaruan LakuKelas

## V23.0: Smart Export & Repository Soal - PLANNED
Rencana implementasi alur kerja profesional untuk pengelolaan naskah ujian guru.

### 1. Fitur Baru
- **Deep Nesting Drive**: Otomatisasi pembuatan sub-folder `Kelas/Mapel` di Google Drive.
- **Repository Soal**: Menu baru untuk menyimpan link dokumen yang sudah diekspor (seperti menu Materi).
- **Auto-Download Flow**: File otomatis terunduh ke komputer guru setelah proses simpan ke Drive selesai.
- **Professional DOCX**: Ekspor naskah soal lengkap dengan Kop Surat sekolah otomatis.

---

## V22.0: AI Multi-modal Support (Materi Sendiri) - SELESAI
Implementasi fitur canggih yang memungkinkan AI membaca materi langsung dari unggahan guru (PDF/Foto) tanpa membebani penyimpanan database.

### 1. Fitur AI Generatif Terbaru
- **Multimodal Gemini**: Flow AI ditingkatkan untuk memproses gambar dan dokumen PDF secara bersamaan dengan instruksi teks.
- **Materi Mandiri**: Guru kini bisa memotret halaman buku cetak atau mengunggah modul PDF untuk dijadikan bank soal dalam hitungan detik.
- **Auto-Extraction**: AI memprioritaskan ekstraksi data dari materi yang diunggah untuk akurasi konten yang lebih tinggi.

### 2. Optimisasi Storage (Zero-Byte Policy)
- **Ephemeral Processing**: File materi diubah menjadi Base64 Data URI di sisi klien, dikirim ke AI, dan langsung dibuang dari memori server setelah proses selesai.
- **No Supabase Storage Load**: Tidak ada file sampah yang tersimpan di bucket Supabase, menjaga performa dan kuota penyimpanan tetap aman.

---

## V21.0: Master Blueprint Ultimate (Restored & Complete) - SELESAI
Restorasi total seluruh skema database ke dalam satu file `schema.sql` V21.0.
