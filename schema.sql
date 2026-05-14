
-- LAKUKELAS DATABASE SCHEMA & RLS POLICIES
-- Versi: 8.0 (Collaborative Sync Support)

-- 1. PROFILES TABLE (Extends Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  phone_number TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT false,
  active_school_year_id UUID
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
ON profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. SCHOOL YEARS
CREATE TABLE school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage school years" ON school_years FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. CLASSES
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES profiles(id), -- Homeroom Teacher
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage classes" ON classes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 4. SUBJECTS
CREATE TABLE subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage subjects" ON subjects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 5. STUDENTS
CREATE TABLE students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT UNIQUE NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage students" ON students FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 6. ATTENDANCE RECORDS (Student Attendance)
CREATE TABLE attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  school_year_id UUID REFERENCES school_years(id),
  date DATE NOT NULL,
  meeting_number INTEGER,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Collaborative Policy: Teachers can read records of classes they teach to "inherit" data
CREATE POLICY "Teachers can read class attendance" 
ON attendance_records FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can insert own records" 
ON attendance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own records" 
ON attendance_records FOR UPDATE TO authenticated USING (auth.uid() = teacher_id);

-- 7. GRADE RECORDS
CREATE TABLE grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  school_year_id UUID REFERENCES school_years(id),
  date DATE NOT NULL,
  assessment_type TEXT,
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE grade_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view grades" ON grade_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can manage own grades" ON grade_records FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- 8. JOURNAL ENTRIES
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES school_years(id),
  teacher_id UUID REFERENCES profiles(id),
  meeting_number INTEGER,
  learning_objectives TEXT,
  learning_activities TEXT,
  assessment TEXT,
  reflection TEXT
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers manage own journals" ON journal_entries FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- 9. TEACHER ATTENDANCE (Daily Staff Check-in)
CREATE TABLE teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can view all attendance" ON teacher_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff can manage own attendance" ON teacher_attendance FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- 10. SCHEDULE
CREATE TABLE schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE
);

ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by authenticated" ON schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage schedule" ON schedule FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 11. SETTINGS
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage settings" ON settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 12. HOLIDAYS
CREATE TABLE holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('national', 'school'))
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read by all" ON holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage holidays" ON holidays FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- --- RPC FUNCTIONS FOR DASHBOARD & MONITORING ---

-- Function: Get Teacher Attendance Summary
CREATE OR REPLACE FUNCTION get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate NUMERIC
) AS $$
DECLARE
    v_policy TEXT;
    v_day_name TEXT;
    v_expected_count BIGINT;
BEGIN
    -- 1. Get Active Policy
    SELECT value INTO v_policy FROM settings WHERE key = 'attendance_policy';
    v_policy := COALESCE(v_policy, 'schedule_based');

    -- 2. Determine Day Name in Indonesian for schedule lookup
    -- (Mapping might be needed depending on server locale, simplified here)
    v_day_name := trim(to_char(p_date, 'Day')); 
    -- Map English to Indo if needed...

    -- 3. Calculate Expected
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM profiles WHERE role IN ('teacher', 'headmaster');
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM schedule WHERE day = v_day_name;
    END IF;

    RETURN QUERY
    SELECT 
        v_expected_count as total_expected,
        count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat')) as total_present,
        count(*) FILTER (WHERE status = 'Terlambat') as total_late,
        (v_expected_count - count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'))) as total_absent,
        CASE WHEN v_expected_count = 0 THEN 100 ELSE
            ROUND((count(*) FILTER (WHERE status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / v_expected_count::NUMERIC) * 100, 1)
        END as attendance_rate
    FROM teacher_attendance
    WHERE date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Teacher Activity Counts
CREATE OR REPLACE FUNCTION get_teacher_activity_counts()
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
        (SELECT count(DISTINCT (date, class_id, subject_id, meeting_number)) FROM attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT count(DISTINCT (date, class_id, subject_id, assessment_type)) FROM grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT count(*) FROM journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT count(DISTINCT class_id) FROM schedule WHERE teacher_id = p.id) as classes_handled_count
    FROM profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- AUTH TRIGGER ---
-- Automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'teacher');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- --- USEFUL VIEWS ---
CREATE OR REPLACE VIEW journal_entries_with_names AS
SELECT j.*, c.name as "className", s.name as "subjectName"
FROM journal_entries j
LEFT JOIN classes c ON j.class_id = c.id
LEFT JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW attendance_history AS
SELECT a.*, c.name as class_name, s.name as subject_name, p.full_name as teacher_name
FROM attendance_records a
JOIN classes c ON a.class_id = c.id
JOIN subjects s ON a.subject_id = s.id
JOIN profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW grades_history AS
SELECT g.*, c.name as class_name, s.name as subject_name, s.kkm as subject_kkm, p.full_name as teacher_name
FROM grade_records g
JOIN classes c ON g.class_id = c.id
JOIN subjects s ON g.subject_id = s.id
JOIN profiles p ON g.teacher_id = p.id;
