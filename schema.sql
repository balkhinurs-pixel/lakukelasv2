
-- Drop existing objects with CASCADE to handle dependencies
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role CASCADE;

-- Drop tables in reverse order of creation to respect foreign keys, using CASCADE
DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- 1. Profiles Table
-- This table will store user profile data.
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    account_status TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'teacher',
    email TEXT
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- 2. Activation Codes Table
-- Stores activation codes for Pro accounts.
CREATE TABLE public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro account upgrades.';

-- 3. Classes Table
-- Stores information about classes taught by a teacher.
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Represents a class or group of students.';

-- 4. Subjects Table
-- Stores information about subjects taught by a teacher.
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm NUMERIC NOT NULL DEFAULT 75,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Represents a subject taught in a class.';

-- 5. Students Table
-- Stores student data, linked to a class.
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT,
    nisn TEXT,
    gender TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);
COMMENT ON TABLE public.students IS 'Stores individual student information.';

-- 6. Schedule Table
-- Stores the weekly teaching schedule.
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule for teachers.';

-- 7. Journals Table
-- For teachers to write teaching journals.
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.journals IS 'Stores teaching journal entries.';

-- 8. Attendance History Table
-- Stores historical attendance records.
CREATE TABLE public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendance_history IS 'Stores daily attendance records.';

-- 9. Grade History Table
-- Stores historical grade records.
CREATE TABLE public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.grade_history IS 'Stores student grade records for various assessments.';


-- Functions and Triggers

-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$;

-- Trigger to call handle_new_user on new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Function to get the role of the currently logged-in user
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$;


-- Row Level Security (RLS) Policies

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Policies for activation_codes
CREATE POLICY "Admins can manage activation codes" ON public.activation_codes FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Users can read their own used code" ON public.activation_codes FOR SELECT TO authenticated USING (used_by = auth.uid());


-- Policies for teacher-specific data
CREATE POLICY "Teachers can manage their own data" ON public.classes FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their own data" ON public.subjects FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their own data" ON public.schedule FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their own data" ON public.journals FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their own data" ON public.attendance_history FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their own data" ON public.grade_history FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- Policies for students (A teacher can see students in their own classes)
CREATE POLICY "Teachers can manage students in their classes" ON public.students
FOR ALL TO authenticated
USING (
  class_id IN (
    SELECT id FROM public.classes WHERE teacher_id = auth.uid()
  )
);

-- Admin override policies for teacher-specific data
CREATE POLICY "Admins can manage all classes" ON public.classes FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all subjects" ON public.subjects FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all schedules" ON public.schedule FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all journals" ON public.journals FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all attendance" ON public.attendance_history FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all grades" ON public.grade_history FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
CREATE POLICY "Admins can manage all students" ON public.students FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
