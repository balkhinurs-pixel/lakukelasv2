-- DEBUG FRONTEND WALIKELAS ISSUE
-- Script untuk mengidentifikasi mengapa frontend masih kosong meskipun RPC sudah bekerja

-- 1. Cek data yang dikembalikan oleh fungsi yang digunakan frontend
SELECT 'Testing get_student_performance_for_class - Frontend Function' as test_info;

-- Test dengan class_id yang benar (8-B)
SELECT 
    sp.*,
    'Class: 8-B' as class_info
FROM get_student_performance_for_class(
    (SELECT id FROM public.classes WHERE name = '8-B' LIMIT 1)
) sp;

-- 2. Cek semua kelas yang tersedia
SELECT 'Available Classes' as info;
SELECT 
    id,
    name,
    teacher_id
FROM public.classes 
ORDER BY name;

-- 3. Cek apakah ada siswa di kelas 8-B
SELECT 'Students in Class 8-B' as info;
SELECT 
    s.id,
    s.name,
    s.nis,
    c.name as class_name
FROM public.students s
JOIN public.classes c ON s.class_id = c.id
WHERE c.name = '8-B'
ORDER BY s.name;

-- 4. Cek data grades dan attendance untuk kelas 8-B
SELECT 'Grades data for Class 8-B' as info;
SELECT 
    g.id,
    g.date,
    s.name as subject_name,
    jsonb_array_length(g.records) as student_count,
    g.records
FROM public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
WHERE c.name = '8-B'
ORDER BY g.date DESC
LIMIT 5;

SELECT 'Attendance data for Class 8-B' as info;
SELECT 
    a.id,
    a.date,
    s.name as subject_name,
    jsonb_array_length(a.records) as student_count,
    a.records
FROM public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id
WHERE c.name = '8-B'
ORDER BY a.date DESC
LIMIT 5;

-- 5. Test fungsi RPC individual untuk siswa tertentu
SELECT 'Individual Student Test - Grades' as test_info;
SELECT * FROM get_student_grades_ledger('52bf298f-6439-4055-8bb9-0a7db630f557')
LIMIT 10;

SELECT 'Individual Student Test - Attendance' as test_info;
SELECT * FROM get_student_attendance_ledger('52bf298f-6439-4055-8bb9-0a7db630f557')
LIMIT 10;

-- 6. Cek apakah ada masalah dengan tahun ajaran
SELECT 'School Year Check' as info;
SELECT 
    sy.*,
    CASE WHEN sy.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END as status
FROM public.school_years sy
ORDER BY sy.name DESC;

-- 7. Cek apakah teacher_id di session sesuai dengan kelas
SELECT 'Teacher and Class Relationship' as info;
SELECT 
    p.id as teacher_id,
    p.full_name as teacher_name,
    c.id as class_id,
    c.name as class_name
FROM public.profiles p
JOIN public.classes c ON p.id = c.teacher_id
WHERE c.name = '8-B';

-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase
-- 2. Periksa apakah get_student_performance_for_class mengembalikan data
-- 3. Pastikan ada siswa di kelas 8-B
-- 4. Pastikan ada data grades dan attendance untuk kelas tersebut
-- 5. Jika semua data ada tapi frontend kosong, masalahnya di frontend/cache