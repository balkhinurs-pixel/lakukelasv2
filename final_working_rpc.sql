-- FINAL WORKING SOLUTION: Based on successful bypass test results
-- We know the data exists and can be found, so let's use the working approach

-- Replace the original RPC function with the working version
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Use the same logic as the successful bypass function
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
    JOIN public.students st ON st.id::text = r.value->>'student_id'
    WHERE st.id = p_student_id
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Also fix the attendance function using the same approach
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
    JOIN public.students st ON st.id::text = r.value->>'student_id'
    WHERE st.id = p_student_id
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;

-- Test with the known working student ID
DO $$
DECLARE
    test_student_id uuid := '52bf298f-6439-4055-8bb9-0a7db630f557';
    result_count integer := 0;
    test_result RECORD;
BEGIN
    RAISE NOTICE 'Testing final working RPC function with student ID: %', test_student_id;
    
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
    
    IF result_count > 0 THEN
        RAISE NOTICE '🎉 SUCCESS! Grades found and should now appear in the UI!';
    ELSE
        RAISE NOTICE '❌ Still no results - needs further investigation';
    END IF;
END $$;