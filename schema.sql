-- ==========================================
-- MASTER BLUEPRINT DATABASE LAKUKELAS V21.0
-- ==========================================
-- Deskripsi: Skema lengkap mencakup Admin, Guru, Wali Kelas, Kepala Sekolah,
--            Monitoring, Hari Libur, Bank Soal AI, dan Google Drive.
-- ==========================================

-- 0. EKSTENSI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFIL (Pusat Identitas)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    full_name text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    phone_number text,
    role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_activated boolean DEFAULT false,
    is_homeroom_teacher boolean DEFAULT false,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    gemini_api_key text,
    email text -- Hanya untuk referensi tampilan
);

-- 2. TABEL MASTER AKADEMIK
CREATE TABLE public.school_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    is_active boolean DEFAULT false,
    teacher_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) -- Wali Kelas
);

CREATE TABLE public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    kkm integer DEFAULT 75,
    teacher_id uuid REFERENCES public.profiles(id)
);

CREATE TABLE public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    nis text UNIQUE,
    gender text CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url text
);

-- 3. TABEL OPERASIONAL
CREATE TABLE public.schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    day text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.attendance_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    status text CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.grade_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    score numeric(5,2) NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date timestamptz DEFAULT now(),
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text
);

CREATE TABLE public.agendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time
);

CREATE TABLE public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date DEFAULT CURRENT_DATE,
    check_in time,
    check_out time,
    status text CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
    reason text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(teacher_id, date)
);

CREATE TABLE public.student_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id),
    date timestamptz DEFAULT now(),
    note text NOT NULL,
    type text DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

CREATE TABLE public.materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    link_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.holidays (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date UNIQUE NOT NULL,
    description text NOT NULL,
    type text DEFAULT 'school' CHECK (type IN ('national', 'school')),
    created_at timestamptz DEFAULT now()
);

-- 4. TABEL SISTEM & AKTIVASI
CREATE TABLE public.activation_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    token text UNIQUE NOT NULL,
    created_at timestamptz DEFAULT now(),
    used_by uuid REFERENCES public.profiles(id),
    used_at timestamptz
);

CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value text NOT NULL,
    updated_at timestamptz DEFAULT now()
);

-- 5. TABEL AI & GOOGLE DRIVE (FITUR V20+)
CREATE TABLE public.questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id uuid, -- Reserved
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    generation_group_id uuid,
    jenjang text NOT NULL,
    kelas text NOT NULL,
    semester text,
    subject text NOT NULL,
    curriculum text,
    assessment_purpose text,
    topic text NOT NULL,
    subtopic text,
    sort_order integer NOT NULL,
    question_type text NOT NULL,
    question_text text NOT NULL,
    options_json jsonb,
    correct_answer text,
    explanation text,
    difficulty text,
    cognitive_level text,
    language_direction text DEFAULT 'ltr',
    image_url text,
    needs_review boolean DEFAULT true,
    status text DEFAULT 'draft',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.google_drive_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    folder_id text,
    folder_url text,
    folder_name text DEFAULT 'LakuKelas AI',
    status text DEFAULT 'connected',
    connected_at timestamptz DEFAULT now(),
    disconnected_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.ai_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    title text NOT NULL,
    drive_file_id text,
    drive_file_url text,
    drive_folder_id text,
    is_public boolean DEFAULT false,
    status text DEFAULT 'created',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==========================================
-- 6. FUNGSI PEMBANTU & ROLE LOGIC
-- ==========================================

-- Fungsi deteksi role saat ini
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Fungsi pengecekan Wali Kelas
CREATE OR REPLACE FUNCTION public.is_homeroom_for_student(s_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.classes c
        JOIN public.students s ON s.class_id = c.id
        WHERE c.teacher_id = auth.uid() AND s.id = s_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger Otomatis: User Pertama = Admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user boolean;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  IF is_first_user THEN
    INSERT INTO public.profiles (id, full_name, role, is_activated, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'Administrator'),
      'admin',
      true,
      new.email
    );
  ELSE
    INSERT INTO public.profiles (id, full_name, role, is_activated, email)
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
      'teacher',
      false,
      new.email
    );
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Connect trigger ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 7. KEBIJAKAN KEAMANAN (RLS) - SEMUA TABEL
-- ==========================================

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;

