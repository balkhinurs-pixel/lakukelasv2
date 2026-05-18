
# Log Pembaruan LakuKelas

## V18.2: Finalisasi Blueprint Database & Keamanan RLS (Terbaru)
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

### 1. Optimalisasi Bank Soal
- **Sistem Paginasi**: Implementasi paginasi (5 soal per halaman) untuk performa memuat data yang lebih ringan.
- **Filter Materi Pintar**: Penambahan filter berdasarkan Topik/Materi yang dinormalisasi (case-insensitive).
- **Pembahasan Interaktif**: Perbaikan fitur buka-tutup pembahasan soal dengan animasi halus.
- **Render LaTeX & Gambar**: Konsistensi tampilan rumus matematika dan ilustrasi AI di seluruh halaman.

---

## V18.0: Integrasi Ekspor & Google Drive (Selesai)
Tahap 3 dari fitur AI Pembelajaran: Menghubungkan aset digital dengan penyimpanan cloud guru.

### 1. Tahap 3: Ekspor & Cloud Storage (Selesai)
- Implementasi sistem sub-folder otomatis di Google Drive (Folder: `LakuKelas AI/Bank Soal`).
- Fitur ekspor naskah soal dari Bank Soal ke Google Doc secara kolektif.
- Integrasi metadata dokumen; menyimpan link Drive hasil ekspor ke database Supabase.
- Penataan naskah ekspor otomatis (mencakup Pertanyaan, Opsi A-E, Kunci, dan Pembahasan).

---

## V17.0: Implementasi Bank Soal AI (Selesai)
Menyelesaikan siklus hidup fitur Generate Soal dari pembuatan hingga manajemen arsip.
