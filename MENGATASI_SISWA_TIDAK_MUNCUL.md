# PANDUAN MENGATASI SISWA TIDAK MUNCUL DI PERKEMBANGAN SISWA

## MASALAH UTAMA
- Siswa tidak muncul di menu **Perkembangan Siswa** walikelas
- Error: `column "is_active" does not exist` saat menjalankan diagnostic
- Menampilkan pesan "Kelas Anda Belum Memiliki Siswa"

## ROOT CAUSE
❌ **Database schema missing `is_active` column** in `school_years` table
❌ **RPC functions too restrictive** with school year filtering

## SOLUSI BERTAHAP

### LANGKAH 1: PERBAIKAN CEPAT (SUDAH DITERAPKAN)
✅ **Temporary Fix Applied** - Sistem sudah dimodifikasi untuk menampilkan siswa tanpa mengandalkan RPC function yang bermasalah.

- File `src/lib/data.ts` sudah diperbarui
- Function `getHomeroomStudentProgress()` sekarang menggunakan query langsung ke tabel `students`
- Siswa akan muncul dengan status default "Stabil"

### LANGKAH 2: PERBAIKAN DATABASE SCHEMA

**🚨 PENTING: Jalankan ini terlebih dahulu untuk mengatasi error `is_active` column**

1. **Login ke Supabase** → **SQL Editor** → **New Query**
2. **Copy dan jalankan** isi file `debug_student_data_fixed.sql` 
3. **Script akan:**
   - ✅ Menambahkan kolom `is_active` yang hilang ke tabel `school_years`
   - ✅ Mengatur satu tahun ajaran sebagai aktif
   - ✅ Menjalankan diagnostic queries untuk identifikasi masalah

#### Hasil yang Diharapkan:
```sql
-- Kolom is_active berhasil ditambahkan
ALTER TABLE
-- Query diagnostic berhasil dijalankan
SELECT 10
```

#### Query Penting:
```sql
-- Cek total siswa di database
SELECT 'Total Students' as info, COUNT(*) as count FROM public.students;

-- Cek siswa aktif
SELECT 'Active Students' as info, COUNT(*) as count FROM public.students WHERE status = 'active';

-- Cek kelas dengan wali kelas dan jumlah siswa
SELECT 
    c.name as class_name,
    p.full_name as teacher_name,
    p.is_homeroom_teacher,
    COUNT(s.id) as student_count
FROM public.classes c
JOIN public.profiles p ON c.teacher_id = p.id
LEFT JOIN public.students s ON s.class_id = c.id AND s.status = 'active'
GROUP BY c.id, c.name, p.full_name, p.is_homeroom_teacher
ORDER BY c.name;
```

### LANGKAH 3: PERBAIKAN RPC FUNCTION

**Setelah schema diperbaiki, jalankan corrective migration:**

1. **Buka Supabase** → **SQL Editor** → **New Query**
2. **Copy seluruh isi** file `fix_student_data_corrective.sql` (yang sudah diperbarui)
3. **Paste dan Run**

**✨ Perbaikan ini akan:**
- ✅ Memastikan kolom `is_active` ada di `school_years`
- ✅ Mengatur tahun ajaran aktif otomatis
- ✅ Memperbaiki RPC functions dengan filtering fleksibel
- ✅ Mengembalikan siswa ke menu Perkembangan Siswa

### LANGKAH 4: VERIFIKASI HASIL

Setelah menerapkan perbaikan:

1. **Refresh browser** atau **clear cache**
2. **Login ulang** jika perlu
3. **Buka menu** "Perkembangan Siswa"
4. **Siswa harus muncul** dengan data dasar

## TROUBLESHOOTING

### Jika Siswa Masih Tidak Muncul:

#### A. Cek Status Wali Kelas
```sql
-- Cek status wali kelas di profile
SELECT 
    id, 
    full_name, 
    is_homeroom_teacher 
FROM profiles 
WHERE id = 'USER_ID_HERE';

-- Update jika perlu
UPDATE profiles 
SET is_homeroom_teacher = true 
WHERE id = 'USER_ID_HERE';
```

#### B. Cek Assignment Kelas
```sql
-- Cek penugasan ke kelas
SELECT 
    c.*, 
    p.full_name 
FROM classes c 
JOIN profiles p ON c.teacher_id = p.id 
WHERE c.teacher_id = 'USER_ID_HERE';
```

#### C. Cek Data Siswa di Kelas
```sql
-- Cek siswa di kelas tertentu
SELECT * FROM students 
WHERE class_id = 'CLASS_ID_HERE' 
AND status = 'active';
```

### Jika Browser Error:

1. **Clear browser cache** completely
2. **Hard refresh** (Ctrl+F5 atau Cmd+Shift+R)
3. **Try incognito/private mode**
4. **Check browser console** untuk error JavaScript

### Jika Database Error:

1. **Check RLS policies** - pastikan policies membolehkan read access
2. **Verify permissions** - pastikan user authenticated 
3. **Check function existence** - pastikan RPC functions ada

## PEMULIHAN FUNCTION RPC (OPSIONAL)

Setelah siswa muncul, untuk mengembalikan perhitungan nilai dan kehadiran:

1. **Pastikan** corrective migration sudah dijalankan
2. **Edit** file `src/lib/data.ts` 
3. **Uncomment** bagian RPC call original
4. **Comment** bagian temporary fix
5. **Test** untuk memastikan data kalkulasi muncul

## CATATAN PENTING

- ✅ **Temporary fix memastikan siswa muncul** tanpa menunggu perbaikan RPC
- ⚠️ **Data nilai dan kehadiran akan 0** sampai RPC function diperbaiki  
- 🔄 **Setelah RPC diperbaiki**, nilai dan kehadiran akan terhitung otomatis
- 📝 **Semua data tetap aman** - tidak ada data yang hilang

## KONTAK BANTUAN

Jika masalah berlanjut:
1. **Screenshot** halaman error
2. **Copy** hasil diagnostic queries
3. **Share** browser console errors (F12 → Console)
4. **Jelaskan** langkah yang sudah dicoba