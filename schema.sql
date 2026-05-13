
-- LakuKelas V4.4 - Comprehensive Schema Setup (Timezone Aware & Robust Summary)
-- Root Schema Reference

-- 0. Cleanup
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;

-- 1. Helper Functions
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

-- 2. Base Tables
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meeting_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  assessment_type TEXT NOT NULL,
  score NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Views
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.id, ar.date, ar.meeting_number, ar.status, ar.student_id, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.id, gr.date, gr.assessment_type, gr.score, gr.student_id, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
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
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 4. Advanced Functions
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
  -- 1. Get Policy
  SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Day Info & Holiday Check
  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  SELECT EXISTS(SELECT 1 FROM holidays WHERE date = p_date) INTO v_is_holiday;

  -- 3. Weekend/Holiday Logic
  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  -- 4. Count Expected Presence
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

  -- 5. Count Present (Any check-in today)
  SELECT COUNT(*) INTO v_present_count
  FROM teacher_attendance 
  WHERE date = p_date AND check_in IS NOT NULL;

  -- 6. Count Late
  SELECT COUNT(*) INTO v_late_count
  FROM teacher_attendance 
  WHERE date = p_date AND status = 'Terlambat';

  -- 7. Count Absent (Alpha)
  v_absent_count := v_expected_count - (
    SELECT COUNT(DISTINCT teacher_id) 
    FROM teacher_attendance 
    WHERE date = p_date
  );
  
  IF v_absent_count < 0 THEN v_absent_count := 0; END IF;

  -- 8. Return Results
  RETURN QUERY SELECT 
    v_expected_count, 
    v_present_count, 
    v_late_count, 
    v_absent_count,
    COALESCE(ROUND((v_present_count::NUMERIC / NULLIF(v_expected_count, 0)::NUMERIC) * 100, 1), 0);
END;
$$;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
  RETURN json_build_object('input_date', p_date, 'detected_day_name', v_day_name, 'active_policy', COALESCE(v_policy, 'schedule_based (default)'), 'profiles_count', v_total_teachers, 'total_schedules_in_db', v_total_schedules, 'schedules_today_count', v_schedules_today, 'teachers_with_schedule_today', COALESCE(v_matching_teachers, 'NONE FOUND'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'teacher', new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see own, Admin sees all
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Settings: Admin full access, others read
CREATE POLICY "Settings viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin full access on settings" ON public.settings FOR ALL USING (public.is_admin());

-- School Years, Classes, Subjects: Admin full access, Teachers read
CREATE POLICY "School years viewable by everyone" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Admin manage school years" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Teachers can insert school years" ON public.school_years FOR INSERT WITH CHECK (true);

CREATE POLICY "Classes viewable by everyone" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Admin manage classes" ON public.classes FOR ALL USING (public.is_admin());

CREATE POLICY "Subjects viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Admin manage subjects" ON public.subjects FOR ALL USING (public.is_admin());

-- Students: Everyone read, Admin manage
CREATE POLICY "Students viewable by everyone" ON public.students FOR SELECT USING (true);
CREATE POLICY "Admin manage students" ON public.students FOR ALL USING (public.is_admin());

-- Schedule: Everyone read, Admin manage
CREATE POLICY "Schedule viewable by everyone" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Admin manage schedule" ON public.schedule FOR ALL USING (public.is_admin());

-- Attendance & Grade Records: Owners manage, Admin read
CREATE POLICY "Teacher manage own attendance records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admin read all attendance" ON public.attendance_records FOR SELECT USING (public.is_admin());

CREATE POLICY "Teacher manage own grade records" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admin read all grades" ON public.grade_records FOR SELECT USING (public.is_admin());

-- Journals: Owners manage, Admin read
CREATE POLICY "Teacher manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admin read all journals" ON public.journal_entries FOR SELECT USING (public.is_admin());

-- Student Notes: Everyone read, Teachers manage
CREATE POLICY "Student notes viewable by everyone" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Teachers can manage notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);

-- Teacher Attendance: Users manage own, Admin read all
CREATE POLICY "Users can manage own teacher attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admin view all teacher attendance" ON public.teacher_attendance FOR SELECT USING (public.is_admin() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'headmaster');

-- Holidays: Everyone read, Admin manage
CREATE POLICY "Holidays viewable by everyone" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- Materials: Everyone read, Teachers manage
CREATE POLICY "Materials viewable by everyone" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Teachers manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id);

-- Grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
