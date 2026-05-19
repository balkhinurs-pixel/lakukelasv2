
-- LAKUKELAS ULTIMATE MASTER BLUEPRINT V33.0
-- Dokumen ini adalah Single Source of Truth untuk infrastruktur database LakuKelas.
-- Mencakup: Identity, Academic Management, AI Question Bank, Google Drive Integration, RLS, and RPC.

-- ==========================================================
-- 1. EXTENSIONS & INITIAL SETUP
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- 2. CORE IDENTITY: PROFILES
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    school_name TEXT,
    npsn TEXT,
    school_address TEXT,
    school_email TEXT,
    school_website TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_activated BOOLEAN DEFAULT false,
    is_homeroom_teacher BOOLEAN DEFAULT false,
    gemini_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 3. INTEGRATION: GOOGLE DRIVE
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    provider TEXT NOT NULL DEFAULT 'google',
    drive_email TEXT,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ DEFAULT now(),
    disconnected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    semester TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 4. AI SYSTEM: BANK SOAL
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    generation_group_id UUID,
    jenjang TEXT NOT NULL,
    kelas TEXT NOT NULL,
    semester TEXT,
    subject TEXT NOT NULL,
    curriculum TEXT,
    assessment_purpose TEXT,
    topic TEXT NOT NULL,
    subtopic TEXT,
    sort_order INTEGER,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'essay')),
    question_text TEXT NOT NULL,
    options_json JSONB,
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('mudah', 'sedang', 'sulit', 'campuran')),
    cognitive_level TEXT,
    language_direction TEXT DEFAULT 'ltr',
    image_url TEXT,
    status TEXT DEFAULT 'draft',
    needs_review BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 5. ACADEMIC MANAGEMENT
-- ==========================================================

-- Tahun Ajaran
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Kelas
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Data Siswa
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Master Jadwal
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 6. TRANSACTIONAL DATA: PRESENSI & NILAI
-- ==========================================================

-- Presensi Siswa
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Nilai Siswa
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Jurnal Mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT now(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Catatan Siswa
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 7. TEACHER MONITORING & SYSTEM SETTINGS
-- ==========================================================

-- Absensi Guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Materi & Agenda
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Hari Libur
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('national', 'school')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Pengaturan Global
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Token Aktivasi
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================================
-- 8. VIEWS (PELAPORAN)
-- ==========================================================

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
    a.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records a
JOIN public.students s ON a.student_id = s.id
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects sub ON a.subject_id = sub.id
JOIN public.profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    sub.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records g
JOIN public.students s ON g.student_id = s.id
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects sub ON g.subject_id = sub.id
JOIN public.profiles p ON g.teacher_id = p.id;

-- ==========================================================
-- 9. FUNCTIONS & TRIGGERS
-- ==========================================================

-- Fungsi: Pembuatan Profil Otomatis (First User = Admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    is_first_user boolean;
BEGIN
    SELECT (NOT EXISTS (SELECT 1 FROM public.profiles)) INTO is_first_user;

    IF is_first_user THEN
        INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'Administrator LakuKelas'),
            new.raw_user_meta_data->>'avatar_url',
            'admin',
            true
        );
    ELSE
        INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
            new.raw_user_meta_data->>'avatar_url',
            'teacher',
            false
        );
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fungsi RPC: Ringkasan Kehadiran Guru Harian
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
    v_day_name TEXT;
BEGIN
    -- 1. Ambil kebijakan
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    -- 2. Ambil nama hari
    v_day_name := trim(to_char(p_date, 'Day'));
    -- Map Day Name to Indonesian
    IF v_day_name = 'Monday' THEN v_day_name := 'Senin';
    ELSIF v_day_name = 'Tuesday' THEN v_day_name := 'Selasa';
    ELSIF v_day_name = 'Wednesday' THEN v_day_name := 'Rabu';
    ELSIF v_day_name = 'Thursday' THEN v_day_name := 'Kamis';
    ELSIF v_day_name = 'Friday' THEN v_day_name := 'Jumat';
    ELSIF v_day_name = 'Saturday' THEN v_day_name := 'Sabtu';
    ELSE v_day_name := 'Minggu';
    END IF;

    -- 3. Hitung Wajib Hadir
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected FROM public.schedule WHERE day = v_day_name;
    END IF;

    -- 4. Hitung Realisasi
    SELECT count(*) INTO v_present FROM public.teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
    SELECT count(*) INTO v_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT
        v_expected,
        v_present,
        v_late,
        GREATEST(0, v_expected - v_present),
        CASE WHEN v_expected > 0 THEN ROUND((v_present::NUMERIC / v_expected::NUMERIC) * 100, 1) ELSE 100 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see all (for lookup), but update only own
CREATE POLICY "Profiles are viewable by all authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Holidays: Everyone can read, only Admin can write
CREATE POLICY "Holidays are viewable by all authenticated" ON public.holidays FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admin can manage holidays" ON public.holidays FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Academic: All staff can view master data
CREATE POLICY "Classes viewable by staff" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Subjects viewable by staff" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Students viewable by staff" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Schedules viewable by staff" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');

-- Transactional: Data isolated by teacher_id
CREATE POLICY "Teachers can manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own journal" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own teacher_attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

-- Google Drive & AI: Strictly isolated
CREATE POLICY "Users manage own drive integration" ON public.google_drive_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ai documents" ON public.ai_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own questions" ON public.questions FOR ALL USING (auth.uid() = created_by);

-- ==========================================================
-- 11. INDEXES (PERFORMANCE)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grade_records(student_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==========================================================
-- 12. PERMISSIONS (GRANTS)
-- ==========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
