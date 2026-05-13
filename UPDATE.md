
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

# Update V4.7: Integrasi WhatsApp Gateway (TERIMPLEMENTASI - INFRASTRUKTUR)

Fitur pengingat otomatis kepada guru melalui WhatsApp untuk absensi dan informasi jadwal mengajar.

## 1. Komponen yang Diperbarui
- **vercel.json**: Penambahan Cron Job harian (06:00 WIB).
- **Admin Settings**: Menu **"Pengaturan WhatsApp"** dengan fitur Test Koneksi, Toggle Aktif, dan Waktu Pengiriman.
- **API Cron**: Implementasi endpoint `/api/cron/wa-reminder` untuk memproses antrean pesan.
- **Database**: Penambahan kolom `phone_number` pada tabel `profiles`.

## 2. Cara Kerja
1. Vercel Cron memicu endpoint setiap pagi.
2. Sistem mengecek status `wa_reminder_enabled`.
3. Mengambil daftar guru yang memiliki jadwal mengajar pada hari tersebut.
4. Mengirimkan pesan format profesional via API Fonnte.

## 3. Langkah Lanjutan
Admin perlu memastikan data nomor telepon guru telah diisi pada menu "Daftar Guru" dengan format internasional (contoh: 62812xxx).
