-- ==========================================
-- LAKUKELAS MASTER SQL BLUEPRINT (V32.0)
-- Ultimate Identity & Automation Edition
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles: Menyimpan data identitas sekolah dan peran pengguna
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    school_name TEXT,
    npsn TEXT, -- Nomor Pokok Sekolah Nasional (8 digit)
    school_address TEXT,
    school_email TEXT,
    school_website TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    role TEXT CHECK (role IN ('admin', 'teacher', 'headmaster')) DEFAULT 'teacher',
    is_activated BOOLEAN DEFAULT false,
    is_homeroom_teacher BOOLEAN DEFAULT false,
    gemini_api_key TEXT
);

-- School Years: Manajemen Semester Ganjil/Genap
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- Classes: Data Rombongan Belajar
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- ID Wali Kelas
);

-- Subjects: Mata Pelajaran & KKM
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- Students: Data Induk Siswa
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')) DEFAULT 'active'
);

-- Attendance Records: Presensi Siswa
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) NOT NULL
);

-- Grade Records: Penilaian Siswa
CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score NUMERIC NOT NULL
);

-- Journal Entries: Jurnal Mengajar Guru
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT
);

-- Agendas: Kalender & Agenda Guru
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Schedule: Jadwal Mengajar Tetap
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Teacher Attendance: Absensi GPS Guru
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC
);

-- Materials: Link Materi Pembelajaran
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Holidays: Hari Libur Nasional & Sekolah
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('national', 'school')) DEFAULT 'school'
);

-- Settings: Konfigurasi Global
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Student Notes: Catatan Perilaku Siswa
CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')) DEFAULT 'neutral'
);

-- Google Drive Integrations
CREATE TABLE public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT now(),
    disconnected_at TIMESTAMPTZ
);

-- AI Documents Repository
CREATE TABLE public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'rpp', 'soal', 'naskah_ujian'
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    status TEXT DEFAULT 'created'
);

-- AI Bank Soal (Questions)
CREATE TABLE public.questions (
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
    question_type TEXT, -- 'multiple_choice', 'essay'
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

-- 3. VIEWS (Virtual Tables)

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
    c.name as "class_name",
    s.name as "subject_name",
    p.full_name as "teacher_name"
FROM public.attendance_records a
LEFT JOIN public.classes c ON a.class_id = c.id
LEFT JOIN public.subjects s ON a.subject_id = s.id
LEFT JOIN public.profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.*,
    st.name as "student_name",
    c.name as "class_name",
    s.name as "subject_name",
    s.kkm as "subject_kkm",
    p.full_name as "teacher_name"
FROM public.grade_records g
LEFT JOIN public.students st ON g.student_id = st.id
LEFT JOIN public.classes c ON g.class_id = c.id
LEFT JOIN public.subjects s ON g.subject_id = s.id
LEFT JOIN public.profiles p ON g.teacher_id = p.id;

-- 4. FUNCTIONS & TRIGGERS

-- handle_new_user: Otomatisasi Admin Pertama dan Profil Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    is_first_user BOOLEAN;
BEGIN
    -- Cek apakah ini pengguna pertama di sistem
    SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

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
$$;

-- Trigger: Jalankan fungsi saat auth.users mendapat baris baru
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- trigger_sync_homeroom: Menandai guru sebagai Wali Kelas secara otomatis
CREATE OR REPLACE FUNCTION public.sync_homeroom_teacher_flag()
RETURNS trigger AS $$
BEGIN
    UPDATE public.profiles SET is_homeroom_teacher = false;
    UPDATE public.profiles p
    SET is_homeroom_teacher = true
    FROM public.classes c
    WHERE c.teacher_id = p.id;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_sync_homeroom
    AFTER INSERT OR UPDATE OR DELETE ON public.classes
    FOR EACH STATEMENT EXECUTE FUNCTION public.sync_homeroom_teacher_flag();

-- 5. RPC (Remote Procedure Calls)

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
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_total_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_total_expected FROM public.schedule 
        WHERE day = CASE EXTRACT(DOW FROM p_date)
            WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa' WHEN 3 THEN 'Rabu'
            WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu' END;
    END IF;

    SELECT count(*) INTO v_total_present FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_total_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    RETURN QUERY SELECT 
        v_total_expected,
        v_total_present,
        v_total_late,
        GREATEST(v_total_expected - v_total_present, 0),
        CASE WHEN v_total_expected = 0 THEN 100 ELSE ROUND((v_total_present::NUMERIC / v_total_expected::NUMERIC) * 100, 1) END;
END;
$$;

-- 6. SECURITY (RLS)

-- Global
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Holidays (Sesuai instruksi: View All, Manage Admin)
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage holidays" ON public.holidays FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Other Tables (Teacher Isolation)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);

-- 7. GRANTS (Permissions)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 8. INDEXES
CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_grades_student ON public.grade_records(student_id);
CREATE INDEX idx_questions_topic ON public.questions(topic);
