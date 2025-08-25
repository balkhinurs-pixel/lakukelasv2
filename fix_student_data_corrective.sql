-- Corrective Migration to Fix Overly Restrictive School Year Filtering
-- This fixes the issue where students disappeared after applying the previous migration

-- STEP 1: Fix the missing is_active column in school_years table
ALTER TABLE public.school_years ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;

-- Set the first school year as active if none exists
UPDATE public.school_years SET is_active = TRUE 
WHERE id = (SELECT id FROM public.school_years ORDER BY created_at ASC LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM public.school_years WHERE is_active = TRUE);

-- STEP 2: Drop existing functions to recreate them
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);

-- Update the helper function to be more flexible
CREATE OR REPLACE FUNCTION public.get_active_school_year_id()
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    active_year_id uuid;
BEGIN
    SELECT id INTO active_year_id
    FROM public.school_years
    WHERE is_active = true
    LIMIT 1;
    
    RETURN active_year_id;
END;
$$;

-- Recreate the grade ledger function with OPTIONAL school year filtering
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
        -- Only filter by school year if one is active AND the grade has a school year
        AND (active_school_year_id IS NULL OR g.school_year_id IS NULL OR g.school_year_id = active_school_year_id)
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Recreate the attendance ledger function with OPTIONAL school year filtering
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
        -- Only filter by school year if one is active AND the attendance has a school year
        AND (active_school_year_id IS NULL OR a.school_year_id IS NULL OR a.school_year_id = active_school_year_id)
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Recreate the student performance function with OPTIONAL school year filtering
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
DECLARE
    active_school_year_id uuid;
BEGIN
    -- Get active school year
    active_school_year_id := public.get_active_school_year_id();
    
    RETURN QUERY
    WITH student_grades AS (
        SELECT 
            (r.value->>'student_id')::uuid AS student_id,
            AVG((r.value->>'score')::numeric) as avg_grade
        FROM public.grades g,
        jsonb_array_elements(g.records) r
        WHERE g.class_id = p_class_id
        -- Only filter by school year if one is active AND the grade has a school year
        AND (active_school_year_id IS NULL OR g.school_year_id IS NULL OR g.school_year_id = active_school_year_id)
        GROUP BY (r.value->>'student_id')::uuid
    ),
    student_attendance AS (
        SELECT
            (r.value->>'student_id')::uuid AS student_id,
            COUNT(*) as total_records,
            SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as hadir_count
        FROM public.attendance a,
        jsonb_array_elements(a.records) r
        WHERE a.class_id = p_class_id
        -- Only filter by school year if one is active AND the attendance has a school year
        AND (active_school_year_id IS NULL OR a.school_year_id IS NULL OR a.school_year_id = active_school_year_id)
        GROUP BY (r.value->>'student_id')::uuid
    )
    SELECT
        s.id,
        s.name,
        s.nis,
        COALESCE(ROUND(sg.avg_grade, 1), 0) as average_grade,
        CASE 
            WHEN sa.total_records > 0 THEN ROUND((sa.hadir_count::numeric / sa.total_records) * 100, 0)
            ELSE 0 
        END as attendance_percentage
    FROM public.students s
    LEFT JOIN student_grades sg ON s.id = sg.student_id
    LEFT JOIN student_attendance sa ON s.id = sa.student_id
    WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_active_school_year_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_performance_for_class(uuid) TO authenticated;

-- Test that the functions work
-- You can run these to verify:
-- SELECT * FROM get_student_performance_for_class('YOUR_CLASS_ID_HERE');
-- SELECT * FROM get_student_grades_ledger('YOUR_STUDENT_ID_HERE');
-- SELECT * FROM get_student_attendance_ledger('YOUR_STUDENT_ID_HERE');