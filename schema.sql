
-- LakuKelas Database Schema V4.4
-- Berada di root directory untuk konsistensi referensi.

-- Reset Schema (Gunakan dengan hati-hati!)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- #0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- #1. Table: Profiles (User accounts)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT UNIQUE,
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
  role TEXT CHECK (role IN ('admin', 'teacher', 'headmaster')) DEFAULT 'teacher',
  is_homeroom_teacher BOOLEAN DEFAULT false,
  active_school_year_id UUID
);

-- #2. Table: School Years
CREATE TABLE public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  teacher_id UUID REFERENCES public.profiles(id)
);

-- #3. Table: Classes
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) -- Wali Kelas
);

-- #4. Table: Subjects
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id)
);

-- #5. Table: Students
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')) DEFAULT 'active',
  avatar_url TEXT
);

-- #6. Table: Attendance Records (Students)
CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  meeting_number INTEGER,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) DEFAULT 'Hadir'
);

-- #7. Table: Grade Records (Students)
CREATE TABLE public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  score NUMERIC DEFAULT 0
);

-- #8. Table: Journal Entries
CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  meeting_number INTEGER,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

-- #9. Table: Agendas
CREATE TABLE public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT DEFAULT '#6b7280',
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- #10. Table: Weekly Schedule
CREATE TABLE public.schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- #11. Table: Teacher Attendance
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason TEXT,
  UNIQUE(teacher_id, date)
);

-- #12. Table: Holidays
CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

-- #13. Table: Student Notes
CREATE TABLE public.student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')) DEFAULT 'neutral',
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- #14. Table: Materials (Teaching resources)
CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL
);

-- #15. Table: Settings (Global configuration)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- #16. View: Journal Entries with Names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
  je.*,
  c.name as "className",
  s.name as "subjectName"
FROM public.journal_entries je
LEFT JOIN public.classes c ON je.class_id = c.id
LEFT JOIN public.subjects s ON je.subject_id = s.id;

-- #17. View: Attendance History
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
  ar.id,
  ar.date,
  ar.meeting_number,
  ar.class_id,
  ar.subject_id,
  ar.teacher_id,
  ar.school_year_id,
  ar.status,
  ar.student_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

-- #18. View: Grades History
CREATE OR REPLACE VIEW public.grades_history AS
SELECT
  gr.id,
  gr.date,
  gr.assessment_type,
  gr.class_id,
  gr.subject_id,
  gr.teacher_id,
  gr.school_year_id,
  gr.score,
  gr.student_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- #19. View: Student Notes with Teacher Name
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
  sn.*,
  p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- FUNCTIONS & LOGIC
-- ==========================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Handle new user creation (Trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get Indonesian Day Name from Date (Force GMT+7 Logic)
CREATE OR REPLACE FUNCTION public.get_indonesian_day_name_from_date(p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_day_num INT;
    v_days TEXT[] := ARRAY['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
BEGIN
    -- Gunakan timezone Indonesia agar hari yang dihitung tepat
    v_day_num := EXTRACT(DOW FROM (p_date AT TIME ZONE 'Asia/Jakarta'));
    RETURN v_days[v_day_num + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Admin Dashboard: Attendance Summary with Intelligent Policy Logic
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate NUMERIC
) AS $$
DECLARE
  v_policy TEXT;
  v_is_holiday BOOLEAN;
  v_day_name TEXT;
BEGIN
  -- 1. Ambil kebijakan yang berlaku dari settings
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Cek apakah hari libur atau Minggu
  SELECT EXISTS(SELECT 1 FROM public.holidays WHERE date = p_date) INTO v_is_holiday;
  v_day_name := public.get_indonesian_day_name_from_date(p_date);

  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH expected_teachers AS (
    -- Ambil semua guru/kepsek yang harus hadir
    SELECT DISTINCT p.id
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster')
    AND (
      v_policy = 'daily_based' OR 
      (v_policy = 'schedule_based' AND EXISTS (
        SELECT 1 FROM public.schedule s 
        WHERE s.teacher_id = p.id AND s.day = v_day_name
      ))
    )
  ),
  actual_attendance AS (
    -- Hitung siapa saja yang sudah absen (Hadir/Terlambat)
    SELECT teacher_id, status 
    FROM public.teacher_attendance 
    WHERE date = p_date 
    AND status IN ('Tepat Waktu', 'Terlambat')
  )
  SELECT
    (SELECT COUNT(*) FROM expected_teachers) AS total_expected,
    (SELECT COUNT(*) FROM actual_attendance) AS total_present,
    (SELECT COUNT(*) FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat') AS total_late,
    (
      -- Guru yang diharapkan hadir tapi tidak ada rekaman absen masuk
      SELECT COUNT(*) 
      FROM expected_teachers et
      WHERE NOT EXISTS (
        SELECT 1 FROM public.teacher_attendance ta 
        WHERE ta.teacher_id = et.id AND ta.date = p_date AND ta.check_in IS NOT NULL
      )
    ) AS total_absent,
    COALESCE(
      ROUND(
        (SELECT COUNT(*) FROM actual_attendance)::NUMERIC / 
        NULLIF((SELECT COUNT(*) FROM expected_teachers), 0)::NUMERIC * 100, 
        1
      ), 
      0
    ) AS attendance_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Monitoring: Teacher Activity Counts
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  -- Ambil ID Tahun Ajaran aktif
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records ar WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records gr WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    (SELECT COUNT(*) FROM public.journal_entries je WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) FROM public.schedule s WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- RLS POLICIES & SECURITY
-- ==========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Viewable by anyone, editable by owner or admin
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles updated by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Default Policies: Admin full access, others restricted
CREATE POLICY "Admin full access on school_years" ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "School years viewable by authenticated" ON public.school_years FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on classes" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Classes viewable by authenticated" ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Students viewable by authenticated" ON public.students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Subjects viewable by authenticated" ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin full access on schedule" ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Schedule viewable by owner" ON public.schedule FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

CREATE POLICY "Admin full access on teacher_attendance" ON public.teacher_attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Teachers can record their own attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admin full access on settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Settings viewable by authenticated" ON public.settings FOR SELECT TO authenticated USING (true);

-- Records Policies
CREATE POLICY "Teachers can manage their own records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage their own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage their own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage their own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage their own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
