-- VERIFIKASI PERBAIKAN RPC SETELAH UPDATE JSONB
-- Script untuk memastikan fungsi RPC sudah bekerja dengan benar

-- 1. Cek apakah struktur JSONB sudah diperbaiki
SELECT 'Checking Updated Attendance Structure' as info;
SELECT 
    a.id,
    a.date,
    c.name as class_name,
    s.name as subject_name,
    a.records
FROM public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id
LIMIT 3;

SELECT 'Checking Updated Grades Structure' as info;
SELECT 
    g.id,
    g.date,
    c.name as class_name,
    s.name as subject_name,
    g.records
FROM public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
LIMIT 3;

-- 2. Test fungsi RPC dengan student_id yang valid
SELECT 'Testing get_student_grades_ledger' as test_name;
SELECT * FROM get_student_grades_ledger('52bf298f-6439-4055-8bb9-0a7db630f557');

SELECT 'Testing get_student_attendance_ledger' as test_name;
SELECT * FROM get_student_attendance_ledger('52bf298f-6439-4055-8bb9-0a7db630f557');

-- 3. Cek apakah ada data untuk siswa tersebut setelah update
SELECT 'Checking if student data exists in grades' as info;
SELECT COUNT(*) as grades_count
FROM public.grades g
WHERE g.records::text LIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%';

SELECT 'Checking if student data exists in attendance' as info;
SELECT COUNT(*) as attendance_count
FROM public.attendance a
WHERE a.records::text LIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%';

-- 4. Cek fungsi get_student_performance_for_class yang digunakan frontend
-- Pertama ambil class_id untuk kelas 8-B
SELECT 'Getting class_id for 8-B' as info;
SELECT id as class_id, name as class_name FROM public.classes WHERE name = '8-B';

-- Test fungsi dengan class_id yang benar
SELECT 'Testing get_student_performance_for_class with class_id' as test_name;
SELECT * FROM get_student_performance_for_class(
    (SELECT id FROM public.classes WHERE name = '8-B' LIMIT 1)
);

-- 5. Cek apakah ada tahun ajaran aktif
SELECT 'Checking active school year' as info;
SELECT * FROM get_active_school_year_id();

-- INSTRUKSI:
-- Jalankan script ini di Supabase SQL Editor
-- Jika fungsi RPC masih tidak mengembalikan data, kemungkinan ada masalah lain
-- Periksa hasil setiap query untuk mengidentifikasi masalah spesifik