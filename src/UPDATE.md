
# Log Pembaruan LakuKelas

## V17.0: Implementasi Bank Soal AI (Selesai)
Menyelesaikan siklus hidup fitur Generate Soal dari pembuatan hingga manajemen arsip.

### 1. Tahap 1: Generator & Pratinjau (Selesai)
- Implementasi AI Generate Soal berbasis parameter pedagogis (C1-C6, Kurikulum Merdeka/KBC).
- Fitur render otomatis rumus matematika (LaTeX) di pratinjau.
- Integrasi generator gambar edukasi berbasis Pollinations.ai (Gratis & Unlimited).
- Desain dialog pratinjau premium sesuai referensi guru.

### 2. Tahap 2: Persistensi & Bank Soal (Selesai)
- Implementasi sistem penyimpanan soal ke database Supabase (Status: Draft & Perlu Review).
- Pembuatan antarmuka Bank Soal dengan fitur filter multi-dimensi.
- Standarisasi data kelas (hanya tingkat 7, 8, 9, dsb) untuk kemudahan manajemen arsip.
- Fitur hapus soal secara kolektif atau individual dari Bank Soal.

---

## V16.0: Restrukturisasi AI Pembelajaran (Selesai)
Mengubah modul AI menjadi sistem manajemen konten yang lebih terstruktur.

### 1. Tahap 1: Arsitektur Menu (Selesai)
- Melakukan pemisahan fitur AI Pembelajaran menjadi 4 sub-menu utama: Bank Soal, Modul Ajar, LKPD, dan Generate Soal.
- Memperbarui Sidebar dengan sistem *collapsible* (lipat) untuk kategori AI.
- Menyiapkan PRD V2.0 sebagai panduan pengembangan jangka panjang.
- Membuat halaman *placeholder* dengan desain indigo premium untuk konsistensi UI.
