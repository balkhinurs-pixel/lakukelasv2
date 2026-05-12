-- TEMPORARY BYPASS: Show all grades to verify data exists
-- This will help us see if there are any grades at all in the system

-- Create a temporary function that shows ALL grades for debugging
CREATE OR REPLACE FUNCTION public.debug_show_all_grades()
RETURNS TABLE(
    grade_id uuid, 
    subject_name text, 
    assessment_type text, 
    date date,
    student_id_from_record text,
    score_from_record text,
    matching_student_name text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as grade_id,
        s.name as subject_name,
        g.assessment_type,
        g.date,
        r.value->>'student_id' as student_id_from_record,
        r.value->>'score' as score_from_record,
        st.name as matching_student_name
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id,
    jsonb_array_elements(g.records) r
    LEFT JOIN public.students st ON st.id::text = r.value->>'student_id'
    WHERE r.value ? 'student_id' AND r.value ? 'score'
    ORDER BY g.date DESC;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.debug_show_all_grades() TO authenticated;

-- Test it
SELECT 'All Grades in System' as info, * FROM debug_show_all_grades() LIMIT 10;

-- Also create a function to test with the student name instead of ID
CREATE OR REPLACE FUNCTION public.get_grades_by_student_name(p_student_name text)
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
    JOIN public.students st ON st.id::text = r.value->>'student_id'
    WHERE st.name ILIKE '%' || p_student_name || '%'
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION public.get_grades_by_student_name(text) TO authenticated;

-- Test with ABBAD's name
SELECT 'Grades for ABBAD' as info, * FROM get_grades_by_student_name('ABBAD');

-- Test with partial name
SELECT 'Grades for NAILUN' as info, * FROM get_grades_by_student_name('NAILUN');