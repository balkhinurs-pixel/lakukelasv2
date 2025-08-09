-- This is a migration file to update an existing database schema.
-- It is designed to be run on a database that was created with a previous version of schema.sql.

-- Drop existing functions and their dependencies if they exist, using CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(TEXT, UUID, TEXT) CASCADE;


-- Create the school_years table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add the active_school_year_id column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_school_year_id UUID;

-- Drop the foreign key constraint if it exists, then add it back
-- This is a safe way to ensure the constraint is correctly defined without causing errors.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey
FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Recreate function to get the user's role from the profiles table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$;


-- Recreate function to handle new user creation, to be called by a webhook
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;


-- Recreate the function to activate an account, designed to be called securely via RPC
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
  activation_code_to_use TEXT,
  user_id_to_activate UUID,
  user_email_to_set TEXT
)
RETURNS VOID AS $$
DECLARE
  code_id_found UUID;
BEGIN
  -- Find the code and lock it
  SELECT id INTO code_id_found FROM public.activation_codes
  WHERE code = activation_code_to_use AND NOT is_used FOR UPDATE;

  IF code_id_found IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- Update the activation_codes table
  UPDATE public.activation_codes
  SET
    is_used = TRUE,
    used_by = user_id_to_activate,
    used_at = NOW(),
    used_by_email = user_email_to_set
  WHERE id = code_id_found;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Reset and re-apply all Row Level Security policies to ensure consistency

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for own user" ON public.profiles;
CREATE POLICY "Enable read access for own user" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Enable update for own user" ON public.profiles;
CREATE POLICY "Enable update for own user" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Enable read access for admins" ON public.profiles;
CREATE POLICY "Enable read access for admins" ON public.profiles
  FOR SELECT USING (get_my_role() = 'admin');

-- RLS for classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.classes;
CREATE POLICY "Enable read access for assigned teacher" ON public.classes
  FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Enable insert for assigned teacher" ON public.classes;
CREATE POLICY "Enable insert for assigned teacher" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- RLS for subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.subjects;
CREATE POLICY "Enable read access for assigned teacher" ON public.subjects
  FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Enable insert for assigned teacher" ON public.subjects;
CREATE POLICY "Enable insert for assigned teacher" ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Enable update for assigned teacher" ON public.subjects;
CREATE POLICY "Enable update for assigned teacher" ON public.subjects
  FOR UPDATE USING (auth.uid() = teacher_id);

-- RLS for students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable CRUD for assigned teacher" ON public.students;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.students
  FOR ALL USING (
    (SELECT teacher_id FROM classes WHERE id = students.class_id) = auth.uid()
  );

-- RLS for schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable CRUD for assigned teacher" ON public.schedule;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.schedule
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for attendance_history
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable CRUD for assigned teacher" ON public.attendance_history;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.attendance_history
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for grade_history
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable CRUD for assigned teacher" ON public.grade_history;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.grade_history
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable CRUD for assigned teacher" ON public.journals;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.journals
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for activation_codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for admin" ON public.activation_codes;
CREATE POLICY "Enable read access for admin" ON public.activation_codes
  FOR SELECT USING (get_my_role() = 'admin');
DROP POLICY IF EXISTS "Enable insert for admin" ON public.activation_codes;
CREATE POLICY "Enable insert for admin" ON public.activation_codes
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
DROP POLICY IF EXISTS "Enable update for account activation" ON public.activation_codes;
CREATE POLICY "Enable update for account activation" ON public.activation_codes
  FOR UPDATE USING (true); -- This is now handled by a secure function

-- RLS for school_years
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.school_years;
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years
  FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Enable insert for assigned teacher" ON public.school_years;
CREATE POLICY "Enable insert for assigned teacher" ON public.school_years
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
