-- 
-- LAKUKELAS DATABASE SCHEMA 
-- Version: 9.4 (Token & Activation Fix)
--

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
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
    is_homeroom_teacher BOOLEAN DEFAULT false,
    is_activated BOOLEAN DEFAULT false
);

-- 2. ACTIVATION TOKENS TABLE
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SCHOOL YEARS TABLE
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Homeroom Teacher
);

-- 5. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75
);

-- 6. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- 7. SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 8. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- 9. GRADE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL
);

-- 10. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
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

-- 11. AGENDAS TABLE
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT DEFAULT '#6b7280',
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 12. TEACHER ATTENDANCE TABLE (NEW V4.6)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tidak Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT, -- Alasan jika sakit/izin
    UNIQUE(teacher_id, date)
);

-- 13. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- 14. STUDENT NOTES TABLE
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date DATE DEFAULT CURRENT_DATE
);

-- 15. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

-- 16. SETTINGS TABLE (Global Configuration)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- --- RLS CONFIGURATION ---

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Helper Function: Is Admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper Function: Is Activated?
CREATE OR REPLACE FUNCTION public.is_activated()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_activated = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES: ACTIVATION TOKENS
CREATE POLICY "Admins full access on tokens" ON public.activation_tokens
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY "Enable read access for unused tokens" ON public.activation_tokens
    FOR SELECT TO authenticated USING (used_by IS NULL);

CREATE POLICY "Enable update for claiming tokens" ON public.activation_tokens
    FOR UPDATE TO authenticated 
    USING (used_by IS NULL)
    WITH CHECK (used_by = auth.uid());

-- POLICIES: PROFILES
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- POLICIES: OTHER TABLES (Only for Activated Users or Admins)
-- Applying a general pattern: Admin has full access, owner has full access, others depends on role.

CREATE POLICY "Manage school years" ON public.school_years FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin() OR public.is_activated());
CREATE POLICY "Manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin() OR public.is_activated());
CREATE POLICY "Manage students" ON public.students FOR ALL TO authenticated USING (public.is_admin() OR public.is_activated());
CREATE POLICY "Manage schedule" ON public.schedule FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage attendance" ON public.attendance_records FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage grades" ON public.grade_records FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage journals" ON public.journal_entries FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage agendas" ON public.agendas FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage teacher attendance" ON public.teacher_attendance FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage materials" ON public.materials FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage student notes" ON public.student_notes FOR ALL TO authenticated USING (public.is_admin() OR (public.is_activated() AND teacher_id = auth.uid()));
CREATE POLICY "Manage holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin() OR public.is_activated());
CREATE POLICY "Manage settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin() OR public.is_activated());

-- --- VIEWS ---

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries je
LEFT JOIN public.classes c ON je.class_id = c.id
LEFT JOIN public.subjects s ON je.subject_id = s.id;

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

-- --- FUNCTIONS & TRIGGERS ---

-- Auto-Admin for First User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Cek apakah ini user pertama kali di sistem
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Guru LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_first_user THEN 'admin' ELSE 'teacher' END,
    is_first_user -- User pertama otomatis aktif tanpa token
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Monitoring: Teacher Activity Counts
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
DECLARE
  v_active_year_id UUID;
BEGIN
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

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
    WHERE ar.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY ar.teacher_id
  ) att ON p.id = att.teacher_id
  LEFT JOIN (
    SELECT gr.teacher_id, COUNT(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt
    FROM public.grade_records gr
    WHERE gr.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY gr.teacher_id
  ) grd ON p.id = grd.teacher_id
  LEFT JOIN (
    SELECT je.teacher_id, COUNT(*) as cnt
    FROM public.journal_entries je
    WHERE je.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY je.teacher_id
  ) jrn ON p.id = jrn.teacher_id
  LEFT JOIN (
    SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt
    FROM public.schedule s
    GROUP BY s.teacher_id
  ) sch ON p.id = sch.teacher_id
  WHERE p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$;

-- Monitoring: Teacher Attendance Summary
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
SET search_path = public
AS $$
DECLARE
    v_policy TEXT;
    v_day_name TEXT;
    v_expected_count BIGINT;
    v_present_count BIGINT;
    v_late_count BIGINT;
    v_absent_count BIGINT;
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    -- Get day name from date (e.g., 'Senin')
    SELECT 
        CASE EXTRACT(DOW FROM p_date)
            WHEN 0 THEN 'Minggu'
            WHEN 1 THEN 'Senin'
            WHEN 2 THEN 'Selasa'
            WHEN 3 THEN 'Rabu'
            WHEN 4 THEN 'Kamis'
            WHEN 5 THEN 'Jumat'
            WHEN 6 THEN 'Sabtu'
        END INTO v_day_name;

    -- Calculate expected
    IF v_policy = 'daily_based' THEN
        SELECT COUNT(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule WHERE day = v_day_name;
    END IF;

    -- Calculate presence from teacher_attendance table
    SELECT COUNT(*) INTO v_present_count FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT COUNT(*) INTO v_late_count FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    v_absent_count := v_expected_count - v_present_count;
    IF v_absent_count < 0 THEN v_absent_count := 0; END IF;

    RETURN QUERY SELECT 
        v_expected_count, 
        v_present_count, 
        v_late_count, 
        v_absent_count,
        CASE WHEN v_expected_count > 0 THEN ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) ELSE 0 END;
END;
$$;
