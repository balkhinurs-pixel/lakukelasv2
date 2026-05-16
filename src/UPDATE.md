
# Log Pembaruan LakuKelas

## V11.1: Optimalisasi Statistik & Laporan (TERBARU)
Penyempurnaan sistem setelah implementasi Approval untuk memastikan data akurat dan laporan profesional.

### 1. Perbaikan Visibilitas Laporan
- **Akses Identitas**: Memperbarui kebijakan RLS agar Guru dapat membaca data profil Admin terbatas pada informasi sekolah (Nama, Alamat, Logo) untuk kebutuhan kop surat laporan.
- **Placeholder Profesional**: Menambahkan data fallback otomatis pada laporan jika Admin belum sempat mengisi profil sekolah.

### 2. Akurasi Aktivitas Guru
- **Sesi Unik**: Memperbarui logika penghitungan aktivitas guru agar menghitung "Jumlah Sesi" (Pertemuan/Set Nilai) bukan jumlah baris siswa, sehingga angka beban kerja lebih realistis.
- **Filter Approval**: Statistik kini 100% hanya menghitung staf yang sudah disetujui (Active) oleh Admin.

---

## V11.0: Sistem Approval & Pembersihan Token (FINAL)
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin untuk keamanan dan kemudahan penggunaan.

### 1. Alur Pendaftaran Baru (Persetujuan Admin)
- **Halaman Tunggu**: Pengguna baru yang mendaftar kini tidak lagi memasukkan token, melainkan diarahkan ke halaman `/waiting-approval`.
- **Approval System**: Admin dapat melihat daftar guru yang sedang menunggu di menu **Admin > Staf & Approval**.
- **Satu Klik Akses**: Admin memberikan akses cukup dengan menekan tombol **"Setujui Akses"**. Akun guru otomatis aktif tanpa perlu kode.
- **Bypass Admin**: Pendaftar pertama pada database kosong tetap otomatis menjadi **Admin Aktif** tanpa perlu persetujuan.

### 2. Penghapusan Fitur Token
- Menghapus menu **Token Aktivasi** dari seluruh navigasi.
- Menyederhanakan proses *onboarding* guru agar lebih cepat dan efisien.

---

## V10.0: Privilese Admin & Bypass Aktivasi
Menyempurnakan alur pendaftaran untuk administrator agar tidak terkunci pada instalasi baru.
