
-- LakuKelas V4.4 - FINAL STABLE SCHEMA (Timezone Aware & Optimized)

-- Reset (DANGER: Only for new installations)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  email TEXT,
  active_school_year_id UUID,
  is_homeroom_teacher BOOLEAN DEFAULT false,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT
);

CREATE TABLE public.school_years (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false
);

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) -- Homeroom Teacher
);

CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id)
);

CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE public.grade_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  assessment_type TEXT,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  learning_objectives TEXT,
  learning_activities TEXT,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id)
);

CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date TIMESTAMPTZ DEFAULT now(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral'))
);

CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT now(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- 3. FUNCTIONS & HELPERS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_indonesian_day_name_from_date(p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_day_num INT;
    v_days TEXT[] := ARRAY['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
BEGIN
    -- Force calculation relative to WIB
    v_day_num := EXTRACT(DOW FROM p_date AT TIME ZONE 'Asia/Jakarta');
    RETURN v_days[v_day_num + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. VIEWS
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
  je.*,
  c.name as "className",
  s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.*,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
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

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 5. COMPLEX FUNCTIONS (RPC)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public 
AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  SELECT value::UUID INTO v_active_year_id FROM settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM attendance_records ar 
     WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM grade_records gr 
     WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    (SELECT COUNT(*) 
     FROM journal_entries je 
     WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) 
     FROM schedule s 
     WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM
    profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$;

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
  v_is_holiday BOOLEAN;
  v_day_name TEXT;
  v_expected_count BIGINT;
  v_present_count BIGINT;
  v_late_count BIGINT;
  v_absent_count BIGINT;
  v_rate NUMERIC;
BEGIN
  -- 1. Settings
  SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Context
  SELECT EXISTS(SELECT 1 FROM holidays WHERE date = p_date) INTO v_is_holiday;
  v_day_name := public.get_indonesian_day_name_from_date(p_date);

  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  -- 3. Expected
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

  -- 4. Actual
  SELECT COUNT(*) INTO v_present_count
  FROM teacher_attendance 
  WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');

  SELECT COUNT(*) INTO v_late_count
  FROM teacher_attendance 
  WHERE date = p_date AND status = 'Terlambat';

  -- 5. Alpha
  SELECT COUNT(*) INTO v_absent_count
  FROM (
      SELECT p.id FROM profiles p
      WHERE p.role IN ('teacher', 'headmaster')
      AND (
        v_policy = 'daily_based' OR 
        (v_policy = 'schedule_based' AND EXISTS (
          SELECT 1 FROM schedule s WHERE s.teacher_id = p.id AND s.day = v_day_name
        ))
      )
  ) expected
  WHERE NOT EXISTS (
      SELECT 1 FROM teacher_attendance ta 
      WHERE ta.teacher_id = expected.id AND ta.date = p_date
  );

  -- 6. Rate
  v_rate := CASE WHEN v_expected_count > 0 THEN ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) ELSE 0 END;

  RETURN QUERY SELECT v_expected_count, v_present_count, v_late_count, v_absent_count, v_rate;
END;
$$;

CREATE OR REPLACE FUNCTION public.diagnose_attendance_logic(p_date DATE)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  v_day_name TEXT;
  v_policy TEXT;
  v_total_teachers INT;
  v_total_schedules INT;
  v_schedules_today INT;
  v_matching_teachers TEXT;
BEGIN
  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
  SELECT COUNT(*) INTO v_total_teachers FROM profiles WHERE role IN ('teacher', 'headmaster');
  SELECT COUNT(*) INTO v_total_schedules FROM schedule;
  SELECT COUNT(*) INTO v_schedules_today FROM schedule WHERE day = v_day_name;

  SELECT string_agg(DISTINCT p.full_name, ', ') INTO v_matching_teachers
  FROM profiles p
  JOIN schedule s ON s.teacher_id = p.id
  WHERE s.day = v_day_name AND p.role IN ('teacher', 'headmaster');

  RETURN json_build_object(
    'input_date', p_date,
    'detected_day_name', v_day_name,
    'active_policy', COALESCE(v_policy, 'schedule_based (default)'),
    'profiles_count', v_total_teachers,
    'total_schedules_in_db', v_total_schedules,
    'schedules_today_count', v_schedules_today,
    'teachers_with_schedule_today', COALESCE(v_matching_teachers, 'NONE FOUND')
  );
END;
$$;

-- 6. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'teacher'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RLS & PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 7.1 POLICIES (Simplified)
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ADMIN POLICIES
CREATE POLICY "Admin full access" ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access school_years" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access classes" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access schedule" ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access teacher_attendance" ON public.teacher_attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access holidays" ON public.holidays FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access settings" ON public.settings FOR ALL USING (public.is_admin());

-- TEACHER POLICIES
CREATE POLICY "Teachers can view their own data" ON public.schedule FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their journals" ON public.journal_entries FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their grades" ON public.grade_records FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their attendance" ON public.attendance_records FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their agendas" ON public.agendas FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their materials" ON public.materials FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their notes" ON public.student_notes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teachers can manage their attendance checkin" ON public.teacher_attendance FOR ALL USING (teacher_id = auth.uid());

-- FINAL GRANTS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
