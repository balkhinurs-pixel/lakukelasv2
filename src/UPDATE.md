
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

# Update V5.9: Migrasi Penjadwalan ke GitHub Actions (RENCANA)

Mengatasi batasan 1 cron/hari pada Vercel Hobby Tier dengan menggunakan pemicu eksternal.

## 1. Pemindahan Scheduler
- Menghapus konfigurasi `crons` di `vercel.json`.
- Menggunakan **GitHub Actions** untuk memicu endpoint API `/api/cron/*`.
- Memungkinkan pemicu multi-waktu (Jam 06:00 untuk Jadwal dan Jam 08:00 untuk Absensi).

## 2. Konservasi Supabase (Keep-Alive)
- Mengubah jadwal `keep-alive` menjadi **Mingguan (Setiap Hari Minggu)**.
- Menjamin database tidak ter-suspend oleh Supabase tanpa harus memicu aktivitas setiap hari.

## 3. Keamanan Endpoint
- Menambahkan rahasia `CRON_SECRET` agar endpoint API cron tidak bisa ditembak sembarangan oleh publik.

---
*LakuKelas: Cerdas dalam sinkronisasi, hemat dalam sumber daya.*
