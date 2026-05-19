-- ======================================================================================
-- LAKUKELAS MASTER DATABASE BLUEPRINT (V29.0 - ULTIMATE EDITION)
-- Description: Comprehensive schema for School Management System with AI & G-Drive
-- Author: App Prototyper - Firebase Studio
-- Total lines: 520+
-- ======================================================================================

-- 1. EXTENSIONS & SCHEMAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES DEFINITIONS

-- [PROFILES] - User identity and school data
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    is_activated BOOLEAN DEFAULT FALSE,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE,
    school_name TEXT,
    school_address TEXT,
    npsn TEXT,
    school_email TEXT,
    school_website TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    gemini_api_key TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- [SETTINGS] - Global application settings
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- [ACTIVATION TOKENS] - Unique codes for registration
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ
);

-- [SCHOOL YEARS] - Academic periods
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- [CLASSES] - Rombongan Belajar
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Wali Kelas
);

-- [SUBJECTS] - Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- [STUDENTS] - Student Master Data
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- [SCHEDULE] - Teaching schedules
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- [ATTENDANCE RECORDS] - Student daily presence
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    meeting_number INTEGER NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- [GRADE RECORDS] - Student academic performance
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessment_type TEXT NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    score DECIMAL(5,2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- [JOURNAL ENTRIES] - Teacher teaching log
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- [AGENDAS] - Personal agenda for teachers
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- [MATERIALS] - Shared learning resources
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- [HOLIDAYS] - Public or school holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

-- [TEACHER ATTENDANCE] - Teacher location-based presence
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL DEFAULT 'Tepat Waktu' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    latitude TEXT,
    longitude TEXT
);

-- [STUDENT NOTES] - Disciplinary and positive notes
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- [GOOGLE DRIVE INTEGRATIONS]
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ
);

-- [AI DOCUMENTS] - Metadata for files in Drive
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    class_level TEXT,
    subject TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- [QUESTIONS] - AI Bank Soal
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    generation_group_id UUID,
    jenjang TEXT,
    kelas TEXT,
    semester TEXT,
    subject TEXT,
    curriculum TEXT,
    assessment_purpose TEXT,
    topic TEXT NOT NULL,
    subtopic TEXT,
    sort_order INTEGER,
    question_type TEXT,
    question_text TEXT NOT NULL,
    options_json JSONB,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    cognitive_level TEXT,
    language_direction TEXT DEFAULT 'ltr',
    image_url TEXT,
    status TEXT DEFAULT 'active'
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_attendance_date_class ON public.attendance_records(date, class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_student ON public.grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_journal_teacher_date ON public.journal_entries(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_schedule_teacher_day ON public.schedule(teacher_id, day);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date, teacher_id);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
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
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Students Policies (Viewable by all staff, editable by Admin)
CREATE POLICY "Staff can view students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Attendance Records Policies
CREATE POLICY "Teachers can manage own attendance records" ON public.attendance_records 
FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Staff can view attendance" ON public.attendance_records FOR SELECT USING (auth.role() = 'authenticated');

-- Grade Records Policies
CREATE POLICY "Teachers can manage own grade records" ON public.grade_records 
FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Staff can view grades" ON public.grade_records FOR SELECT USING (auth.role() = 'authenticated');

-- Journal Entries Policies
CREATE POLICY "Teachers can manage own journals" ON public.journal_entries 
FOR ALL USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
CREATE POLICY "Staff can view journals" ON public.journal_entries FOR SELECT USING (auth.role() = 'authenticated');

-- Schedule Policies
CREATE POLICY "Staff can view schedule" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage schedule" ON public.schedule FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Holidays Policies
CREATE POLICY "Everyone can view holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admins can manage holidays" ON public.holidays FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- AI Bank Soal Policies
CREATE POLICY "Users can manage own questions" ON public.questions 
FOR ALL USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- 5. VIEWS DEFINITIONS

-- [Journal View with Class/Subject Names]
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
JOIN public.classes c ON j.class_id = c.id
JOIN public.subjects s ON j.subject_id = s.id;

-- [Attendance History View]
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

-- [Grade History View]
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

-- 6. FUNCTIONS (RPC) DEFINITIONS

-- Function to get teacher attendance summary for a specific date
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT,
    total_present BIGINT,
    total_late BIGINT,
    total_absent BIGINT,
    attendance_rate NUMERIC
) LANGUAGE plpgsql AS $$
DECLARE
    v_policy TEXT;
    v_total_expected BIGINT;
    v_total_present BIGINT;
    v_total_late BIGINT;
BEGIN
    -- 1. Get current policy
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    -- 2. Calculate expected based on policy
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_total_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = TRUE;
    ELSE
        -- schedule_based
        SELECT count(DISTINCT teacher_id) INTO v_total_expected 
        FROM public.schedule 
        WHERE day = trim(to_char(p_date, 'Day'));
    END IF;

    -- 3. Calculate present and late
    SELECT count(*) INTO v_total_present FROM public.teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
    SELECT count(*) INTO v_total_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_total_expected,
        v_total_present,
        v_total_late,
        (v_total_expected - v_total_present),
        CASE WHEN v_total_expected > 0 THEN round((v_total_present::numeric / v_total_expected::numeric) * 100, 1) ELSE 0 END;
END;
$$;

-- Function to get overall activity counts per teacher
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    full_name TEXT,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT,
    classes_handled_count BIGINT
) LANGUAGE sql AS $$
    SELECT 
        p.id as teacher_id,
        p.full_name,
        (SELECT count(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT count(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT count(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT count(DISTINCT class_id) FROM public.schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster') AND p.is_activated = TRUE;
$$;

-- 7. TRIGGERS & AUTOMATION

-- Handle new user creation via auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher',
    FALSE -- All new users must wait for admin approval
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing triggers to prevent duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Automatic Homeroom Teacher Flag Sync
CREATE OR REPLACE FUNCTION public.sync_homeroom_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        UPDATE public.profiles SET is_homeroom_teacher = FALSE WHERE id = OLD.teacher_id;
    ELSE
        UPDATE public.profiles SET is_homeroom_teacher = TRUE WHERE id = NEW.teacher_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_class_teacher_change
    AFTER INSERT OR UPDATE OR DELETE ON public.classes
    FOR EACH ROW EXECUTE FUNCTION public.sync_homeroom_flag();

-- ======================================================================================
-- END OF MASTER BLUEPRINT
-- ======================================================================================
