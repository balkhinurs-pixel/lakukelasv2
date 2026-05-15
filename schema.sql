-- LAKUKELAS DATABASE SCHEMA V9.0
-- Fokus: Security, Activation Token, Monitoring Accuracy & Role Admin Support

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Profiles: Informasi dasar pengguna (Guru, Admin, Kepsek)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  phone_number TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT false,
  is_activated BOOLEAN DEFAULT false -- Default false untuk gatekeeper
);

-- Activation Tokens: Tabel untuk menampung token pendaftaran
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- School Years: Manajemen Semester
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL, -- e.g. "2023/2024 - Ganjil"
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false
);

-- Classes: Rombongan Belajar
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- Subjects: Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Students: Data Induk Siswa
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive'))
);

-- Schedule: Jadwal Mengajar Guru
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Attendance Records: Presensi Siswa (V8.0: Collaborative)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Siapa yang input
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Grade Records: Nilai Siswa
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL, -- e.g. "Ulangan Harian 1"
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Journal Entries: Jurnal Mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date TIMESTAMPTZ NOT NULL,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Agendas: Agenda Pribadi/Sekolah
CREATE TABLE IF NOT EXISTS public.agendas (
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

-- Teacher Attendance: Absensi Masuk/Pulang Guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT, -- Alasan sakit/izin
    UNIQUE(teacher_id, date)
);

-- Materials: Link Materi Pembelajaran
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- Student Notes: Catatan perkembangan perilaku/akademik
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
  date DATE DEFAULT CURRENT_DATE
);

-- Settings: Konfigurasi Global (e.g. Active School Year)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Holidays: Daftar Hari Libur
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL,
    type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

-- 3. FUNCTIONS & SECURITY LOGIC

-- Non-recursive is_admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Automatic Profile Creation on Signup (GATEKEEPER VERSION)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role, email, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher'),
    new.email,
    -- Otomatis aktifkan jika ini user pertama atau jika diundang via email admin
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN true 
      ELSE false 
    END
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. RLS POLICIES (Comprehensive Security)
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
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- 4.1 Profiles Policy
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- 4.2 Data Operational Policies (Allow Read for Collaborative V8.0)
DROP POLICY IF EXISTS "All authenticated can read academic data" ON public.students;
CREATE POLICY "All authenticated can read academic data" ON public.students FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "All authenticated can read classes" ON public.classes;
CREATE POLICY "All authenticated can read classes" ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "All authenticated can read subjects" ON public.subjects;
CREATE POLICY "All authenticated can read subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "All authenticated can read journal" ON public.journal_entries;
CREATE POLICY "All authenticated can read journal" ON public.journal_entries FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "All authenticated can read grades" ON public.grade_records;
CREATE POLICY "All authenticated can read grades" ON public.grade_records FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "All authenticated can read attendance" ON public.attendance_records;
CREATE POLICY "All authenticated can read attendance" ON public.attendance_records FOR SELECT TO authenticated USING (true);

-- 4.3 Management Policies (Owner/Admin)
-- Classes
DROP POLICY IF EXISTS "Admins manage classes" ON public.classes;
CREATE POLICY "Admins manage classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin());
-- Students
DROP POLICY IF EXISTS "Admins manage students" ON public.students;
CREATE POLICY "Admins manage students" ON public.students FOR ALL TO authenticated USING (public.is_admin());
-- Records (Teacher manage own)
DROP POLICY IF EXISTS "Teachers manage own records" ON public.attendance_records;
CREATE POLICY "Teachers manage own records" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin());
DROP POLICY IF EXISTS "Teachers manage own grades" ON public.grade_records;
CREATE POLICY "Teachers manage own grades" ON public.grade_records FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin());
DROP POLICY IF EXISTS "Teachers manage own journal" ON public.journal_entries;
CREATE POLICY "Teachers manage own journal" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin());

-- 4.4 Tokens Policy
DROP POLICY IF EXISTS "Admins manage tokens" ON public.activation_tokens;
CREATE POLICY "Admins manage tokens" ON public.activation_tokens FOR ALL TO authenticated USING (public.is_admin());

-- 5. VIEWS for Easy Fetching
-- View for Journal Entries with Class & Subject Names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
  je.*, 
  c.name as "className", 
  s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

-- View for Attendance History
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id, ar.status, ar.student_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

-- View for Grades History
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id, gr.score, gr.student_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- View for Student Notes with Teacher Name
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
  sn.*,
  p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 6. RPC FUNCTIONS (Business Logic)

-- Perbaikan RPC Aktivitas Guru (SECURITY DEFINER + Optimized Logic)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Crucial for monitoring access
SET search_path = public
AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  -- Get active school year id
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
  -- Hitung Sesi Presensi
  LEFT JOIN (
    SELECT ar.teacher_id, COUNT(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt
    FROM public.attendance_records ar
    WHERE ar.school_year_id = v_active_year_id OR v_active_year_id IS NULL
    GROUP BY ar.teacher_id
  ) att ON p.id = att.teacher_id
  -- Hitung Set Nilai
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
  -- Hitung Beban Kelas (Dari Jadwal)
  LEFT JOIN (
    SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt
    FROM public.schedule s
    GROUP BY s.teacher_id
  ) sch ON p.id = sch.teacher_id
  WHERE p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$;

-- Function for Teacher Attendance Summary (Monitoring Dashboard)
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
AS $$
DECLARE
  v_policy TEXT;
  v_expected_ids UUID[];
  v_present_count BIGINT;
  v_late_count BIGINT;
  v_total_expected BIGINT;
BEGIN
  -- 1. Ambil Kebijakan
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  IF v_policy IS NULL THEN v_policy := 'schedule_based'; END IF;

  -- 2. Tentukan Guru yang Wajib Hadir
  IF v_policy = 'daily_based' THEN
      SELECT array_agg(id) INTO v_expected_ids FROM public.profiles WHERE role IN ('teacher', 'headmaster');
  ELSE
      -- Ambil nama hari bahasa Indonesia
      DECLARE
          v_day_name TEXT;
      BEGIN
          SELECT 
            CASE EXTRACT(DOW FROM p_date)
              WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
              WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu'
            END INTO v_day_name;
          
          SELECT array_agg(DISTINCT teacher_id) INTO v_expected_ids FROM public.schedule WHERE day = v_day_name;
      END;
  END IF;

  v_total_expected := COALESCE(cardinality(v_expected_ids), 0);

  -- 3. Hitung yang Hadir
  SELECT COUNT(*) INTO v_present_count FROM public.teacher_attendance 
  WHERE date = p_date AND teacher_id = ANY(v_expected_ids) AND status IN ('Tepat Waktu', 'Terlambat');

  SELECT COUNT(*) INTO v_late_count FROM public.teacher_attendance 
  WHERE date = p_date AND teacher_id = ANY(v_expected_ids) AND status = 'Terlambat';

  RETURN QUERY SELECT 
    v_total_expected,
    v_present_count,
    v_late_count,
    (v_total_expected - v_present_count) as total_absent,
    CASE WHEN v_total_expected > 0 THEN ROUND((v_present_count::NUMERIC / v_total_expected::NUMERIC) * 100, 1) ELSE 100 END;
END;
$$;