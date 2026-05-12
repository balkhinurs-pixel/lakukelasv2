-- LakuKelas Database Schema v3.9
-- Description: Integrated Monitoring System for Teacher Activity & Attendance

-- ################################################
-- 1. CLEANUP & INITIALIZATION
-- ################################################
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ################################################
-- 2. TABLES DEFINITIONS
-- ################################################

-- Table: Profiles (Users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT false,
  -- School data (mostly for admin profiles acting as global config)
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT
);

-- Table: Global Settings
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: School Years (Semesters)
CREATE TABLE public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false
);

-- Table: Classes
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Homeroom teacher
);

-- Table: Subjects
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

-- Table: Students
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- Table: Schedule
CREATE TABLE public.schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

-- Table: Attendance Records
CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- Table: Grade Records
CREATE TABLE public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL
);

-- Table: Journal Entries
CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_number INTEGER,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

-- Table: Personal Agendas
CREATE TABLE public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME
);

-- Table: Teacher Attendance (Absensi Kehadiran Guru)
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin', 'Libur')),
  reason TEXT,
  UNIQUE(teacher_id, date)
);

-- Table: Holidays
CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

-- Table: Student Notes
CREATE TABLE public.student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

-- Table: Materials (Materi Pembelajaran)
CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL
);

-- ################################################
-- 3. FUNCTIONS & VIEWS
-- ################################################

-- Function: Secure Admin Check (Avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: Handle New User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Auth User Created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: Activity Monitoring (v3.9 - Professional)
DROP FUNCTION IF EXISTS public.get_teacher_activity_counts();
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM public.attendance_records ar 
     WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM public.grade_records gr 
     WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    (SELECT COUNT(*) 
     FROM public.journal_entries je 
     WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) 
     FROM public.schedule s 
     WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM
    public.profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View: Attendance History with Names
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  p.full_name as teacher_name
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
JOIN classes c ON ar.class_id = c.id
JOIN subjects sub ON ar.subject_id = sub.id
JOIN profiles p ON ar.teacher_id = p.id;

-- View: Grades History with Names
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
FROM grade_records gr
JOIN students s ON gr.student_id = s.id
JOIN classes c ON gr.class_id = c.id
JOIN subjects sub ON gr.subject_id = sub.id
JOIN profiles p ON gr.teacher_id = p.id;

-- View: Student Notes with Teacher Name
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- View: Journal Entries with Names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as className,
    s.name as subjectName
FROM journal_entries je
JOIN classes c ON je.class_id = c.id
JOIN subjects s ON je.subject_id = s.id;

-- ################################################
-- 4. SECURITY (RLS)
-- ################################################

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Shared Admin Policy Generator
-- Admin can do everything on all tables
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
  LOOP
    EXECUTE format('CREATE POLICY "Admin full access on %I" ON public.%I FOR ALL USING (public.is_admin())', t, t);
  END LOOP;
END $$;

-- Profiles: Users can see all profiles, but only update their own
CREATE POLICY "View all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Settings: Everyone can view, only admin can update (Admin policy already created above)
CREATE POLICY "View settings" ON public.settings FOR SELECT USING (true);

-- Common: Teachers can view/manage their own data
CREATE POLICY "Teacher manage own journal" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher manage own agenda" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teacher manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id);

-- Attendance: View personal attendance
CREATE POLICY "Teacher view own attendance" ON public.teacher_attendance FOR SELECT USING (auth.uid() = teacher_id);

-- Read access for teachers
CREATE POLICY "Teachers view all school years" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Teachers view all classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Teachers view all subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Teachers view all students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Teachers view all schedules" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Teachers view all holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Teachers view all notes" ON public.student_notes FOR SELECT USING (true);

-- ################################################
-- 5. GRANTS
-- ################################################

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
