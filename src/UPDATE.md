
# Log Pembaruan LakuKelas

## V9.6: Perbaikan Logika Aktivasi & Dashboard Admin (TERBARU)
Peningkatan pada kejelasan sistem token dan keandalan aktivasi otomatis.

### 1. Fix First-User Auto-Admin
- **Logic Correction**: Menggunakan variabel `p_count` di dalam trigger `handle_new_user` untuk memastikan deteksi tabel kosong (0 profile) benar-benar akurat sebelum menyematkan role `Admin`. Ini menyelesaikan masalah pendaftar pertama yang tetap diminta token pada database baru.

### 2. Dashboard Admin: Token Clarity
- **Visual Status**: Card token kini memiliki warna yang memudar (opacity) dan label "Sudah Terpakai" yang jelas untuk membedakan token lama dan baru.
- **Used-By tracking**: Menambahkan tampilan nama staf pengajar yang telah mengklaim token tersebut, mempermudah admin melakukan audit pendaftaran.

### 3. Izin RLS Token
- **Akses Aktivasi**: Memperbarui kebijakan RLS pada tabel `activation_tokens` agar pengguna `authenticated` yang baru mendaftar (status non-aktif) diperbolehkan mencari token yang belum terpakai (`used_by IS NULL`) guna keperluan validasi di halaman `/activate`.

---

## V9.5: Aktivasi & Redirection Fix
Perbaikan pada alur kerja setelah aktivasi akun.

### 1. Perbaikan Redirection
- **Hard Reload**: Mengganti `router.push` dengan `window.location.href` pada halaman aktivasi untuk memastikan navigasi memicu pemindaian ulang oleh *middleware*. Ini menyelesaikan masalah pengguna yang tetap tertahan di halaman `/activate` padahal sudah berhasil aktivasi.
- **Revalidation**: Menambahkan `revalidatePath('/', 'layout')` pada server action `activateAccount` untuk memastikan cache server dibersihkan segera setelah status akun berubah.
