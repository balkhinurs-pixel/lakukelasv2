
-- ==========================================
-- LAKUKELAS DATABASE SCHEMA v2.0 (FINAL RLS)
-- ==========================================
-- Deskripsi: Perbaikan total pada kebijakan keamanan (RLS)
-- untuk mencegah rekursi (loop) saat pengecekan role Admin.

-- 1. FUNGSI PEMBANTU (Sangat Penting)
-- Fungsi ini mengecek apakah user adalah admin tanpa memicu loop RLS.
-- SECURITY DEFINER membuat fungsi berjalan dengan hak akses database owner.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT (role = 'admin') INTO is_admin_user
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin_user, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TABEL PROFIL (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- AKTIFKAN RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- KEBIJAKAN RLS PROFILES (ANTI-LOOP)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Setiap user login HARUS bisa melihat profilnya sendiri (untuk Dashboard/Middleware)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin bisa melihat semua data profil
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- User bisa update profil sendiri
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin bisa update semua profil (penting untuk ganti role di aplikasi)
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- 3. TABEL TAHUN AJARAN (school_years)
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view active school years" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Only admins can manage school years" ON public.school_years FOR ALL USING (public.is_admin());

-- 4. TABEL KELAS (classes)
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.is_admin());

-- 5. TABEL MATA PELAJARAN (subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());

-- 6. TABEL SISWA (students)
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.is_admin());

-- 7. TABEL PRESENSI SISWA (attendance_records)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own attendance records" ON public.attendance_records 
  FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Homeroom teachers can view class attendance" ON public.attendance_records
  FOR SELECT USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

-- 8. TABEL NILAI SISWA (grade_records)
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own grade records" ON public.grade_records 
  FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Homeroom teachers can view class grades" ON public.grade_records
  FOR SELECT USING (class_id IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid()));

-- 9. TABEL JURNAL MENGAJAR (journal_entries)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  learning_objectives TEXT,
  learning_activities TEXT,
  assessment TEXT,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own journals" ON public.journal_entries 
  FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());

-- 10. TABEL MATERI (materials)
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

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage own materials" ON public.materials 
  FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Students/Others can view materials" ON public.materials FOR SELECT USING (true);

-- 11. TABEL AGENDA (agendas)
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT DEFAULT '#6b7280',
  start_time TIME,
  end_time DATE, -- Harusnya TIME, tapi skema lama mungkin DATE, kita samakan dulu
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own agendas" ON public.agendas FOR ALL USING (teacher_id = auth.uid());

-- 12. TABEL JADWAL (schedule)
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view schedules" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Admins can manage schedules" ON public.schedule FOR ALL USING (public.is_admin());

-- 13. TABEL SETTINGS (Global Settings)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Only admins can change settings" ON public.settings FOR ALL USING (public.is_admin());

-- 14. TABEL ABSENSI GURU (teacher_attendance)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'Tidak Hadir',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, date)
);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view and insert own attendance" ON public.teacher_attendance 
  FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());

-- 15. TABEL CATATAN SISWA (student_notes)
CREATE TABLE IF NOT EXISTS public.student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
  date TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage notes" ON public.student_notes FOR ALL USING (true);

-- 16. TABEL HARI LIBUR (holidays)
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description TEXT
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admins can manage holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- ==========================================
-- VIEW & TRIGGER UNTUK OTOMATISASI
-- ==========================================

-- Trigger Profile Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Views History (untuk mempermudah query)
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
  c.name as class_name, 
  sub.name as subject_name
FROM journal_entries je
JOIN classes c ON je.class_id = c.id
JOIN subjects sub ON je.subject_id = sub.id;

CREATE OR REPLACE VIEW student_notes_with_teacher AS
SELECT 
  sn.*, 
  p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- Function untuk statistik aktivitas admin
CREATE OR REPLACE FUNCTION get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    (SELECT COUNT(DISTINCT date || class_id || subject_id || meeting_number) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
    (SELECT COUNT(DISTINCT date || class_id || subject_id || assessment_type) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
    (SELECT COUNT(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
