-- ---------------------------------------------------------------------
-- 1. EXTENSIONS
-- ---------------------------------------------------------------------
-- Enable the "pg_cron" extension for scheduled tasks
-- create extension if not exists pg_cron with schema extensions;

-- Enable the "http" extension for making HTTP requests
-- create extension if not exists http with schema extensions;


-- ---------------------------------------------------------------------
-- 2. CREATE TABLES
-- ---------------------------------------------------------------------

-- Table for user profiles, extending the built-in auth.users table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    full_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    account_status TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'teacher',
    active_school_year_id UUID,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- Table for school years
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for active_school_year_id after school_years table is created
ALTER TABLE public.profiles
ADD CONSTRAINT fk_active_school_year
FOREIGN KEY (active_school_year_id)
REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Table for classes
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table for subjects
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    kkm NUMERIC(5, 2) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for students
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT NOT NULL UNIQUE,
    gender TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, graduated, dropout, inactive
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for attendance records
CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for grade records
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for journal entries
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for teacher schedule
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for personal agendas
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table for student-specific notes from teachers
CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'neutral' -- 'positive', 'improvement', 'neutral'
);

-- Table for system settings
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Table for teacher daily attendance (geolocation based)
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIME,
    check_out_time TIME,
    check_in_status TEXT, -- 'Tepat Waktu', 'Terlambat'
    check_in_location JSONB,
    check_out_location JSONB,
    UNIQUE(teacher_id, date)
);


-- ---------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & VIEWS
-- ---------------------------------------------------------------------

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_name_from_meta TEXT;
  avatar_from_meta TEXT;
BEGIN
  -- Extract full_name from metadata, if available
  full_name_from_meta := new.raw_user_meta_data ->> 'full_name';
  avatar_from_meta := new.raw_user_meta_data ->> 'avatar_url';

  -- If full_name is not available (e.g., manual sign-up), create a default name from email
  IF full_name_from_meta IS NULL OR full_name_from_meta = '' THEN
    full_name_from_meta := split_part(new.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    full_name_from_meta,
    new.email,
    avatar_from_meta,
    'teacher' -- Default role for new users
  );
  RETURN new;
END;
$$;


-- View for attendance history with class and subject names
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.meeting_number,
    a.records,
    a.teacher_id,
    c.name AS className,
    s.name AS subjectName,
    EXTRACT(MONTH FROM a.date) AS month
FROM 
    public.attendance a
JOIN 
    public.classes c ON a.class_id = c.id
JOIN 
    public.subjects s ON a.subject_id = s.id;

-- View for grades history with class and subject names/kkm
CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.assessment_type,
    g.records,
    g.teacher_id,
    c.name AS className,
    s.name AS subjectName,
    s.kkm AS subjectKkm,
    EXTRACT(MONTH FROM g.date) AS month
FROM 
    public.grades g
JOIN 
    public.classes c ON g.class_id = c.id
JOIN 
    public.subjects s ON g.subject_id = s.id;

-- View for journal entries with class and subject names
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    j.id,
    j.date,
    j.class_id,
    j.subject_id,
    j.school_year_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    c.name AS className,
    s.name AS subjectName,
    EXTRACT(MONTH FROM j.date) AS month
FROM 
    public.journal_entries j
JOIN 
    public.classes c ON j.class_id = c.id
JOIN 
    public.subjects s ON j.subject_id = s.id;

-- View for student notes with teacher's name
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.date,
    sn.note,
    sn.type,
    p.full_name AS teacher_name
FROM 
    public.student_notes sn
JOIN 
    public.profiles p ON sn.teacher_id = p.id;

-- View for students with class name
CREATE OR REPLACE VIEW public.students_with_class_name AS
SELECT 
    s.id,
    s.name,
    s.nis,
    s.gender,
    s.class_id,
    s.status,
    s.avatar_url,
    s.created_at,
    c.name AS class_name
FROM
    public.students s
LEFT JOIN
    public.classes c ON s.class_id = c.id;

-- View for teacher attendance history with names
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT 
    ta.id,
    ta.teacher_id as teacherId,
    p.full_name as teacherName,
    ta.date,
    ta.check_in_time AS "checkIn",
    ta.check_out_time AS "checkOut",
    ta.check_in_status AS status
FROM
    public.teacher_attendance ta
JOIN
    public.profiles p ON ta.teacher_id = p.id;

-- ---------------------------------------------------------------------
-- 4. DATABASE FUNCTIONS (RPC)
-- ---------------------------------------------------------------------

