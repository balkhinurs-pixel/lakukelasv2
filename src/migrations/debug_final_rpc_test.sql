-- FINAL DIAGNOSTIC TO TEST RPC FUNCTION WITH ACTUAL STUDENT DATA

-- 1. Get the student ID for NIS 24027
SELECT 
    'Student Info for NIS 24027' as info,
    id,
    name,
    nis,
    class_id
FROM public.students 
WHERE nis = '24027';

-- 2. Check if this student ID exists in any grades records
WITH target_student AS (
    SELECT id as student_id FROM public.students WHERE nis = '24027'
)
SELECT 
    'Student ID in Grades Records' as info,
    g.id,
    g.assessment_type,
    g.date,
    s.name as subject_name,
    COUNT(r.*) as matching_records
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id,
jsonb_array_elements(g.records) r,
target_student ts
WHERE (r.value->>'student_id')::uuid = ts.student_id
GROUP BY g.id, g.assessment_type, g.date, s.name
ORDER BY g.date DESC;

-- 3. Test the RPC function directly with the actual student ID
-- Get student ID first and then test
DO $$
DECLARE
    target_student_id uuid;
BEGIN
    SELECT id INTO target_student_id FROM public.students WHERE nis = '24027';
    
    RAISE NOTICE 'Testing RPC function with student ID: %', target_student_id;
    
    -- This will show in the messages, but we'll also create a temp table to see results
    DROP TABLE IF EXISTS temp_rpc_test;
    CREATE TEMP TABLE temp_rpc_test AS
    SELECT * FROM get_student_grades_ledger(target_student_id);
END $$;

-- 4. Show RPC function results
SELECT 'RPC Function Results' as info, * FROM temp_rpc_test;

-- 5. Manual query to replicate what RPC should return
WITH target_student AS (
    SELECT id as student_id FROM public.students WHERE nis = '24027'
),
active_year AS (
    SELECT get_active_school_year_id() as year_id
)
SELECT 
    'Manual Query Results' as info,
    g.id,
    s.name as "subjectName",
    g.assessment_type,
    g.date,
    (r.value->>'score')::numeric as score,
    s.kkm
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id,
jsonb_array_elements(g.records) r,
target_student ts,
active_year ay
WHERE 
    (r.value->>'student_id')::uuid = ts.student_id
    AND (ay.year_id IS NULL OR g.school_year_id IS NULL OR g.school_year_id = ay.year_id)
ORDER BY g.date DESC, s.name;

-- 6. Check school year filtering impact
WITH target_student AS (
    SELECT id as student_id FROM public.students WHERE nis = '24027'
)
SELECT 
    'School Year Impact Analysis' as info,
    g.school_year_id,
    sy.name as school_year_name,
    sy.is_active,
    COUNT(r.*) as record_count
FROM public.grades g
LEFT JOIN public.school_years sy ON g.school_year_id = sy.id,
jsonb_array_elements(g.records) r,
target_student ts
WHERE (r.value->>'student_id')::uuid = ts.student_id
GROUP BY g.school_year_id, sy.name, sy.is_active
ORDER BY record_count DESC;