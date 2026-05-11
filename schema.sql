-- LAKUKELAS DATABASE SCHEMA (STABLE VERSION)
-- Pastikan dijalankan di SQL Editor Supabase

-- --- 1. CLEANUP ---
-- Hapus view lama jika ada agar tidak bentrok
DROP VIEW IF EXISTS attendance_history;
DROP VIEW IF EXISTS grades_history;
DROP VIEW IF EXISTS journal_entries_with_names;
DROP VIEW IF EXISTS student_notes_with_teacher;

-- --- 2. TABLES ---

-- PROFILES: Tabel utama user
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
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

-- SCHOOL YEARS: Semester Ganjil/Genap
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE -- Contoh: "2024/2025 - Ganjil"
);

-- CLASSES: Rombongan Belajar
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- SUBJECTS: Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

-- STUDENTS: Data Induk Siswa
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- SCHEDULE: Jadwal Mengajar Guru
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  UNIQUE(teacher_id, day, start_time, class_id)
);

-- ATTENDANCE RECORDS: Presensi Siswa
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  UNIQUE(date, student_id, subject_id, meeting_number)
);

-- GRADE RECORDS: Nilai Siswa
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL, -- e.g., 'UH1', 'UTS'
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  UNIQUE(date, student_id, subject_id, assessment_type)
);

-- JOURNAL ENTRIES: Jurnal Mengajar Guru
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

-- AGENDAS: Agenda/Rapat/Pengingat
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT DEFAULT '#6b7280',
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MATERIALS: Tautan Materi Pembelajaran
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENT NOTES: Catatan Wali Kelas/Guru
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

-- TEACHER ATTENDANCE: Absensi Guru (Geo-location)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tidak Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- HOLIDAYS: Daftar hari libur
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- SETTINGS: Global Settings (seperti active_school_year_id)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- --- 3. FUNCTIONS & TRIGGERS ---

-- Otomatis buat profil saat user daftar di Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi sakti untuk cek Admin tanpa loop RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- 4. VIEWS (Untuk mempermudah query aplikasi) ---

CREATE OR REPLACE VIEW attendance_history AS
SELECT 
    ar.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM attendance_records ar
JOIN students s ON ar.student_id = s.id
JOIN classes c ON ar.class_id = c.id
JOIN subjects sub ON ar.subject_id = sub.id
JOIN profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW grades_history AS
SELECT 
    gr.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    sub.kkm as subject_kkm,
    p.full_name as teacher_name
FROM grade_records gr
JOIN students s ON gr.student_id = s.id
JOIN classes c ON gr.class_id = c.id
JOIN subjects sub ON gr.subject_id = sub.id
JOIN profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW journal_entries_with_names AS
SELECT 
    je.*,
    c.name as "className",
    s.name as "subjectName"
FROM journal_entries je
JOIN classes c ON je.class_id = c.id
JOIN subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- --- 5. RLS POLICIES ---

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile." ON public.profiles FOR UPDATE USING (public.is_admin());

-- OTHER TABLES (Admin has full access, Teachers have restricted access)
-- Contoh untuk JOURNAL ENTRIES
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own journals" ON public.journal_entries
  FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Terapkan logika serupa untuk tabel lainnya...
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated users" ON public.students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.is_admin());

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated users" ON public.classes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.is_admin());

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated users" ON public.subjects FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON public.settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Managed by admin" ON public.settings FOR ALL USING (public.is_admin());