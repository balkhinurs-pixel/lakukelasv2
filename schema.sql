-- ==========================================
-- LAKUKELAS DATABASE SCHEMA V4.2 (STABLE)
-- Location: /schema.sql (Root)
-- ==========================================

-- 1. CLEANUP (Nuclear Reset)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 2. BASIC PERMISSIONS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;

-- 3. FUNCTIONS & HELPERS
-- Function to check if user is admin (SECURITY DEFINER to bypass RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. TABLES
-- Profiles Table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT FALSE,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT
);

-- School Years Table
CREATE TABLE public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  teacher_id UUID REFERENCES public.profiles(id)
);

-- Classes Table
CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) -- Homeroom teacher
);

-- Subjects Table
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id)
);

-- Students Table
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- Attendance Records Table
CREATE TABLE public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- Grade Records Table
CREATE TABLE public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100)
);

-- Journal Entries Table
CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
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

-- Agendas Table
CREATE TABLE public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Materials Table
CREATE TABLE public.materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL
);

-- Teacher Attendance Table
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL,
  reason TEXT,
  UNIQUE(teacher_id, date)
);

-- Global Settings Table
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Holidays Table
CREATE TABLE public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

-- Student Notes Table
CREATE TABLE public.student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
  date TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VIEWS
-- View for attendance with names
CREATE VIEW public.attendance_history AS
SELECT 
  ar.*,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

-- View for grades with names
CREATE VIEW public.grades_history AS
SELECT 
  gr.*,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- View for journals with names
CREATE VIEW public.journal_entries_with_names AS
SELECT 
  je.*,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id
JOIN public.profiles p ON je.teacher_id = p.id;

-- View for student notes with teacher name
CREATE VIEW public.student_notes_with_teacher AS
SELECT 
  sn.*,
  p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 6. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Default Policies
-- Profiles: Users can read all profiles, but only update their own. Admin can do everything.
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- School Years: Admin full access, others read only.
CREATE POLICY "Anyone can view school years" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Admin full access on school_years" ON public.school_years FOR ALL TO authenticated USING (public.is_admin());

-- Classes: Admin full access, others read only.
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admin full access on classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());

-- Subjects: Admin full access, others read only.
CREATE POLICY "Anyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin full access on subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin());

-- Students: Everyone can view active students. Admin full access.
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Admin full access on students" ON public.students FOR ALL TO authenticated USING (public.is_admin());

-- Attendance & Grades: Owners can read/write their own. Admin full access.
CREATE POLICY "Teachers can manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Journal: Owners can manage own. Others can read (for transparency). Admin full access.
CREATE POLICY "Teachers can view all journals" ON public.journal_entries FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Materials & Agendas: Manage own, read all.
CREATE POLICY "Anyone can view materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Teacher Attendance: Manage own, admin view all.
CREATE POLICY "Teachers can manage own teacher_attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Settings & Holidays: Read all, admin manage.
CREATE POLICY "Anyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Anyone can view holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- Student Notes: View all, manage own.
CREATE POLICY "Anyone can view notes" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- 7. TRIGGERS
-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ANALYTICS FUNCTIONS
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
  -- Get active year ID
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM public.attendance_records ar 
     WHERE ar.teacher_id = p.id AND (v_active_year_id IS NULL OR ar.school_year_id = v_active_year_id)) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM public.grade_records gr 
     WHERE gr.teacher_id = p.id AND (v_active_year_id IS NULL OR gr.school_year_id = v_active_year_id)) AS grades_count,
    (SELECT COUNT(*) 
     FROM public.journal_entries je 
     WHERE je.teacher_id = p.id AND (v_active_year_id IS NULL OR je.school_year_id = v_active_year_id)) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) 
     FROM public.schedule s 
     WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM
    public.profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FINAL GRANTS
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;