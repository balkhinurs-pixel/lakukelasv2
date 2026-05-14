
# Rencana Pembaruan Sistem Absensi Guru (V4.6) - SELESAI
Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
- Berbasis Jadwal vs Absensi Harian.

## 2. Monitoring Kepala Sekolah (TERIMPLEMENTASI - V4.6)
- Akses Dashboard & Rekap Kehadiran.

---

# Update V5.8: Optimasi Sinkronisasi Hari Libur (TERIMPLEMENTASI)

Fitur sinkronisasi otomatis yang ramah kuota Supabase Free Tier dan menghindari limit Vercel Cron.

## 1. Mekanisme "Smart Sync on Load"
- **Daily Cooldown**: Sistem mencatat `last_holiday_sync` di tabel `settings`.
- **Logic**: API hanya dipanggil 1x dalam 24 jam oleh pengunjung pertama. Pengunjung berikutnya hanya mengambil data dari Database (0% pemborosan API).
- **Deduplikasi**: Tetap menggunakan `upsert` pada kolom `date` yang unik untuk menjaga kebersihan data.

---

# Update V5.9: Migrasi Penjadwalan ke GitHub Actions (TERIMPLEMENTASI)

Mengatasi batasan 1 cron/hari pada Vercel Hobby Tier dengan menggunakan pemicu eksternal yang lebih andal.

## 1. Pemindahan Scheduler
- Menghapus konfigurasi `crons` di `vercel.json` untuk menghindari konflik limitasi.
- Menggunakan **GitHub Actions** (`.github/workflows/cron-scheduler.yml`) untuk memicu endpoint API.
- Mendukung pemicu multi-waktu: 
    - Jam 06:00 WIB: Notifikasi Jadwal Harian.
    - Jam 08:00 WIB: Teguran Belum Absen.

## 2. Konservasi Supabase (Keep-Alive)
- Mengubah jadwal `keep-alive` menjadi **Mingguan (Setiap Hari Minggu)**.
- Strategi ini cukup untuk mencegah database ter-suspend tanpa membuang kuota request harian.

---
*LakuKelas: Cerdas dalam sinkronisasi, hemat dalam sumber daya.*
