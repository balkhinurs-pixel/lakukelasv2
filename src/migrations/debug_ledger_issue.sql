-- DIAGNOSTIC SCRIPT UNTUK MASALAH LEGER SISWA
-- Jalankan script ini di Supabase SQL Editor untuk mengidentifikasi masalah

-- 1. Cek apakah kolom is_active sudah ada di school_years
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'school_years' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Cek data school_years dan status aktif
SELECT 
    id,
    name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'school_years' AND column_name = 'is_active')
        THEN is_active::text
        ELSE 'KOLOM TIDAK ADA'
    END as is_active_status
FROM public.school_years
ORDER BY name DESC;

-- 3. Cek apakah ada data grades dengan student_id yang valid
SELECT 
    'Total Grades Records' as info,
    COUNT(*) as count
FROM public.grades;

-- 4. Cek struktur data grades dan records
SELECT 
    g.id,
    g.date,
    g.school_year_id,
    s.name as subject_name,
    c.name as class_name,
    jsonb_array_length(g.records) as records_count,
    g.records
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id
JOIN public.classes c ON g.class_id = c.id
LIMIT 3;

-- 5. Cek apakah ada data attendance dengan student_id yang valid
SELECT 
    'Total Attendance Records' as info,
    COUNT(*) as count
FROM public.attendance;

-- 6. Cek struktur data attendance dan records
SELECT 
    a.id,
    a.date,
    a.school_year_id,
    s.name as subject_name,
    c.name as class_name,
    jsonb_array_length(a.records) as records_count,
    a.records
FROM public.attendance a
JOIN public.subjects s ON a.subject_id = s.id
JOIN public.classes c ON a.class_id = c.id
LIMIT 3;

-- 7. Cek apakah fungsi RPC sudah ada dan bisa dijalankan
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'get_student_grades_ledger',
    'get_student_attendance_ledger',
    'get_active_school_year_id',
    'get_student_performance_for_class'
)
ORDER BY routine_name;

-- 8. Test fungsi get_active_school_year_id
SELECT 
    'Active School Year ID' as info,
    public.get_active_school_year_id() as active_year_id;

-- 9. Cek siswa aktif dan class_id mereka
SELECT 
    s.id,
    s.name,
    s.nis,
    s.class_id,
    c.name as class_name,
    c.teacher_id
FROM public.students s
JOIN public.classes c ON s.class_id = c.id
WHERE s.status = 'active'
LIMIT 5;

-- 10. Test fungsi RPC dengan student_id yang valid (ganti dengan ID siswa yang sebenarnya)
-- GANTI 'STUDENT_ID_DISINI' dengan ID siswa yang valid dari query #9
/*
SELECT 'Testing get_student_grades_ledger' as test_name;
SELECT * FROM public.get_student_grades_ledger('STUDENT_ID_DISINI');

SELECT 'Testing get_student_attendance_ledger' as test_name;
SELECT * FROM public.get_student_attendance_ledger('STUDENT_ID_DISINI');
*/

-- 11. Cek apakah ada data grades yang match dengan student_id tertentu
SELECT 
    'Grades with Student Records' as info,
    COUNT(*) as count
FROM public.grades g,
jsonb_array_elements(g.records) r
WHERE r.value ? 'student_id';

-- 12. Cek apakah ada data attendance yang match dengan student_id tertentu
SELECT 
    'Attendance with Student Records' as info,
    COUNT(*) as count
FROM public.attendance a,
jsonb_array_elements(a.records) r
WHERE r.value ? 'student_id';

-- 13. Sample data dari grades records untuk melihat struktur
SELECT 
    'Sample Grade Record Structure' as info,
    r.value
FROM public.grades g,
jsonb_array_elements(g.records) r
LIMIT 3;

-- 14. Sample data dari attendance records untuk melihat struktur
SELECT 
    'Sample Attendance Record Structure' as info,
    r.value
FROM public.attendance a,
jsonb_array_elements(a.records) r
LIMIT 3;

-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Lihat hasil setiap query untuk mengidentifikasi masalah
-- 3. Jika query #9 menunjukkan siswa yang valid, copy ID siswa tersebut
-- 4. Uncomment dan edit query #10, ganti 'STUDENT_ID_DISINI' dengan ID siswa yang valid
-- 5. Jalankan ulang untuk test fungsi RPC
-- 6. Share hasil output untuk analisis lebih lanjut