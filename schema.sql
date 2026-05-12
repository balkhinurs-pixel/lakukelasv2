-- RESET: Hapus semua jika sudah ada untuk memastikan instalasi bersih
-- PERHATIAN: Ini akan menghapus data di database baru Anda.
DROP VIEW IF EXISTS journal_entries_with_names CASCADE;
DROP VIEW IF EXISTS grades_history CASCADE;
DROP VIEW IF EXISTS attendance_history CASCADE;
DROP VIEW IF EXISTS student_notes_with_teacher CASCADE;
DROP TABLE IF EXISTS student_notes CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS agendas CASCADE;
DROP TABLE IF EXISTS grade_records CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS schedule CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS school_years CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. TABEL PROFIL (DENGAN PERBAIKAN RLS RECURSION)
CREATE TABLE profiles (
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

-- FUNGSI PEMBANTU UNTUK CEK ADMIN (Tanpa Rekursi RLS)
-- SECURITY DEFINER membuat fungsi ini berjalan dengan hak akses sistem, mem-bypass RLS tabel itu sendiri.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AKTIFKAN RLS PADA PROFIL
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN PROFIL (SANGAT PENTING: JANGAN DIUBAH)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.check_is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING (public.check_is_admin());

-- 2. TABEL PENDUKUNG LAINNYA
CREATE TABLE school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL,
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT DEFAULT '#6b7280',
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'Tidak Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. VIEWS PINTAR (SANGAT BERGUNA UNTUK DASHBOARD)
CREATE VIEW attendance_history AS
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

CREATE VIEW grades_history AS
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

CREATE VIEW student_notes_with_teacher AS
SELECT 
  sn.*,
  p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- 4. OTOMATISASI PROFIL (TRIGGER SAAT REGISTER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. AKTIFKAN RLS PADA SEMUA TABEL
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES UNTUK ADMIN & GURU
-- Policy: Admin Bisa Segalanya
CREATE POLICY "Admins have full access on school_years" ON school_years TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on classes" ON classes TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on subjects" ON subjects TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on students" ON students TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on schedule" ON schedule TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on settings" ON settings TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on holidays" ON holidays TO authenticated USING (public.check_is_admin());
CREATE POLICY "Admins have full access on teacher_attendance" ON teacher_attendance TO authenticated USING (public.check_is_admin());

-- Policy: Guru Bisa Baca Data Dasar
CREATE POLICY "Teachers can view years" ON school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view classes" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view subjects" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view students" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view schedules" ON schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view holidays" ON holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can view settings" ON settings FOR SELECT TO authenticated USING (true);

-- Policy: Data Milik Sendiri (CRUD)
CREATE POLICY "Users can manage own attendance" ON attendance_records TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Users can manage own grades" ON grade_records TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Users can manage own agendas" ON agendas TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Users can manage own materials" ON materials TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Users can manage own notes" ON student_notes TO authenticated USING (teacher_id = auth.uid());
CREATE POLICY "Users can manage own teacher_attendance" ON teacher_attendance TO authenticated USING (teacher_id = auth.uid());

-- Policy: Wali Kelas Tambahan
CREATE POLICY "Homerooms can view their student notes" ON student_notes 
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM classes 
    WHERE classes.id = (SELECT class_id FROM students WHERE students.id = student_notes.student_id)
    AND classes.teacher_id = auth.uid()
  )
);
