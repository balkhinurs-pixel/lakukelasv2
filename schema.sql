-- LAKUKELAS DATABASE SCHEMA (V8.2)
-- Pusat Fondasi Database LakuKelas

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- Settings Table (Global configuration)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Homeroom Teacher
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- Attendance Records (Student)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- Grade Records
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    score NUMERIC(5,2) DEFAULT 0
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT
);

-- Teacher Attendance Table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- Schedule Table
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Agendas Table
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
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
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Student Notes Table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

-- 3. VIEWS

-- View for Journal with Names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM journal_entries j
JOIN classes c ON j.class_id = c.id
JOIN subjects s ON j.subject_id = s.id;

-- View for Attendance History
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.*, 
    c.name as class_name, 
    s.name as subject_name, 
    p.full_name as teacher_name
FROM attendance_records ar
JOIN classes c ON ar.class_id = c.id
JOIN subjects s ON ar.subject_id = s.id
JOIN profiles p ON ar.teacher_id = p.id;

-- View for Grades History
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*, 
    c.name as class_name, 
    s.name as subject_name, 
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM grade_records gr
JOIN classes c ON gr.class_id = c.id
JOIN subjects s ON gr.subject_id = s.id
JOIN profiles p ON gr.teacher_id = p.id;

-- View for Student Notes with Teacher Name
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*, 
    p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- 4. FUNCTIONS & RPCs

-- Function to check if user is admin (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle new user registration via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for teacher activity counts (Fix for Monitoring)
CREATE OR REPLACE FUNCTION get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT,
    classes_handled_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    att_stats AS (
        SELECT ar.teacher_id, COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) as count
        FROM public.attendance_records ar
        GROUP BY ar.teacher_id
    ),
    grade_stats AS (
        SELECT gr.teacher_id, COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) as count
        FROM public.grade_records gr
        GROUP BY gr.teacher_id
    ),
    journal_stats AS (
        SELECT je.teacher_id, COUNT(*) as count
        FROM public.journal_entries je
        GROUP BY je.teacher_id
    ),
    class_stats AS (
        SELECT s.teacher_id, COUNT(DISTINCT class_id) as count
        FROM public.schedule s
        GROUP BY s.teacher_id
    )
    SELECT 
        p.id as teacher_id,
        COALESCE(att.count, 0) as attendance_count,
        COALESCE(grd.count, 0) as grades_count,
        COALESCE(jrn.count, 0) as journal_count,
        COALESCE(cls.count, 0) as classes_handled_count
    FROM public.profiles p
    LEFT JOIN att_stats att ON p.id = att.teacher_id
    LEFT JOIN grade_stats grd ON p.id = grd.teacher_id
    LEFT JOIN journal_stats jrn ON p.id = jrn.teacher_id
    LEFT JOIN class_stats cls ON p.id = cls.teacher_id
    WHERE p.role IN ('teacher', 'headmaster', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for teacher attendance summary
CREATE OR REPLACE FUNCTION get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) AS $$
DECLARE
    v_policy TEXT;
    v_expected_count BIGINT;
BEGIN
    -- Get active policy
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    
    -- Count expected teachers based on policy
    IF v_policy = 'daily_based' THEN
        SELECT COUNT(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        -- Schedule based
        SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count 
        FROM schedule 
        WHERE day = (
            CASE extract(dow from p_date)
                WHEN 0 THEN 'Minggu'
                WHEN 1 THEN 'Senin'
                WHEN 2 THEN 'Selasa'
                WHEN 3 THEN 'Rabu'
                WHEN 4 THEN 'Kamis'
                WHEN 5 THEN 'Jumat'
                WHEN 6 THEN 'Sabtu'
            END
        );
    END IF;

    RETURN QUERY
    SELECT 
        v_expected_count as total_expected,
        COUNT(CASE WHEN status IN ('Tepat Waktu', 'Terlambat') THEN 1 END) as total_present,
        COUNT(CASE WHEN status = 'Terlambat' THEN 1 END) as total_late,
        (v_expected_count - COUNT(CASE WHEN status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin') THEN 1 END)) as total_absent,
        CASE 
            WHEN v_expected_count = 0 THEN 100
            ELSE ROUND((COUNT(CASE WHEN status IN ('Tepat Waktu', 'Terlambat') THEN 1 END)::NUMERIC / v_expected_count) * 100, 2)
        END as attendance_rate
    FROM teacher_attendance
    WHERE date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS)

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by everyone" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify settings" ON public.settings FOR ALL TO authenticated USING (public.is_admin());

-- School Years
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School years viewable by everyone" ON public.school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can modify school years" ON public.school_years FOR ALL TO authenticated USING (public.is_admin());

-- Other Tables (Enable for all, then simple policies)
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes access" ON public.classes FOR ALL TO authenticated USING (true);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Subjects access" ON public.subjects FOR ALL TO authenticated USING (true);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students access" ON public.students FOR ALL TO authenticated USING (true);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendance records access" ON public.attendance_records FOR ALL TO authenticated USING (true);

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grade records access" ON public.grade_records FOR ALL TO authenticated USING (true);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Journal entries access" ON public.journal_entries FOR ALL TO authenticated USING (true);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teacher attendance access" ON public.teacher_attendance FOR ALL TO authenticated USING (true);

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schedule access" ON public.schedule FOR ALL TO authenticated USING (true);

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agendas access" ON public.agendas FOR ALL TO authenticated USING (true);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials access" ON public.materials FOR ALL TO authenticated USING (true);

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Student notes access" ON public.student_notes FOR ALL TO authenticated USING (true);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holidays access" ON public.holidays FOR ALL TO authenticated USING (true);