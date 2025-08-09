-- This schema is intended for new database setups.
-- For migrating existing databases, see migration.sql.

-- Drop existing functions to ensure a clean slate, using CASCADE to remove dependencies.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(TEXT, UUID, TEXT) CASCADE;

-- Table for user profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    account_status TEXT DEFAULT 'Free'::text NOT NULL,
    role TEXT DEFAULT 'teacher'::text NOT NULL,
    active_school_year_id UUID
);

-- Table for school years
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from profiles to school_years AFTER school_years table is created
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey
FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Table for classes
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for subjects
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm NUMERIC DEFAULT 75,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for students
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE,
    nisn TEXT UNIQUE,
    gender TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for activation codes (for Pro accounts)
CREATE TABLE public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_by_email TEXT
);

-- Table for teaching schedule
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for teaching journals
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for attendance history
CREATE TABLE public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    records JSONB,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for grade history
CREATE TABLE public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT,
    records JSONB,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- Function to get the current user's role from their profile
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


-- Function to create a user profile when a new user signs up in Supabase auth.
-- This function is intended to be called by a Webhook, not a database trigger.
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


-- Secure function to activate an account with a code, intended to be called via RPC.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
  activation_code_to_use TEXT,
  user_id_to_activate UUID,
  user_email_to_set TEXT
)
RETURNS VOID AS $$
DECLARE
  code_id_found UUID;
BEGIN
  -- Find the code and lock it to prevent race conditions
  SELECT id INTO code_id_found FROM public.activation_codes
  WHERE code = activation_code_to_use AND NOT is_used FOR UPDATE;

  IF code_id_found IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- Mark the code as used
  UPDATE public.activation_codes
  SET
    is_used = TRUE,
    used_by = user_id_to_activate,
    used_at = NOW(),
    used_by_email = user_email_to_set
  WHERE id = code_id_found;

  -- Upgrade the user's account status
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ROW LEVEL SECURITY (RLS) POLICIES

-- RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for own user" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable update for own user" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for admins" ON public.profiles
  FOR SELECT USING (get_my_role() = 'admin');

-- RLS for classes table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.classes
  FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.classes
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- RLS for subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.subjects
  FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.subjects
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Enable update for assigned teacher" ON public.subjects
  FOR UPDATE USING (auth.uid() = teacher_id);

-- RLS for students table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.students
  FOR ALL USING (
    (SELECT teacher_id FROM classes WHERE id = students.class_id) = auth.uid()
  );

-- RLS for schedule table
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.schedule
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for attendance_history table
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.attendance_history
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for grade_history table
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.grade_history
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for journals table
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable CRUD for assigned teacher" ON public.journals
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS for activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for admin" ON public.activation_codes
  FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Enable insert for admin" ON public.activation_codes
  FOR INSERT WITH CHECK (get_my_role() = 'admin');
-- Update is handled by the secure 'activate_account_with_code' function
CREATE POLICY "Enable update for account activation" ON public.activation_codes
  FOR UPDATE USING (true);

-- RLS for school_years table
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years
  FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.school_years
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);
