# Log Pembaruan LakuKelas

## V9.4: Aktivasi & Keamanan Fix (TERBARU)
Perbaikan krusial pada sistem aktivasi token dan monitoring.

### 1. Perbaikan Token Aktivasi
- **RLS Fix**: Memperbarui kebijakan Row Level Security pada tabel `activation_tokens`. Sebelumnya, pengguna baru tidak bisa "melihat" token karena batasan keamanan, sehingga muncul pesan "Token tidak valid".
- **Claim Logic**: Menambahkan izin `UPDATE` bagi pengguna terautentikasi untuk mengklaim token yang belum terpakai.

### 2. Keamanan & Pendaftaran
- **First-User Auto-Admin**: Pendaftar pertama di database otomatis menjadi `Admin` yang sudah `Aktif`.
- **Token-Based Auth**: Pengguna selanjutnya wajib memasukkan token 8-digit dari Admin untuk aktivasi akun.

### 3. Monitoring & Performa
- **Aktivitas Guru Fix**: Mengaktifkan `SECURITY DEFINER` pada fungsi agregasi database untuk memastikan data statistik guru terdeteksi 100% oleh akun Monitoring.

---

## V9.3: Gatekeeper & UI Navigation
Implementasi sistem keamanan token aktivasi dan penyelarasan navigasi admin.

### 1. Navigasi & UI
- **Menu Token Aktivasi**: Menambahkan tautan menu ke `/admin/codes` pada sidebar desktop dan drawer mobile layout Admin.
- **WhatsApp Integration**: Tombol kirim token via WhatsApp dengan template pesan profesional.
