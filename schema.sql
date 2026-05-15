-- LakuKelas Master Schema
-- Fokus: Security, Monitoring Accuracy, and Gatekeeper System

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Profiles: Inti data pengguna
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    phone_number TEXT,
    school_name TEXT DEFAULT 'LakuKelas Digital School',
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_homeroom_teacher BOOLEAN DEFAULT false,
    is_activated BOOLEAN DEFAULT false, -- Gatekeeper status
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activation Tokens: Untuk pendaftaran terkendali
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings: Konfigurasi Global
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roster: Tahun Ajaran, Kelas, Mapel, Siswa
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Wali Kelas
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Schedule: Jadwal Mengajar
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Records: Presensi, Nilai, Jurnal, Agenda
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meeting_number INTEGER,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT now(),
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'school' CHECK (type IN ('national', 'school')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VIEWS
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

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
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 4. SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Helper Function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for Profiles
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete any profile" ON public.profiles;
CREATE POLICY "Admins can delete any profile" 
    ON public.profiles FOR DELETE TO authenticated USING (public.is_admin());

-- Global Policy for Admins
-- Mengizinkan Admin melakukan apapun di semua tabel
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name != 'profiles' -- Profiles sudah punya kebijakan sendiri di atas
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Admins can do everything on %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Admins can do everything on %I" ON public.%I FOR ALL TO authenticated USING (public.is_admin())', t, t);
    END LOOP;
END $$;

-- Policies for Data (Teacher Access)
DROP POLICY IF EXISTS "Teachers can manage own data" ON public.journal_entries;
CREATE POLICY "Teachers can manage own data" ON public.journal_entries
    FOR ALL TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage own attendance" ON public.attendance_records;
CREATE POLICY "Teachers can manage own attendance" ON public.attendance_records
    FOR ALL TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage own grades" ON public.grade_records;
CREATE POLICY "Teachers can manage own grades" ON public.grade_records
    FOR ALL TO authenticated USING (teacher_id = auth.uid());

DROP POLICY IF EXISTS "Teachers can manage own agendas" ON public.agendas;
CREATE POLICY "Teachers can manage own agendas" ON public.agendas
    FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- Monitoring View Access (Kepala Sekolah & Admin)
DROP POLICY IF EXISTS "Monitoring users can view everything" ON public.attendance_records;
CREATE POLICY "Monitoring users can view everything" ON public.attendance_records
    FOR SELECT TO authenticated USING (public.is_admin() OR (SELECT role = 'headmaster' FROM public.profiles WHERE id = auth.uid()));

-- 5. FUNCTIONS & TRIGGERS

-- Handle New User (Auto-Activation for FIRST USER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  -- Cek apakah ini user pertama kali di sistem
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN is_first_user THEN 'admin' ELSE 'teacher' END,
    is_first_user -- User pertama otomatis aktif sebagai Admin
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC: Get Teacher Activity Counts (Untuk Monitoring)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Sangat Penting agar Kepsek/Admin bisa melihat data agregasi guru lain
SET search_path = public
AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  -- Dapatkan ID Tahun Ajaran Aktif
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT 
    p.id as t_id,
    COALESCE(att.cnt, 0) as attendance_count,
    COALESCE(grd.cnt, 0) as grades_count,
    COALESCE(jrn.cnt, 0) as journal_count,
    COALESCE(sch.cnt, 0) as classes_handled_count
  FROM 
    public.profiles p
  -- Hitung Presensi (Unik per Sesi)
  LEFT JOIN (
    SELECT ar.teacher_id, COUNT(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt
    FROM public.attendance_records ar
    WHERE ar.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY ar.teacher_id
  ) att ON p.id = att.teacher_id
  -- Hitung Nilai (Unik per Sesi)
  LEFT JOIN (
    SELECT gr.teacher_id, COUNT(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt
    FROM public.grade_records gr
    WHERE gr.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY gr.teacher_id
  ) grd ON p.id = grd.teacher_id
  -- Hitung Jurnal
  LEFT JOIN (
    SELECT je.teacher_id, COUNT(*) as cnt
    FROM public.journal_entries je
    WHERE je.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY je.teacher_id
  ) jrn ON p.id = jrn.teacher_id
  -- Hitung Beban Kelas
  LEFT JOIN (
    SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt
    FROM public.schedule s
    GROUP BY s.teacher_id
  ) sch ON p.id = sch.teacher_id
  WHERE p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$;

-- RPC: Get Teacher Attendance Summary (Untuk Admin Dashboard)
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy TEXT;
  v_expected_count BIGINT;
  v_present_count BIGINT;
  v_late_count BIGINT;
BEGIN
  -- 1. Cek Kebijakan
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Hitung yang Wajib Hadir
  IF v_policy = 'daily_based' THEN
    SELECT COUNT(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster');
  ELSE
    -- Berbasis jadwal hari ini
    SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count 
    FROM public.schedule 
    WHERE day = (
      SELECT CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu'
      END
    );
  END IF;

  -- 3. Hitung Realisasi
  SELECT COUNT(*) INTO v_present_count FROM public.teacher_attendance WHERE date = p_date AND check_in IS NOT NULL;
  SELECT COUNT(*) INTO v_late_count FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat';

  RETURN QUERY
  SELECT 
    v_expected_count,
    v_present_count,
    v_late_count,
    GREATEST(0, v_expected_count - v_present_count) as total_absent,
    CASE WHEN v_expected_count > 0 THEN ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) ELSE 100 END as attendance_rate;
END;
$$;