
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

Fitur pengingat otomatis kepada guru melalui WhatsApp untuk absensi dan informasi jadwal mengajar harian.

## 1. Komponen yang Diperbarui
- **Integrasi Fonnte**: Mendukung pengiriman pesan via WhatsApp menggunakan API Fonnte (Direkomendasikan menggunakan *Device Token*).
- **Pengaturan URL Aplikasi**: Admin dapat mengatur domain aplikasi secara dinamis untuk link akses di dalam pesan WA.
- **Uji Kirim Pesan**: Fitur bagi Admin untuk mengetes koneksi dengan mengirim pesan manual ke nomor tertentu.
- **Dua Jalur Cron Job (Vercel)**:
    1. **Jam 06:00 WIB**: Pengingat jadwal mengajar harian kepada guru.
    2. **Jam 08:00 WIB**: Pengingat/Teguran bagi guru yang wajib hadir tetapi belum melakukan absen masuk.

---

# Update V4.8: Re-Strukturisasi & Pemisahan Panel Monitoring (TERIMPLEMENTASI)

Pemisahan antarmuka Kepala Sekolah dari direktori `/admin` ke direktori khusus `/monitoring` untuk meningkatkan kebersihan kode dan spesialisasi fitur.

## 1. Pemisahan Route
- **Direktori `/admin`**: Dikhususkan hanya untuk fungsi manajemen sistem (Kelola Guru, Roster/Data Siswa, Pengaturan Sekolah, WhatsApp, dll). Hanya bisa diakses oleh role `admin`.
- **Direktori `/monitoring`**: Antarmuka khusus pemantauan yang digunakan oleh Kepala Sekolah dan Admin. Berisi Dashboard Statistik, Rekap Absensi, dan Aktivitas Guru.

## 2. Peningkatan Pengalaman Pengguna (UX)
- **Layout Sidebar Berbeda**: Kepala Sekolah memiliki sidebar yang bersih dengan warna tema Teal-Cyan yang segar, tanpa menu manajemen yang membingungkan.
- **Integrasi Pengajaran**: Jika Kepala Sekolah juga mengajar, mereka dapat dengan mudah berpindah ke "Mode Guru" melalui tombol navigasi cepat di sidebar atau dropdown profil.

---

# Update V4.9: Optimasi Upload & Konfigurasi Storage (SELESAI)

Peningkatan sistem unggah foto profil dan logo sekolah agar lebih stabil dan mudah dikonfigurasi melalui database.

## 1. Perbaikan & Fitur
- **Penanganan Error 42501**: Mengoptimalkan script SQL untuk menghindari masalah hak akses `must be owner of table objects` di Supabase.
- **Skema SQL Terpadu**: Menyertakan konfigurasi bucket `avatars` dan kebijakan RLS (Row Level Security) langsung ke dalam skrip inisialisasi database.
- **Validasi Ganda**: Memastikan file gambar divalidasi di sisi klien (ukuran < 2MB) dan diproses dengan benar oleh server action.

---

# Update V5.0: Smart Storage Management (SELESAI)

Fitur manajemen storage otomatis untuk mencegah penumpukan file sampah di server.

## 1. Fitur Utama
- **Auto-Delete Old Files**: Saat pengguna mengganti foto profil atau Admin mengganti logo sekolah, sistem akan otomatis mendeteksi file lama di storage dan menghapusnya sebelum mengunggah file baru.
- **Efisiensi Storage**: Memastikan setiap guru hanya memiliki 1 file foto aktif dan sekolah hanya memiliki 1 file logo aktif di bucket Supabase.

---

# Update V5.1: Optimasi Layout Monitoring (SELESAI)

Penyesuaian tata letak dasbor monitoring untuk meningkatkan kenyamanan akses Kepala Sekolah melalui perangkat mobile.

## 1. Perubahan UI
- **Prioritas Data**: Daftar kehadiran guru hari ini dipindahkan ke urutan pertama di bawah kartu statistik.
- **Statistik di Bawah**: Grafik batang mingguan dipindahkan ke bawah agar tidak menghalangi pandangan utama saat pertama kali membuka dasbor.
- **Scroll Area**: Menambah tinggi area scroll daftar guru menjadi 450px untuk visibilitas yang lebih baik.

---
*Update ini memastikan Kepala Sekolah mendapatkan informasi paling krusial secara instan.*
