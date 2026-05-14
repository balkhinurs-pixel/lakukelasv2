-- ==========================================
-- LAKUKELAS DATABASE SCHEMA (CONSOLIDATED)
-- ==========================================

-- ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SETTINGS TABLE (Global Configuration)
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- PROFILES TABLE
-- Menampung data Guru, Admin, dan Kepala Sekolah
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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
    active_school_year_id UUID
);

-- SCHOOL YEARS
CREATE TABLE IF NOT EXISTS school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. "2024/2025 - Ganjil"
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- CLASSES (Rombongan Belajar)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Wali Kelas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SUBJECTS (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SCHEDULE (Jadwal Mengajar)
CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- ATTENDANCE RECORDS (Student Attendance)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE
);

-- GRADE RECORDS (Student Grades)
CREATE TABLE IF NOT EXISTS grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC NOT NULL,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE
);

-- JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

-- AGENDAS (Personal Teacher Calendar)
CREATE TABLE IF NOT EXISTS agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- TEACHER ATTENDANCE (Staff Geo-Attendance)
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- HOLIDAYS
CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

-- MATERIALS (Shared Teaching Links)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- STUDENT NOTES
CREATE TABLE IF NOT EXISTS student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ==========================================
-- VIEWS (For Easy Data Fetching)
-- ==========================================

CREATE OR REPLACE VIEW journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM journal_entries j
LEFT JOIN classes c ON j.class_id = c.id
LEFT JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW attendance_history AS
SELECT 
    a.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM attendance_records a
LEFT JOIN classes c ON a.class_id = c.id
LEFT JOIN subjects s ON a.subject_id = s.id
LEFT JOIN profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW grades_history AS
SELECT 
    g.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM grade_records g
LEFT JOIN classes c ON g.class_id = c.id
LEFT JOIN subjects s ON g.subject_id = s.id
LEFT JOIN profiles p ON g.teacher_id = p.id;

CREATE OR REPLACE VIEW student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM student_notes sn
LEFT JOIN profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- RPC FUNCTIONS (Core Logic)
-- ==========================================

-- 1. Get Teacher Attendance Summary
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
    v_day_name TEXT;
    v_expected_count BIGINT;
    v_present_count BIGINT;
    v_late_count BIGINT;
BEGIN
    -- Get active policy
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    IF v_policy IS NULL THEN v_policy := 'schedule_based'; END IF;

    -- Get day name in Indonesian
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

    -- Count expected
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM schedule WHERE day = v_day_name;
    END IF;

    -- Count present and late
    SELECT count(*) INTO v_present_count FROM teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_late_count FROM teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        CASE WHEN (v_expected_count - v_present_count) < 0 THEN 0::BIGINT ELSE (v_expected_count - v_present_count) END,
        CASE WHEN v_expected_count > 0 THEN ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) ELSE 100 END;
END;
$$ LANGUAGE plpgsql;

-- 2. Get Teacher Activity Stats
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
    SELECT 
        p.id as teacher_id,
        (SELECT count(DISTINCT (date, class_id, subject_id, meeting_number)) FROM attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT count(DISTINCT (date, class_id, subject_id, assessment_type)) FROM grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT count(*) FROM journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT count(DISTINCT class_id) FROM schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql;

-- 3. Get Student Performance (Simplified version of Ledger Logic)
CREATE OR REPLACE FUNCTION get_student_performance_for_class(p_class_id UUID)
RETURNS TABLE (
    student_id UUID,
    name TEXT,
    nis TEXT,
    average_grade NUMERIC,
    attendance_percentage NUMERIC,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as student_id,
        s.name,
        s.nis,
        0::NUMERIC as average_grade, -- Calc logic can be expanded
        0::NUMERIC as attendance_percentage,
        'Stabil'::TEXT as status
    FROM students s
    WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 4. Get Student Ledger Data
CREATE OR REPLACE FUNCTION get_student_grades_ledger(p_student_id UUID)
RETURNS TABLE (
    id UUID,
    subject_name TEXT,
    assessment_type TEXT,
    date DATE,
    score NUMERIC,
    kkm INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        s.name as subject_name,
        g.assessment_type,
        g.date,
        g.score,
        s.kkm
    FROM grade_records g
    JOIN subjects s ON g.subject_id = s.id
    WHERE g.student_id = p_student_id
    ORDER BY g.date DESC;
END;
$$ LANGUAGE plpgsql;

-- 5. Diagnose Logic (For Debugging)
CREATE OR REPLACE FUNCTION diagnose_attendance_logic(p_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_policy TEXT;
    v_day_name TEXT;
    v_expected_ids UUID[];
BEGIN
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    SELECT CASE EXTRACT(DOW FROM p_date) WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa' WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu' END INTO v_day_name;
    IF v_policy = 'daily_based' THEN SELECT array_agg(id) INTO v_expected_ids FROM profiles WHERE role IN ('teacher', 'headmaster'); ELSE SELECT array_agg(DISTINCT teacher_id) INTO v_expected_ids FROM schedule WHERE day = v_day_name; END IF;
    RETURN jsonb_build_object('date', p_date, 'day', v_day_name, 'policy', v_policy, 'expected_ids', v_expected_ids);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- AUTH TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'teacher'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger below needs to be applied after table 'profiles' is ready
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
