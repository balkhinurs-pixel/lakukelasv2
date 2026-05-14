
# Rencana Pembaruan Sistem Absensi Guru (V4.6) - SELESAI

Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru yang lebih profesional dan fleksibel.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
Admin dapat memilih salah satu dari dua kebijakan absensi yang diterapkan di sekolah:
- **Berbasis Jadwal**: Wajib hadir jika ada jam mengajar.
- **Absensi Harian**: Wajib hadir setiap hari kerja.

## 2. Monitoring Kepala Sekolah (TERIMPLEMENTASI - V4.6)
Kepala Sekolah kini memiliki akses khusus ke Panel Monitoring:
- **Akses Dashboard**: Melihat statistik kehadiran real-time seluruh guru.
- **Rekap Kehadiran**: Melihat dan mengunduh PDF riwayat absen seluruh staf.
- **Aktivitas Guru**: Memantau kedisiplinan pengisian data (jurnal/nilai) tiap guru.

---

# Update V4.7: Integrasi WhatsApp Gateway & Otomatisasi (TERIMPLEMENTASI)

Fitur pengingat otomatis kepada guru melalui WhatsApp for absensi dan informasi jadwal mengajar harian.

---

# Update V5.6: Auto-Sync Hari Libur Nasional (NEW - TERIMPLEMENTASI)

Fitur sinkronisasi otomatis kalender akademik dengan hari libur nasional Indonesia.

## 1. Mekanisme Sinkronisasi (Server-Side Sync)
- **Background Fetch**: Sistem melakukan pemanggilan API `api-hari-libur.vercel.app` secara otomatis saat menu Agenda dibuka.
- **Deduplikasi Database**: Sistem mengecek kolom `date` di tabel `holidays`. Jika data sudah ada, sistem tidak akan memasukkan data duplikat (Aman meskipun banyak admin yang membuka aplikasi).
- **Multi-Year Support**: Menarik data untuk tahun berjalan dan satu tahun ke depan (Contoh: 2025 & 2026).

## 2. Status Proses
- ✅ **BERHASIL**: Koneksi API Vercel Nasional.
- ✅ **BERHASIL**: Pemetaan field `description` (Nama Libur) dan `date` (Tanggal).
- ✅ **BERHASIL**: Penyimpanan otomatis ke tabel `holidays` untuk digunakan di modul Absensi.
- ✅ **BERHASIL**: Indikator visual titik merah dan banner keterangan di Kalender Agenda.

## 3. Catatan Teknis
Jika tanggal merah tidak muncul, pastikan tabel `holidays` di Supabase memiliki kebijakan (RLS) yang mengizinkan *Insert* untuk user terautentikasi atau sistem.

---
*LakuKelas kini lebih cerdas dengan otomasi kalender nasional.*
