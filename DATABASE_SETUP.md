# Panduan Setup Database LakuKelas

Dokumen ini menjelaskan cara menerapkan skema database ke proyek Supabase Anda, baik untuk instalasi baru maupun memperbarui database yang sudah ada.

## Cara Instalasi (SQL Editor)

1.  Buka [Dashboard Supabase](https://supabase.com/dashboard) Anda.
2.  Pilih proyek Anda.
3.  Di menu samping kiri, klik **SQL Editor** (ikon `>_`).
4.  Klik tombol **"+ New query"**.
5.  Buka file `schema.sql` di root proyek ini, lalu salin **seluruh isinya**.
6.  Tempelkan ke dalam editor SQL di Supabase.
7.  Klik tombol **"RUN"** di pojok kanan bawah.

## Jika Database Sudah Ada Siswa/Data?

Skrip `schema.sql` telah dirancang dengan instruksi `IF NOT EXISTS`. Ini berarti:
-   Tabel yang sudah Anda miliki **tidak akan dihapus atau ditimpa**. Data Anda aman.
-   Hanya tabel, kolom, atau fungsi yang **belum ada** yang akan dibuat.
-   Aturan keamanan (RLS) akan diperbarui ke versi terbaru untuk mendukung fitur **V8.0 (Presensi Kolaboratif)**.

## Fitur Keamanan RLS

Aplikasi ini menggunakan **Row Level Security (RLS)** untuk melindungi data. 
-   **Guru:** Hanya bisa mengelola data (nilai/jurnal) yang mereka buat sendiri.
-   **Wali Kelas:** Memiliki akses baca ke seluruh progres siswa di kelasnya.
-   **Kepala Sekolah:** Memiliki akses monitoring untuk seluruh sekolah.

## Troubleshooting

Jika Anda melihat pesan *error* saat menjalankan skrip:
-   **"Policy already exists"**: Abaikan saja, skrip secara otomatis mencoba menghapus policy lama sebelum membuat yang baru.
-   **"Role 'admin' not found"**: Pastikan Anda sudah membuat akun admin pertama Anda melalui Dashboard Supabase (Tabel `profiles`).

---
*LakuKelas: Digitalizing Education with Ease.*
