
-- LAKUKELAS DATABASE SCHEMA
-- VERSION: 2.1 (Anti-Recursion & Deep Debug)

-- 1. CLEANUP (Optional: Uncomment if you want a total reset)
-- DROP VIEW IF EXISTS attendance_history;
-- DROP VIEW IF EXISTS grades_history;
-- DROP TABLE IF EXISTS student_notes;
-- DROP TABLE IF EXISTS grade_records;
-- DROP TABLE IF EXISTS attendance_records;
-- DROP TABLE IF EXISTS schedule;
-- DROP TABLE IF EXISTS students;
-- DROP TABLE IF EXISTS subjects;
-- DROP TABLE IF EXISTS classes;
-- DROP TABLE IF EXISTS agendas;
-- DROP TABLE IF EXISTS school_years;
-- DROP TABLE IF EXISTS settings;
-- DROP TABLE IF EXISTS profiles;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT false,
  active_school_year_id UUID
);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id),
  meeting_number INTEGER,
  learning_objectives TEXT,
  learning_activities TEXT,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  assessment_type TEXT,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'Tidak Hadir',
  reason TEXT,
  UNIQUE(teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FUNCTIONS & HELPERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- SECURITY DEFINER function to bypass RLS recursion
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES (Version 2.1 - Non-Recursive)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Important: Policy based only on auth.uid() to avoid recursion
CREATE POLICY "profiles_read_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for Admin using the helper function
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (public.is_admin());

-- Default Allow for other tables based on role or ownership
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_read_all" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_all" ON public.settings FOR ALL USING (public.is_admin());

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes_read_all" ON public.classes FOR SELECT USING (true);
CREATE POLICY "classes_admin_all" ON public.classes FOR ALL USING (public.is_admin());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_read_all" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "subjects_admin_all" ON public.subjects FOR ALL USING (public.is_admin());

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_read_all" ON public.students FOR SELECT USING (true);
CREATE POLICY "students_admin_all" ON public.students FOR ALL USING (public.is_admin());

ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "school_years_read_all" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "school_years_admin_all" ON public.school_years FOR ALL USING (public.is_admin());

-- Teacher Specific Data
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "schedule_all" ON public.schedule FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_all" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agendas_all" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_all" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "grades_all" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "materials_all" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- 5. VIEWS
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as class_name,
    s.name as subject_name
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 6. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE(teacher_id UUID, attendance_count BIGINT, grades_count BIGINT, journal_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    (SELECT count(DISTINCT CONCAT(date, '-', class_id, '-', subject_id, '-', meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
    (SELECT count(DISTINCT CONCAT(date, '-', class_id, '-', subject_id, '-', assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
    (SELECT count(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
