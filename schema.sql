-- DEFINITIVE SCHEMA FOR LAKUKELAS V8.1
-- Optimized for reliability, performance, and role management.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
    email TEXT
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
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
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

CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tepat Waktu' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. SECURITY DEFINER HELPER (To prevent recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VIEWS
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
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.students s ON ar.student_id = s.id
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects sub ON ar.subject_id = sub.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    sub.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.students s ON gr.student_id = s.id
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects sub ON gr.subject_id = sub.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 5. RPC FUNCTIONS
CREATE OR REPLACE FUNCTION get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_policy TEXT;
    v_expected_count BIGINT;
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count 
        FROM public.schedule 
        WHERE day = trim(to_char(p_date, 'Day'));
    END IF;

    RETURN QUERY
    SELECT 
        v_expected_count as total_expected,
        count(ta.id) FILTER (WHERE ta.check_in IS NOT NULL) as total_present,
        count(ta.id) FILTER (WHERE ta.status = 'Terlambat') as total_late,
        (v_expected_count - count(ta.id) FILTER (WHERE ta.check_in IS NOT NULL)) as total_absent,
        CASE WHEN v_expected_count > 0 
             THEN round((count(ta.id) FILTER (WHERE ta.check_in IS NOT NULL)::NUMERIC / v_expected_count) * 100, 1)
             ELSE 100 
        END as attendance_rate
    FROM public.teacher_attendance ta
    WHERE ta.date = p_date;
END;
$$;

CREATE OR REPLACE FUNCTION get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT,
    classes_handled_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as teacher_id,
        (SELECT count(*) FROM public.attendance_records ar WHERE ar.teacher_id = p.id) as attendance_count,
        (SELECT count(DISTINCT assessment_type) FROM public.grade_records gr WHERE gr.teacher_id = p.id) as grades_count,
        (SELECT count(*) FROM public.journal_entries je WHERE je.teacher_id = p.id) as journal_count,
        (SELECT count(DISTINCT class_id) FROM public.schedule s WHERE s.teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$;

-- 6. AUTOMATIC PROFILE TRIGGER (Fixed Security Definer)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'), 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can do anything on profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read classes to everyone" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow admin to manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());

-- (Tambahkan kebijakan serupa untuk tabel lain: allow authenticated to read, restrict write to owner/admin)
