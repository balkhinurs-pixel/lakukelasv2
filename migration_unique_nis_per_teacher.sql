-- Step 1: Drop the existing (incorrect) function if it exists.
-- The `IF EXISTS` clause prevents an error if the function wasn't created before.
DROP FUNCTION IF EXISTS public.check_unique_nis_for_teacher();


-- Step 2: Create a new function to handle the unique NIS check per teacher.
-- This function will be triggered before inserting or updating a student.
CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
)
RETURNS void AS $$
DECLARE
    v_teacher_id UUID;
    v_nis_exists INTEGER;
BEGIN
    -- Get the teacher_id from the class the student is being added to.
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher.
    -- We join students with classes to find the teacher.
    SELECT 1 INTO v_nis_exists FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE c.teacher_id = v_teacher_id AND s.nis = p_nis;

    -- If a record is found (v_nis_exists will be 1), raise an exception.
    IF v_nis_exists = 1 THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student.
    INSERT INTO public.students (class_id, nis, name, gender)
    VALUES (p_class_id, p_nis, p_name, p_gender::gender);
END;
$$ LANGUAGE plpgsql;

-- Note: This file only creates the function.
-- The function is called from the `importStudents` server action in `lib/actions.ts`.
-- This is a more controlled approach than using a trigger for this specific import case.
