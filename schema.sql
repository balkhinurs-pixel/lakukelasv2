
-- LakuKelas Database Schema V11.1
-- Optimized for Admin Approval System & Accurate Reporting

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  phone_number TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_activated BOOLEAN DEFAULT false,
  is_homeroom_teacher BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER NOT NULL,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  score NUMERIC NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL,
  reason TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC
);

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 3. FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  p_count INTEGER;
BEGIN
  SELECT count(*) INTO p_count FROM public.profiles;
  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN p_count = 0 THEN 'admin' ELSE 'teacher' END,
    CASE WHEN p_count = 0 THEN true ELSE false END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    COALESCE(att.cnt, 0) as attendance_count,
    COALESCE(grd.cnt, 0) as grades_count,
    COALESCE(jrn.cnt, 0) as journal_count,
    COALESCE(sch.cnt, 0) as classes_handled_count
  FROM 
    public.profiles p
  LEFT JOIN (
    SELECT ar.teacher_id, COUNT(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt
    FROM public.attendance_records ar GROUP BY ar.teacher_id
  ) att ON p.id = att.teacher_id
  LEFT JOIN (
    SELECT gr.teacher_id, COUNT(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt
    FROM public.grade_records gr GROUP BY gr.teacher_id
  ) grd ON p.id = grd.teacher_id
  LEFT JOIN (
    SELECT je.teacher_id, COUNT(*) as cnt
    FROM public.journal_entries je GROUP BY je.teacher_id
  ) jrn ON p.id = jrn.teacher_id
  LEFT JOIN (
    SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt
    FROM public.schedule s GROUP BY s.teacher_id
  ) sch ON p.id = sch.teacher_id
  WHERE p.is_activated = true
  AND p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own records" ON public.attendance_records FOR ALL TO authenticated USING (teacher_id = auth.uid() OR public.is_admin());

-- (Policy lainnya mengikuti pola yang sama: User hanya bisa akses miliknya sendiri atau Admin bisa akses semua)

-- 5. VIEWS FOR REPORTS
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT je.*, c.name as "className", s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT ar.*, c.name as class_name, s.name as subject_name, p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT gr.*, c.name as class_name, s.name as subject_name, s.kkm as subject_kkm, p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;
