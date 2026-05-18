
# Log Pembaruan LakuKelas

## V18.6: Solusi Admin Pertama (Database Baru)
Pembaruan pada logika pendaftaran untuk menangani instalasi pada database kosong.

### 1. Logika Auto-Admin
- **Smart Assignment**: Fungsi `handle_new_user` sekarang menghitung jumlah user yang ada.
- **First User Privilege**: Jika pendaftar adalah orang pertama, sistem otomatis memberikan role `admin` dan status `is_activated = true`.
- **Security**: Pendaftar kedua dan seterusnya tetap mendapatkan role `teacher` dan wajib menunggu persetujuan dari Admin pertama.

---

## V18.5: Integrasi Auth Sync Otomatis
Pembaruan kritikal pada blueprint database untuk menangani sinkronisasi profil pengguna baru secara otomatis saat login pertama kali.

### 1. Perbaikan Alur Pendaftaran
- **Trigger Auth Baru**: Menambahkan fungsi `handle_new_user` dan trigger `on_auth_user_created`. Sekarang, setiap pengguna yang login melalui Google akan otomatis dibuatkan baris profilnya di tabel `public.profiles`.
- **Identitas Otomatis**: Mengambil nama lengkap dan foto profil langsung dari metadata Google OAuth.
- **Security Check**: Menambahkan `security definer` pada fungsi sinkronisasi untuk memastikan database dapat menulis data profil meskipun user belum memiliki izin RLS penuh.

---

## V18.4: Perbaikan Urutan Skema SQL & Dependensi Tabel
Pembaruan pada blueprint database untuk memastikan skrip dapat dijalankan pada database kosong tanpa error urutan relasi.

### 1. Perbaikan Urutan Eksekusi
- **Table-First Approach**: Memastikan tabel `public.schedule` dan tabel master lainnya didefinisikan di awal skrip sebelum dipanggil oleh fungsi atau view mana pun.
- **Pembersihan Dependensi**: Menata ulang urutan drop dan create agar tidak terjadi konflik *foreign key*.

---

## V18.3: Perbaikan Integritas Skema SQL
Perbaikan pada fungsi penghitungan aktivitas guru agar kompatibel dengan database baru.

### 1. Perbaikan Bug SQL
- **Type Casting**: Menambahkan casting `::text` eksplisit pada fungsi `get_teacher_activity_counts`. Sebelumnya terjadi error karena PostgreSQL tidak bisa menggabungkan tipe `date` dan `uuid` menggunakan operator `||`.
- **Integritas Blueprint**: Memastikan seluruh fungsi RPC di `schema.sql` dapat berjalan di database kosong tanpa error tipe data.
