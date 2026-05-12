-- LakuKelas Database Schema V4.3 (Stabil & Terintegrasi)
-- Menghapus skema lama dan membangun ulang struktur yang benar
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS (Diletakkan di awal agar bisa digunakan oleh RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER menjalankan fungsi dengan izin sistem
  -- Ini memutus loop rekursi RLS pada tabel profiles
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TABLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
  is_homeroom_teacher BOOLEAN DEFAULT false
);

CREATE TABLE public.school_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE public.grade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(teacher_id, date)
);

CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL
);

CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 4. VIEWS (Menyederhanakan Query di Aplikasi)
CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*, 
    c.name AS "className", 
    s.name AS "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE VIEW public.attendance_history AS
SELECT 
    ar.*, 
    c.name AS class_name, 
    s.name AS subject_name, 
    p.full_name AS teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE VIEW public.grades_history AS
SELECT 
    gr.*, 
    c.name AS class_name, 
    s.name AS subject_name, 
    s.kkm AS subject_kkm,
    p.full_name AS teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*, 
    p.full_name AS teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 5. RPC FUNCTIONS
-- Fungsi Statistik Aktivitas Guru (DISTINCT Per Sesi/Pertemuan & Beban Kelas)
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
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM public.attendance_records ar WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM public.grade_records gr WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    (SELECT COUNT(*) FROM public.journal_entries je WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) FROM public.schedule s WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi pembantu nama hari Indonesia
CREATE OR REPLACE FUNCTION public.get_indonesian_day_name_from_date(p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_day_num INT;
    v_days TEXT[] := ARRAY['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
BEGIN
    v_day_num := EXTRACT(DOW FROM p_date);
    RETURN v_days[v_day_num + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fungsi Ringkasan Kehadiran Guru (Berdasarkan Kebijakan & Alpha Otomatis)
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
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');
  SELECT EXISTS(SELECT 1 FROM public.holidays WHERE date = p_date) INTO v_is_holiday;
  v_day_name := public.get_indonesian_day_name_from_date(p_date);

  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  RETURN QUERY
  WITH expected_teachers AS (
    SELECT DISTINCT p.id FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster')
    AND (v_policy = 'daily_based' OR (v_policy = 'schedule_based' AND EXISTS (SELECT 1 FROM public.schedule s WHERE s.teacher_id = p.id AND s.day = v_day_name)))
  ),
  actual_attendance AS (
    SELECT teacher_id, status FROM public.teacher_attendance WHERE date = p_date
  )
  SELECT
    (SELECT COUNT(*) FROM expected_teachers) AS total_expected,
    (SELECT COUNT(*) FROM actual_attendance WHERE status IN ('Tepat Waktu', 'Terlambat')) AS total_present,
    (SELECT COUNT(*) FROM actual_attendance WHERE status = 'Terlambat') AS total_late,
    (SELECT COUNT(*) FROM expected_teachers et LEFT JOIN actual_attendance aa ON et.id = aa.teacher_id WHERE aa.teacher_id IS NULL) AS total_absent,
    COALESCE(ROUND((SELECT COUNT(*) FROM actual_attendance WHERE status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / NULLIF((SELECT COUNT(*) FROM expected_teachers), 0)::NUMERIC * 100, 1), 0) AS attendance_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER: New User Auth to Profile
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Profiles: Admin all, User read all, User update self
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- School Years: Admin all, Everyone read
CREATE POLICY "School years are viewable by everyone" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Admin can insert school years" ON public.school_years FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admin can update school years" ON public.school_years FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admin can delete school years" ON public.school_years FOR DELETE USING (public.is_admin());

-- Classes, Subjects, Students, Holidays: Admin all, Everyone read
CREATE POLICY "Roster viewable by everyone" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admin full access on classes" ON public.classes FOR ALL USING (public.is_admin());

CREATE POLICY "Subjects viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin full access on subjects" ON public.subjects FOR ALL USING (public.is_admin());

CREATE POLICY "Students viewable by everyone" ON public.students FOR SELECT USING (true);
CREATE POLICY "Admin full access on students" ON public.students FOR ALL USING (public.is_admin());

CREATE POLICY "Holidays viewable by everyone" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin full access on holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- Settings: Admin all, Everyone read
CREATE POLICY "Settings viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin full access on settings" ON public.settings FOR ALL USING (public.is_admin());

-- Schedule: Admin all, Everyone read
CREATE POLICY "Schedule viewable by everyone" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Admin full access on schedule" ON public.schedule FOR ALL USING (public.is_admin());

-- Journal, Attendance, Grades: Admin full, User own
CREATE POLICY "Teacher own journal" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teacher own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teacher own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teacher own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Agendas: User only own
CREATE POLICY "Teachers see only own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Teacher Attendance: User update/read own, Admin read all
CREATE POLICY "Teacher personal attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Student Notes: Everyone read, Teacher/Admin insert
CREATE POLICY "Notes viewable by everyone" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Teachers can insert notes" ON public.student_notes FOR INSERT WITH CHECK (auth.uid() = teacher_id OR public.is_admin());

-- 8. PERMISSIONS (GRANTS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL VIEWS IN SCHEMA public TO authenticated, anon, service_role;

-- 9. INITIAL DATA
INSERT INTO public.settings (key, value) VALUES 
('attendance_latitude', '-6.2088'),
('attendance_longitude', '106.8456'),
('attendance_radius', '30'),
('attendance_check_in_start', '06:30'),
('attendance_check_in_deadline', '07:15'),
('attendance_policy', 'schedule_based');