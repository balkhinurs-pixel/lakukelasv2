-- ==== MIGRATION SCRIPT v3 ====
-- Fixes issues with RLS policies and adds missing activation function.
-- SAFE to run on existing databases. Will not delete data.

-- 1. Drop existing functions and their dependent triggers/policies safely.
-- The previous version missed CASCADE on get_my_role.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid) CASCADE;


-- 2. Recreate the handle_new_user function to populate profiles.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'teacher',
    'Free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-enable the trigger on the auth.users table.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 4. Recreate the role checking function.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  my_role TEXT;
BEGIN
  SELECT role INTO my_role FROM public.profiles WHERE id = auth.uid();
  RETURN my_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Drop all existing RLS policies on all tables to ensure a clean slate.
-- This is the safest way to avoid "policy already exists" errors.
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.classes;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.classes;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.classes;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.subjects;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.subjects;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.subjects;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.students;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.students;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.students;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.schedule;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.schedule;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.schedule;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.attendance_history;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.attendance_history;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.attendance_history;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.grade_history;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.grade_history;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.grade_history;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.journals;
DROP POLICY IF EXISTS "Enable insert access for assigned teacher" ON public.journals;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.journals;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.school_years;
DROP POLICY IF EXISTS "Enable read access for admin" ON public.activation_codes;
DROP POLICY IF EXISTS "Enable insert access for admin" ON public.activation_codes;
DROP POLICY IF EXISTS "Enable all access for admin" ON public.activation_codes;


-- 6. Recreate all RLS policies with the correct, non-recursive logic.
-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

-- SCHOOL_YEARS
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);

-- STUDENTS
-- Relies on joining with `classes` table to check teacher_id
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- SCHEDULE
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- ATTENDANCE_HISTORY
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

-- GRADE_HISTORY
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- JOURNALS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- ACTIVATION_CODES (Admin only)
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin" ON public.activation_codes FOR ALL USING (public.get_my_role() = 'admin');


-- 7. Create the missing activation function
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: run as the user who defined it (admin)
AS $$
DECLARE
    code_id_to_use int;
    code_is_used boolean;
BEGIN
    -- Step 1: Find the code and lock the row for update to prevent race conditions
    SELECT id, is_used INTO code_id_to_use, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use
    FOR UPDATE;

    -- Step 2: Check if the code exists
    IF code_id_to_use IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    -- Step 3: Check if the code has already been used
    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Step 4: If code is valid and unused, update the user's profile
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Step 5: Mark the code as used
    UPDATE public.activation_codes
    SET
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id_to_use;
END;
$$;
