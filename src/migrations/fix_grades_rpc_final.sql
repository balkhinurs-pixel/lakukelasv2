-- FINAL FIX FOR GRADES RPC FUNCTION
-- Based on diagnostic results showing school year filtering issue

-- Drop and recreate the grades ledger function with corrected logic
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
DECLARE
    active_school_year_id uuid;
BEGIN
    -- Get active school year
    active_school_year_id := public.get_active_school_year_id();
    
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
        -- More flexible school year filtering - include NULL or match active year
        AND (
            active_school_year_id IS NULL 
            OR g.school_year_id IS NULL 
            OR g.school_year_id = active_school_year_id
        )
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Also fix the attendance ledger function for consistency
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
DECLARE
    active_school_year_id uuid;
BEGIN
    -- Get active school year
    active_school_year_id := public.get_active_school_year_id();
    
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
        -- More flexible school year filtering - include NULL or match active year
        AND (
            active_school_year_id IS NULL 
            OR a.school_year_id IS NULL 
            OR a.school_year_id = active_school_year_id
        )
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;

-- Test the fixed function with the known student
-- Replace with actual student ID from your results
DO $$
DECLARE
    target_student_id uuid;
    test_result RECORD;
BEGIN
    -- Get the student ID for NIS 24027
    SELECT id INTO target_student_id FROM public.students WHERE nis = '24027';
    
    RAISE NOTICE 'Testing fixed RPC function with student ID: %', target_student_id;
    
    -- Test the function
    FOR test_result IN 
        SELECT * FROM get_student_grades_ledger(target_student_id)
    LOOP
        RAISE NOTICE 'Found grade: % - % - % - %', 
            test_result."subjectName", 
            test_result.assessment_type, 
            test_result.date, 
            test_result.score;
    END LOOP;
END $$;