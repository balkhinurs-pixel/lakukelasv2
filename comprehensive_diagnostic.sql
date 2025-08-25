-- COMPREHENSIVE DIAGNOSTIC: Find exactly why grades aren't appearing
-- This will identify the exact issue with student ID matching

-- 1. First, let's see what student IDs actually exist in grades records
SELECT 
    'Student IDs in Grades Records' as info,
    r.value->>'student_id' as student_id_in_grades,
    COUNT(*) as record_count
FROM public.grades g,
jsonb_array_elements(g.records) r
WHERE r.value ? 'student_id'
GROUP BY r.value->>'student_id'
ORDER BY record_count DESC
LIMIT 10;

-- 2. Check our specific student (ABBAD AZZAM NAILUN NABHAN with NIS 24027)
SELECT 
    'Our Target Student' as info,
    id as actual_student_id,
    name,
    nis
FROM public.students 
WHERE nis = '24027' OR name ILIKE '%ABBAD%';

-- 3. Let's see if there are any grades records that contain ABBAD or 24027
SELECT 
    'Grades containing ABBAD or 24027' as info,
    g.id as grade_id,
    g.assessment_type,
    g.date,
    s.name as subject,
    g.records
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id
WHERE g.records::text ILIKE '%ABBAD%' 
   OR g.records::text ILIKE '%24027%'
   OR g.records::text ILIKE '%52bf298f-6439-4055-8bb9-0a7db630f557%';

-- 4. Check all grades records with their student info to see the pattern
SELECT 
    'All Grade Records with Student Names' as info,
    g.id as grade_id,
    g.assessment_type,
    g.date,
    s.name as subject,
    r.value->>'student_id' as stored_student_id,
    r.value->>'score' as score,
    st.name as student_name,
    st.nis as student_nis
FROM public.grades g
JOIN public.subjects s ON g.subject_id = s.id,
jsonb_array_elements(g.records) r
LEFT JOIN public.students st ON st.id::text = r.value->>'student_id'
WHERE r.value ? 'student_id' AND r.value ? 'score'
ORDER BY g.date DESC
LIMIT 10;

-- 5. Test our RPC function with different student IDs that we know exist
DO $$
DECLARE
    existing_student_id text;
    test_result RECORD;
    result_count integer := 0;
BEGIN
    -- Get a student ID that actually exists in grades
    SELECT DISTINCT r.value->>'student_id' INTO existing_student_id
    FROM public.grades g,
    jsonb_array_elements(g.records) r
    WHERE r.value ? 'student_id'
    LIMIT 1;
    
    IF existing_student_id IS NOT NULL THEN
        RAISE NOTICE 'Testing RPC with existing student ID: %', existing_student_id;
        
        FOR test_result IN 
            SELECT * FROM get_student_grades_ledger(existing_student_id::uuid)
        LOOP
            result_count := result_count + 1;
            RAISE NOTICE 'Result %: % - Score: %', 
                result_count,
                test_result."subjectName", 
                test_result.score;
        END LOOP;
        
        RAISE NOTICE 'Results found for existing student: %', result_count;
    ELSE
        RAISE NOTICE 'No student IDs found in grades records!';
    END IF;
END $$;

-- 6. Final check: What's the actual structure of the first few grades records?
SELECT 
    'Sample Grades Structure' as info,
    g.assessment_type,
    g.date,
    g.records,
    jsonb_array_length(g.records) as record_count,
    jsonb_typeof(g.records->0) as first_record_type,
    g.records->0 as first_record
FROM public.grades g
ORDER BY g.date DESC
LIMIT 3;