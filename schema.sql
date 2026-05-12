-- ==========================================
-- LAKUKELAS DATABASE SCHEMA
-- VERSION: 3.7 (Master Integration)
-- DESCRIPTION: Reset total, integrated Teacher Activity, 
-- and improved automatic profile creation.
-- ==========================================

-- 0. CLEAN RESET (NUCLEAR OPTION)
-- Menghapus semua yang ada di skema public untuk memastikan instalasi bersih.
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles: Menyimpan data guru dan admin
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher'::text CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT false
);

-- Settings: Konfigurasi global aplikasi
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- School Years: Tahun ajaran dan semester
CREATE TABLE public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g. "2023/2024 - Ganjil"
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Classes: Daftar rombongan belajar
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id), -- Wali Kelas
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Students: Data induk siswa
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nis TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subjects: Mata pelajaran
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Schedule: Jadwal mengajar guru
CREATE TABLE public.schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Attendance Records: Presensi harian siswa
CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Grade Records: Penilaian akademik siswa
CREATE TABLE public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL, -- e.g. "UH1", "UTS"
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Journal Entries: Jurnal mengajar harian guru
CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id),
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Agendas: Catatan agenda pribadi guru
CREATE TABLE public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Teacher Attendance: Absensi kehadiran guru di sekolah
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(teacher_id, date)
);

-- Holidays: Daftar hari libur
CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description TEXT NOT NULL
);

-- Materials: Tautan materi pembelajaran
CREATE TABLE public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Student Notes: Catatan perkembangan siswa (konseling/walikelas)
CREATE TABLE public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. FUNCTIONS & SECURITY HELPERS

-- Fungsi untuk mengecek apakah user adalah admin (Memutus Rekursi RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- #1. FUNCTION: get_teacher_activity_counts
-- Menghitung total entri data dari 3 tabel utama untuk setiap guru
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(*) FROM public.attendance_records ar WHERE ar.teacher_id = p.id) AS attendance_count,
    (SELECT COUNT(*) FROM public.grade_records gr WHERE gr.teacher_id = p.id) AS grades_count,
    (SELECT COUNT(*) FROM public.journal_entries je WHERE je.teacher_id = p.id) AS journal_count
  FROM
    public.profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VIEWS (Untuk Laporan Lebih Mudah)

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.id, ar.date, ar.meeting_number, ar.status, ar.student_id,
  ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.id, gr.date, gr.assessment_type, gr.score, gr.student_id,
  gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
  je.*,
  c.name as "className",
  s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
LEFT JOIN public.profiles p ON sn.teacher_id = p.id;

-- 5. TRIGGERS FOR AUTH

-- Fungsi untuk membuat profil otomatis saat user baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pendaftaran
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin());

-- Default Policy: Admins can do everything on all tables
DO $$ 
DECLARE 
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name != 'profiles'
  LOOP
    EXECUTE format('CREATE POLICY "Admins have full access on %I" ON public.%I FOR ALL TO authenticated USING (public.is_admin())', t, t);
  END LOOP;
END $$;

-- Table-specific Policies for Teachers
CREATE POLICY "Teacher full access own data - journal" ON public.journal_entries FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher full access own data - agendas" ON public.agendas FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher full access own data - materials" ON public.materials FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher full access own data - teacher_attendance" ON public.teacher_attendance FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher full access own data - attendance_records" ON public.attendance_records FOR ALL TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Teacher full access own data - grade_records" ON public.grade_records FOR ALL TO authenticated USING (teacher_id = auth.uid());

-- General Select Access for Teachers
CREATE POLICY "Authenticated users can view school_years" ON public.school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view schedule" ON public.schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view materials" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can view student_notes" ON public.student_notes FOR SELECT TO authenticated USING (true);

-- 7. GRANTS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
