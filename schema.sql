-- ======================================================================================
-- LAKUKELAS MASTER SQL BLUEPRINT (V31.0)
-- Deskripsi: Skema basis data lengkap untuk sistem manajemen sekolah digital.
-- Cakupan: Tabel, RLS, Relasi, View, Indexes, RPC Functions, Triggers, & Permissions.
-- ======================================================================================

-- 0. EKSTENSI (WAJIB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL UTAMA: PROFILES (Identitas Pengguna & Sekolah)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT DEFAULT 'User LakuKelas',
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_activated BOOLEAN DEFAULT false,
    is_homeroom_teacher BOOLEAN DEFAULT false,
    -- Identitas Sekolah Profesional (Pembaruan V27.0)
    school_name TEXT,
    school_address TEXT,
    npsn TEXT,
    school_email TEXT,
    school_website TEXT,
    school_logo_url TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    -- Integrasi AI
    gemini_api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL AKADEMIK: TAHUN AJARAN
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. 2024/2025 - Ganjil
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. TABEL AKADEMIK: KELAS
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Wali Kelas
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABEL AKADEMIK: MATA PELAJARAN
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABEL DATA INDUK: SISWA
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. TABEL OPERASIONAL: JADWAL MENGAJAR
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TABEL OPERASIONAL: PRESENSI SISWA
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TABEL OPERASIONAL: NILAI SISWA
CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL, -- e.g. Tugas 1, UTS, UAS
    score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. TABEL OPERASIONAL: JURNAL MENGAJAR
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT now(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. TABEL OPERASIONAL: AGENDA GURU
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. TABEL OPERASIONAL: ABSENSI GURU (Geolocation)
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    latitude TEXT,
    longitude TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. TABEL PENDUKUNG: MATERI PEMBELAJARAN
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. TABEL PENDUKUNG: HARI LIBUR
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school'))
);

-- 14. TABEL PENDUKUNG: CATATAN SISWA (Konseling)
CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT now()
);

-- 15. TABEL PENDUKUNG: PENGATURAN GLOBAL (Settings)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 16. TABEL PENDUKUNG: TOKEN AKTIVASI
CREATE TABLE public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ
);

-- 17. TABEL INTEGRASI: GOOGLE DRIVE
CREATE TABLE public.google_drive_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT DEFAULT 'google',
    folder_id TEXT,
    folder_url TEXT,
    folder_name TEXT DEFAULT 'LakuKelas AI',
    status TEXT DEFAULT 'connected',
    connected_at TIMESTAMPTZ DEFAULT now(),
    disconnected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. TABEL INTEGRASI: BANK SOAL AI
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    image_prompt TEXT,
    status TEXT DEFAULT 'draft',
    needs_review BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 19. TABEL INTEGRASI: REPOSITORY DOKUMEN AI
CREATE TABLE public.ai_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('rpp', 'soal', 'naskah_ujian', 'modul_ajar')),
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

-- ======================================================================================
-- VIEWS (Untuk Mempermudah Query Dashboard)
-- ======================================================================================

-- View: Jurnal dengan nama Kelas dan Mapel
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- View: Riwayat Presensi Lengkap
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

-- View: Riwayat Nilai Lengkap
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

-- ======================================================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ======================================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- Kebijakan Umum: Pengguna hanya dapat melihat/mengelola data miliknya sendiri
-- Kebijakan Khusus: Admin dapat melihat seluruh data.

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Students (Viewable by all teachers, managed by Admin)
CREATE POLICY "View students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Manage students" ON public.students FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Operational Tables (Teacher specific)
CREATE POLICY "Own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Own teacher attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Own questions" ON public.questions FOR ALL USING (auth.uid() = created_by);
CREATE POLICY "Own ai documents" ON public.ai_documents FOR ALL USING (auth.uid() = user_id);

-- ======================================================================================
-- FUNCTIONS & TRIGGERS (Automations)
-- ======================================================================================

-- Trigger: Buat Profil Otomatis saat Registrasi Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User LakuKelas'), 
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger: Sync Flag Wali Kelas Otomatis
CREATE OR REPLACE FUNCTION public.sync_homeroom_flag()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles SET is_homeroom_teacher = false WHERE id = OLD.teacher_id;
    IF NEW.teacher_id IS NOT NULL THEN
        UPDATE public.profiles SET is_homeroom_teacher = true WHERE id = NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_class_teacher_changed
    AFTER INSERT OR UPDATE OF teacher_id ON public.classes
    FOR EACH ROW EXECUTE PROCEDURE public.sync_homeroom_flag();

-- RPC: Ringkasan Kehadiran Guru (Untuk Dashboard Admin)
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
BEGIN
    -- Ambil kebijakan dari settings
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    
    -- Hitung jumlah guru yang wajib hadir berdasarkan kebijakan
    IF v_policy = 'daily_based' THEN
        SELECT COUNT(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule 
        WHERE day = trim(to_char(p_date, 'Day', 'indonesian'));
    END IF;

    RETURN QUERY
    SELECT 
        v_expected_count as total_expected,
        COUNT(ta.id) FILTER (WHERE ta.status IN ('Tepat Waktu', 'Terlambat')) as total_present,
        COUNT(ta.id) FILTER (WHERE ta.status = 'Terlambat') as total_late,
        (v_expected_count - COUNT(ta.id) FILTER (WHERE ta.status IN ('Tepat Waktu', 'Terlambat'))) as total_absent,
        CASE WHEN v_expected_count > 0 
             THEN ROUND((COUNT(ta.id) FILTER (WHERE ta.status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / v_expected_count) * 100, 2)
             ELSE 100 
        END as attendance_rate
    FROM public.teacher_attendance ta
    WHERE ta.date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Statistik Keaktifan Staf
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
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT COUNT(DISTINCT class_id) FROM public.schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role != 'admin' AND p.is_activated = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================================================================
-- 20. HAK AKSES (PERMISSIONS / GRANTS) - SANGAT PENTING
-- ======================================================================================

-- Berikan izin penggunaan skema public
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Berikan izin ke seluruh tabel untuk peran authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Batasi izin untuk peran anon (Hanya baca tabel tertentu jika diperlukan)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.holidays TO anon;

-- Pastikan service_role memiliki akses total (Default Supabase)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ======================================================================================
-- 21. INDEXES (Optimasi Performa)
-- ======================================================================================
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_grades_date ON public.grade_records(date);
CREATE INDEX IF NOT EXISTS idx_journal_date ON public.journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON public.schedule(day);
CREATE INDEX IF NOT EXISTS idx_teacher_attendance_date ON public.teacher_attendance(date);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions(topic);

-- SELESAI. Blueprint siap dijalankan di SQL Editor Supabase.
