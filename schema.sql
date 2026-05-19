-- ======================================================================================
-- MASTER SQL BLUEPRINT: LAKUKELAS V28.0 (PROFESSIONAL IDENTITY & AI INTEGRATION)
-- ======================================================================================
-- Deskripsi: Skema database lengkap untuk Supabase (PostgreSQL)
-- Cakupan: Profiles, Rombel, Presensi, Nilai, Jurnal, Agenda, AI, Drive, & Security
-- ======================================================================================

-- 0. EXTENSIONS & INITIAL SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABEL: PROFILES (Identitas Pengguna & Sekolah)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    -- Identitas Sekolah (Update V27.0)
    school_name TEXT,
    school_address TEXT,
    npsn TEXT, -- 8 Digit
    school_email TEXT,
    school_website TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    -- System Flags
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_activated BOOLEAN DEFAULT FALSE,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE,
    gemini_api_key TEXT
);

-- 2. TABEL: SCHOOL_YEARS (Tahun Pelajaran)
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL, -- e.g. 2024/2025 - Ganjil
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT FALSE
);

-- 3. TABEL: CLASSES (Data Rombongan Belajar)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- 4. TABEL: SUBJECTS (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 5. TABEL: STUDENTS (Data Induk Siswa)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- 6. TABEL: SCHEDULE (Master Jadwal Mengajar)
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

-- 7. TABEL: ATTENDANCE_RECORDS (Presensi Siswa)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- 8. TABEL: GRADE_RECORDS (Penilaian Siswa)
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- 9. TABEL: JOURNAL_ENTRIES (Jurnal Mengajar Guru)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 10. TABEL: AGENDAS (Agenda & Pengingat Personal)
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT DEFAULT '#6b7280',
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 11. TABEL: TEACHER_ATTENDANCE (Absensi Kehadiran Guru/Staf)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tepat Waktu' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT, -- Alasan jika Izin/Sakit
    UNIQUE(teacher_id, date)
);

-- 12. TABEL: MATERIALS (Link Materi Pembelajaran)
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- 13. TABEL: HOLIDAYS (Hari Libur Nasional & Sekolah)
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

-- 14. TABEL: GOOGLE_DRIVE_INTEGRATIONS (Fondasi Cloud Storage)
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    drive_email TEXT,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ
);

-- 15. TABEL: AI_DOCUMENTS (Repository File di Drive)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- rpp, soal, naskah_ujian
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'created'
);

-- 16. TABEL: QUESTIONS (Bank Soal AI - Hasil Generate)
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
    topic TEXT,
    subtopic TEXT,
    sort_order INTEGER,
    question_type TEXT CHECK (question_type IN ('multiple_choice', 'essay')),
    question_text TEXT NOT NULL,
    options_json JSONB, -- A, B, C, D, E
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT CHECK (difficulty IN ('mudah', 'sedang', 'sulit', 'campuran')),
    cognitive_level TEXT,
    language_direction TEXT DEFAULT 'ltr',
    status TEXT DEFAULT 'draft',
    needs_review BOOLEAN DEFAULT TRUE,
    image_url TEXT
);

-- 17. TABEL: STUDENT_NOTES (Catatan Wali Kelas)
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

-- 18. TABEL: SETTINGS (Global Configuration)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. TABEL: ACTIVATION_TOKENS (Sistem Monetisasi/Registrasi)
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ
);

-- ======================================================================================
-- VIEWS: MEMPERMUDAH AKSES DATA (READ-ONLY)
-- ======================================================================================

-- Riwayat Jurnal dengan Nama Kelas/Mapel
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- Riwayat Presensi Lengkap
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

-- Riwayat Nilai Lengkap
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

-- Catatan Siswa dengan Nama Guru
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    n.*, 
    p.full_name as teacher_name
FROM public.student_notes n
JOIN public.profiles p ON n.teacher_id = p.id;

-- ======================================================================================
-- FUNCTIONS: BUSINESS LOGIC & RPC
-- ======================================================================================

-- RPC: Ringkasan Kehadiran Guru Harian
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
    v_total_staff BIGINT;
    v_expected_ids UUID[];
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    IF v_policy = 'daily_based' THEN
        SELECT ARRAY_AGG(id) INTO v_expected_ids FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = TRUE;
    ELSE
        SELECT ARRAY_AGG(DISTINCT teacher_id) INTO v_expected_ids 
        FROM public.schedule 
        WHERE day = trim(to_char(p_date, 'Day', 'NLS_DATE_LANGUAGE=INDONESIAN'));
    END IF;

    v_total_staff := COALESCE(array_length(v_expected_ids, 1), 0);

    RETURN QUERY
    SELECT 
        v_total_staff as total_expected,
        COUNT(id) FILTER (WHERE status != 'Tidak Hadir') as total_present,
        COUNT(id) FILTER (WHERE status = 'Terlambat') as total_late,
        (v_total_staff - COUNT(id) FILTER (WHERE status != 'Tidak Hadir')) as total_absent,
        CASE WHEN v_total_staff = 0 THEN 100 ELSE ROUND((COUNT(id) FILTER (WHERE status != 'Tidak Hadir')::NUMERIC / v_total_staff) * 100, 1) END as attendance_rate
    FROM public.teacher_attendance
    WHERE date = p_date AND teacher_id = ANY(v_expected_ids);
END;
$$;

-- RPC: Statistik Keaktifan Staf
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT,
    classes_handled_count BIGINT
) LANGUAGE sql AS $$
    SELECT 
        p.id as teacher_id,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT COUNT(DISTINCT class_id) FROM public.schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster') AND p.is_activated = TRUE;
$$;

-- ======================================================================================
-- SECURITY: ROW LEVEL SECURITY (RLS)
-- ======================================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Master Data Policies (Common Access)
CREATE POLICY "Full access to authenticated users" ON public.classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to authenticated users" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to authenticated users" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to authenticated users" ON public.school_years FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to authenticated users" ON public.schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Read access for all, manage for admin" ON public.holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Read access for all" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Manage for admin" ON public.settings FOR ALL USING (auth.role() = 'authenticated');

-- Transactional Data Policies (Ownership Based)
CREATE POLICY "Users manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own teacher_attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users manage own drive integration" ON public.google_drive_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own ai documents" ON public.ai_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own bank soal" ON public.questions FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Users view relevant notes" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Users manage own notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);

-- ======================================================================================
-- TRIGGERS & AUTOMATION
-- ======================================================================================

-- Function: Handle New User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: On Auth User Created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======================================================================================
-- INDEXES FOR PERFORMANCE
-- ======================================================================================
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_grade_date ON public.grade_records(date);
CREATE INDEX IF NOT EXISTS idx_journal_teacher ON public.journal_entries(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON public.schedule(day);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);
CREATE INDEX IF NOT EXISTS idx_ai_docs_user ON public.ai_documents(user_id);