-- 7.1 PROFILES (Akses Luas untuk Middleware)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can do everything on profiles" ON public.profiles FOR ALL USING (public.current_user_role() = 'admin');

-- 7.2 MASTER DATA (Admin ALL, Guru/Headmaster SELECT)
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY['school_years', 'classes', 'subjects', 'students', 'holidays', 'settings'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "Admin full access on %I" ON public.%I FOR ALL USING (public.current_user_role() = ''admin'')', t, t);
        EXECUTE format('CREATE POLICY "Auth users can view %I" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', t, t);
    END LOOP;
END $$;

-- 7.3 AKTIVITAS GURU (Pribadi + Monitoring)
DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY['attendance_records', 'grade_records', 'journal_entries', 'agendas', 'teacher_attendance', 'materials', 'student_notes', 'schedule', 'questions', 'ai_documents'];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Tabel questions/ai_documents punya kolom created_by/user_id, yang lain teacher_id
        IF t = 'questions' THEN
            EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = created_by)', t, t);
        ELSEIF t = 'ai_documents' OR t = 'google_drive_integrations' THEN
            EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = user_id)', t, t);
        ELSE
            EXECUTE format('CREATE POLICY "Users manage own %I" ON public.%I FOR ALL USING (auth.uid() = teacher_id)', t, t);
        END IF;
        
        -- Akses Monitoring untuk Admin & Headmaster
        EXECUTE format('CREATE POLICY "Monitoring view %I" ON public.%I FOR SELECT USING (public.current_user_role() IN (''admin'', ''headmaster''))', t, t);
    END LOOP;
END $$;

-- 7.4 SPESIAL: RLS WALI KELAS (Leger/Catatan)
CREATE POLICY "Wali Kelas can view own class attendance" ON public.attendance_records FOR SELECT USING (public.is_homeroom_for_student(student_id));
CREATE POLICY "Wali Kelas can view own class grades" ON public.grade_records FOR SELECT USING (public.is_homeroom_for_student(student_id));

-- ==========================================
-- 8. VIEWS (Join Data untuk UI Kencang)
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
    ar.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.students s ON ar.student_id = s.id
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects sub ON ar.subject_id = sub.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    sub.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.students s ON gr.student_id = s.id
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects sub ON gr.subject_id = sub.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
LEFT JOIN public.profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- 9. RPC (Fungsi Khusus Monitoring)
-- ==========================================

-- Rekap Kehadiran Guru Harian
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date date)
RETURNS TABLE (
    total_expected bigint,
    total_present bigint,
    total_late bigint,
    total_absent bigint,
    attendance_rate numeric
) AS $$
BEGIN
    RETURN QUERY
    WITH expected AS (
        SELECT id FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true
    ),
    actual AS (
        SELECT teacher_id, status FROM public.teacher_attendance WHERE date = p_date
    )
    SELECT 
        COUNT(e.id) as total_expected,
        COUNT(a.teacher_id) FILTER (WHERE a.status IN ('Tepat Waktu', 'Terlambat')) as total_present,
        COUNT(a.teacher_id) FILTER (WHERE a.status = 'Terlambat') as total_late,
        COUNT(e.id) - COUNT(a.teacher_id) as total_absent,
        CASE WHEN COUNT(e.id) = 0 THEN 100 ELSE ROUND((COUNT(a.teacher_id)::numeric / COUNT(e.id)::numeric) * 100, 2) END as attendance_rate
    FROM expected e
    LEFT JOIN actual a ON e.id = a.teacher_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hitung Aktivitas Guru (Dashboard Monitoring)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as teacher_id,
        COUNT(DISTINCT ar.date || ar.class_id || ar.subject_id || ar.meeting_number) as attendance_count,
        COUNT(DISTINCT gr.date || gr.class_id || gr.subject_id || gr.assessment_type) as grades_count,
        COUNT(DISTINCT je.id) as journal_count,
        COUNT(DISTINCT sc.class_id) as classes_handled_count
    FROM public.profiles p
    LEFT JOIN public.attendance_records ar ON p.id = ar.teacher_id
    LEFT JOIN public.grade_records gr ON p.id = gr.teacher_id
    LEFT JOIN public.journal_entries je ON p.id = je.teacher_id
    LEFT JOIN public.schedule sc ON p.id = sc.teacher_id
    WHERE p.is_activated = true
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 10. IZIN AKSES (FAIL-SAFE GRANTS)
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Akhir Skema