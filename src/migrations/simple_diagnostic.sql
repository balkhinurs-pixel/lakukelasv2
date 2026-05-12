-- SIMPLE DIAGNOSTIC: Basic checks to find the issue
-- This version uses simpler SQL to avoid syntax errors

-- 1. Check if our target student exists
SELECT 
    'Target Student Check' as check_type,
    id,
    name,
    nis
FROM public.students 
WHERE nis = '24027' 
   OR name ILIKE '%ABBAD%';

-- 2. Check if there are ANY grades records at all
SELECT 
    'Total Grades Records' as check_type,
    COUNT(*) as total_records
FROM public.grades;

-- 3. Check the structure of the first grades record
SELECT 
    'First Grades Record' as check_type,
    id,
    assessment_type,
    date,
    records
FROM public.grades 
ORDER BY date DESC 
LIMIT 1;

-- 4. Check what student IDs are in grades (simple version)
WITH grade_students AS (
    SELECT 
        r.value->>'student_id' as student_id_found
    FROM public.grades g,
    jsonb_array_elements(g.records) r
    WHERE r.value ? 'student_id'
    LIMIT 20
)
SELECT 
    'Student IDs Found in Grades' as check_type,
    student_id_found,
    COUNT(*) as count
FROM grade_students
GROUP BY student_id_found
ORDER BY count DESC;

-- 5. Try to find our specific student in grades
SELECT 
    'Our Student in Grades' as check_type,
    g.id as grade_id,
    g.assessment_type,
    g.date,
    r.value as full_record
FROM public.grades g,
jsonb_array_elements(g.records) r
WHERE r.value->>'student_id' = '52bf298f-6439-4055-8bb9-0a7db630f557'
   OR g.records::text LIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%'
   OR g.records::text LIKE '%ABBAD%';

-- 6. Test if we can match any student with grades
SELECT 
    'Student Match Test' as check_type,
    s.name as student_name,
    s.nis,
    s.id as student_id,
    COUNT(r.*) as grade_records_found
FROM public.students s
LEFT JOIN public.grades g ON TRUE,
jsonb_array_elements(g.records) r
WHERE r.value->>'student_id' = s.id::text
GROUP BY s.id, s.name, s.nis
HAVING COUNT(r.*) > 0
ORDER BY grade_records_found DESC
LIMIT 5;