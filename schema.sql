
-- Drop dependent objects first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code CASCADE;


-- Drop tables in reverse order of creation due to dependencies
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status text DEFAULT 'Free'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Holds public user profile information.';

-- Create activation codes table
CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

-- Create classes table
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Represents a group of students, e.g., "Class 10-A".';

-- Create subjects table
CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Represents a subject taught, e.g., "Mathematics".';

-- Create students table
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text,
    nisn text UNIQUE,
    gender text,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores individual student data.';

-- Create schedule table
CREATE TABLE public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Create journals table
CREATE TABLE public.journals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text,
    learning_activities text,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.journals IS 'Stores teaching journal entries.';

-- Create grade history table
CREATE TABLE public.grade_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.grade_history IS 'Stores records of student grades for various assessments.';

-- Create attendance history table
CREATE TABLE public.attendance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendance_history IS 'Stores student attendance records for each meeting.';


-- Function to handle new user creation
CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher' -- default role
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create a profile entry for a new user.';


-- Trigger to call handle_new_user on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to get the role of the currently authenticated user
CREATE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$;
COMMENT ON FUNCTION public.get_my_role() IS 'Safely retrieves the role of the current user.';

-- Function to handle account activation atomically
CREATE OR REPLACE FUNCTION public.activate_account_with_code(activation_code text, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  code_id uuid;
  code_is_used boolean;
BEGIN
  -- Find the code and lock the row for update
  SELECT id, is_used INTO code_id, code_is_used
  FROM public.activation_codes
  WHERE code = activation_code
  FOR UPDATE;

  -- Raise exceptions for invalid or used codes
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  IF code_is_used THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id;

  -- Update the activation_codes table
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id,
    used_at = now()
  WHERE id = code_id;

  RETURN true;
END;
$$;
COMMENT ON FUNCTION public.activate_account_with_code(text, uuid) IS 'Atomically activates a user account and marks the code as used.';


-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Activation Codes Policies
CREATE POLICY "Admins can manage activation codes" ON public.activation_codes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Authenticated users can read codes" ON public.activation_codes FOR SELECT USING (auth.role() = 'authenticated');

-- Generic Policies for Teacher-Owned Data
-- Classes
CREATE POLICY "Teachers can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Subjects
CREATE POLICY "Teachers can manage their own subjects" ON public.subjects FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Schedule
CREATE POLICY "Teachers can manage their own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Journals
CREATE POLICY "Teachers can manage their own journals" ON public.journals FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Grade History
CREATE POLICY "Teachers can manage their own grade history" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
-- Attendance History
CREATE POLICY "Teachers can manage their own attendance history" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Students Policies
CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can insert students into their classes" ON public.students FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can update students in their classes" ON public.students FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can delete students from their classes" ON public.students FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
