
-- ### TABLES ###

-- PROFILES
-- Stores public user data.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  account_status text DEFAULT 'Pro'::text,
  role text DEFAULT 'teacher'::text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  active_school_year_id uuid,
  is_homeroom_teacher boolean DEFAULT false
);

-- SCHOOL YEARS
-- Stores academic years and semesters.
CREATE TABLE IF NOT EXISTS public.school_years (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- CLASSES
-- Stores class groups.
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- SUBJECTS
-- Stores subjects taught.
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  kkm integer NOT NULL DEFAULT 75,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- STUDENTS
-- Stores student data.
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  nis text UNIQUE,
  gender text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  status text DEFAULT 'active'::text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- SCHEDULE
-- Stores weekly teaching schedules.
CREATE TABLE IF NOT EXISTS public.schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- JOURNAL ENTRIES
-- Stores teaching journal entries.
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
  meeting_number integer,
  learning_objectives text NOT NULL,
  learning_activities text NOT NULL,
  assessment text,
  reflection text,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- ATTENDANCE
-- Stores student attendance records.
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
  meeting_number integer NOT NULL,
  records jsonb NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- GRADES
-- Stores student grade records.
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
  assessment_type text NOT NULL,
  records jsonb NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

-- AGENDAS
-- Stores personal teacher agendas.
CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- TEACHER ATTENDANCE
-- Stores teacher's own attendance records.
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time,
    check_out time,
    status text,
    check_in_location jsonb,
    check_out_location jsonb,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (teacher_id, date)
);

-- STUDENT NOTES
-- Stores notes about students from teachers.
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now(),
    note text NOT NULL,
    type text DEFAULT 'neutral'::text
);

-- SETTINGS
-- Stores global application settings.
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now()
);


-- ### CONSTRAINTS & INDEXES ###

-- Add foreign key constraint for active_school_year_id after school_years table is created
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_journal_teacher_id ON public.journal_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_teacher_id ON public.attendance(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);


-- ### FUNCTIONS ###

-- Function to handle new user creation
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher',
    'Pro'
  );
  RETURN NEW;
END;
$$;

-- Function to check if a user is an admin
DROP FUNCTION IF EXISTS public.is_admin();
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  -- Check if the user has the 'admin' role in the profiles table
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin_user;
  
  RETURN is_admin_user;
END;
$$;


-- ### TRIGGERS ###

-- Trigger to call handle_new_user on new user sign-up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ### ROW LEVEL SECURITY (RLS) ###

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- PROFILES Table
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (public.is_admin());

-- CLASSES, SUBJECTS, SCHOOL_YEARS Tables (Admin-managed)
DROP POLICY IF EXISTS "Authenticated users can view." ON public.classes;
CREATE POLICY "Authenticated users can view." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage." ON public.classes;
CREATE POLICY "Admins can manage." ON public.classes FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view." ON public.subjects;
CREATE POLICY "Authenticated users can view." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage." ON public.subjects;
CREATE POLICY "Admins can manage." ON public.subjects FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view." ON public.school_years;
CREATE POLICY "Authenticated users can view." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage." ON public.school_years;
CREATE POLICY "Admins can manage." ON public.school_years FOR ALL USING (public.is_admin());

-- STUDENTS Table
DROP POLICY IF EXISTS "Authenticated users can view all students." ON public.students;
CREATE POLICY "Authenticated users can view all students." ON public.students FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage students." ON public.students;
CREATE POLICY "Admins can manage students." ON public.students FOR ALL USING (public.is_admin());

-- SCHEDULE Table
DROP POLICY IF EXISTS "Teachers can view their own schedule." ON public.schedule;
CREATE POLICY "Teachers can view their own schedule." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can manage all schedules." ON public.schedule;
CREATE POLICY "Admins can manage all schedules." ON public.schedule FOR ALL USING (public.is_admin());

-- JOURNAL, ATTENDANCE, GRADES, AGENDAS (Teacher-specific data)
DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.journal_entries;
CREATE POLICY "Teachers can manage their own data." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all data." ON public.journal_entries;
CREATE POLICY "Admins can view all data." ON public.journal_entries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.attendance;
CREATE POLICY "Teachers can manage their own data." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all data." ON public.attendance;
CREATE POLICY "Admins can view all data." ON public.attendance FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.grades;
CREATE POLICY "Teachers can manage their own data." ON public.grades FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all data." ON public.grades;
CREATE POLICY "Admins can view all data." ON public.grades FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own agendas." ON public.agendas;
CREATE POLICY "Teachers can manage their own agendas." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own attendance." ON public.teacher_attendance;
CREATE POLICY "Teachers can manage their own attendance." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all teacher attendance." ON public.teacher_attendance;
CREATE POLICY "Admins can view all teacher attendance." ON public.teacher_attendance FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own notes." ON public.student_notes;
CREATE POLICY "Teachers can manage their own notes." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);

-- SETTINGS Table
DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can read settings." ON public.settings;
CREATE POLICY "Authenticated users can read settings." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
