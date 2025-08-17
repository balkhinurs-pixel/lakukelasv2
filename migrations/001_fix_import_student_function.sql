-- This migration fixes the student import function by correcting a data type error.

-- Drop the old function if it exists, to ensure a clean replacement
DROP FUNCTION IF EXISTS add_student_with_teacher_check(uuid, text, text, text);

-- Recreate the function with the corrected parameter type for gender (text instead of gender)
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text -- Corrected data type from 'gender' to 'text'
)
RETURNS void AS $$
DECLARE
    v_teacher_id uuid;
    v_existing_nis_teacher_id uuid;
BEGIN
    -- 1. Get the teacher_id from the provided p_class_id
    SELECT teacher_id INTO v_teacher_id
    FROM public.classes
    WHERE id = p_class_id;

    -- If the class doesn't exist or doesn't belong to any teacher, raise an exception.
    IF v_teacher_id IS NULL THEN
        RAISE EXCEPTION 'Kelas dengan ID yang diberikan tidak ditemukan.';
    END IF;

    -- 2. Check if the NIS already exists for another class under the same teacher
    SELECT c.teacher_id INTO v_existing_nis_teacher_id
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    LIMIT 1;

    -- If the NIS is found for the same teacher, it's a violation.
    IF v_existing_nis_teacher_id IS NOT NULL THEN
        RAISE EXCEPTION 'NIS sudah terdaftar untuk guru ini di kelas lain.';
    END IF;
    
    -- 3. If all checks pass, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$ LANGUAGE plpgsql;
