

# Rencana Pembaruan Sistem Absensi Guru (V4.6) - SELESAI
Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
- Berbasis Jadwal vs Absensi Harian.

## 2. Monitoring Kepala Sekolah (TERIMPLEMENTASI - V4.6)
- Akses Dashboard & Rekap Kehadiran.

---

# Update V6.4: Perbaikan Build Error & Kode Bersih (SELESAI)

Mengatasi kegagalan build di Vercel akibat teks dokumentasi yang masuk ke file kode.

## 1. Perbaikan Bug
- **Syntax Error Fixed**: Menghapus seluruh teks non-kode yang mengganggu di `src/lib/actions/admin.ts`.
- **Code Integrity**: Memastikan seluruh fungsi admin (save class, save schedule, dll) kembali normal dan dapat dikompilasi oleh Vercel.

---

# Update V6.3: Perbaikan Sinkronisasi API libur.deno.dev (SELESAI)

Optimasi logika pengambilan data untuk memastikan hari libur nasional ditarik dengan sempurna.

## 1. Perubahan Teknis
- **Data Detektor**: Sekarang sistem secara cerdas mendeteksi apakah API mengembalikan array langsung atau objek dengan properti data.
- **Mapping Universal**: Menambahkan pemetaan nama kolom (`name`, `keterangan`, `holiday_name`) agar deskripsi libur tidak kosong.
- **Network Headers**: Menambahkan `User-Agent` dan `cache: no-store` untuk mencegah pemblokiran dari server API dan memastikan data selalu paling baru.
- **Robust Error Handling**: Menambahkan log error yang detail di sisi server jika sinkronisasi gagal.

## 2. Fitur Admin
- **Sync Latar Belakang**: Klik tombol Sync di Admin kini 100% lebih andal untuk tahun 2025 dan 2026.
- **Deduplikasi**: Tetap menggunakan `upsert` pada kolom `date` untuk mencegah data ganda.

---

# Update V6.2: Manajemen Libur Nasional Terpisah & Hapus Massal (TERIMPLEMENTASI)

Optimalisasi UI dan fungsionalitas untuk manajemen hari libur nasional.

## 1. Antarmuka Terpisah (Tabs)
- **Menu Tab**: Memisahkan "Libur Sekolah" dan "Libur Nasional" untuk kenyamanan visual.
- **Counter Data**: Menampilkan jumlah hari libur pada setiap kategori tab.

## 2. Pembersihan Data Massal
- **Fitur Baru**: Tombol "Bersihkan Data Nasional" di tab Libur Nasional.
- **Kegunaan**: Menghapus seluruh record `type: national` sekaligus untuk persiapan sinkronisasi ulang yang bersih (mencegah data lama menumpuk).

## 3. Sinkronisasi API libur.deno.dev
- **Endpoint**: Menarik data terupdate tahun 2025 dan 2026.
- **Deduplikasi**: Menggunakan `upsert` pada kolom `date` untuk menjamin tidak ada data ganda.

---

# Update V6.1: Migrasi API Hari Libur ke libur.deno.dev (TERIMPLEMENTASI)

Mengganti sumber data hari libur nasional untuk keandalan dan akurasi data yang lebih baik.

## 1. Perubahan Sumber Data
- **API Baru**: Menggunakan `https://libur.deno.dev/api` sebagai sumber utama.
- **Dukungan Multi-Tahun**: Fungsi sinkronisasi manual di Admin sekarang menarik data tahun 2025 dan 2026 sekaligus.
- **Filter Ketat**: Menambahkan filter `is_holiday: true` untuk memastikan hanya hari libur resmi yang masuk ke database.

## 2. Mekanisme Sinkronisasi
- **Admin Control**: Sinkronisasi tetap dilakukan secara manual melalui tombol "Sync Libur Nasional" di menu Admin.
- **Data Persistence**: Data disimpan ke tabel `holidays` dengan tipe `national`.
- **Zero Duplication**: Menggunakan kolom `date` sebagai kunci unik (upsert) untuk mencegah data ganda.

---

# Update V6.0: Sinkronisasi Hari Libur Manual (TERIMPLEMENTASI)

Optimalisasi pengambilan data hari libur nasional untuk keandalan 100% dan performa aplikasi yang lebih kencang.

## 1. Mekanisme "Manual Sync by Admin"
- **Kontrol Admin**: Menambahkan tombol "Sync Libur Nasional" di menu Admin > Pengaturan > Libur.
- **Bulk Fetch**: Menarik data tahunan sekaligus dari API Pemerintah dalam satu klik.
- **Database Persistence**: Data disimpan permanen ke tabel `holidays` with tipe `national`.
- **Zero Latency for Teachers**: Halaman Agenda Guru tidak lagi memanggil API luar saat dibuka (mengurangi waktu loading ~2 detik), karena data sudah tersedia di database internal.

---

# Update V5.9: Migrasi Penjadwalan ke GitHub Actions (TERIMPLEMENTASI)

Mengatasi batasan 1 cron/hari pada Vercel Hobby Tier dengan menggunakan pemicu eksternal yang lebih andal.

## 1. Pemindahan Scheduler
- Menggunakan **GitHub Actions** untuk memicu pengingat WA jam 06:00, 08:00, dan Keep-Alive mingguan.

---
*LakuKelas: Menggunakan sumber data terbaik untuk kemudahan Administrasi Anda.*
