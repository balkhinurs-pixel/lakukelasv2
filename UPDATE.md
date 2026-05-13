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
- **Keamanan**: Kepala Sekolah hanya bisa **Melihat (Read-Only)**, tidak bisa mengubah jadwal, menghapus guru, atau mengganti pengaturan sekolah.

## 3. Perbaikan RLS & Navigasi (TERIMPLEMENTASI - V4.6)
- **RLS Update**: Database kini mengizinkan peran `headmaster` untuk melakukan `SELECT` pada data global.
- **UI Navigasi**: Penambahan tombol navigasi cepat untuk beralih antara "Mode Guru" dan "Mode Pemantauan" pada perangkat mobile dan desktop.

---
*Update V4.6 telah selesai diimplementasikan dan diuji berhasil.*
