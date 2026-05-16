-- LakuKelas V11.1 - Full Database Blueprint
-- Jalankan skrip ini di SQL Editor Supabase untuk membangun database dari nol.

-- ================================================================================
-- 1. EKSTENSI & PEMBERSIHAN (OPSIONAL)
-- ================================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================================
-- 2. TABEL UTAMA
-- ================================================================================

-- Tabel Profil Pengguna (Guru, Kepsek, Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_activated BOOLEAN DEFAULT false,
  is_homeroom_teacher BOOLEAN DEFAULT false,
  -- Kolom Data Sekolah (Hanya diisi oleh Admin)
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT
);

-- Tabel Tahun Ajaran
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel Kelas
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- Tabel Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

-- Tabel Siswa
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- Tabel Jadwal Mengajar
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel Presensi Siswa
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Tabel Nilai Siswa
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Tabel Jurnal Mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT now(),
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Tabel Agenda Personal Guru
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT DEFAULT '#3b82f6',
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel Absensi Guru (Check-in/Check-out)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL,
  reason TEXT,
  UNIQUE(teacher_id, date)
);

-- Tabel Materi Pembelajaran (Link)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel Hari Libur
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

-- Tabel Pengaturan Global (Key-Value)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- ================================================================================
-- 3. FUNGSI PEMBANTU (HELPERS)
-- ================================================================================

-- Cek apakah user adalah Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cek apakah user adalah Kepala Sekolah
CREATE OR REPLACE FUNCTION public.is_headmaster()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'headmaster';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================================
-- 4. KEBIJAKAN KEAMANAN (RLS) - "THE GUARDIAN"
-- ================================================================================

-- Aktifkan RLS di semua tabel
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
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

-- POLICY: Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- POLICY: Master Data (Classes, Subjects, Students)
CREATE POLICY "Authenticated users can view master data" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage master data" ON public.classes FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage students" ON public.students FOR ALL TO authenticated USING (public.is_admin());

-- POLICY: Teaching Data (Attendance, Grades, Journals)
-- Guru hanya bisa ALL data mereka sendiri. Admin & Kepsek bisa SELECT semuanya.
CREATE POLICY "Teachers manage own attendance records" ON public.attendance_records FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Monitoring attendance records" ON public.attendance_records FOR SELECT TO authenticated USING (public.is_admin() OR public.is_headmaster());

CREATE POLICY "Teachers manage own grade records" ON public.grade_records FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Monitoring grade records" ON public.grade_records FOR SELECT TO authenticated USING (public.is_admin() OR public.is_headmaster());

CREATE POLICY "Teachers manage own journals" ON public.journal_entries FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Monitoring journals" ON public.journal_entries FOR SELECT TO authenticated USING (public.is_admin() OR public.is_headmaster());

-- POLICY: Materials & Agendas
CREATE POLICY "Teachers manage own materials" ON public.materials FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "View materials" ON public.materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers manage own agendas" ON public.agendas FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- POLICY: Teacher Attendance (Absensi Guru)
CREATE POLICY "Users manage own teacher_attendance" ON public.teacher_attendance FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Monitoring teacher attendance" ON public.teacher_attendance FOR SELECT TO authenticated USING (public.is_admin() OR public.is_headmaster());

-- POLICY: Settings & Holidays
CREATE POLICY "View settings and holidays" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "View holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings and holidays" ON public.settings FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins manage holidays" ON public.holidays FOR ALL TO authenticated USING (public.is_admin());

-- ================================================================================
-- 5. TRIGGER: PENDAFTAR PERTAMA (AUTO-ADMIN)
-- ================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  p_count INTEGER;
BEGIN
  -- Hitung profil yang sudah ada
  SELECT count(*) INTO p_count FROM public.profiles;

  INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    CASE WHEN p_count = 0 THEN 'admin' ELSE 'teacher' END,
    CASE WHEN p_count = 0 THEN true ELSE false END -- User pertama langsung aktif
  );
  RETURN new;
END;
$$;

-- Daftarkan trigger ke auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================================
-- 6. RPC: FUNGSI STATISTIK (DASHBOARD)
-- ================================================================================

-- Summary Kehadiran Guru untuk Admin/Monitoring
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
  v_expected_count BIGINT;
BEGIN
  -- 1. Cek Kebijakan
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Hitung Wajib Hadir
  IF v_policy = 'daily_based' THEN
    SELECT count(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
  ELSE
    -- Schedule based: Ambil nama hari bahasa Indonesia
    SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule WHERE day = 
      CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa' WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat' WHEN 6 THEN 'Sabtu'
      END;
  END IF;

  -- 3. Return hasil
  RETURN QUERY
  SELECT 
    v_expected_count,
    count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat'))::BIGINT,
    count(*) FILTER (WHERE status = 'Terlambat')::BIGINT,
    (v_expected_count - count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat')))::BIGINT,
    CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / v_expected_count) * 100, 1) END
  FROM public.teacher_attendance
  WHERE date = p_date;
END;
$$;

-- Rekap Aktivitas Guru
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(att.cnt, 0),
    COALESCE(grd.cnt, 0),
    COALESCE(jrn.cnt, 0),
    COALESCE(sch.cnt, 0)
  FROM public.profiles p
  LEFT JOIN (SELECT ar.teacher_id, COUNT(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt FROM public.attendance_records ar GROUP BY ar.teacher_id) att ON p.id = att.teacher_id
  LEFT JOIN (SELECT gr.teacher_id, COUNT(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt FROM public.grade_records gr GROUP BY gr.teacher_id) grd ON p.id = grd.teacher_id
  LEFT JOIN (SELECT je.teacher_id, COUNT(*) as cnt FROM public.journal_entries je GROUP BY je.teacher_id) jrn ON p.id = jrn.teacher_id
  LEFT JOIN (SELECT s.teacher_id, COUNT(DISTINCT s.class_id) as cnt FROM public.schedule s GROUP BY s.teacher_id) sch ON p.id = sch.teacher_id
  WHERE p.is_activated = true AND p.role IN ('teacher', 'headmaster', 'admin')
  ORDER BY p.full_name;
END;
$$;

-- ================================================================================
-- 7. VIEW: DATA DENGAN RELASI NAMA
-- ================================================================================

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
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.*,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- ================================================================================
-- FINISH
-- ================================================================================
