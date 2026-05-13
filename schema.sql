
-- LakuKelas Database Schema
-- Version: 4.8 (Production Ready)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    is_homeroom_teacher BOOLEAN DEFAULT false,
    school_name TEXT,
    school_address TEXT,
    school_logo_url TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT
);

-- Settings Table (Global App Settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Homeroom Teacher
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
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
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- Schedule Table
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Attendance Records (Student Presence)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Grade Records (Student Scores)
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    score DECIMAL(5,2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Agendas Table
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT DEFAULT '#6b7280',
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Teacher Attendance (Teacher Clock-in/out)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    latitude TEXT,
    longitude TEXT
);

-- Holidays Table
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL UNIQUE,
    description TEXT NOT NULL
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

-- Student Notes Table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. VIEWS & FUNCTIONS

-- View for Journal Entries with Names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM journal_entries j
LEFT JOIN classes c ON j.class_id = c.id
LEFT JOIN subjects s ON j.subject_id = s.id;

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

-- View for Student Notes with Teacher Names
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- Function: Get Teacher Activity Counts (Semester Based)
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
    FROM profiles p
    LEFT JOIN (
        SELECT ar.teacher_id, count(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt 
        FROM attendance_records ar 
        GROUP BY ar.teacher_id
    ) att ON p.id = att.teacher_id
    LEFT JOIN (
        SELECT gr.teacher_id, count(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt 
        FROM grade_records gr 
        GROUP BY gr.teacher_id
    ) grd ON p.id = grd.teacher_id
    LEFT JOIN (
        SELECT je.teacher_id, count(*) as cnt 
        FROM journal_entries je 
        GROUP BY je.teacher_id
    ) jrn ON p.id = jrn.teacher_id
    LEFT JOIN (
        SELECT s.teacher_id, count(DISTINCT s.class_id) as cnt 
        FROM schedule s 
        GROUP BY s.teacher_id
    ) sch ON p.id = sch.teacher_id
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Teacher Attendance Summary (Daily Monitoring)
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
    v_expected_count BIGINT;
    v_present_count BIGINT;
    v_late_count BIGINT;
    v_absent_count BIGINT;
    v_is_holiday BOOLEAN;
BEGIN
    -- 1. Check if holiday
    SELECT EXISTS(SELECT 1 FROM holidays WHERE date = p_date) INTO v_is_holiday;
    
    IF v_is_holiday THEN
        RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
        RETURN;
    END IF;

    -- 2. Get current policy
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    v_policy := COALESCE(v_policy, 'schedule_based');

    -- 3. Calculate expected teachers based on policy
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        -- Schedule based: Get unique teacher_ids from schedule for current day name
        SELECT count(DISTINCT teacher_id) INTO v_expected_count 
        FROM schedule 
        WHERE day = (
            SELECT 
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

    -- 4. Calculate actual attendance
    SELECT count(*) INTO v_present_count FROM teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
    SELECT count(*) INTO v_late_count FROM teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    v_absent_count := v_expected_count - v_present_count;
    IF v_absent_count < 0 THEN v_absent_count := 0; END IF;

    RETURN QUERY
    SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        v_absent_count,
        CASE 
            WHEN v_expected_count = 0 THEN 100::NUMERIC 
            ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1)
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. STORAGE CONFIGURATION
-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for Public Read Access
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Avatar Public Access') THEN
        CREATE POLICY "Avatar Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
    END IF;
END $$;

-- Policy for Uploads (Authenticated Users)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated User Upload') THEN
        CREATE POLICY "Authenticated User Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
    END IF;
END $$;

-- Policy for Managing Own Files or School Logo (Admin)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'User Manage Own or Admin Logo') THEN
        CREATE POLICY "User Manage Own or Admin Logo" ON storage.objects FOR ALL TO authenticated 
        USING (
            bucket_id = 'avatars' AND (
                (storage.foldername(name))[1] = auth.uid()::text OR 
                (name LIKE 'school_logo_%' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
            )
        );
    END IF;
END $$;
