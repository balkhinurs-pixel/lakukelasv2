
# Log Pembaruan LakuKelas

## V11.0: Sistem Approval & Pembersihan Token (FINAL)
Peralihan total dari sistem token manual ke sistem persetujuan (approval) oleh Admin untuk keamanan dan kemudahan penggunaan.

### 1. Alur Pendaftaran Baru (Persetujuan Admin)
- **Halaman Tunggu**: Pengguna baru yang mendaftar kini tidak lagi memasukkan token, melainkan diarahkan ke halaman `/waiting-approval`.
- **Approval System**: Admin dapat melihat daftar guru yang sedang menunggu di menu **Admin > Staf & Approval**.
- **Satu Klik Akses**: Admin memberikan akses cukup dengan menekan tombol **"Setujui Akses"**. Akun guru otomatis aktif tanpa perlu kode.
- **Bypass Admin**: Pendaftar pertama pada database kosong tetap otomatis menjadi **Admin Aktif** tanpa perlu persetujuan.

### 2. Penghapusan Fitur Token
- Menghapus menu **Token Aktivasi** dari seluruh navigasi.
- Menghapus fungsi *generate*, *share*, dan *copy* token.
- Menyederhanakan proses *onboarding* guru agar lebih cepat dan efisien.

### 3. Keamanan & Kebersihan Data
- **Middleware Protection**: Menambahkan proteksi ketat sehingga user belum aktif hanya bisa melihat halaman tunggu, mencegah akses ke Dashboard tanpa izin.
- **Penyaringan Statistik**: Seluruh statistik Dashboard dan Monitoring kini hanya menghitung pengguna yang sudah disetujui (aktif).
- **Tab Pending**: Admin memiliki daftar khusus untuk akun "asing" atau belum disetujui untuk segera disetujui atau dihapus agar administrasi tetap bersih.

---

## V10.0: Privilese Admin & Bypass Aktivasi
Menyempurnakan alur pendaftaran untuk administrator.

### 1. Alur Khusus Admin
- **Bypass Aktivasi**: Pengguna dengan peran `admin` kini secara otomatis melewati layar aktivasi token. 
- **Auto-Admin First User**: Pendaftar pertama pada database baru 100% diatur sebagai Admin Aktif.
