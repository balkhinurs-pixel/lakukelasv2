
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
- Kolom `type`: 
    - `national`: Data otomatis dari API (Warna Merah).
    - `school`: Data input manual dari Admin (Warna Indigo).
- Kolom `date` bersifat unik (Unique Index) untuk mencegah duplikasi.

## 2. Logika Sinkronisasi (Server-Side)
- **Auto-Fetch**: Terjadi saat menu Agenda dibuka.
- **Improved Parsing**: Mendukung format array langsung maupun objek dari API `api-hari-libur.vercel.app`.
- **Deduplikasi**: Menggunakan metode `upsert` pada database untuk memastikan data tetap tunggal per tanggal.
- **Dukungan Multi-Tahun**: Sinkronisasi data tahun 2025 dan 2026 berjalan secara otomatis.

## 3. Integrasi UI/UX
- **Agenda Guru**: 
    - Titik Merah & Angka Merah: Libur Nasional.
    - Titik Indigo & Angka Indigo: Libur Khusus Sekolah.
- **Absensi Guru**: Terintegrasi otomatis untuk meniadakan kewajiban absen pada kedua tipe hari libur tersebut.

---
*LakuKelas: Integrasi cerdas, data akurat.*
