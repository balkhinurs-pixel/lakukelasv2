
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

## 2. Cara Kerja Sistem
1. **Pemicu Otomatis**: Vercel memicu endpoint API setiap pagi sesuai jadwal UTC.
2. **Validasi Kebijakan**: Sistem mengecek siapa saja guru yang wajib hadir berdasarkan kebijakan sekolah (*Schedule-based* atau *Daily-based*).
3. **Double Token Method**: Token dikirim via Header dan Body untuk memastikan kompatibilitas 100% dengan endpoint `/send` Fonnte.
4. **Pesan Profesional**: Format pesan menggunakan template modern dengan emoji, pembatas visual, dan CTA (*Call to Action*) yang jelas.

## 3. Langkah Konfigurasi bagi Admin
1. **Dapatkan Token**: Ambil *Device Token* dari dashboard Fonnte (menu Device -> tombol hitam Token).
2. **Input Data**: Masukkan Token, URL Aplikasi (contoh: `https://app.anda.id`), dan aktifkan toggle pengingat di menu **Admin > Pengaturan WhatsApp**.
3. **Data Guru**: Pastikan setiap profil guru memiliki nomor WhatsApp yang valid dengan format internasional (contoh: `628123456789`).
4. **Tes Koneksi**: Gunakan kartu "Uji Kirim Pesan" untuk memastikan pesan masuk ke ponsel Anda.

---
*Update ini bertujuan untuk meningkatkan kedisiplinan administrasi sekolah secara otomatis dan efisien.*
