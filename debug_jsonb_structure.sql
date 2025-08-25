-- TARGETED DIAGNOSTIC TO EXAMINE JSONB STRUCTURE

-- 1. Get the exact JSONB structure from the grades we found
SELECT 
    'JSONB Structure Analysis' as info,
    g.id,
    g.assessment_type,
    g.records,
    jsonb_typeof(g.records) as records_type,
    jsonb_array_length(g.records) as array_length
FROM public.grades g
WHERE g.id = '6e0e5a07-3622-4542-8935-7dda05971ab3'
   OR g.id = 'ad1fd2dc-8612-45fa-b896-516e6a7ee3ad';

-- 2. Extract individual JSONB elements to see the structure
SELECT 
    'Individual JSONB Elements' as info,
    g.id,
    g.assessment_type,
    r.value as full_record,
    jsonb_typeof(r.value) as record_type,
    r.value ? 'student_id' as has_student_id_key,
    r.value ? 'studentId' as has_studentId_key,
    r.value ? 'score' as has_score_key,
    r.value->>'student_id' as student_id_variant1,
    r.value->>'studentId' as student_id_variant2
FROM public.grades g,
jsonb_array_elements(g.records) r
WHERE g.id = '6e0e5a07-3622-4542-8935-7dda05971ab3'
   OR g.id = 'ad1fd2dc-8612-45fa-b896-516e6a7ee3ad';

-- 3. Get the student ID for NIS 24027 to test with
SELECT 
    'Student ID for NIS 24027' as info,
    id,
    name,
    nis
FROM public.students 
WHERE nis = '24027';

-- 4. Test different JSONB key patterns that might be used
WITH test_student AS (
    SELECT id as student_id FROM public.students WHERE nis = '24027' LIMIT 1
)
SELECT 
    'JSONB Key Pattern Test' as info,
    g.id,
    g.assessment_type,
    -- Test different possible key names
    COUNT(CASE WHEN r.value->>'student_id' = ts.student_id::text THEN 1 END) as matches_student_id,
    COUNT(CASE WHEN r.value->>'studentId' = ts.student_id::text THEN 1 END) as matches_studentId,
    COUNT(CASE WHEN (r.value->>'student_id')::uuid = ts.student_id THEN 1 END) as matches_student_id_uuid,
    COUNT(CASE WHEN (r.value->>'studentId')::uuid = ts.student_id THEN 1 END) as matches_studentId_uuid
FROM public.grades g,
jsonb_array_elements(g.records) r,
test_student ts
WHERE g.id = '6e0e5a07-3622-4542-8935-7dda05971ab3'
   OR g.id = 'ad1fd2dc-8612-45fa-b896-516e6a7ee3ad'
GROUP BY g.id, g.assessment_type, ts.student_id;

-- 5. Show all available keys in the JSONB records
SELECT 
    'Available JSONB Keys' as info,
    g.id,
    g.assessment_type,
    jsonb_object_keys(r.value) as available_keys
FROM public.grades g,
jsonb_array_elements(g.records) r
WHERE g.id = '6e0e5a07-3622-4542-8935-7dda05971ab3'
   OR g.id = 'ad1fd2dc-8612-45fa-b896-516e6a7ee3ad';