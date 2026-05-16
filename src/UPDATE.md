
# Log Pembaruan LakuKelas

## V11.6: Finalisasi Alur Onboarding (PENYEMPURNAAN)
Menyempurnakan transisi otomatis dari pengisian data diri ke halaman tunggu persetujuan.

### 1. Alur Kerja Otomatis
- **Redirect Mulus**: Setelah menekan "Ajukan Persetujuan", sistem secara otomatis memicu pembersihan cache dan mengalihkan pengguna ke `/waiting-approval`.
- **Validasi Middleware**: Memperkuat deteksi `hasFilledProfile` di middleware agar pengguna tidak bisa kembali ke formulir setelah data dikirim.
- **Instruksi WhatsApp**: Menambahkan petunjuk penginputan nomor WhatsApp tanpa simbol '+' untuk stabilitas sistem notifikasi.

---

## V11.5: Alur Verifikasi Staf Baru (PENINGKATAN)
Menambahkan langkah wajib pengisian data diri bagi guru baru untuk memudahkan Admin saat melakukan persetujuan akses.

### 1. Alur Pendaftaran Diperbarui
- **Langkah 1**: Login via Google.
- **Langkah 2 (Baru)**: Halaman `Lengkapi Profil`. Guru wajib mengisi Nama Lengkap, NIP, dan WhatsApp.
- **Langkah 3**: Halaman `Menunggu Persetujuan`. Data guru sudah muncul di Panel Admin secara lengkap.
- **Auto-Bypass**: Admin (pendaftar pertama) tetap langsung aktif tanpa melewati proses ini.

---

## V11.2: Blueprint Database Komprehensif (TERBARU)
Penyempurnaan total pada `schema.sql` untuk memastikan kemudahan setup pada proyek baru.

### 1. Keamanan RLS (Row Level Security) Terintegrasi
- **Struktur RLS**: Menambahkan aturan kebijakan untuk seluruh tabel.
- **Hak Akses Admin/Kepsek**: Dipastikan dapat melihat seluruh jurnal, nilai, dan absensi guru untuk keperluan monitoring.
- **Hak Akses Guru**: Dibatasi hanya dapat mengelola (Insert/Update/Delete) data milik mereka sendiri.

---

## V11.0: Sistem Approval & Pembersihan Token (FINAL)
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin.
