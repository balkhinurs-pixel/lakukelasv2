# Log Pembaruan Sistem (Database & Identity)

## Update V44.0: Dynamic AI Model Selector - TERIMPLEMENTASI
Pembaruan fundamental untuk memungkinkan pengguna memilih model AI yang digunakan sesuai kebutuhan stabilitas atau teknologi terbaru.

### 1. Perubahan Skema SQL (Blueprint)
Menambahkan kolom baru pada tabel `public.profiles` untuk menyimpan preferensi model:
- **AI Model**: Identifier model yang dipilih (Gemini 2.5 Flash / Gemini 3 Flash Preview).

### 2. Manfaat Fitur
- **Redundansi**: Guru dapat beralih ke model lain jika satu model mengalami lonjakan permintaan (Error 503).
- **Fleksibilitas**: Memungkinkan penggunaan model stabil (2.5) untuk tugas rutin dan model terbaru (3.0) untuk eksperimen.

---

## Update V27.0: Professional Identity Blueprint - TERIMPLEMENTASI
Pembaruan fundamental pada skema database untuk mendukung identitas sekolah yang lengkap dan profesional.

### 1. Perubahan Skema SQL (Blueprint)
Menambahkan kolom baru pada tabel `public.profiles` untuk keperluan administrasi resmi:
- **NPSN**: Nomor Pokok Sekolah Nasional (8 digit).
- **School Email**: Email resmi untuk komunikasi instansi.
- **School Website**: Alamat situs web sekolah.
- **Is Homeroom Teacher**: Flag penugasan wali kelas untuk akses menu khusus.

### 2. Sinkronisasi Kop Surat
Data identitas baru ini telah diintegrasikan secara otomatis ke dalam:
- **Naskah Soal PDF**: Kop surat kini menampilkan NPSN dan kontak sekolah.
- **Laporan Bulanan**: Kop surat laporan wali kelas kini lebih lengkap dan formal.
- **Menu Pengaturan**: Antarmuka bagi Admin untuk mengelola data ini dengan validasi yang ketat.

---
*Pembaruan ini memastikan setiap dokumen yang keluar dari sistem LakuKelas memiliki standar legalitas sekolah yang sah.*