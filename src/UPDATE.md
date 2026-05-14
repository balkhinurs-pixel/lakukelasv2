
# Rencana Pembaruan Sistem Absensi Guru (V4.6) - SELESAI
Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
- Berbasis Jadwal vs Absensi Harian.

## 2. Monitoring Kepala Sekolah (TERIMPLEMENTASI - V4.6)
- Akses Dashboard & Rekap Kehadiran.

---

# Update V6.0: Sinkronisasi Hari Libur Manual (TERIMPLEMENTASI)

Optimalisasi pengambilan data hari libur nasional untuk keandalan 100% dan performa aplikasi yang lebih kencang.

## 1. Mekanisme "Manual Sync by Admin"
- **Kontrol Admin**: Menambahkan tombol "Sync Libur Nasional" di menu Admin > Pengaturan > Libur.
- **Bulk Fetch**: Menarik data tahun 2025 dan 2026 sekaligus dari API Pemerintah dalam satu klik.
- **Database Persistence**: Data disimpan permanen ke tabel `holidays` dengan tipe `national`.
- **Zero Latency for Teachers**: Halaman Agenda Guru tidak lagi memanggil API luar saat dibuka (mengurangi waktu loading ~2 detik), karena data sudah tersedia di database internal.

## 2. Keuntungan Arsitektur
- **Bebas Kuota**: Tidak ada pemborosan request API eksternal di sisi klien.
- **Stabilitas**: Tanggal merah tetap muncul meskipun API luar sedang mengalami gangguan.
- **Integritas Data**: Menggunakan indeks unik pada kolom `date` untuk menjamin tidak ada data ganda.

---

# Update V5.9: Migrasi Penjadwalan ke GitHub Actions (TERIMPLEMENTASI)

Mengatasi batasan 1 cron/hari pada Vercel Hobby Tier dengan menggunakan pemicu eksternal yang lebih andal.

## 1. Pemindahan Scheduler
- Menggunakan **GitHub Actions** untuk memicu pengingat WA jam 06:00, 08:00, dan Keep-Alive mingguan.

---
*LakuKelas: Kendali penuh di tangan Admin, kecepatan maksimal bagi Guru.*
