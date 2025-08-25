-- CORRECTED RPC FUNCTION: Handle student_id as string (not UUID)
-- This fixes the "cannot cast type jsonb to uuid" error

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
        -- Match student_id as string (convert UUID parameter to text)
        r.value->>'student_id' = p_student_id::text
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
        -- Match student_id as string (convert UUID parameter to text)
        r.value->>'student_id' = p_student_id::text
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;

-- Test with the known student ID
DO $$
DECLARE
    test_student_id uuid := '52bf298f-6439-4055-8bb9-0a7db630f557';
    result_count integer := 0;
    test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing corrected RPC function with student ID: %', test_student_id;
    
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
    
    RAISE NOTICE 'Total grade results found: %', result_count;
    
    -- Also test a direct query to verify data exists
    SELECT COUNT(*) INTO result_count
    FROM public.grades g,
    jsonb_array_elements(g.records) r
    WHERE r.value->>'student_id' = test_student_id::text;
    
    RAISE NOTICE 'Raw grade records found for student: %', result_count;
END $$;