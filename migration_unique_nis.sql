-- This script adds a UNIQUE constraint to the 'nis' column in the 'students' table.
-- It ensures that no two students can have the same NIS.
-- This script is safe to run on an existing database. If the constraint already exists, it will do nothing.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'students_nis_key' AND conrelid = 'students'::regclass
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_nis_key UNIQUE (nis);
    END IF;
END;
$$;
