
-- LakuKelas Database Schema V4.5
-- Timezone: GMT+7 (Asia/Jakarta)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles (Guru & Admin)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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
  role TEXT DEFAULT 'teacher'::text,
  email TEXT,
  is_homeroom_teacher BOOLEAN DEFAULT false,
  phone_number TEXT
);

-- School Years
CREATE TABLE public.school_years (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false
);

-- Classes
CREATE TABLE public.classes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Subjects
CREATE TABLE public.subjects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Students
CREATE TABLE public.students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active'::text
);

-- Schedule
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

-- Attendance Records (Siswa)
CREATE TABLE public.attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  meeting_number INTEGER NOT NULL,
  status TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Grade Records (Siswa)
CREATE TABLE public.grade_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Journal Entries
CREATE TABLE public.journal_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- Agendas
CREATE TABLE public.agendas (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Teacher Attendance (Presensi Guru)
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT,
  reason TEXT
);

-- Holidays
CREATE TABLE public.holidays (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

-- Materials
CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Settings (Global K-V)
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Student Notes
CREATE TABLE public.student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral',
  date TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FUNCTIONS & RPC

-- Helper: Get Indo Day Name
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

-- RPC: Get Teacher Attendance Summary (V4.5 Verified)
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate NUMERIC
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_policy TEXT;
  v_day_name TEXT;
  v_is_holiday BOOLEAN;
  v_expected_count BIGINT := 0;
  v_present_count BIGINT := 0;
  v_late_count BIGINT := 0;
  v_absent_count BIGINT := 0;
BEGIN
  SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  
  IF v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  SELECT COUNT(DISTINCT p.id) INTO v_expected_count
  FROM profiles p
  WHERE p.role IN ('teacher', 'headmaster')
  AND (
    v_policy = 'daily_based' OR 
    (v_policy = 'schedule_based' AND EXISTS (
      SELECT 1 FROM schedule s 
      WHERE s.teacher_id = p.id AND s.day = v_day_name
    ))
  );

  SELECT COUNT(DISTINCT teacher_id) INTO v_present_count
  FROM teacher_attendance 
  WHERE date = p_date AND check_in IS NOT NULL;

  SELECT COUNT(DISTINCT teacher_id) INTO v_late_count
  FROM teacher_attendance 
  WHERE date = p_date AND status = 'Terlambat';

  v_absent_count := v_expected_count - (
    SELECT COUNT(DISTINCT teacher_id) 
    FROM teacher_attendance 
    WHERE date = p_date
  );
  
  IF v_absent_count < 0 THEN v_absent_count := 0; END IF;

  RETURN QUERY SELECT 
    v_expected_count, 
    v_present_count, 
    v_late_count, 
    v_absent_count,
    COALESCE(ROUND((v_present_count::NUMERIC / NULLIF(v_expected_count, 0)::NUMERIC) * 100, 1), 0);
END;
$$;

-- RPC: Diagnose logic
CREATE OR REPLACE FUNCTION public.diagnose_attendance_logic(p_date DATE)
RETURNS JSON AS $$
DECLARE
  v_day_name TEXT;
  v_policy TEXT;
  v_total_teachers INT;
  v_total_schedules INT;
  v_schedules_today INT;
  v_matching_teachers TEXT;
BEGIN
  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  SELECT COUNT(*) INTO v_total_teachers FROM public.profiles WHERE role IN ('teacher', 'headmaster');
  SELECT COUNT(*) INTO v_total_schedules FROM public.schedule;
  SELECT COUNT(*) INTO v_schedules_today FROM public.schedule WHERE day = v_day_name;
  SELECT string_agg(DISTINCT p.full_name, ', ') INTO v_matching_teachers
  FROM public.profiles p
  JOIN public.schedule s ON s.teacher_id = p.id
  WHERE s.day = v_day_name AND p.role IN ('teacher', 'headmaster');
  RETURN json_build_object('input_date', p_date, 'detected_day_name', v_day_name, 'active_policy', COALESCE(v_policy, 'schedule_based'), 'profiles_count', v_total_teachers, 'total_schedules_in_db', v_total_schedules, 'schedules_today_count', v_schedules_today, 'teachers_with_schedule_today', COALESCE(v_matching_teachers, 'NONE FOUND'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Teacher Activity Counts
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as teacher_id,
    (SELECT COUNT(DISTINCT meeting_number || '-' || date || '-' || class_id || '-' || subject_id) FROM attendance_records WHERE teacher_id = p.id) as attendance_count,
    (SELECT COUNT(DISTINCT assessment_type || '-' || date || '-' || class_id || '-' || subject_id) FROM grade_records WHERE teacher_id = p.id) as grades_count,
    (SELECT COUNT(*) FROM journal_entries WHERE teacher_id = p.id) as journal_count,
    (SELECT COUNT(DISTINCT class_id) FROM schedule WHERE teacher_id = p.id) as classes_handled_count
  FROM profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql;

-- 4. VIEWS
CREATE OR REPLACE VIEW journal_entries_with_names AS
SELECT je.*, c.name as "className", s.name as "subjectName"
FROM journal_entries je
JOIN classes c ON je.class_id = c.id
JOIN subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW attendance_history AS
SELECT 
    ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
    ar.status, ar.student_id, c.name as class_name, s.name as subject_name, p.full_name as teacher_name
FROM attendance_records ar
JOIN classes c ON ar.class_id = c.id
JOIN subjects s ON ar.subject_id = s.id
JOIN profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW grades_history AS
SELECT 
    gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
    gr.score, gr.student_id, c.name as class_name, s.name as subject_name, s.kkm as subject_kkm, p.full_name as teacher_name
FROM grade_records gr
JOIN classes c ON gr.class_id = c.id
JOIN subjects s ON gr.subject_id = s.id
JOIN profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW student_notes_with_teacher AS
SELECT sn.*, p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- 5. RLS POLICIES

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;

-- Profiles: Viewable by everyone, editable by owner
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Global Access for Headmaster & Admin
-- (Jalankan kebijakan RLS V4.6 untuk akses Headmaster)
CREATE POLICY "Headmaster and Admin can view all attendance" ON public.teacher_attendance 
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'headmaster')));

CREATE POLICY "Headmaster and Admin can view all schedules" ON public.schedule 
FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'headmaster')));

-- Other tables policies (simplified)
CREATE POLICY "Teachers can manage own records" ON public.journal_entries USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'headmaster')));
CREATE POLICY "Teachers can manage own attendance_records" ON public.attendance_records USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'headmaster')));
CREATE POLICY "Teachers can manage own grade_records" ON public.grade_records USING (auth.uid() = teacher_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'headmaster')));

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
