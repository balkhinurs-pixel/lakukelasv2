-- TEMPORARY TEST: Create a simplified RPC function without school year filtering
-- This will help us determine if the school year filtering is causing the issue

-- Create a test function that returns ALL grades for a student regardless of school year
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger_test(p_student_id uuid)
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger_test(uuid) TO authenticated;

-- Test the function immediately
DO $$
DECLARE
    target_student_id uuid;
    test_result RECORD;
    result_count integer := 0;
BEGIN
    -- Get the student ID for NIS 24027
    SELECT id INTO target_student_id FROM public.students WHERE nis = '24027';
    
    IF target_student_id IS NULL THEN
        RAISE NOTICE 'Student with NIS 24027 not found';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing simplified RPC function with student ID: %', target_student_id;
    
    -- Test the function
    FOR test_result IN 
        SELECT * FROM get_student_grades_ledger_test(target_student_id)
    LOOP
        result_count := result_count + 1;
        RAISE NOTICE 'Result %: % - % - % - %', 
            result_count,
            test_result."subjectName", 
            test_result.assessment_type, 
            test_result.date, 
            test_result.score;
    END LOOP;
    
    RAISE NOTICE 'Total results found: %', result_count;
END $$;