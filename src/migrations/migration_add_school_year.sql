-- This script is designed to be run ONCE on an existing database.
-- It adds the necessary `school_year_id` column to attendance, grade, and journal tables,
-- and then backfills the data for existing records based on the currently active school year.

DO $$
DECLARE
    -- Variable to hold the active school year ID. This should be set for the user running the script.
    v_active_school_year_id UUID;
    v_user_id UUID;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();

    -- Get the current user's active school year ID from their profile
    SELECT active_school_year_id INTO v_active_school_year_id 
    FROM public.profiles 
    WHERE id = v_user_id;

    -- Step 1: Add the school_year_id column to the attendance_history table if it doesn't exist.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_history' AND column_name='school_year_id') THEN
        ALTER TABLE public.attendance_history
        ADD COLUMN school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added school_year_id to attendance_history.';
    ELSE
        RAISE NOTICE 'Column school_year_id already exists in attendance_history.';
    END IF;

    -- Step 2: Add the school_year_id column to the grade_history table if it doesn't exist.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='grade_history' AND column_name='school_year_id') THEN
        ALTER TABLE public.grade_history
        ADD COLUMN school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added school_year_id to grade_history.';
    ELSE
        RAISE NOTICE 'Column school_year_id already exists in grade_history.';
    END IF;
    
    -- Step 3: Add the school_year_id column to the journals table if it doesn't exist.
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='journals' AND column_name='school_year_id') THEN
        ALTER TABLE public.journals
        ADD COLUMN school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added school_year_id to journals.';
    ELSE
        RAISE NOTICE 'Column school_year_id already exists in journals.';
    END IF;

    -- Step 4: Backfill existing records with the active school year ID if it's set.
    IF v_active_school_year_id IS NOT NULL THEN
        RAISE NOTICE 'Backfilling existing records with active school year ID: %', v_active_school_year_id;
        
        UPDATE public.attendance_history
        SET school_year_id = v_active_school_year_id
        WHERE school_year_id IS NULL AND teacher_id = v_user_id;
        
        UPDATE public.grade_history
        SET school_year_id = v_active_school_year_id
        WHERE school_year_id IS NULL AND teacher_id = v_user_id;
        
        UPDATE public.journals
        SET school_year_id = v_active_school_year_id
        WHERE school_year_id IS NULL AND teacher_id = v_user_id;

        RAISE NOTICE 'Backfill complete.';
    ELSE
        RAISE NOTICE 'No active school year set for the current user. Skipping backfill.';
    END IF;

    RAISE NOTICE 'Migration script completed successfully.';
END $$;
