-- ==========================================
-- LAKUKELAS MASTER DATABASE BLUEPRINT
-- Version: 30.0 - Professional Ultimate
-- Description: Skema lengkap untuk sistem manajemen kelas digital
-- ==========================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. IDENTITAS & PROFIL PENGGUNA
-- ==========================================

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    role TEXT CHECK (role IN ('admin', 'teacher', 'headmaster')) DEFAULT 'teacher',
    is_activated BOOLEAN DEFAULT FALSE,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE,
    
    -- Identitas Sekolah (Update V27.0+)
    school_name TEXT,
    school_address TEXT,
    npsn TEXT,
    school_email TEXT,
    school_website TEXT,
    school_logo_url TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    
    -- Integrasi AI
    gemini_api_key TEXT
);

COMMENT ON COLUMN public.profiles.npsn IS 'Nomor Pokok Sekolah Nasional (8 digit)';

-- ==========================================
-- 2. STRUKTUR AKADEMIK & ROMBEL
-- ==========================================

CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL, -- e.g. 2024/2025 - Ganjil
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Ditugaskan sebagai Wali Kelas
);

CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')) DEFAULT 'active',
    avatar_url TEXT
);

CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    day TEXT NOT NULL, -- Senin - Minggu
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- ==========================================
-- 3. CATATAN HARIAN & ADMINISTRASI
-- ==========================================

CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    meeting_number INTEGER NOT NULL,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) NOT NULL
);

CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    assessment_type TEXT NOT NULL, -- e.g. UH 1, UTS, UAS
    score NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ DEFAULT NOW(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT
);

CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT DEFAULT '#6b7280',
    start_time TIME,
    end_time TIME
);

CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    date TIMESTAMPTZ DEFAULT NOW(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')) DEFAULT 'neutral'
);

-- ==========================================
-- 4. MONITORING GURU & SISTEM
-- ==========================================

CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT CHECK (type IN ('national', 'school')) DEFAULT 'school'
);

CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ
);

-- ==========================================
-- 5. ASISTEN AI & GOOGLE DRIVE
-- ==========================================

CREATE TABLE public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    drive_email TEXT,
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    disconnected_at TIMESTAMPTZ
);

CREATE TABLE public.ai_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- e.g. rpp, soal, naskah_ujian
    title TEXT NOT NULL,
    subject TEXT,
    class_level TEXT,
    drive_file_id TEXT,
    drive_file_url TEXT,
    drive_folder_id TEXT,
    mime_type TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'created',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    generation_group_id UUID,
    jenjang TEXT,
    kelas TEXT,
    semester TEXT,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    subtopic TEXT,
    sort_order INTEGER,
    question_type TEXT CHECK (question_type IN ('multiple_choice', 'essay')),
    question_text TEXT NOT NULL,
    options_json JSONB, -- Opsi A-E
    correct_answer TEXT,
    explanation TEXT,
    difficulty TEXT,
    cognitive_level TEXT,
    language_direction TEXT DEFAULT 'ltr',
    image_url TEXT,
    status TEXT DEFAULT 'draft'
);

-- ==========================================
-- 6. VIEWS UNTUK PELAPORAN
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
    st.name as student_name,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records g
JOIN public.students st ON g.student_id = st.id
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id
JOIN public.profiles p ON g.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    n.*,
    p.full_name as teacher_name
FROM public.student_notes n
JOIN public.profiles p ON n.teacher_id = p.id;

-- ==========================================
-- 7. FUNGSI & RPC (PL/pgSQL)
-- ==========================================

-- Fungsi pembuat profil otomatis saat registrasi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    'teacher'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi hitung ringkasan kehadiran guru harian
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
    v_total_expected BIGINT;
    v_total_present BIGINT;
    v_total_late BIGINT;
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_total_expected FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = TRUE;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_total_expected FROM public.schedule WHERE day = TRIM(to_char(p_date, 'Day', 'id_ID'));
    END IF;

    SELECT count(*) INTO v_total_present FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    SELECT count(*) INTO v_total_late FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';
    
    RETURN QUERY SELECT 
        v_total_expected,
        v_total_present,
        v_total_late,
        GREATEST(0, v_total_expected - v_total_present) as total_absent,
        CASE WHEN v_total_expected = 0 THEN 100 ELSE ROUND((v_total_present::NUMERIC / v_total_expected::NUMERIC) * 100, 1) END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi hitung keaktifan administrasi guru
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
        p.id,
        (SELECT count(DISTINCT format('%s-%s-%s-%s', a.date, a.class_id, a.subject_id, a.meeting_number)) FROM public.attendance_records a WHERE a.teacher_id = p.id) as att_count,
        (SELECT count(DISTINCT format('%s-%s-%s-%s', g.date, g.class_id, g.subject_id, g.assessment_type)) FROM public.grade_records g WHERE g.teacher_id = p.id) as grd_count,
        (SELECT count(*) FROM public.journal_entries j WHERE j.teacher_id = p.id) as jrn_count,
        (SELECT count(*) FROM public.classes c WHERE c.teacher_id = p.id) as cls_count
    FROM public.profiles p
    WHERE p.is_activated = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 8. TRIGGERS
-- ==========================================

-- Trigger Profil Otomatis
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger Sinkronisasi Wali Kelas
CREATE OR REPLACE FUNCTION public.sync_homeroom_flag()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.teacher_id IS NOT NULL THEN
      UPDATE public.profiles SET is_homeroom_teacher = TRUE WHERE id = NEW.teacher_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_class_teacher_change
  AFTER INSERT OR UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.sync_homeroom_flag();

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Aktivasi RLS
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
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Kebijakan Umum: Pengguna hanya melihat & mengedit data miliknya sendiri
-- Kebijakan Admin: Dapat melihat seluruh data staf

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Teachers can manage own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Everyone can view classes" ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Everyone can view schedule" ON public.schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage own records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Everyone can view active students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can manage own drive integration" ON public.google_drive_integrations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI documents" ON public.ai_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own questions bank" ON public.questions FOR ALL USING (auth.uid() = created_by);

-- ==========================================
-- 10. INDEXES UNTUK PERFORMA
-- ==========================================

CREATE INDEX idx_students_class ON public.students(class_id);
CREATE INDEX idx_students_status ON public.students(status);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_grade_date ON public.grade_records(date);
CREATE INDEX idx_journal_teacher ON public.journal_entries(teacher_id);
CREATE INDEX idx_schedule_day ON public.schedule(day);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_questions_topic ON public.questions(topic);
CREATE INDEX idx_ai_docs_user ON public.ai_documents(user_id);
