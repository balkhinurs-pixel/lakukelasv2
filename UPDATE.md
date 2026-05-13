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

# Rencana Pengembangan Selanjutnya (V4.7) - PERENCANAAN

## 1. Integrasi WhatsApp Gateway (Fonnte)
Menambahkan fitur pengingat otomatis kepada guru untuk melakukan absensi dan memberikan informasi jadwal mengajar hari tersebut.

## 2. Komponen Teknis
- **Database**: Penambahan kolom `phone_number` pada tabel `profiles`.
- **Admin Settings**: Menu baru untuk menyimpan `Fonnte API Token` di tabel `settings`.
- **Automation**: Implementasi `Vercel Cron Jobs` yang berjalan setiap pagi (Pukul 06:00 WIB).
- **Logika Pesan**: 
    1. Cari guru yang memiliki jadwal mengajar pada hari tersebut (berdasarkan hari di GMT+7).
    2. Ambil detail jadwal (Mata Pelajaran, Kelas, Jam).
    3. Format pesan: "Halo [Nama Guru], jangan lupa absensi hari ini. Jadwal Anda: 1. [Mapel] di [Kelas] jam [Jam]..."
    4. Kirim melalui API Fonnte.

## 3. Fitur Tambahan
- Log pengiriman pesan (untuk memantau apakah pesan berhasil terkirim).
- Tombol "Test Koneksi" di dashboard admin untuk memastikan token WA valid.

---
*Update V4.6 telah selesai diimplementasikan. Perencanaan V4.7 sedang didiskusikan.*