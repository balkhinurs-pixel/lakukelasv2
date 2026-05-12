-- Quick test of the RPC function to see if it's working
-- Run this to verify the function returns data

-- 1. Get a student ID (using NIS 24027 from our previous tests)
SELECT 
    'Student ID for NIS 24027:' as info,
    id as student_id,
    name as student_name
FROM public.students 
WHERE nis = '24027'
LIMIT 1;

-- 2. Test the RPC function with this student ID
-- You'll need to replace 'STUDENT_ID_HERE' with the actual ID from step 1
-- SELECT * FROM get_student_grades_ledger('STUDENT_ID_HERE');

-- 3. Check if there are any grades records for this student
WITH target_student AS (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'Grades records for student:' as info,
    COUNT(*) as total_grade_records,
    COUNT(DISTINCT g.subject_id) as subjects_with_grades,
    COUNT(DISTINCT g.school_year_id) as school_years_with_grades
FROM public.grades g,
jsonb_array_elements(g.records) r,
target_student ts
WHERE (r.value->>'student_id')::uuid = ts.id;

-- 4. Show sample grade record structure
WITH target_student AS (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'Sample grade record:' as info,
    g.id as grade_id,
    s.name as subject_name,
    g.assessment_type,
    g.date,
    r.value as student_record
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id,
jsonb_array_elements(g.records) r,
target_student ts
WHERE (r.value->>'student_id')::uuid = ts.id
LIMIT 1;

-- 5. Check active school year
SELECT 
    'Active school year:' as info,
    id,
    name,
    is_active
FROM public.school_years 
WHERE is_active = true;