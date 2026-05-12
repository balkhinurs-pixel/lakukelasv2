-- DIAGNOSTIC SCRIPT TO CHECK GRADES DATA AND JSONB STRUCTURE

-- 1. Check if there are any grades records in the database
SELECT 
    'Total Grades Records' as info,
    COUNT(*) as count
FROM public.grades;

-- 2. Check grades records for the specific student shown in your screenshot
-- Replace 'STUDENT_NIS_HERE' with the actual NIS from your screenshot (24027)
SELECT 
    'Grades for Student NIS 24027' as info,
    g.id,
    g.date,
    g.assessment_type,
    s.name as subject_name,
    g.records
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id
WHERE g.records::text LIKE '%24027%'
ORDER BY g.date DESC;

-- 3. Check sample JSONB structure from grades table
SELECT 
    'Sample Grades JSONB Structure' as info,
    g.id,
    g.assessment_type,
    g.records,
    jsonb_array_length(g.records) as record_count
FROM public.grades g
LIMIT 3;

-- 4. Try to extract student IDs from JSONB records
SELECT 
    'JSONB Student ID Extraction Test' as info,
    g.id,
    g.assessment_type,
    r.value->>'student_id' as extracted_student_id,
    r.value->>'score' as extracted_score
FROM public.grades g,
jsonb_array_elements(g.records) r
LIMIT 5;

-- 5. Check if there are students with the NIS from your screenshot
SELECT 
    'Student with NIS 24027' as info,
    s.id,
    s.name,
    s.nis,
    s.class_id,
    c.name as class_name
FROM public.students s
LEFT JOIN public.classes c ON s.class_id = c.id
WHERE s.nis = '24027';

-- 6. Test the get_student_grades_ledger function directly
-- Replace 'STUDENT_ID_HERE' with the actual student ID from query #5
-- SELECT 'RPC Function Test' as info, * FROM get_student_grades_ledger('STUDENT_ID_FROM_QUERY_5');

-- 7. Check which classes have grades data
SELECT 
    'Classes with Grades Data' as info,
    c.name as class_name,
    COUNT(g.id) as grades_count,
    string_agg(DISTINCT s.name, ', ') as subjects
FROM public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
GROUP BY c.id, c.name
ORDER BY grades_count DESC;

-- 8. Check school year associations in grades
SELECT 
    'School Year Association in Grades' as info,
    g.school_year_id,
    sy.name as school_year_name,
    sy.is_active,
    COUNT(g.id) as grades_count
FROM public.grades g
LEFT JOIN public.school_years sy ON g.school_year_id = sy.id
GROUP BY g.school_year_id, sy.name, sy.is_active
ORDER BY grades_count DESC;

-- 9. Check if the RPC function helper is working
SELECT 'Active School Year ID from Function' as info, get_active_school_year_id() as active_year_id;

-- 10. Manual test of the grades query logic
SELECT 
    'Manual Grades Query Test' as info,
    g.id,
    s.name as "subjectName",
    g.assessment_type,
    g.date,
    (r.value->>'score')::numeric as score,
    s.kkm
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id,
jsonb_array_elements(g.records) r
WHERE (r.value->>'student_id')::uuid = (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
ORDER BY g.date DESC, s.name;