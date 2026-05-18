
# Log Pembaruan LakuKelas

## V18.1: Optimalisasi Bank Soal & Blueprint SQL (Terbaru)
Pembaruan fungsionalitas pada Bank Soal dan standarisasi database sesuai Blueprint.

### 1. Optimalisasi Bank Soal
- **Sistem Paginasi**: Implementasi paginasi (5 soal per halaman) untuk performa memuat data yang lebih ringan.
- **Filter Materi Pintar**: Penambahan filter berdasarkan Topik/Materi yang dinormalisasi (case-insensitive).
- **Pembahasan Interaktif**: Perbaikan fitur buka-tutup pembahasan soal dengan animasi halus.
- **Render LaTeX & Gambar**: Konsistensi tampilan rumus matematika dan ilustrasi AI di seluruh halaman.

### 2. Standarisasi Database (Blueprint)
- Pembuatan file `schema_ai.sql` sebagai panduan tunggal instalasi modul AI.
- Penambahan indeks pada kolom `topic` dan `subject` untuk mempercepat pencarian soal.

---

## V18.0: Integrasi Ekspor & Google Drive (Selesai)
Tahap 3 dari fitur AI Pembelajaran: Menghubungkan aset digital dengan penyimpanan cloud guru.

### 1. Tahap 3: Ekspor & Cloud Storage (Selesai)
- Implementasi sistem sub-folder otomatis di Google Drive (Folder: `LakuKelas AI/Bank Soal`).
- Fitur ekspor naskah soal dari Bank Soal ke Google Doc secara kolektif.
- Integrasi metadata dokumen; menyimpan link Drive hasil ekspor ke database Supabase.
- Penataan naskah ekspor otomatis (mencakup Pertanyaan, Opsi A-E, Kunci, dan Pembahasan).

---

## V17.0: Implementasi Bank Soal AI (Selesai)
Menyelesaikan siklus hidup fitur Generate Soal dari pembuatan hingga manajemen arsip.
