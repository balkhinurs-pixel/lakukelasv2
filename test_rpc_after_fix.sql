-- TEST RPC FUNCTIONS SETELAH PERBAIKAN STRUKTUR JSONB
-- Script ini untuk memverifikasi bahwa fungsi RPC sudah bekerja dengan benar

-- 1. Test fungsi get_student_grades_ledger
-- Ganti 'student_id_here' dengan ID siswa yang valid dari hasil diagnostic sebelumnya
SELECT 'Testing get_student_grades_ledger' as test_name;
SELECT * FROM get_student_grades_ledger('52bf298f-6439-4055-8bb9-0a7db630f557');

-- 2. Test fungsi get_student_attendance_ledger  
-- Ganti 'student_id_here' dengan ID siswa yang valid dari hasil diagnostic sebelumnya
SELECT 'Testing get_student_attendance_ledger' as test_name;
SELECT * FROM get_student_attendance_ledger('52bf298f-6439-4055-8bb9-0a7db630f557');

-- 3. Cek apakah ada data grades dan attendance untuk siswa tersebut
SELECT 'Checking grades data for student' as info;
SELECT 
    g.id,
    g.date,
    c.name as class_name,
    s.name as subject_name,
    g.records
FROM public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
WHERE g.records::text LIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%'
LIMIT 5;

SELECT 'Checking attendance data for student' as info;
SELECT 
    a.id,
    a.date,
    c.name as class_name,
    s.name as subject_name,
    a.records
FROM public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id
WHERE a.records::text LIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%'
LIMIT 5;

-- INSTRUKSI:
-- 1. Jalankan script fix_jsonb_structure.sql terlebih dahulu
-- 2. Jalankan script ini untuk memverifikasi fungsi RPC
-- 3. Jika masih tidak ada hasil, cek apakah ada data grades/attendance untuk siswa tersebut
-- 4. Jika sudah ada hasil, test di frontend dengan refresh halaman walikelas