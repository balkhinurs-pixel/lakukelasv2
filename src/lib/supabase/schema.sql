-- ==========================================
-- LAKUKELAS DATABASE SCHEMA v3.8 (Activity Refined)
-- ==========================================
-- Deskripsi: Menghapus rekursi RLS, memperbaiki trigger profil,
-- dan mengoptimalkan perhitungan aktivitas guru (berbasis sesi).

-- 0. CLEANUP (Nuclear Reset)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 1. PROFILES TABLE
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  email TEXT,
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
  is_homeroom_teacher BOOLEAN DEFAULT FALSE,
  active_school_year_id UUID
);

-- 2. SCHOOL YEARS TABLE
CREATE TABLE public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SETTINGS TABLE (Global App Settings)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLASSES TABLE
CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUBJECTS TABLE
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STUDENTS TABLE
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ATTENDANCE RECORDS
CREATE TABLE public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meeting_number INTEGER,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. GRADE RECORDS
CREATE TABLE public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. JOURNAL ENTRIES
CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ DEFAULT NOW(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT,
  learning_activities TEXT,
  assessment TEXT,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AGENDAS
CREATE TABLE public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HOLIDAYS
CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TEACHER ATTENDANCE (Personal)
CREATE TABLE public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

-- 13. STUDENT NOTES
CREATE TABLE public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MATERIALS
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

-- 15. SCHEDULE
CREATE TABLE public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- VIEWS FOR EASY REPORTING
-- ==========================================

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.id, ar.date, ar.meeting_number, ar.status, ar.student_id,
    ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
    s.name as student_name, c.name as class_name, sub.name as subject_name, p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.students s ON ar.student_id = s.id
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects sub ON ar.subject_id = sub.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.id, gr.date, gr.assessment_type, gr.score, gr.student_id,
    gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
    s.name as student_name, c.name as class_name, sub.name as subject_name, sub.kkm as subject_kkm, p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.students s ON gr.student_id = s.id
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects sub ON gr.subject_id = sub.id
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
JOIN public.profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- SECURITY & ACCESS CONTROL (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- NON-RECURSIVE ADMIN CHECK
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLICIES: PROFILES
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (is_admin());

-- POLICIES: GENERAL (ADMIN & TEACHER)
-- Admin can do everything, teachers can read all but modify their own or related data
CREATE POLICY "admin_all_access" ON public.school_years FOR ALL USING (is_admin());
CREATE POLICY "teacher_read_years" ON public.school_years FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_classes" ON public.classes FOR ALL USING (is_admin());
CREATE POLICY "teacher_read_classes" ON public.classes FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_subjects" ON public.subjects FOR ALL USING (is_admin());
CREATE POLICY "teacher_read_subjects" ON public.subjects FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_students" ON public.students FOR ALL USING (is_admin());
CREATE POLICY "teacher_read_students" ON public.students FOR SELECT USING (TRUE);

CREATE POLICY "admin_all_attendance" ON public.attendance_records FOR ALL USING (is_admin());
CREATE POLICY "teacher_attendance_ops" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_grades" ON public.grade_records FOR ALL USING (is_admin());
CREATE POLICY "teacher_grades_ops" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_journals" ON public.journal_entries FOR ALL USING (is_admin());
CREATE POLICY "teacher_journals_ops" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_agendas" ON public.agendas FOR ALL USING (is_admin());
CREATE POLICY "teacher_agendas_ops" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_teacher_att" ON public.teacher_attendance FOR ALL USING (is_admin());
CREATE POLICY "teacher_att_ops" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_materials" ON public.materials FOR ALL USING (is_admin());
CREATE POLICY "teacher_materials_ops" ON public.materials FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "admin_all_schedule" ON public.schedule FOR ALL USING (is_admin());
CREATE POLICY "teacher_read_schedule" ON public.schedule FOR SELECT USING (TRUE);

-- SETTINGS & HOLIDAYS
CREATE POLICY "anyone_read_settings" ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY "admin_all_settings" ON public.settings FOR ALL USING (is_admin());
CREATE POLICY "anyone_read_holidays" ON public.holidays FOR SELECT USING (TRUE);
CREATE POLICY "admin_all_holidays" ON public.holidays FOR ALL USING (is_admin());

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- #1. REFINED ACTIVITY MONITORING (BY SESSIONS)
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
    -- Hitung Sesi Presensi (Grup: Tgl + Kelas + Mapel + Pertemuan)
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM public.attendance_records ar WHERE ar.teacher_id = p.id) AS attendance_count,
    -- Hitung Set Penilaian (Grup: Tgl + Kelas + Mapel + Jenis Penilaian)
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM public.grade_records gr WHERE gr.teacher_id = p.id) AS grades_count,
    -- Hitung Jurnal (Per Entri)
    (SELECT COUNT(*) 
     FROM public.journal_entries je WHERE je.teacher_id = p.id) AS journal_count
  FROM
    public.profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- #2. AUTO PROFILE CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER ON AUTH.USERS
-- Catatan: Jika trigger ini sudah ada, pastikan dihapus dulu di dashboard jika menjalankan skrip ini berkali-kali.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- #3. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;