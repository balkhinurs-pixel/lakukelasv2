-- SCRIPT PERBAIKAN STRUKTUR JSONB RECORDS
-- Masalah: Data attendance dan grades tidak menyertakan student_id dalam records JSONB
-- Solusi: Update struktur records untuk menyertakan student_id

-- 1. Cek struktur data attendance yang ada
SELECT 
    'Current Attendance Structure' as info,
    a.id,
    a.date,
    c.name as class_name,
    s.name as subject_name,
    a.records
FROM public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id
LIMIT 3;

-- 2. Cek struktur data grades yang ada
SELECT 
    'Current Grades Structure' as info,
    g.id,
    g.date,
    c.name as class_name,
    s.name as subject_name,
    g.records
FROM public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
LIMIT 3;

-- 3. Cek siswa di setiap kelas untuk referensi
SELECT 
    c.id as class_id,
    c.name as class_name,
    COUNT(st.id) as student_count,
    array_agg(st.id) as student_ids,
    array_agg(st.name) as student_names
FROM public.classes c
LEFT JOIN public.students st ON c.id = st.class_id
WHERE st.status = 'active'
GROUP BY c.id, c.name
ORDER BY c.name;

-- 4. PERBAIKAN: Update attendance records untuk menyertakan student_id
-- HATI-HATI: Backup data sebelum menjalankan update ini!

-- Update attendance records untuk menyertakan student_id
-- BACKUP DATA TERLEBIH DAHULU!
UPDATE public.attendance 
SET records = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'student_id', st.id,
            'student_name', st.name,
            'status', 'Hadir'
        )
    )
    FROM public.students st
    WHERE st.class_id = attendance.class_id
    AND st.status = 'active'
)
WHERE jsonb_array_length(records) > 0;

-- 5. PERBAIKAN: Update grades records untuk menyertakan student_id
-- Update grades records untuk menyertakan student_id
-- BACKUP DATA TERLEBIH DAHULU!
UPDATE public.grades 
SET records = (
    SELECT jsonb_agg(
        jsonb_build_object(
            'student_id', st.id,
            'student_name', st.name,
            'score', 75
        )
    )
    FROM public.students st
    WHERE st.class_id = grades.class_id
    AND st.status = 'active'
)
WHERE jsonb_array_length(records) > 0;

-- 6. Verifikasi hasil setelah update
-- Verifikasi hasil setelah update
SELECT 
    'Updated Attendance Structure' as info,
    a.records
FROM public.attendance a
LIMIT 3;

SELECT 
    'Updated Grades Structure' as info,
    g.records
FROM public.grades g
LIMIT 3;

-- INSTRUKSI:
-- 1. Jalankan query 1-3 untuk melihat struktur data saat ini
-- 2. Backup data attendance dan grades sebelum melakukan update
-- 3. Uncomment dan jalankan query update (4-5) satu per satu
-- 4. Jalankan query verifikasi (6) untuk memastikan struktur sudah benar
-- 5. Test fungsi RPC setelah perbaikan struktur

-- CATATAN PENTING:
-- Script ini akan mengubah struktur data yang ada
-- Pastikan untuk backup data sebelum menjalankan update
-- Sesuaikan nilai default (status, score) dengan kebutuhan aplikasi