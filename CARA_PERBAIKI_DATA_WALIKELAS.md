# PANDUAN MENGATASI MASALAH DATA TIDAK MUNCUL DI MENU WALIKELAS

## MASALAH
- Siswa tidak muncul di menu **Perkembangan Siswa** walikelas
- Data absensi dan nilai tidak muncul di menu **Catatan & Leger Siswa** walikelas  
- Yang muncul hanya catatan saja
- Setelah migration, siswa malah hilang dari daftar

## PENYEBAB
Fungsi database (RPC) terlalu ketat dalam memfilter berdasarkan tahun ajaran aktif, sehingga data yang tidak memiliki school_year_id atau tidak sesuai tahun ajaran aktif tidak muncul.

## SOLUSI TERBARU (PERBAIKAN)

### 1. Buka Supabase Dashboard
- Login ke [supabase.com](https://supabase.com)
- Pilih project Anda
- Klik menu **SQL Editor** di sidebar kiri

### 2. Jalankan Corrective Migration Script
- Klik **New Query** 
- Copy seluruh isi file `fix_student_data_corrective.sql`
- Paste ke SQL Editor
- Klik **Run** untuk menjalankan script

### 3. Verifikasi
Setelah menjalankan script corrective, fungsi berikut akan diperbaiki dengan filtering yang lebih fleksibel:
- ✅ `get_student_grades_ledger` - untuk data nilai di leger siswa (sekarang menampilkan semua data jika tidak ada tahun ajaran aktif)
- ✅ `get_student_attendance_ledger` - untuk data absensi di leger siswa (sekarang menampilkan semua data jika tidak ada tahun ajaran aktif)
- ✅ `get_student_performance_for_class` - untuk data di perkembangan siswa (sekarang menampilkan semua siswa dan data)
- ✅ `get_active_school_year_id` - helper untuk mendapatkan tahun ajaran aktif

### 4. Pastikan Tahun Ajaran Aktif Sudah Diatur
- Masuk ke dashboard admin
- Menu **Roster** > **Tahun Ajaran**
- Pastikan ada satu tahun ajaran yang diset sebagai **aktif** (toggle switch hijau)

## HASIL SETELAH PERBAIKAN CORRECTIVE
- ✅ **SISWA MUNCUL KEMBALI** di menu **Perkembangan Siswa**
- ✅ Data absensi akan muncul di menu **Perkembangan Siswa**
- ✅ Data nilai akan muncul di menu **Perkembangan Siswa**
- ✅ Data absensi akan muncul di tab **Presensi** di **Catatan & Leger Siswa**
- ✅ Data nilai akan muncul di tab **Nilai** di **Catatan & Leger Siswa**
- ✅ Data catatan tetap berfungsi seperti sebelumnya
- ✅ Data difilter berdasarkan tahun ajaran aktif JIKA ada, jika tidak akan menampilkan semua data
- ✅ Backward compatibility dengan data lama yang belum memiliki school_year_id

## CATATAN PENTING
- Script corrective ini menggantikan script sebelumnya yang terlalu ketat
- Script ini akan menghapus dan membuat ulang fungsi RPC dengan filtering yang lebih fleksibel
- Tidak ada data yang akan hilang - hanya memperbaiki cara query data
- Setelah migration, refresh browser untuk melihat perubahan
- Fungsi sekarang kompatibel dengan data lama dan baru
- Jika ada tahun ajaran aktif, data akan difilter sesuai tahun ajaran
- Jika tidak ada tahun ajaran aktif atau data tidak memiliki school_year_id, semua data akan ditampilkan

## TROUBLESHOOTING
1. **Siswa masih tidak muncul**: Jalankan script corrective `fix_student_data_corrective.sql` untuk menggantikan script sebelumnya
2. **Data masih kosong**: Pastikan ada data yang diinput, atau set tahun ajaran aktif di admin panel
3. **Error saat run script**: Pastikan copy paste script corrective dengan benar  
4. **Masih tidak muncul**: Clear cache browser dan refresh halaman
5. **Masalah tahun ajaran**: Script corrective akan bekerja bahkan tanpa tahun ajaran aktif