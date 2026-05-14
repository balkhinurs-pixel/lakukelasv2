-- LAKUKELAS DATABASE SCHEMA (CONSOLIDATED & IDEMPOTENT)
-- Versi 8.0: Presensi Kolaboratif & Keamanan RLS

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES (Gunakan IF NOT EXISTS agar aman untuk database yang sudah ada)

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

CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Wali Kelas
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

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

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ DEFAULT NOW(),
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tepat Waktu',
    reason TEXT
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
    description TEXT,
    type TEXT DEFAULT 'national'
);

CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ DEFAULT NOW(),
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral',
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. VIEWS FOR APP EFFICIENCY

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
JOIN public.classes c ON j.class_id = c.id
JOIN public.subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.*, 
    c.name as class_name, 
    s.name as subject_name, 
    p.full_name as teacher_name
FROM public.attendance_records a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id
JOIN public.profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.*, 
    c.name as class_name, 
    s.name as subject_name, 
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
JOIN public.profiles p ON g.teacher_id = p.id;

-- 4. RPC FUNCTIONS (DIGUNAKAN OLEH DASHBOARD)

-- Fungsi untuk mendapatkan statistik aktivitas guru
CREATE OR REPLACE FUNCTION get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT,
    classes_handled_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as teacher_id,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT COUNT(*) FROM classes WHERE teacher_id = p.id) as classes_handled_count
    FROM profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$;

-- Fungsi untuk ringkasan absensi guru (Dashboard Admin/Monitoring)
CREATE OR REPLACE FUNCTION get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_policy TEXT;
    v_expected_count BIGINT;
    v_present_count BIGINT;
    v_late_count BIGINT;
BEGIN
    -- Ambil kebijakan
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    
    -- Hitung yang seharusnya hadir
    IF v_policy = 'daily_based' THEN
        SELECT COUNT(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count 
        FROM schedule 
        WHERE day = to_char(p_date, 'TMDay'); -- Memerlukan konfigurasi locale ID
    END IF;

    -- Hitung realita
    SELECT COUNT(*) INTO v_present_count FROM teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
    SELECT COUNT(*) INTO v_late_count FROM teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    RETURN QUERY SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        GREATEST(0, v_expected_count - v_present_count),
        CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) END;
END;
$$;

-- 5. TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'teacher');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastikan trigger tidak duplikat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RLS POLICIES (Gunakan sistem DO block untuk keamanan existing data)

DO $$ 
BEGIN
    -- Aktifkan RLS pada semua tabel
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
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
    ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policy: Profiles (User bisa baca semua, tapi hanya edit milik sendiri)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policy: Classes & Subjects (Semua guru bisa baca, hanya Admin bisa edit)
DROP POLICY IF EXISTS "Anyone can view classes" ON classes;
CREATE POLICY "Anyone can view classes" ON classes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view subjects" ON subjects;
CREATE POLICY "Anyone can view subjects" ON subjects FOR SELECT USING (true);

-- Policy: Collaborative Attendance (V8.0)
DROP POLICY IF EXISTS "Teachers can view all attendance" ON attendance_records;
CREATE POLICY "Teachers can view all attendance" ON attendance_records FOR SELECT USING (true);
DROP POLICY IF EXISTS "Teachers can insert own attendance" ON attendance_records;
CREATE POLICY "Teachers can insert own attendance" ON attendance_records FOR INSERT WITH CHECK (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Teachers can update own attendance" ON attendance_records;
CREATE POLICY "Teachers can update own attendance" ON attendance_records FOR UPDATE USING (auth.uid() = teacher_id);

-- Policy: Settings (Semua bisa baca, hanya Admin bisa edit)
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);

-- Policy: Global Delete untuk Admin
-- Skrip ini mengasumsikan role 'admin' ada di tabel profiles. 
-- Role-based policy yang lebih kompleks bisa ditambahkan di sini.

-- 7. DEFAULT SETTINGS
INSERT INTO public.settings (key, value) VALUES ('attendance_policy', 'schedule_based') ON CONFLICT DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('attendance_radius', '50') ON CONFLICT DO NOTHING;
