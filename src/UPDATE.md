
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

## 2. Pemisahan Tipe Libur
- `national`: Otomatis dari API (Indikator Merah).
- `school`: Manual dari Admin (Indikator Indigo).
- Keduanya secara otomatis meniadakan kewajiban absen pada sistem Absensi Guru.

## 3. Efisiensi Database
- Ukuran data sangat kecil (~0.1MB untuk data 2 tahun).
- Jumlah request terminimalisir secara drastis dibandingkan versi sebelumnya.

---
*LakuKelas: Cerdas dalam sinkronisasi, hemat dalam sumber daya.*
