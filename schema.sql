-- LAKUKELAS DATABASE SCHEMA V11.0
-- (Sistem Approval & Manajemen Staf Terintegrasi)

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
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
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
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100)
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
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
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

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date DATE DEFAULT CURRENT_DATE
);

-- 3. VIEWS
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
LEFT JOIN public.classes c ON ar.class_id = c.id
LEFT JOIN public.subjects s ON ar.subject_id = s.id
LEFT JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
LEFT JOIN public.classes c ON gr.class_id = c.id
LEFT JOIN public.subjects s ON gr.subject_id = s.id
LEFT JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
LEFT JOIN public.profiles p ON sn.teacher_id = p.id;

-- 4. FUNCTIONS & TRIGGERS

-- Auto-Admin & Auto-Approval for first user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Monitoring Statistics Function
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy TEXT;
    v_expected_count BIGINT;
    v_present_count BIGINT;
    v_late_count BIGINT;
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    IF v_policy IS NULL THEN v_policy := 'schedule_based'; END IF;

    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule WHERE day = TRIM(to_char(p_date, 'Day'));
    END IF;

    SELECT count(*) INTO v_present_count FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_late_count FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    RETURN QUERY SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        GREATEST(0, v_expected_count - v_present_count),
        CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) END;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as t_id,
    COALESCE(att.cnt, 0) as attendance_count,
    COALESCE(grd.cnt, 0) as grades_count,
    COALESCE(jrn.cnt, 0) as journal_count,
    COALESCE(sch.cnt, 0) as classes_handled_count
  FROM 
    public.profiles p
  LEFT JOIN (
    SELECT ar.teacher_id, COUNT(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt
    FROM public.attendance_records ar
    GROUP BY ar.teacher_id
  ) att ON p.id = att.teacher_id
  LEFT JOIN (
    SELECT gr.teacher_id, COUNT(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt
    FROM public.grade_records gr
    GROUP BY gr.teacher_id
  ) grd ON p.id = grd.teacher_id
  LEFT JOIN (
    SELECT je.teacher_id, COUNT(*) as cnt
    FROM public.journal_entries je
    GROUP BY je.teacher_id
  ) jrn ON p.id = jrn.teacher_id
  LEFT JOIN (
    SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt
    FROM public.schedule s
    GROUP BY s.teacher_id
  ) sch ON p.id = sch.teacher_id
  WHERE p.is_activated = true
  AND p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$;

-- 5. RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins full access on profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes are viewable by authenticated" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins full access on classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects are viewable by authenticated" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins full access on subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students are viewable by authenticated" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins full access on students" ON public.students FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attendance records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all attendance" ON public.attendance_records FOR SELECT USING (public.is_admin());

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own grade records" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all grades" ON public.grade_records FOR SELECT USING (public.is_admin());

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all journals" ON public.journal_entries FOR SELECT USING (public.is_admin());

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can view all teacher attendance" ON public.teacher_attendance FOR SELECT USING (public.is_admin());

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admins full access on settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holidays are viewable by everyone" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admins full access on holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin());

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher manage own notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Homeroom can view notes" ON public.student_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.classes WHERE teacher_id = auth.uid())
);