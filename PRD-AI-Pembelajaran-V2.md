# PRD — Evolusi AI Pembelajaran LakuKelas (V2.0)

## 1. Visi
Menjadikan AI sebagai asisten pedagogis yang komprehensif bagi guru, tidak hanya sebagai pembuat konten instan tetapi juga sebagai pusat manajemen aset pembelajaran digital.

## 2. Struktur Menu Baru
Fitur AI Pembelajaran kini dipisah menjadi beberapa sub-modul:

### 2.1. Bank Soal AI (Repository)
- **Tujuan**: Menyimpan dan mengelola daftar soal yang pernah di-generate sebelumnya.
- **Fitur Utama**:
  - Filter berdasarkan Mapel/Kelas.
  - Opsi Cetak ulang atau edit soal lama.
  - Link langsung ke file di Google Drive.

### 2.2. Pembuatan Modul Ajar
- **Tujuan**: Generator RPP/Modul Ajar yang lebih mendalam.
- **Input**: CP (Capaian Pembelajaran), TP (Tujuan Pembelajaran), dan Model Pembelajaran.
- **Output**: File Google Doc di folder "LakuKelas AI/Modul Ajar".

### 2.3. Pembuatan LKPD (Lembar Kerja Peserta Didik)
- **Tujuan**: Membuat lembar kerja siswa yang interaktif dan sistematis.
- **Struktur**: Petunjuk pengerjaan, tugas mandiri, tugas kelompok, dan refleksi siswa.

### 2.4. Generate Soal (AI Engine)
- **Tujuan**: Mesin utama pembuat soal (Pilihan Ganda & Esai).
- **Fitur**: Pengaturan tingkat kesulitan (C1-C6) dan jumlah soal.

## 3. Alur Penyimpanan
- Modul Ajar -> Folder `LakuKelas AI/Modul Ajar`
- Soal -> Folder `LakuKelas AI/Bank Soal`
- LKPD -> Folder `LakuKelas AI/LKPD`

## 4. Roadmap Implementasi
1. [x] Tahap 1: Restrukturisasi UI Sidebar & Placeholder.
2. [ ] Tahap 2: Migrasi Generator Soal & RPP ke sub-menu baru.
3. [ ] Tahap 3: Implementasi sistem Database untuk Bank Soal (Riwayat).
4. [ ] Tahap 4: Pengembangan Generator LKPD.
