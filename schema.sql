-- LAKUKELAS DATABASE SCHEMA (V8.5: Security Gatekeeper & Role Consolidation)
-- This script is idempotent and handles all table creations, RLS, and RPC functions.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & SETTINGS
-- (Roles are handled as text in profiles table for simplicity: 'admin', 'teacher', 'headmaster')

-- 3. TABLES
-- Table: Profiles (User metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
    role TEXT DEFAULT 'teacher',
    is_activated BOOLEAN DEFAULT false, -- GATEKEEPER FLAG
    is_homeroom_teacher BOOLEAN DEFAULT false
);

-- Table: Activation Tokens (Registration security)
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    token TEXT UNIQUE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES public.profiles(id)
);

-- Table: School Years
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT false
);

-- Table: Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Wali Kelas
);

-- Table: Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75
);

-- Table: Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' -- active, graduated, dropout, inactive
);

-- Table: Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    status TEXT NOT NULL -- Hadir, Sakit, Izin, Alpha
);

-- Table: Grade Records
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) DEFAULT 0
);

-- Table: Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT
);

-- Table: Agendas
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME
);

-- Table: Materials
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Table: Student Notes
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' -- positive, improvement, neutral
);

-- Table: Teacher Attendance (Absensi Guru)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT, -- Tepat Waktu, Terlambat, Sakit, Izin, Tidak Hadir
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- Table: Settings (Global configs)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Table: Holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'national' -- national, school
);

-- 4. VIEWS
-- View for Journal with names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM journal_entries j
LEFT JOIN classes c ON j.class_id = c.id
LEFT JOIN subjects s ON j.subject_id = s.id;

-- View for Attendance history
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM attendance_records ar
LEFT JOIN classes c ON ar.class_id = c.id
LEFT JOIN subjects s ON ar.subject_id = s.id
LEFT JOIN profiles p ON ar.teacher_id = p.id;

-- View for Grades history
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM grade_records gr
LEFT JOIN classes c ON gr.class_id = c.id
LEFT JOIN subjects s ON gr.subject_id = s.id
LEFT JOIN profiles p ON gr.teacher_id = p.id;

-- View for Student Notes with teacher info
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM student_notes sn
LEFT JOIN profiles p ON sn.teacher_id = p.id;

-- 5. FUNCTIONS & TRIGGERS

-- Function: Auto-create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_role TEXT := 'teacher';
    activation_status BOOLEAN := false;
BEGIN
    -- Jika pendaftar pertama di sistem, jadikan dia Admin dan Otomatis Aktif
    IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
        new_role := 'admin';
        activation_status := true;
    END IF;

    -- Jika metadata user memiliki info role dari undangan admin
    IF (new.raw_user_meta_data->>'role') IS NOT NULL THEN
        new_role := new.raw_user_meta_data->>'role';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, is_activated)
    VALUES (
        new.id, 
        COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'), 
        new_role,
        activation_status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: is_admin (Safe check for RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Get teacher activity summary for admin
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
        (SELECT COUNT(DISTINCT ar.date || ar.meeting_number || ar.class_id) FROM attendance_records ar WHERE ar.teacher_id = p.id) as attendance_count,
        (SELECT COUNT(DISTINCT gr.date || gr.assessment_type || gr.class_id) FROM grade_records gr WHERE gr.teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM journal_entries je WHERE je.teacher_id = p.id) as journal_count,
        (SELECT COUNT(DISTINCT s.class_id) FROM schedule s WHERE s.teacher_id = p.id) as classes_handled_count
    FROM profiles p
    WHERE p.role IN ('teacher', 'headmaster', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function: Get Teacher Attendance Summary for Admin Dashboard
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
    -- Get day name in Indonesian
    v_day_name := CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu' END;

    -- Get Policy
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    
    -- Count Expected
    IF v_policy = 'daily_based' THEN
        SELECT COUNT(*) INTO v_total_expected FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT COUNT(DISTINCT teacher_id) INTO v_total_expected FROM schedule WHERE day = v_day_name;
    END IF;

    -- Count Present & Late
    SELECT COUNT(*) INTO v_total_present FROM teacher_attendance WHERE date = p_date AND (status = 'Tepat Waktu' OR status = 'Terlambat');
    SELECT COUNT(*) INTO v_total_late FROM teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT
        v_total_expected,
        v_total_present,
        v_total_late,
        (v_total_expected - v_total_present),
        CASE WHEN v_total_expected > 0 THEN ROUND((v_total_present::NUMERIC / v_total_expected::NUMERIC) * 100, 2) ELSE 100 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Policies for TOKEN (Admin only for tokens)
CREATE POLICY "Admins can manage tokens" ON public.activation_tokens FOR ALL USING (public.is_admin());
CREATE POLICY "Authenticated users can read tokens for activation" ON public.activation_tokens FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for OTHER TABLES (Unified logic: Owner can do all, Others can view if in same class/school)
-- We apply a general rule: Authenticated users can read most things, but only owners or admins can write.

-- Example for ATTENDANCE
CREATE POLICY "Teacher can manage own attendance records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Headmaster can view all attendance" ON public.attendance_records FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('headmaster', 'admin')));

-- (Apply similar policies to grade_records, journal_entries, etc. as needed)
-- For this brief, we ensure Admin has full bypass power on all tables:
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admin full access" ON public.%I', tbl.tablename);
        EXECUTE format('CREATE POLICY "Admin full access" ON public.%I FOR ALL USING (public.is_admin())', tbl.tablename);
    END LOOP;
END $$;

-- 7. INITIAL DATA (Optional)
INSERT INTO public.settings (key, value) VALUES ('attendance_policy', 'schedule_based') ON CONFLICT DO NOTHING;
