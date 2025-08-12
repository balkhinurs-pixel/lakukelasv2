-- This script is designed to be run ONCE on an existing database.
-- It creates a function and a trigger to enforce that the `nis` (student ID number)
-- is unique per teacher, not across the entire application.

-- Drop the old trigger and function if they exist to ensure a clean state
DROP TRIGGER IF EXISTS before_student_insert_update ON public.students;
DROP FUNCTION IF EXISTS check_unique_nis_per_teacher();

-- Create the function that will be executed by the trigger.
CREATE OR REPLACE FUNCTION check_unique_nis_per_teacher()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_id UUID;
    v_count INT;
BEGIN
    -- Get the teacher_id from the associated class of the student being inserted/updated.
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = NEW.class_id;

    -- If the operation is an UPDATE, we must exclude the current row from the check
    -- to allow changing other details of the same student.
    IF TG_OP = 'UPDATE' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = NEW.nis AND s.id != NEW.id;
    -- For an INSERT operation, we check all existing rows.
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = NEW.nis;
    END IF;

    -- If a student with the same NIS is found for the same teacher, raise an error.
    IF v_count > 0 THEN
        RAISE EXCEPTION 'Gagal: NIS "%" sudah terdaftar untuk guru ini. NIS harus unik.', NEW.nis;
    END IF;

    -- If no duplicates are found, allow the operation to proceed.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger that will fire the function before any INSERT or UPDATE on the students table.
CREATE TRIGGER before_student_insert_update
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION check_unique_nis_per_teacher();

-- Optional: Add a comment to the trigger for clarity.
COMMENT ON TRIGGER before_student_insert_update ON public.students IS 'Ensures that NIS is unique per teacher.';
