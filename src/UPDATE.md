
# Log Pembaruan LakuKelas

## V18.3: Perbaikan Integritas Skema SQL (Terbaru)
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

### 2. Optimalisasi Performa
- **Indeks Filter**: Penambahan indeks pada kolom yang sering difilter seperti `topic`, `subject`, dan `date`.
- **View Terpusat**: Pembuatan view `attendance_history` dan `grades_history` untuk mempercepat query laporan.

---

## V18.1: Optimalisasi Bank Soal & Paginasi
Pembaruan fungsionalitas pada Bank Soal dan standarisasi database sesuai Blueprint.

---

## V18.0: Integrasi Ekspor & Google Drive (Selesai)
Tahap 3 dari fitur AI Pembelajaran: Menghubungkan aset digital dengan penyimpanan cloud guru.
