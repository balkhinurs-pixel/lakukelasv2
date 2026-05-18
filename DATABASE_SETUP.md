
# Panduan Setup Database LakuKelas

Dokumen ini menjelaskan cara menerapkan skema database ke proyek Supabase Anda.

## Langkah Instalasi

1.  Buka [Dashboard Supabase](https://supabase.com/dashboard) Anda.
2.  Pilih proyek Anda.
3.  Klik **SQL Editor** di menu samping kiri.
4.  Klik **"+ New query"**.

### Bagian 1: Skema Dasar (Wajib)
- Salin isi file `schema.sql` dari root proyek ini.
- Tempelkan ke editor SQL Supabase dan klik **"RUN"**.

### Bagian 2: Fitur AI & Google Drive (Pembaruan V18.0)
- Salin isi file `schema_ai.sql` dari root proyek ini.
- Tempelkan ke editor SQL Supabase dan klik **"RUN"**.

## Fitur Keamanan RLS
Aplikasi ini menggunakan **Row Level Security (RLS)** untuk melindungi data:
- **Guru:** Hanya bisa mengelola data miliknya sendiri.
- **Admin:** Memiliki akses kontrol sistem.
- **AI & Drive:** Data terisolasi per akun guru masing-masing.

---
*LakuKelas: Digitalizing Education with Ease.*
