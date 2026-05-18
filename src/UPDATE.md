
# Log Pembaruan LakuKelas

## V23.0: Smart Export & Repository Soal - SELESAI
Implementasi alur kerja profesional untuk pengelolaan naskah ujian dengan kualitas cetak tinggi dan pengorganisasian otomatis.

### 1. Fitur Ekspor Naskah Profesional
- **Visual PDF Rendering**: Menggunakan engine html2canvas untuk merender rumus LaTeX (KaTeX) dan teks Arab menjadi objek visual tajam di dalam dokumen PDF.
- **Equation Support**: Rumus matematika kini tampil sempurna sebagai objek simbolik profesional, siap cetak tanpa risiko format berantakan.
- **Deep Nesting Drive**: Otomatisasi pembuatan struktur folder rekursif di Google Drive: `LakuKelas AI > Bank Soal > Kelas [X] > [Nama Mata Pelajaran]`.
- **Repository Naskah**: Menu baru "Naskah Soal" di Dashboard Guru sebagai pusat akses cepat link dokumen yang telah tersimpan di Drive.
- **Auto-Download Flow**: Mekanisme unduhan instan ke perangkat lokal yang terpicu otomatis setelah proses sinkronisasi ke cloud selesai.
- **Custom Naskah Config**: Penambahan input judul file manual dan pilihan jenis asesmen sebelum naskah disusun.

### 2. Keamanan & Stabilitas Sesi
- **Auth Security Fix**: Migrasi total ke `getUser()` untuk validasi identitas yang lebih ketat guna menghindari peringatan keamanan sesi Supabase.
- **Binary Multipart Upload**: Implementasi pengiriman data biner Base64 untuk memastikan file PDF kompleks terkirim utuh ke API Google Drive.
- **UTF-8 Encoding Persistence**: Memastikan karakter khusus dan simbol matematika tetap konsisten dalam proses transfer data antar server.

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
