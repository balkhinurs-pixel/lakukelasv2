-- Fix Student Ledger RPC Functions
-- This migration fixes the RPC functions to correctly query student grades and attendance
-- Supports both student_id and studentId field names for backward compatibility

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);

-- Recreate the grade ledger function with correct JSONB handling
-- This version handles both student_id and studentId field names
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
        COALESCE(
            (r.value->>'score')::numeric,
            (r.value->>'score')::numeric
        ) as score,
        s.kkm
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id,
    jsonb_array_elements(g.records) r
    WHERE 
        (r.value->>'student_id')::uuid = p_student_id OR
        (r.value->>'studentId')::uuid = p_student_id
    ORDER BY g.date DESC, s.name;
END;
$$;

-- Recreate the attendance ledger function with correct JSONB handling
-- This version handles both student_id and studentId field names
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
        (r.value->>'student_id')::uuid = p_student_id OR
        (r.value->>'studentId')::uuid = p_student_id
    ORDER BY a.date DESC, s.name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;