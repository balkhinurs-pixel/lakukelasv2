
# Rencana Pembaruan Sistem Absensi Guru (V4.6) - SELESAI
Dokumen ini berisi logika dan rencana perubahan database untuk fitur pemantauan kehadiran guru.

## 1. Konfigurasi Kebijakan Absensi (TERIMPLEMENTASI)
- Berbasis Jadwal vs Absensi Harian.

## 2. Monitoring Kepala Sekolah (TERIMPLEMENTASI - V4.6)
- Akses Dashboard & Rekap Kehadiran.

---

# Update V5.7: Arsitektur Hari Libur Terintegrasi (TERIMPLEMENTASI)

Fitur sinkronisasi cerdas yang memisahkan antara hari libur nasional dan kebijakan internal sekolah.

## 1. Konsep Database (Tabel `holidays`)
- Tambahan kolom `type`: 
    - `national`: Data otomatis dari API.
    - `school`: Data input manual dari Admin.
- Kolom `date` bersifat unik (Unique Index) untuk mencegah duplikasi data ganda.

## 2. Logika Sinkronisasi (Server-Side)
- **Auto-Fetch**: Terjadi saat menu Agenda dibuka oleh user manapun.
- **Deduplikasi**: Pengecekan berbasis `date` dan `Set` di level aplikasi sebelum masuk ke database dengan metode `upsert`.
- **Dukungan Multi-Tahun**: Sinkronisasi otomatis data tahun 2025 dan 2026.

## 3. Integrasi UI/UX
- **Agenda Guru**: 
    - Titik Merah & Teks Merah: Libur Nasional.
    - Titik Indigo: Libur Khusus Sekolah.
- **Absensi Guru**: Mendeteksi kedua tipe libur untuk meniadakan kewajiban absen secara otomatis.

---
*LakuKelas: Integrasi cerdas, data akurat.*
