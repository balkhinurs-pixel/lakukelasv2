-- =================================================================================
-- LAKUKELAS DATABASE SCHEMA V3.3 (FINAL RESET & FULL CLEANUP)
-- =================================================================================

-- 1. PEMBERSIHAN TOTAL (Hapus semua jika ada, urutan penting karena relasi)
DROP VIEW IF EXISTS public.grades_history CASCADE;
DROP VIEW IF EXISTS public.attendance_history CASCADE;
DROP VIEW IF EXISTS public.journal_entries_with_names CASCADE;
DROP VIEW IF EXISTS public.student_notes_with_teacher CASCADE;

DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.student_notes CASCADE;
DROP TABLE IF EXISTS public.grade_records CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE; -- Ditambahkan untuk fix error
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 2. TABEL PROFIL (Source of Truth untuk Role)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
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
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- 3. TABEL PENDUKUNG DASAR
CREATE TABLE public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE, -- e.g., '2023/2024 - Ganjil'
  is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- 4. TABEL TRANSAKSI (Presensi, Nilai, Jurnal)
CREATE TABLE public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) NOT NULL
);

CREATE TABLE public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL
);

CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

CREATE TABLE public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    description TEXT NOT NULL
);

-- 5. VIEWS UNTUK MEMUDAHKAN APLIKASI
CREATE VIEW public.attendance_history AS
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

CREATE VIEW public.grades_history AS
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

CREATE VIEW public.journal_entries_with_names AS
SELECT 
  je.*,
  c.name as "className",
  s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE VIEW public.student_notes_with_teacher AS
SELECT 
  sn.*,
  p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 6. OTOMATISASI PROFIL (Trigger saat User baru mendaftar)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User Baru'), 
    new.email,
    'teacher'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. PERIZINAN (PENTING untuk database baru)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.profiles TO postgres;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT SELECT ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

-- RLS DASAR (Anti-Loop)
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Tabel Lain (Sederhana untuk Admin & Guru)
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "journal_owner" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "journal_admin" ON public.journal_entries FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- (Jalankan sisanya secara manual sesuai kebutuhan, fokus sekarang adalah fix error instalasi)
