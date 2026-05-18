
# Log Pembaruan LakuKelas

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
