-- Step 1: Delete duplicate school years, keeping only the one with the earliest created_at timestamp.
-- This ensures that if a user has created the same "year-semester" multiple times, only the first one remains.
DELETE FROM public.school_years a
USING public.school_years b
WHERE
    a.ctid < b.ctid
    AND a.name = b.name
    AND a.teacher_id = b.teacher_id;

-- Step 2: Add a UNIQUE constraint to the table.
-- This will prevent any new duplicate entries from being created in the future.
-- The constraint is on the combination of the 'name' and 'teacher_id' columns.
ALTER TABLE public.school_years
ADD CONSTRAINT school_years_name_teacher_id_key UNIQUE (name, teacher_id);
