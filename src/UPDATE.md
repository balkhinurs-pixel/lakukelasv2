# Log Pembaruan LakuKelas

## V8.1: Konsolidasi Skema Utama (TERBARU)
- **Schema Update**: Seluruh potongan skrip sukses dari V8.0 telah disatukan ke dalam `schema.sql` di root proyek.
- **Standarisasi**: File `schema.sql` kini siap digunakan untuk inisialisasi database baru dengan dukungan penuh fitur monitoring dan kolaborasi.
- **RLS Robustness**: Penambahan logika otomasi kebijakan keamanan (RLS) untuk akses pengguna terautentikasi.

## V8.0: Presensi Kolaboratif & Sinkronisasi Cerdas (TERIMPLEMENTASI)
Optimisasi alur kerja guru untuk efisiensi input data dan pemantauan real-time oleh Wali Kelas.

### 1. Konsep "First Input Base"
- **Logika**: Guru mata pelajaran yang melakukan input presensi pertama kali di suatu kelas (pada hari tersebut) akan menentukan status awal seluruh siswa.
- **Penerapan**: Data ini menjadi referensi utama bagi sistem untuk hari itu.

### 2. Hierarki Prioritas Status (Akurasi Laporan)
- **Logika**: Sistem menggunakan hierarki `Hadir` > `Izin` > `Sakit` > `Alpha`.
- **Manfaat**: Jika siswa terlambat dan absen jam ke-2 ditandai Hadir, maka laporan harian otomatis menjadi Hadir meskipun di jam ke-1 ditandai Alpha.

### 3. Matriks Bulanan Wali Kelas
- **Format**: Laporan matriks 31 hari standar administrasi Indonesia.
- **Visual**: Deteksi otomatis hari Minggu dan Libur Nasional dengan penanda warna merah.
- **Output**: Fitur Cetak PDF profesional dengan orientasi landscape dan area tanda tangan resmi.

### 4. Protokol Pembaruan SQL (CATATAN PENTING)
Untuk memperbarui database yang sudah ada, selalu gunakan perintah `DROP VIEW IF EXISTS` sebelum pembuatan View baru untuk menghindari error `42P16` (redefinisi struktur kolom).

---

## V7.0: Konsolidasi Skema SQL Utama (TERIMPLEMENTASI)
Optimalisasi untuk deployment mandiri dan migrasi proyek Supabase.
- Penyediaan file `schema.sql` yang idempotent (aman dijalankan berulang kali).
- Penguatan aturan RLS untuk keamanan multi-role (Guru, Wali Kelas, Kepsek).
- Otomatisasi profil pengguna baru melalui PostgreSQL Trigger.