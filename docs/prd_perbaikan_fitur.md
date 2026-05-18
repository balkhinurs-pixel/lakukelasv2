# PRD Perbaikan Fitur - Ekspor Naskah & Identitas Profesional (V2.2)

## 1. Ringkasan
Dokumen ini merinci peningkatan pada alur kerja pembuatan naskah soal di Bank Soal AI, meliputi visualisasi seleksi, validasi metadata sebelum penyimpanan, dan standarisasi Kop Surat berbasis identitas sekolah yang lengkap.

---

## 2. Fitur & Perubahan

### 2.1. Indikator Seleksi Soal (Visual Feedback)
- **Tujuan**: Memudahkan guru mengetahui soal mana saja yang sudah dipilih dan jumlah totalnya.
- **Detail**:
    - Setiap kartu soal yang dicentang akan menampilkan Badge nomor urut (misal: "Terpilih: 1", "Terpilih: 2").
    - Tombol "Susun Naskah" di bagian bawah/atas akan menampilkan counter real-time.

### 2.2. Dialog Konfigurasi Ekspor (Pre-Save)
- **Tujuan**: Memastikan struktur folder di Google Drive rapi dan metadata dokumen akurat.
- **Input Tambahan**:
    - **Nama File**: Input teks manual.
    - **Jenjang**: Dropdown (SD, SMP, SMA, SMK).
    - **Kelas**: Dropdown otomatis menyesuaikan Jenjang.
    - **Mata Pelajaran**: Dropdown otomatis menyesuaikan Jenjang.
    - **Format**: Pilihan PDF atau Google Doc.
- **Logic Drive**: Folder akan dibuat dengan pola: `LakuKelas AI > Bank Soal > [Jenjang] > Kelas [Angka] > [Nama Mapel]`.

### 2.3. Identitas Sekolah & Kop Surat Profesional
- **Pembaruan Profil (Database)**:
    - Penambahan kolom `npsn` (Nomor Pokok Sekolah Nasional).
    - Penambahan kolom `school_email` dan `school_website`.
- **Pembaruan Kop Surat PDF**:
    - Baris 1: Nama Sekolah (Font 14pt Bold).
    - Baris 2: Alamat Lengkap & NPSN.
    - Baris 3: Website & Email (Font 9pt Italic).
    - Pembatas: Garis ganda (Double line border) di bawah Kop.

---

## 3. Alur Implementasi (Tahapan)
1.  **Tahap 1**: Update skema database `profiles` untuk kolom NPSN, Email, dan Website Sekolah.
2.  **Tahap 2**: Update menu **Pengaturan > Data Sekolah** untuk mendukung input data baru tersebut.
3.  **Tahap 3**: Implementasi indikator nomor seleksi pada halaman **Bank Soal**.
4.  **Tahap 4**: Pembaruan Dialog Ekspor dengan dropdown otomatis dan integrasi ke `NaskahPrintTemplate`.

---

## 4. Catatan Teknis
- Dropdown Kelas dan Mapel harus menggunakan data statis yang sama dengan fitur `Generate Soal` untuk konsistensi.
- Pastikan fungsi `setupGoogleDriveFolder` diperluas untuk menangani nesting folder hingga level Mapel.
