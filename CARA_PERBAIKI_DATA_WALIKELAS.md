# PANDUAN MENGATASI MASALAH DATA TIDAK MUNCUL DI MENU WALIKELAS

## MASALAH
- Data absensi dan nilai tidak muncul di menu **Perkembangan Siswa** walikelas
- Data absensi dan nilai tidak muncul di menu **Catatan & Leger Siswa** walikelas  
- Yang muncul hanya catatan saja

## PENYEBAB
Fungsi database (RPC) tidak memfilter berdasarkan tahun ajaran aktif dan menggunakan pola JSONB yang tidak konsisten.

## SOLUSI

### 1. Buka Supabase Dashboard
- Login ke [supabase.com](https://supabase.com)
- Pilih project Anda
- Klik menu **SQL Editor** di sidebar kiri

### 2. Jalankan Migration Script
- Klik **New Query** 
- Copy seluruh isi file `fix_student_ledger_rpc.sql`
- Paste ke SQL Editor
- Klik **Run** untuk menjalankan script

### 3. Verifikasi
Setelah menjalankan script, fungsi berikut akan diperbaiki:
- ✅ `get_student_grades_ledger` - untuk data nilai di leger siswa
- ✅ `get_student_attendance_ledger` - untuk data absensi di leger siswa  
- ✅ `get_student_performance_for_class` - untuk data di perkembangan siswa
- ✅ `get_active_school_year_id` - helper untuk mendapatkan tahun ajaran aktif

### 4. Pastikan Tahun Ajaran Aktif Sudah Diatur
- Masuk ke dashboard admin
- Menu **Roster** > **Tahun Ajaran**
- Pastikan ada satu tahun ajaran yang diset sebagai **aktif** (toggle switch hijau)

## HASIL SETELAH PERBAIKAN
- ✅ Data absensi akan muncul di menu **Perkembangan Siswa**
- ✅ Data nilai akan muncul di menu **Perkembangan Siswa**
- ✅ Data absensi akan muncul di tab **Presensi** di **Catatan & Leger Siswa**
- ✅ Data nilai akan muncul di tab **Nilai** di **Catatan & Leger Siswa**
- ✅ Data catatan tetap berfungsi seperti sebelumnya
- ✅ Semua data difilter berdasarkan tahun ajaran aktif

## CATATAN PENTING
- Script ini akan menghapus dan membuat ulang fungsi RPC yang bermasalah
- Tidak ada data yang akan hilang - hanya memperbaiki cara query data
- Setelah migration, refresh browser untuk melihat perubahan
- Jika masih ada masalah, pastikan guru sudah input data di tahun ajaran yang aktif

## TROUBLESHOOTING
1. **Data masih kosong**: Pastikan ada data yang diinput di tahun ajaran aktif
2. **Error saat run script**: Pastikan copy paste script dengan benar  
3. **Masih tidak muncul**: Clear cache browser dan refresh halaman