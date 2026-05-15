# Log Pembaruan LakuKelas

## V9.0: Security & Activation Gatekeeper (TERBARU)
Fitur keamanan untuk mencegah pengguna tidak dikenal mengakses sistem meskipun login melalui Google.

### 1. Sistem Token Aktivasi
- **Gatekeeper**: Pengguna baru kini berstatus "Belum Aktif" saat pertama kali login.
- **Halaman Aktivasi**: Pengguna dialihkan ke `/activate` untuk memasukkan 8-digit token unik.
- **Manajemen Token**: Admin dapat membuat, memantau, dan menghapus token melalui menu **Admin > Token Aktivasi**.
- **Keamanan**: Mencegah pendaftaran akun liar di sistem produksi.

### 2. Perbaikan Bug & Stabilitas
- **Fix Syntax Build**: Memperbaiki kesalahan kurung kurawal pada modul Presensi yang menyebabkan kegagalan build Vercel.
- **Fix Hapus Pengguna**: Admin kini dapat menghapus profil pengguna secara permanen dari dashboard.
- **Restorasi Logika Admin**: Mengembalikan seluruh fitur manajemen (Jadwal, WhatsApp, Lokasi GPS, dsb) yang sempat hilang pada pembaruan sebelumnya.
- **UI Error Fix**: Memperbaiki `ReferenceError` pada halaman staf dengan melengkapi impor komponen ShadCN.

---

## V8.1: Konsolidasi Skema Utama
- **Schema Update**: Seluruh potongan skrip sukses dari V8.0 telah disatukan ke dalam `schema.sql`.
- **Standardisasi**: Mendukung fitur monitoring dan kolaborasi antar guru.
- **RLS Robustness**: Penambahan logika otomasi kebijakan keamanan (RLS) untuk akses pengguna terautentikasi.
