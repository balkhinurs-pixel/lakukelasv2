-- LakuKelas Database Schema
-- Version: 4.5 (Final Stable Attendance Logic)
-- Description: Modern classroom management system for Indonesian teachers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores both teachers, headmasters and admins
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_homeroom_teacher BOOLEAN DEFAULT false,
    -- School data (mostly for Admin profile, used for report headers)
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT
);

-- 2. SCHOOL YEARS TABLE
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL, -- e.g., "2023/2024 - Ganjil"
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Homeroom teacher
);

-- 4. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 5. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    avatar_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive'))
);

-- 6. ATTENDANCE RECORDS TABLE (Student Attendance)
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- 7. GRADE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.grade_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL, -- e.g., "UH1", "UTS", "UAS"
    score NUMERIC CHECK (score >= 0 AND score <= 100)
);

-- 8. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT
);

-- 9. AGENDAS TABLE (Personal teacher notes/reminders)
CREATE TABLE IF NOT EXISTS public.agendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME
);

-- 10. SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE
);

-- 11. STUDENT NOTES TABLE
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. TEACHER ATTENDANCE (Personal check-in/out)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT DEFAULT 'Tepat Waktu' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- 13. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 14. HOLIDAYS TABLE
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT
);

-- 15. MATERIALS TABLE
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- RLS POLICIES (Row Level Security)

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
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (role = 'admin')
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Generic Policies for Teacher/Admin owned data
-- School Years
CREATE POLICY "Viewable by authenticated" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Manageable by admin" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Insertable by admin" ON public.school_years FOR INSERT WITH CHECK (public.is_admin());

-- Classes
CREATE POLICY "Viewable by authenticated classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Manageable by admin classes" ON public.classes FOR ALL USING (public.is_admin());

-- Students
CREATE POLICY "Viewable by authenticated students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Manageable by admin students" ON public.students FOR ALL USING (public.is_admin());

-- Subjects
CREATE POLICY "Viewable by authenticated subjects" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Manageable by admin subjects" ON public.subjects FOR ALL USING (public.is_admin());

-- Teacher Owned Data (Attendance, Grades, Journal, Agenda, Schedule, Materials)
CREATE POLICY "Teachers can manage own records" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own grade records" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Teachers can manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Student Notes (Visible to all teachers to foster collaboration)
CREATE POLICY "Teachers can view all student notes" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Teachers can manage own student notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Settings & Holidays (Public read, Admin manage)
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Settings are manageable by admin" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Holidays are viewable by everyone" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Holidays are manageable by admin" ON public.holidays FOR ALL USING (public.is_admin());

-- VIEWS FOR EASY DATA ACCESS

-- Journal entries with class and subject names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

-- Attendance records with full details
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records a
JOIN public.students s ON a.student_id = s.id
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects sub ON a.subject_id = sub.id
JOIN public.profiles p ON a.teacher_id = p.id;

-- Grade records with full details
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    sub.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records g
JOIN public.students s ON g.student_id = s.id
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects sub ON g.subject_id = sub.id
JOIN public.profiles p ON g.teacher_id = p.id;

-- Student notes with teacher names
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- FUNCTIONS & TRIGGERS

-- Automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FUNCTIONS FOR DASHBOARD AND ANALYTICS

-- Function to get activity counts per teacher
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
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records WHERE teacher_id = p.id) as attendance_count,
        (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records WHERE teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM public.journal_entries WHERE teacher_id = p.id) as journal_count,
        (SELECT COUNT(*) FROM public.classes WHERE teacher_id = p.id) as classes_handled_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for Indonesian day names
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

-- Final Stable Attendance Summary Function (V4.5)
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
  -- 1. Ambil kebijakan
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');

  -- 2. Identifikasi hari
  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  
  -- 3. Cek Libur
  IF v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;

  -- 4. Hitung Wajib Hadir (Expected)
  SELECT COUNT(DISTINCT p.id) INTO v_expected_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster')
  AND (
    v_policy = 'daily_based' OR 
    (v_policy = 'schedule_based' AND EXISTS (
      SELECT 1 FROM public.schedule s 
      WHERE s.teacher_id = p.id AND s.day = v_day_name
    ))
  );

  -- 5. Hitung Yang Hadir (Present)
  SELECT COUNT(DISTINCT teacher_id) INTO v_present_count
  FROM public.teacher_attendance 
  WHERE date = p_date AND check_in IS NOT NULL;

  -- 6. Hitung Yang Terlambat
  SELECT COUNT(DISTINCT teacher_id) INTO v_late_count
  FROM public.teacher_attendance 
  WHERE date = p_date AND status = 'Terlambat';

  -- 7. Hitung Tanpa Keterangan (Alpha)
  v_absent_count := v_expected_count - (
    SELECT COUNT(DISTINCT teacher_id) 
    FROM public.teacher_attendance 
    WHERE date = p_date
  );
  
  IF v_absent_count < 0 THEN v_absent_count := 0; END IF;

  -- 8. Kembalikan hasil
  RETURN QUERY SELECT 
    v_expected_count, 
    v_present_count, 
    v_late_count, 
    v_absent_count,
    COALESCE(ROUND((v_present_count::NUMERIC / NULLIF(v_expected_count, 0)::NUMERIC) * 100, 1), 0);
END;
$$;

-- Diagnostic function for debugging
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