-- Function to get a student's complete grade ledger
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id UUID)
RETURNS TABLE(id UUID, subjectName TEXT, assessment_type TEXT, date DATE, score NUMERIC, kkm NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    s.name as subjectName,
    g.assessment_type,
    g.date,
    (r.value->>'score')::numeric as score,
    s.kkm
  FROM 
    public.grades g,
    jsonb_array_elements(g.records) r
  JOIN
    public.subjects s ON g.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY 
    g.date DESC;
END;
$$;

-- Function to get a student's complete attendance ledger
CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id UUID)
RETURNS TABLE(id UUID, subjectName TEXT, date DATE, meeting_number INT, status TEXT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    s.name as subjectName,
    a.date,
    a.meeting_number,
    r.value->>'status' as status
  FROM
    public.attendance a,
    jsonb_array_elements(a.records) r
  JOIN
    public.subjects s ON a.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY
    a.date DESC;
END;
$$;

-- Function to get student performance stats for a class
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id UUID)
RETURNS TABLE(id UUID, name TEXT, nis TEXT, average_grade NUMERIC, attendance_percentage INT)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      AVG((r.value->>'score')::numeric) AS avg_score
    FROM
      grades g,
      jsonb_array_elements(g.records) r
    WHERE
      g.class_id = p_class_id
    GROUP BY
      student_id
  ),
  student_attendance AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      COUNT(*) AS total_records,
      SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) AS hadir_count
    FROM
      attendance a,
      jsonb_array_elements(a.records) r
    WHERE
      a.class_id = p_class_id
    GROUP BY
      student_id
  )
  SELECT
    st.id,
    st.name,
    st.nis,
    COALESCE(ROUND(sg.avg_score, 1), 0) AS average_grade,
    COALESCE((sa.hadir_count * 100 / sa.total_records), 0)::int AS attendance_percentage
  FROM
    students st
  LEFT JOIN
    student_grades sg ON st.id = sg.student_id
  LEFT JOIN
    student_attendance sa ON st.id = sa.student_id
  WHERE
    st.class_id = p_class_id AND st.status = 'active';
END;
$$;


-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;


-- Policies for 'profiles' table
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers can view other teachers' basic info" ON public.profiles FOR SELECT USING (role = 'teacher');


-- Policies for 'classes' table
CREATE POLICY "Authenticated users can view all classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can do all operations on classes" ON public.classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'subjects' table
CREATE POLICY "Authenticated users can view all subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can do all operations on subjects" ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'students' table
CREATE POLICY "Authenticated users can view all students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can do all operations on students" ON public.students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'attendance', 'grades', 'journal_entries'
CREATE POLICY "Teachers can manage their own records" ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own records" ON public.grades FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own records" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

-- Policies for 'schedule'
CREATE POLICY "Teachers can view their own schedule" ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all schedules" ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'agendas'
CREATE POLICY "Users can manage their own agenda" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

-- Policies for 'student_notes'
CREATE POLICY "Teachers can manage their own notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Homeroom teacher can view notes for their students" ON public.student_notes FOR SELECT USING (
    (SELECT class_id FROM public.students WHERE id = student_id) IN (SELECT id FROM public.classes WHERE teacher_id = auth.uid())
);
CREATE POLICY "Admin can view all notes" ON public.student_notes FOR SELECT USING (public.is_admin());

-- Policies for 'school_years' and 'settings'
CREATE POLICY "Authenticated users can view school years and settings" ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view school years and settings" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage school years and settings" ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admin can manage school years and settings" ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Policies for 'teacher_attendance'
CREATE POLICY "Teachers can manage their own attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admin can view all teacher attendance" ON public.teacher_attendance FOR SELECT USING (public.is_admin());


-- ---------------------------------------------------------------------
-- 6. DATABASE TRIGGERS
-- ---------------------------------------------------------------------

-- Trigger to create a profile on new user sign-up
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update student status to inactive if their class is deleted
-- This is a soft-delete mechanism to preserve student data.
-- CREATE OR REPLACE FUNCTION public.handle_class_delete()
-- RETURNS TRIGGER
-- LANGUAGE plpgsql
-- AS $$
-- BEGIN
--   UPDATE public.students
--   SET status = 'inactive', class_id = NULL
--   WHERE class_id = OLD.id;
--   RETURN OLD;
-- END;
-- $$;

-- CREATE TRIGGER on_class_deleted
-- AFTER DELETE ON public.classes
-- FOR EACH ROW
-- EXECUTE FUNCTION public.handle_class_delete();
