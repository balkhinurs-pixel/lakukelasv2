-- LakuKelas Database Schema (V8.2 - Production Ready)
-- Fokus: Perbaikan pendaftaran user baru & Manajemen Role

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'teacher'::text CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_homeroom_teacher BOOLEAN DEFAULT false,
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active'::text CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- Grade Records Table
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100)
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT
);

-- Teacher Attendance Table (For Staff)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME WITHOUT TIME ZONE,
    check_out TIME WITHOUT TIME ZONE,
    status TEXT DEFAULT 'Tidak Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT
);

-- Settings Table (Global App Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Agendas Table
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME WITHOUT TIME ZONE,
    end_time TIME WITHOUT TIME ZONE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Materials Table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

-- Student Notes Table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. VIEWS
-- Journal with names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- Attendance history
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

-- Grades history
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

-- Student notes with teacher names
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
LEFT JOIN public.profiles p ON sn.teacher_id = p.id;

-- 4. FUNCTIONS & RPC
-- Helper: Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get teacher attendance summary
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) AS $$
DECLARE
    v_policy TEXT;
    v_total_expected BIGINT;
    v_total_present BIGINT;
    v_total_late BIGINT;
    v_day_name TEXT;
BEGIN
    -- Get policy
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    v_policy := COALESCE(v_policy, 'schedule_based');
    
    -- Get Indonesian day name
    v_day_name := CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu'
    END;

    -- Calculate expected
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_total_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_total_expected FROM public.schedule WHERE day = v_day_name;
    END IF;

    -- Calculate actuals
    SELECT count(*) INTO v_total_present FROM public.teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
    SELECT count(*) INTO v_total_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_total_expected,
        v_total_present,
        v_total_late,
        (v_total_expected - v_total_present),
        CASE WHEN v_total_expected > 0 THEN ROUND((v_total_present::NUMERIC / v_total_expected::NUMERIC) * 100, 2) ELSE 100.00 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Get teacher activity counts
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
        (SELECT count(DISTINCT format('%s-%s-%s-%s', date, class_id, subject_id, meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT count(DISTINCT format('%s-%s-%s-%s', date, class_id, subject_id, assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT count(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT count(DISTINCT class_id) FROM public.schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

-- Global Admin Policy
CREATE POLICY "Admins have full access" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access students" ON public.students FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin());

-- Profiles: Users can view all, but edit only their own
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Classes: Teachers view classes they teach
CREATE POLICY "Teachers can view their classes" ON public.classes FOR SELECT TO authenticated USING (true);

-- Students: Everyone can view active students
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT TO authenticated USING (true);

-- Settings: Read access for all authenticated
CREATE POLICY "Authenticated users can read settings" ON public.settings FOR SELECT TO authenticated USING (true);

-- Records: Only owner can manage
CREATE POLICY "Teachers manage own attendance" ON public.attendance_records FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers manage own grades" ON public.grade_records FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers manage own journals" ON public.journal_entries FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers manage own agendas" ON public.agendas FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teachers manage own materials" ON public.materials FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- Headmaster View Policies (Read only for monitoring)
CREATE POLICY "Headmaster view records" ON public.attendance_records FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'headmaster'));
CREATE POLICY "Headmaster view grades" ON public.grade_records FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'headmaster'));

-- 6. AUTH TRIGGER (HANDLE NEW USER)
-- CRITICAL FIX: Added SECURITY DEFINER to bypass RLS during signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    default_role TEXT := 'teacher';
BEGIN
    -- If custom claims or metadata provides a role, use it
    IF (new.raw_user_meta_data->>'role') IS NOT NULL THEN
        default_role := new.raw_user_meta_data->>'role';
    END IF;

    INSERT INTO public.profiles (id, full_name, avatar_url, role)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        new.raw_user_meta_data->>'avatar_url',
        default_role
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INITIAL SETTINGS
INSERT INTO public.settings (key, value) VALUES ('attendance_policy', 'schedule_based') ON CONFLICT DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('app_url', 'https://app.lakukelas.my.id') ON CONFLICT DO NOTHING;
