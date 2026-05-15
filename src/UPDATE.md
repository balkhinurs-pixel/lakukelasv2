# Log Pembaruan LakuKelas

## V9.1: Monitoring & Core Accuracy Fix (TERBARU)
Perbaikan mendalam pada integritas data monitoring dan kendala manajemen staf.

### 1. Fix Monitoring Aktivitas Guru
- **Data Deteksi**: Memperbaiki fungsi `get_teacher_activity_counts` yang sebelumnya mengembalikan angka 0 meskipun data tersedia. 
- **Security Definer**: Menambahkan izin khusus pada fungsi agregasi agar Kepala Sekolah dan Admin dapat menarik data seluruh staf tanpa hambatan keamanan (RLS).
- **Sub-query Optimization**: Mengubah cara penghitungan sesi agar lebih akurat (menghitung sesi pertemuan unik, bukan jumlah baris data).

### 2. Fix Manajemen Pengguna
- **Hapus Pengguna**: Memperbarui kebijakan RLS pada tabel `profiles` agar tombol "Hapus Akun" di dashboard admin benar-benar mengeksekusi penghapusan di database.
- **Admin Visibility**: Memastikan Admin dapat melihat seluruh daftar staf termasuk sesama Admin untuk pengelolaan yang lebih baik.

### 3. Keamanan & Gatekeeper
- **Token Aktivasi**: Menstabilkan tabel `activation_tokens` untuk mencegah akses tidak sah dari pengguna luar.
- **Auto-Activation**: Menambahkan logika agar user pertama yang mendaftar (Biasanya Admin Setup) otomatis aktif tanpa token.

---

## V9.0: Security & Activation Gatekeeper
Fitur keamanan untuk mencegah pengguna tidak dikenal mengakses sistem meskipun login melalui Google.

- **Gatekeeper**: Pengguna baru kini berstatus "Belum Aktif" saat pertama kali login.
- **Halaman Aktivasi**: Pengguna dialihkan ke `/activate` untuk memasukkan 8-digit token unik.
- **Manajemen Token**: Admin dapat membuat, memantau, dan menghapus token melalui menu **Admin > Token Aktivasi**.

---

## V8.1: Konsolidasi Skema Utama
- **Schema Update**: Seluruh potongan skrip sukses dari V8.0 telah disatukan ke dalam `schema.sql`.
- **Standardisasi**: Mendukung fitur monitoring dan kolaborasi antar guru.
- **RLS Robustness**: Penambahan logika otomasi kebijakan keamanan (RLS) untuk akses pengguna terautentikasi.