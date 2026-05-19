
# Log Pembaruan LakuKelas

## Update V33.0: Ultimate Master SQL Blueprint (Professional Standard) - TERIMPLEMENTASI
Penyempurnaan infrastruktur database tingkat lanjut untuk stabilitas integrasi Cloud dan sistem manajemen sekolah mandiri.

### 1. Perubahan Arsitektur Database (schema.sql)
- **Otomatisasi Admin (First-User Logic)**: Pendaftar pertama di sistem kini otomatis mendapatkan peran `admin` and status `is_activated = true`. Sangat memudahkan setup sekolah baru.
- **Integrasi Cloud Storage**: Menambahkan tabel `google_drive_integrations` dan `ai_documents` untuk mendukung penyimpanan otomatis RPP/Soal ke Drive masing-masing guru.
- **Isolasi Data RLS**: Menjamin privasi data antar guru sambil tetap memberikan akses monitoring bagi Admin dan Kepala Sekolah.
- **RLS Hari Libur**: Seluruh staf dapat membaca jadwal libur, namun pengelolaannya dikunci khusus untuk Admin.

### 2. Fitur Baru & Perbaikan UI (V26.0)
- **Bank Soal Pro**: Menambahkan indikator nomor urut berurutan saat memilih soal untuk naskah ujian.
- **Ekspor Cerdas**: Dialog ekspor naskah kini mendukung pengaturan Waktu (Durasi) dan Tanggal ujian yang dinamis pada Kop Surat.
- **Identitas Sekolah Lengkap**: Mendukung penuh penyimpanan NPSN, Website, dan Email Resmi Sekolah pada profil institusi.

---

## V32.0: Ultimate SQL Blueprint with First User Auto-Admin - TERIMPLEMENTASI
Penyempurnaan total blueprint database untuk menjamin kemudahan setup awal dan keamanan terpusat.
