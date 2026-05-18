# PRD — Evolusi AI Pembelajaran LakuKelas (V2.1 Ultimate)

## 1. Visi
Menjadikan AI sebagai asisten pedagogis yang komprehensif bagi guru, mencakup siklus pembuatan konten, manajemen aset digital, dan otomatisasi administrasi sekolah di Google Drive.

## 2. Struktur Menu Baru
Fitur AI Pembelajaran kini dipisah menjadi beberapa sub-modul:

### 2.1. Daftar Naskah Soal (Repository)
- **Tujuan**: Menampilkan daftar file soal (.docx/.pdf) yang sudah pernah diekspor ke Google Drive.
- **Konsep**: Mirip dengan menu "Materi", menampilkan kartu-kartu dokumen yang berisi link klik langsung ke Drive.
- **Fitur Utama**:
  - Filter berdasarkan Mapel/Kelas.
  - Indikator format file (Word/PDF).
  - Tombol "Buka di Drive" dan "Cetak Ulang".

### 2.2. Bank Soal AI (Database)
- **Tujuan**: Menyimpan butir-butir soal hasil generate AI.
- **Fitur**: Guru bisa memilih beberapa soal (multi-select) untuk dijadikan satu naskah ujian resmi.

### 2.3. Pembuatan Modul Ajar (RPP)
- **Output**: File Google Doc di folder `LakuKelas AI/Modul Ajar/[Kelas]/[Mapel]`.

### 2.4. Generate Soal (AI Engine)
- **Tujuan**: Mesin utama pembuat soal (Pilihan Ganda & Esai) dengan dukungan Multimodal (PDF/Foto).

## 3. Alur Penyimpanan & Ekspor Otomatis
1.  **Generate** butir soal.
2.  **Simpan** ke Bank Soal AI.
3.  **Ekspor** naskah ujian terpilih.
4.  **Auto-Create Folders** di Drive (Deep Nesting).
5.  **Auto-Download** file ke komputer guru.
6.  **Simpan Link** ke Repository "Daftar Naskah Soal".

## 4. Roadmap Implementasi
1. [x] Tahap 1: Restrukturisasi UI Sidebar & Placeholder.
2. [x] Tahap 2: Implementasi Mesin Generate Soal Multimodal (3MB & 5 Soal).
3. [ ] Tahap 3: Implementasi Deep Nesting Google Drive API.
4. [ ] Tahap 4: Implementasi Menu Repository "Daftar Naskah Soal".
5. [ ] Tahap 5: Integrasi Export DOCX dengan Kop Surat Otomatis.
