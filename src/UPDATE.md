
# Log Pembaruan LakuKelas

## V18.4: Perbaikan Urutan Skema SQL & Dependensi Tabel
Pembaruan kritikal pada blueprint database untuk memastikan skrip dapat dijalankan pada database kosong tanpa error urutan relasi.

### 1. Perbaikan Urutan Eksekusi
- **Table-First Approach**: Memastikan tabel `public.schedule` dan tabel master lainnya didefinisikan di awal skrip sebelum dipanggil oleh fungsi atau view mana pun.
- **Pembersihan Dependensi**: Menata ulang urutan drop dan create agar tidak terjadi konflik *foreign key*.

---

## V18.3: Perbaikan Integritas Skema SQL
Perbaikan pada fungsi penghitungan aktivitas guru agar kompatibel dengan database baru.

### 1. Perbaikan Bug SQL
- **Type Casting**: Menambahkan casting `::text` eksplisit pada fungsi `get_teacher_activity_counts`. Sebelumnya terjadi error karena PostgreSQL tidak bisa menggabungkan tipe `date` dan `uuid` menggunakan operator `||`.
- **Integritas Blueprint**: Memastikan seluruh fungsi RPC di `schema.sql` dapat berjalan di database kosong tanpa error tipe data.

---

## V18.2: Finalisasi Blueprint Database & Keamanan RLS
Konsolidasi seluruh struktur database ke dalam satu blueprint utama untuk kemudahan deployment baru.

### 1. Blueprint Database (schema.sql)
- **Cetak Biru Tunggal**: Penggabungan seluruh skema tabel dari sistem inti hingga modul AI dan Google Drive ke file `schema.sql`.
- **Relasi & Integritas**: Penambahan *foreign key constraints* yang lebih ketat untuk mencegah data yatim (*orphaned data*).
- **Fungsi Pintar (RPC)**: Penambahan fungsi `get_teacher_attendance_summary` untuk monitoring cepat di sisi admin/kepala sekolah.
- **RLS Multi-Modul**: Implementasi *Row Level Security* pada tabel `questions`, `google_drive_integrations`, dan `ai_documents` untuk memastikan privasi guru terjaga.
