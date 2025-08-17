-- Migration to fix the parameter order in the add_student_with_teacher_check function.
-- This allows importing students with the format: nis, name, gender.
-- Run this script only if you have an existing database. For new setups, schema.sql is sufficient.

CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(p_class_id uuid, p_nis text, p_name text, p_gender text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id associated with the provided p_class_id
    SELECT teacher_id INTO v_teacher_id
    FROM public.classes
    WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    IF EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    ) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender::gender, 'active');
END;
$function$;
