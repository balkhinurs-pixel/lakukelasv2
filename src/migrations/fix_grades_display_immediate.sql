-- IMMEDIATE FIX: Remove school year filtering to get grades displaying
-- This fixes the "No grades in response" issue by removing restrictive filtering

-- Replace the problematic RPC function with a simpler version
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        s.name as "subjectName",
        g.assessment_type,
        g.date,
        (r.value->>'score')::numeric as score,
        s.kkm
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id,
    jsonb_array_elements(g.records) r
    WHERE 
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Also fix the attendance function
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        s.name as "subjectName",
        a.date,
        a.meeting_number,
        r.value->>'status' as status
    FROM public.attendance a
    JOIN public.subjects s ON a.subject_id = s.id,
    jsonb_array_elements(a.records) r
    WHERE 
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;

-- Test with the known student ID from the debug output
SELECT 'Testing with student ID from debug output' as info;

DO $$
DECLARE
    test_student_id uuid := '52bf298f-6439-4055-8bb9-0a7db630f557';
    result_count integer := 0;
    test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing RPC function with student ID: %', test_student_id;
    
    -- Test the grades function
    FOR test_result IN 
        SELECT * FROM get_student_grades_ledger(test_student_id)
    LOOP
        result_count := result_count + 1;
        RAISE NOTICE 'Grade result %: % - % - Score: %', 
            result_count,
            test_result."subjectName", 
            test_result.assessment_type, 
            test_result.score;
    END LOOP;
    
    RAISE NOTICE 'Total grade results: %', result_count;
    
    -- Also check if there are any grades records at all for this student
    SELECT COUNT(*) INTO result_count
    FROM public.grades g,
    jsonb_array_elements(g.records) r
    WHERE (r.value->>'student_id')::uuid = test_student_id;
    
    RAISE NOTICE 'Raw grade records found: %', result_count;
END $$;