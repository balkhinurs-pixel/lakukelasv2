
-- ==========================================
-- LAKUKELAS DATABASE SCHEMA (V4.9)
-- ==========================================

-- 1. TABLES & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
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
    is_homeroom_teacher BOOLEAN DEFAULT false
);

-- SCHOOL YEARS
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT false
);

-- CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- SCHEDULE
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE
);

-- ATTENDANCE RECORDS (STUDENTS)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- GRADE RECORDS
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- TEACHER ATTENDANCE (STAFF)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    latitude TEXT,
    longitude TEXT,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE (teacher_id, date)
);

-- AGENDAS
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL
);

-- MATERIALS
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

-- HOLIDAYS
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- STUDENT NOTES
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ==========================================
-- 2. VIEWS
-- ==========================================

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
    ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id, ar.status, ar.student_id,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id, gr.score, gr.student_id,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- 3. FUNCTIONS & RPC
-- ==========================================

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
    v_day_name TEXT;
BEGIN
    -- 1. Dapatkan Kebijakan
    SELECT COALESCE(value, 'schedule_based') INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    -- 2. Dapatkan Nama Hari (Indo)
    SELECT 
        CASE EXTRACT(DOW FROM p_date)
            WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
            WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
            WHEN 6 THEN 'Sabtu'
        END INTO v_day_name;

    -- 3. Hitung Guru yang WAJIB Hadir
    IF v_policy = 'daily_based' THEN
        -- Semua Guru & Kepsek
        SELECT COUNT(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        -- Sesuai Jadwal
        SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule WHERE day = v_day_name;
    END IF;

    -- 4. Jika Hari Libur, expected = 0
    IF EXISTS (SELECT 1 FROM public.holidays WHERE date = p_date) THEN
        v_expected_count := 0;
    END IF;

    -- 5. Hitung Realisasi
    SELECT COUNT(*) INTO v_present_count FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT COUNT(*) INTO v_late_count FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        GREATEST(0, v_expected_count - v_present_count) as total_absent,
        CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) END as attendance_rate;
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
        COALESCE(cls.cnt, 0) as classes_handled_count
    FROM public.profiles p
    LEFT JOIN (SELECT teacher_id, COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) as cnt FROM public.attendance_records GROUP BY teacher_id) att ON p.id = att.teacher_id
    LEFT JOIN (SELECT teacher_id, COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) as cnt FROM public.grade_records GROUP BY teacher_id) grd ON p.id = grd.teacher_id
    LEFT JOIN (SELECT teacher_id, COUNT(*) as cnt FROM public.journal_entries GROUP BY teacher_id) jrn ON p.id = jrn.teacher_id
    LEFT JOIN (SELECT teacher_id, COUNT(DISTINCT class_id) as cnt FROM public.schedule GROUP BY teacher_id) cls ON p.id = cls.teacher_id
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. STORAGE CONFIGURATION
-- ==========================================

-- Buat Bucket 'avatars' jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Hapus kebijakan lama jika ada untuk menghindari konflik
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated User Upload" ON storage.objects;
DROP POLICY IF EXISTS "User Manage Own or Admin Logo" ON storage.objects;

-- Kebijakan: Akses Baca Publik (Semua orang bisa melihat foto)
CREATE POLICY "Avatar Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Kebijakan: Izin Unggah (Hanya user yang login)
CREATE POLICY "Authenticated User Upload" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Kebijakan: Kelola File Sendiri (folder UID) atau Logo Sekolah (Khusus Admin)
CREATE POLICY "User Manage Own or Admin Logo" 
ON storage.objects FOR ALL 
TO authenticated 
USING (
    bucket_id = 'avatars' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR 
        (name LIKE 'school_logo_%' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
)
WITH CHECK (
    bucket_id = 'avatars' AND (
        (storage.foldername(name))[1] = auth.uid()::text OR 
        (name LIKE 'school_logo_%' AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
    )
);
