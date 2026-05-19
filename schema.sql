-- ==========================================
-- LAKUKELAS MASTER DATABASE BLUEPRINT
-- Version: 28.0 (Ultimate Identity Update)
-- Description: Skema lengkap untuk Sistem Manajemen Kelas Modern
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLES

-- Profiles: Menyimpan data identitas guru, admin, dan sekolah
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    role TEXT CHECK (role IN ('admin', 'teacher', 'headmaster')) DEFAULT 'teacher',
    is_activated BOOLEAN DEFAULT FALSE,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    school_name TEXT,
    npsn TEXT, -- Nomor Pokok Sekolah Nasional
    school_address TEXT,
    school_email TEXT,
    school_website TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    gemini_api_key TEXT,
    active_school_year_id UUID
);

-- School Years: Manajemen periode akademik
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL, -- e.g. 2024/2025 - Ganjil
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Classes: Data rombongan belajar
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- Subjects: Daftar mata pelajaran
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Students: Data induk siswa
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')) DEFAULT 'active',
    avatar_url TEXT
);

-- Schedule: Jadwal mengajar guru
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Attendance Records: Presensi harian siswa
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) DEFAULT 'Hadir',
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Grade Records: Penilaian akademik siswa
CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Journal Entries: Jurnal mengajar harian guru
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Teacher Attendance: Presensi kehadiran guru (GPS based)
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- Agendas: Agenda dan pengingat pribadi guru
CREATE TABLE public.agendas (
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

-- Materials: Tautan materi pembelajaran
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Holidays: Hari libur nasional & sekolah
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('national', 'school')) DEFAULT 'school'
);

-- Activation Tokens: Token pendaftaran staf
CREATE TABLE public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ
);

-- Settings: Konfigurasi global sistem (JSON-like key-value)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Google Drive Integrations: Status koneksi Drive per guru
CREATE TABLE public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    drive_email TEXT,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ
);

-- AI Documents: Metadata file hasil AI di Drive
CREATE TABLE public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g. naskah_ujian, rpp, soal
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    semester TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions: Bank soal hasil generate AI
CREATE TABLE public.questions (
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
    question_type TEXT CHECK (question_type IN ('multiple_choice', 'essay')),
    question_text TEXT NOT NULL,
    options_json JSONB, -- {A: '...', B: '...'}
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    cognitive_level TEXT,
    language_direction TEXT DEFAULT 'ltr',
    image_url TEXT,
    status TEXT DEFAULT 'draft',
    needs_review BOOLEAN DEFAULT TRUE
);

-- Student Notes: Catatan perilaku/perkembangan siswa oleh guru
CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')) DEFAULT 'neutral',
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_attendance_date_class ON public.attendance_records(date, class_id);
CREATE INDEX idx_grades_student_id ON public.grade_records(student_id);
CREATE INDEX idx_journal_teacher_id ON public.journal_entries(teacher_id);
CREATE INDEX idx_schedule_teacher_day ON public.schedule(teacher_id, day);
CREATE INDEX idx_questions_topic ON public.questions(topic);
CREATE INDEX idx_questions_created_by ON public.questions(created_by);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 4.1 Policies for Profiles
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4.2 Policies for Teachers (Manage own data)
CREATE POLICY "Users can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users can manage own attendance records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users can manage own grade records" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Users can manage own questions" ON public.questions FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Users can manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id);

-- 4.3 Policies for Data Master (Viewable by all staff)
CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view schedule" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view holidays" ON public.holidays FOR SELECT USING (auth.role() = 'authenticated');

-- 5. VIEWS

-- View untuk Jurnal Lengkap dengan Nama Kelas & Mapel
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- View untuk Riwayat Presensi Lengkap
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.*, 
    s.name as "student_name", 
    c.name as "class_name", 
    sub.name as "subject_name",
    p.full_name as "teacher_name"
FROM public.attendance_records a
JOIN public.students s ON a.student_id = s.id
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects sub ON a.subject_id = sub.id
JOIN public.profiles p ON a.teacher_id = p.id;

-- View untuk Riwayat Nilai Lengkap
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.*, 
    s.name as "student_name", 
    c.name as "class_name", 
    sub.name as "subject_name",
    sub.kkm as "subject_kkm",
    p.full_name as "teacher_name"
FROM public.grade_records g
JOIN public.students s ON g.student_id = s.id
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects sub ON g.subject_id = sub.id
JOIN public.profiles p ON g.teacher_id = p.id;

-- 6. FUNCTIONS (RPC)

-- Mendapatkan ringkasan kehadiran guru hari ini
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
    v_present_count BIGINT;
    v_late_count BIGINT;
BEGIN
    -- 1. Ambil kebijakan
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    
    -- 2. Hitung jumlah guru yang wajib hadir
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = TRUE;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM schedule WHERE day = trim(to_char(p_date, 'Day'));
    END IF;

    -- 3. Hitung yang hadir
    SELECT count(*) INTO v_present_count FROM teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_late_count FROM teacher_attendance WHERE date = p_date AND status = 'Terlambat';

    RETURN QUERY SELECT 
        v_expected_count,
        v_present_count,
        v_late_count,
        GREATEST(0, v_expected_count - v_present_count),
        CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 2) END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mendapatkan statistik aktivitas guru (berapa kali input data)
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
        COALESCE(att.cnt, 0) as attendance_count,
        COALESCE(grd.cnt, 0) as grades_count,
        COALESCE(jrn.cnt, 0) as journal_count,
        COALESCE(sch.cnt, 0) as classes_handled_count
    FROM profiles p
    LEFT JOIN (SELECT teacher_id, count(DISTINCT (date, class_id, subject_id, meeting_number)) as cnt FROM attendance_records GROUP BY teacher_id) att ON p.id = att.teacher_id
    LEFT JOIN (SELECT teacher_id, count(DISTINCT (date, class_id, subject_id, assessment_type)) as cnt FROM grade_records GROUP BY teacher_id) grd ON p.id = grd.teacher_id
    LEFT JOIN (SELECT teacher_id, count(*) as cnt FROM journal_entries GROUP BY teacher_id) jrn ON p.id = jrn.teacher_id
    LEFT JOIN (SELECT teacher_id, count(DISTINCT class_id) as cnt FROM schedule GROUP BY teacher_id) sch ON p.id = sch.teacher_id
    WHERE p.is_activated = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Function: Otomatis buat profil saat user daftar auth
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

-- 7. TRIGGERS
-- Jalankan fungsi handle_new_user setiap kali ada baris baru di auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. INITIAL DATA (SETTINGS)
INSERT INTO public.settings (key, value) VALUES 
('attendance_policy', 'schedule_based'),
('attendance_radius', '50'),
('attendance_check_in_start', '06:30'),
('attendance_check_in_deadline', '07:15'),
('app_url', 'https://app.lakukelas.my.id')
ON CONFLICT (key) DO NOTHING;

-- 9. REALTIME CONFIGURATION
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;