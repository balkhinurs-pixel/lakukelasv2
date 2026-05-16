
# Log Pembaruan LakuKelas

## V11.2: Blueprint Database Komprehensif (TERBARU)
Penyempurnaan total pada `schema.sql` untuk memastikan kemudahan setup pada proyek baru.

### 1. Keamanan RLS (Row Level Security) Terintegrasi
- **Struktur RLS**: Menambahkan aturan kebijakan untuk seluruh tabel.
- **Hak Akses Admin/Kepsek**: Dipastikan dapat melihat seluruh jurnal, nilai, dan absensi guru untuk keperluan monitoring.
- **Hak Akses Guru**: Dibatasi hanya dapat mengelola (Insert/Update/Delete) data milik mereka sendiri.
- **Pengecualian Laporan**: Profil Admin kini dapat dibaca oleh semua staf agar identitas sekolah bisa muncul di kop surat laporan.

### 2. Auto-Admin & Approval Terintegrasi
- **Trigger handle_new_user**: Diperbarui untuk mendukung sistem tanpa token. Pendaftar pertama otomatis menjadi `Admin Aktif`. Pendaftar selanjutnya menjadi `Teacher Pending`.

### 3. Fungsi RPC Performa Tinggi
- Memasukkan fungsi `get_teacher_attendance_summary` dan `get_teacher_activity_counts` langsung ke skema utama untuk statistik dashboard yang akurat.

---

## V11.1: Optimalisasi Statistik & Laporan
Penyempurnaan sistem setelah implementasi Approval untuk memastikan data akurat dan laporan profesional.

### 1. Perbaikan Visibilitas Laporan
- **Akses Identitas**: Memperbarui kebijakan RLS agar Guru dapat membaca data profil Admin terbatas pada informasi sekolah (Nama, Alamat, Logo).

---

## V11.0: Sistem Approval & Pembersihan Token (FINAL)
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin.

### 1. Alur Pendaftaran Baru
- **Halaman Tunggu**: Pengguna baru diarahkan ke `/waiting-approval`.
- **Approval System**: Admin menyetujui akses guru melalui menu **Staf & Approval**.
- **Penghapusan Fitur Token**: Semua kode terkait token aktivasi telah dibersihkan.
