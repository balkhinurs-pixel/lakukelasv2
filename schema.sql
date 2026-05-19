-- ==========================================
-- LAKUKELAS MASTER SQL BLUEPRINT (V32.0)
-- Ultimate Production Schema for Supabase
-- Total Rows: 570+ Logic Lines
-- ==========================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Identity Core)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    email TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    
    -- School Identity (Professional)
    school_name TEXT,
    school_address TEXT,
    npsn TEXT,
    school_email TEXT,
    school_website TEXT,
    school_logo_url TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_activated BOOLEAN DEFAULT false,
    is_homeroom_teacher BOOLEAN DEFAULT false,
    gemini_api_key TEXT
);

-- 2. SCHOOL YEARS
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false
);

-- 3. CLASSES
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Homeroom Teacher
);

-- 4. SUBJECTS
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 5. STUDENTS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive'))
);

-- 6. SCHEDULE
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 7. ATTENDANCE RECORDS
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 8. GRADE RECORDS
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 9. JOURNAL ENTRIES
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
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

-- 10. AGENDAS
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME
);

-- 11. TEACHER ATTENDANCE
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL, -- Tepat Waktu, Terlambat, Sakit, Izin, Alpha
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- 12. MATERIALS
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- 13. HOLIDAYS
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

-- 14. SETTINGS (SaaS Logic)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 15. GOOGLE DRIVE INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT now(),
    disconnected_at TIMESTAMPTZ
);

-- 16. AI DOCUMENTS (Repository)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 17. AI QUESTIONS (Bank Soal)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    generation_group_id UUID,
    jenjang TEXT,
    kelas TEXT,
    semester TEXT,
    subject TEXT,
    curriculum TEXT,
    assessment_purpose TEXT,
    topic TEXT,
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
    status TEXT DEFAULT 'draft'
);

-- 18. STUDENT NOTES
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- VIEWS & RPC FUNCTIONS
-- ==========================================

-- View for Journal with joined names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- Function: Get Teacher Attendance Summary
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
    v_expected BIGINT;
    v_present BIGINT;
    v_late BIGINT;
BEGIN
    -- Get policy
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    v_policy := COALESCE(v_policy, 'schedule_based');

    -- Count Expected
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected 
        FROM public.schedule 
        WHERE day = trim(to_char(p_date, 'Day', 'NLS_DATE_LANGUAGE=INDONESIAN'));
    END IF;

    -- Count Present & Late
    SELECT count(*) INTO v_present FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_expected, 
        v_present, 
        v_late, 
        GREATEST(0, v_expected - v_present),
        CASE WHEN v_expected > 0 THEN round((v_present::numeric / v_expected::numeric) * 100, 1) ELSE 100 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- TRIGGERS & AUTOMATION
-- ==========================================

-- Function: Handle New User Registration (WITH FIRST USER AS ADMIN)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Cek apakah ini pengguna pertama kali di sistem
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    CASE WHEN is_first_user THEN 'admin' ELSE 'teacher' END,
    CASE WHEN is_first_user THEN true ELSE false END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Auth Signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- RLS POLICIES (SECURITY)
-- ==========================================

-- Holidays RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view holidays"
ON public.holidays FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage holidays"
ON public.holidays FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'headmaster'))
);

-- Students RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone authenticated can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- AI Documents RLS
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own AI docs" ON public.ai_documents FOR ALL USING (auth.uid() = user_id);

-- Bank Soal RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own questions" ON public.questions FOR ALL USING (auth.uid() = created_by);

-- ==========================================
-- GRANT PERMISSIONS (ACCESS CONTROL)
-- ==========================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;