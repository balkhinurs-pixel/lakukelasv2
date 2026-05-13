
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

---

# Update V4.7: Integrasi WhatsApp Gateway & Otomatisasi (TERIMPLEMENTASI)

Fitur pengingat otomatis kepada guru melalui WhatsApp untuk absensi dan informasi jadwal mengajar harian.

## 1. Komponen yang Diperbarui
- **Integrasi Fonnte**: Mendukung pengiriman pesan via WhatsApp menggunakan API Fonnte (Direkomendasikan menggunakan *Device Token*).
- **Pengaturan URL Aplikasi**: Admin dapat mengatur domain aplikasi secara dinamis untuk link akses di dalam pesan WA.
- **Uji Kirim Pesan**: Fitur bagi Admin untuk mengetes koneksi dengan mengirim pesan manual ke nomor tertentu.
- **Dua Jalur Cron Job (Vercel)**:
    1. **Jam 06:00 WIB**: Pengingat jadwal mengajar harian kepada guru.
    2. **Jam 08:00 WIB**: Pengingat/Teguran bagi guru yang wajib hadir tetapi belum melakukan absen masuk.

---

# Update V4.8: Re-Strukturisasi & Pemisahan Panel Monitoring (RENCANA)

Pemisahan antarmuka Kepala Sekolah dari direktori `/admin` ke direktori khusus `/monitoring` untuk meningkatkan kebersihan kode dan spesialisasi fitur.

## 1. Pemisahan Route
- **Direktori `/admin`**: Dikhususkan hanya untuk fungsi manajemen sistem (Kelola Guru, Roster/Data Siswa, Pengaturan Sekolah, WhatsApp, dll). Hanya bisa diakses oleh role `admin`.
- **Direktori `/monitoring`**: Antarmuka khusus pemantauan yang akan digunakan oleh Kepala Sekolah. Berisi Dashboard Statistik, Rekap Absensi, dan Aktivitas Guru.

## 2. Peningkatan Pengalaman Pengguna (UX)
- **Layout Sidebar Berbeda**: Kepala Sekolah tidak akan lagi melihat menu manajemen yang terkunci (disabled), melainkan hanya menu pemantauan yang relevan.
- **Middleware Role-Based**: Pengaturan pengalihan (redirect) yang lebih ketat saat login berdasarkan role pengguna.

---
*Update ini bertujuan untuk meningkatkan kedisiplinan administrasi sekolah secara otomatis dan efisien.*
