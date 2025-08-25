-- DIAGNOSTIC: Check actual JSONB structure in grades table
-- This will help us understand why the RPC function isn't finding the data

-- Get the student ID we're working with
WITH target_student AS (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'Student Info' as check_type,
    s.id as student_id,
    s.name as student_name,
    s.nis
FROM public.students s, target_student t
WHERE s.id = t.id;

-- Check all grades records and their JSONB structure
SELECT 
    'All Grades Records' as check_type,
    g.id as grade_id,
    g.assessment_type,
    g.date,
    sub.name as subject_name,
    g.records as raw_jsonb_records
FROM public.grades g
JOIN public.subjects sub ON g.subject_id = sub.id
ORDER BY g.date DESC
LIMIT 5;

-- Check if there are any records that contain our student ID
WITH target_student AS (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'Records Containing Student' as check_type,
    g.id as grade_id,
    g.assessment_type,
    g.date,
    sub.name as subject_name,
    g.records as raw_jsonb,
    -- Try different ways to access the student_id
    jsonb_array_length(g.records) as record_count,
    g.records->0 as first_record,
    g.records->0->>'student_id' as first_student_id_attempt1,
    (g.records->0->'student_id')::text as first_student_id_attempt2
FROM public.grades g
JOIN public.subjects sub ON g.subject_id = sub.id,
target_student t
WHERE g.records::text LIKE '%' || t.id::text || '%'
ORDER BY g.date DESC;

-- Test different JSONB access patterns
WITH target_student AS (
    SELECT id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'JSONB Access Test' as check_type,
    g.id as grade_id,
    sub.name as subject_name,
    -- Test jsonb_array_elements approach
    r.value as record_element,
    r.value->>'student_id' as extracted_student_id,
    (r.value->>'student_id')::uuid as casted_student_id,
    r.value->>'score' as extracted_score,
    CASE 
        WHEN (r.value->>'student_id')::uuid = t.id THEN 'MATCH FOUND!'
        ELSE 'No match'
    END as match_status
FROM public.grades g
JOIN public.subjects sub ON g.subject_id = sub.id,
jsonb_array_elements(g.records) r,
target_student t
LIMIT 10;

-- Show sample record structure for debugging
SELECT 
    'Sample Record Structure' as check_type,
    g.records as full_records_array,
    jsonb_array_length(g.records) as total_records,
    g.records->0 as first_record_structure,
    jsonb_object_keys(g.records->0) as available_keys
FROM public.grades g 
WHERE jsonb_array_length(g.records) > 0
LIMIT 1;