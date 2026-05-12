-- LakuKelas Database Schema V4.3
-- CLEAN RESET: Menghapus skema lama untuk memastikan konsistensi total
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNCTIONS (SECURITY DEFINER untuk memutus rekursi RLS)
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

-- 3. TABLES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  school_name TEXT DEFAULT 'Nama Sekolah Belum Diatur',
  school_address TEXT DEFAULT 'Alamat Sekolah Belum Diatur',
  headmaster_name TEXT DEFAULT 'Nama Kepala Sekolah',
  headmaster_nip TEXT DEFAULT '-',
  school_logo_url TEXT,
  role TEXT CHECK (role IN ('admin', 'teacher', 'headmaster')) DEFAULT 'teacher',
  is_homeroom_teacher BOOLEAN DEFAULT false
);

CREATE TABLE public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')) DEFAULT 'active',
  avatar_url TEXT
);

CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')) NOT NULL
);

CREATE TABLE public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  score NUMERIC NOT NULL
);

CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

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
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.schedule (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE
);

CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason TEXT,
  UNIQUE(teacher_id, date)
);

CREATE TABLE public.student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  note TEXT NOT NULL,
  type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')) DEFAULT 'neutral',
  date TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VIEWS
CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE VIEW public.grades_history AS
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

CREATE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 5. ADVANCED MONITORING FUNCTIONS (V4.3)

-- Helper: Get Indonesian Day Name from Date
CREATE OR REPLACE FUNCTION public.get_indo_day_name(p_date DATE)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE EXTRACT(DOW FROM p_date)
    WHEN 0 THEN 'Minggu'
    WHEN 1 THEN 'Senin'
    WHEN 2 THEN 'Selasa'
    WHEN 3 THEN 'Rabu'
    WHEN 4 THEN 'Kamis'
    WHEN 5 THEN 'Jumat'
    WHEN 6 THEN 'Sabtu'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: get_teacher_activity_counts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_teacher_attendance_summary (V4.3)
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate INTEGER
) AS $$
DECLARE
  v_policy TEXT;
  v_is_holiday BOOLEAN;
  v_day_name TEXT;
  v_expected_count BIGINT := 0;
  v_present_count BIGINT := 0;
  v_late_count BIGINT := 0;
BEGIN
  -- 1. Get current policy
  SELECT COALESCE(value, 'schedule_based') INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  
  -- 2. Check if holiday or weekend
  SELECT EXISTS (SELECT 1 FROM public.holidays WHERE date = p_date) INTO v_is_holiday;
  v_day_name := public.get_indo_day_name(p_date);
  
  -- 3. Calculate expected count based on policy
  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    v_expected_count := 0;
  ELSIF v_policy = 'schedule_based' THEN
    SELECT COUNT(DISTINCT teacher_id) INTO v_expected_count 
    FROM public.schedule 
    WHERE day = v_day_name;
  ELSE
    SELECT COUNT(*) INTO v_expected_count 
    FROM public.profiles 
    WHERE role IN ('teacher', 'headmaster');
  END IF;

  -- 4. Calculate actual attendance from teacher_attendance table
  SELECT COUNT(*) INTO v_present_count 
  FROM public.teacher_attendance 
  WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');

  SELECT COUNT(*) INTO v_late_count 
  FROM public.teacher_attendance 
  WHERE date = p_date AND status = 'Terlambat';

  -- 5. Return Results
  total_expected := v_expected_count;
  total_present := v_present_count;
  total_late := v_late_count;
  total_absent := CASE WHEN v_expected_count > v_present_count THEN v_expected_count - v_present_count ELSE 0 END;
  attendance_rate := CASE WHEN v_expected_count > 0 THEN ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100) ELSE 100 END;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS POLICIES (Bypassing recursion with is_admin function)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- General: Admin full access
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on school_years" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on classes" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on attendance" ON public.attendance_records FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on grades" ON public.grade_records FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on journals" ON public.journal_entries FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on agendas" ON public.agendas FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on schedule" ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on teacher_attendance" ON public.teacher_attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on notes" ON public.student_notes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on holidays" ON public.holidays FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on materials" ON public.materials FOR ALL USING (public.is_admin());

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- School Years
CREATE POLICY "Everyone can view active school year" ON public.school_years FOR SELECT USING (true);

-- Classes, Subjects, Students, Holidays
CREATE POLICY "Everyone can view basic data" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Everyone can view subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Everyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Everyone can view holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Everyone can view settings" ON public.settings FOR SELECT USING (true);

-- Teacher specific (Ownership)
CREATE POLICY "Teachers can manage their own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can view their own schedule" ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own teacher_attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Everyone can view materials" ON public.materials FOR SELECT USING (true);

-- 8. INITIAL SETTINGS
INSERT INTO public.settings (key, value) VALUES 
('attendance_latitude', '-6.2088'),
('attendance_longitude', '106.8456'),
('attendance_radius', '30'),
('attendance_check_in_start', '06:30'),
('attendance_check_in_deadline', '07:15'),
('attendance_policy', 'schedule_based')
ON CONFLICT (key) DO NOTHING;

-- 9. PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
