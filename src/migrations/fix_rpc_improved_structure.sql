-- IMPROVED RPC FUNCTION: Handle different JSONB structures
-- This version tries multiple ways to access the data

DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Try the standard approach first
    RETURN QUERY
    SELECT 
        g.id,
        s.name as "subjectName",
        g.assessment_type,
        g.date,
        COALESCE(
            (r.value->>'score')::numeric,
            (r.value->'score')::numeric,
            0
        ) as score,
        s.kkm
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id,
    jsonb_array_elements(g.records) r
    WHERE 
        -- Match student_id as string (no UUID casting)
        (
            r.value->>'student_id' = p_student_id::text OR
            r.value @> jsonb_build_object('student_id', p_student_id::text)
        )
    ORDER BY g.date DESC, s.name;
    
    -- If no results found, try alternative structure
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            g.id,
            s.name as "subjectName",
            g.assessment_type,
            g.date,
            COALESCE(
                (g.records->p_student_id::text->>'score')::numeric,
                0
            ) as score,
            s.kkm
        FROM public.grades g
        JOIN public.subjects s ON g.subject_id = s.id
        WHERE g.records ? p_student_id::text
        ORDER BY g.date DESC, s.name;
    END IF;
END;
$$;

-- Also create a debug version that returns raw data
CREATE OR REPLACE FUNCTION public.debug_student_grades(p_student_id uuid)
RETURNS TABLE(
    grade_id uuid, 
    subject_name text, 
    assessment_type text, 
    raw_records jsonb,
    student_found boolean,
    extracted_score text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as grade_id,
        s.name as subject_name,
        g.assessment_type,
        g.records as raw_records,
        (g.records::text LIKE '%' || p_student_id::text || '%') as student_found,
        COALESCE(
            r.value->>'score',
            'not found'
        ) as extracted_score
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id
    LEFT JOIN LATERAL jsonb_array_elements(g.records) r ON r.value->>'student_id' = p_student_id::text
    ORDER BY g.date DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_student_grades(uuid) TO authenticated;

-- Test both functions
DO $$
DECLARE
    test_student_id uuid := '52bf298f-6439-4055-8bb9-0a7db630f557';
    result_count integer := 0;
    debug_result RECORD;
    grade_result RECORD;
BEGIN
    RAISE NOTICE 'Testing improved RPC functions...';
    
    -- Test debug function first
    RAISE NOTICE 'Debug function results:';
    FOR debug_result IN 
        SELECT * FROM debug_student_grades(test_student_id)
    LOOP
        RAISE NOTICE 'Grade ID: %, Subject: %, Student Found: %, Score: %', 
            debug_result.grade_id,
            debug_result.subject_name,
            debug_result.student_found,
            debug_result.extracted_score;
    END LOOP;
    
    -- Test main function
    RAISE NOTICE 'Main function results:';
    FOR grade_result IN 
        SELECT * FROM get_student_grades_ledger(test_student_id)
    LOOP
        result_count := result_count + 1;
        RAISE NOTICE 'Result %: % - % - Score: %', 
            result_count,
            grade_result."subjectName", 
            grade_result.assessment_type, 
            grade_result.score;
    END LOOP;
    
    RAISE NOTICE 'Total results: %', result_count;
END $$;