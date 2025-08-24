-- Classroom Zephyr - Supabase Schema
-- version: 1.6

-- 1. Enable RLS
ALTER DATABASE postgres SET "app.settings.jwt_claims" = '{"role": "role"}';

-- 2. Create Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    updated_at timestamp with time zone,
    full_name text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status text DEFAULT 'Pro'::text,
    role text DEFAULT 'teacher'::text,
    email text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid NOT NULL,
    status text DEFAULT 'active'::text,
    avatar_url text
);

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text,
    date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL
);

-- 3. Add Foreign Key Constraints
-- Drop existing constraints first to make the script idempotent
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_class_id_fkey;
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_subject_id_fkey;
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_teacher_id_fkey;
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_id_fkey;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_teacher_id_fkey;
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_teacher_id_fkey;
ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_student_id_fkey;
ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_teacher_id_fkey;
ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;
ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_subject_id_fkey;
ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_class_id_fkey;
ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_teacher_id_fkey;

-- Add new constraints
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. Create Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher',
    'Pro'
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- 5. Create Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update access" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin full access" ON public.profiles;

DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.classes;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.students;
DROP POLICY IF EXISTS "Allow all access to authenticated users" ON public.school_years;
DROP POLICY IF EXISTS "Allow all access to admin" ON public.settings;

DROP POLICY IF EXISTS "Allow individual access" ON public.journal_entries;
DROP POLICY IF EXISTS "Allow admin full access" ON public.journal_entries;

DROP POLICY IF EXISTS "Allow individual access" ON public.attendance;
DROP POLICY IF EXISTS "Allow admin full access" ON public.attendance;

DROP POLICY IF EXISTS "Allow individual access" ON public.grades;
DROP POLICY IF EXISTS "Allow admin full access" ON public.grades;

DROP POLICY IF EXISTS "Allow individual access" ON public.agendas;
DROP POLICY IF EXISTS "Allow admin full access" ON public.agendas;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.student_notes;
DROP POLICY IF EXISTS "Allow individual create access" ON public.student_notes;
DROP POLICY IF EXISTS "Allow homeroom teacher access" ON public.student_notes; -- This may need a helper function
DROP POLICY IF EXISTS "Allow admin full access" ON public.student_notes;

DROP POLICY IF EXISTS "Allow individual access" ON public.teacher_attendance;
DROP POLICY IF EXISTS "Allow admin read access" ON public.teacher_attendance;

DROP POLICY IF EXISTS "Allow authenticated read access" ON public.schedule;
DROP POLICY IF EXISTS "Allow admin full access" ON public.schedule;

-- Create new policies
-- Profiles
CREATE POLICY "Allow public read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admin full access" ON public.profiles FOR ALL USING (is_admin());

-- Master Data
CREATE POLICY "Allow all access to authenticated users" ON public.classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access to authenticated users" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access to authenticated users" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access to authenticated users" ON public.school_years FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all access to admin" ON public.settings FOR ALL USING (is_admin());

-- Transactional Data
CREATE POLICY "Allow individual access" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.journal_entries FOR ALL USING (is_admin());
CREATE POLICY "Allow individual access" ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.attendance FOR ALL USING (is_admin());
CREATE POLICY "Allow individual access" ON public.grades FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.grades FOR ALL USING (is_admin());
CREATE POLICY "Allow individual access" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.agendas FOR ALL USING (is_admin());
CREATE POLICY "Allow authenticated read access" ON public.student_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow individual create access" ON public.student_notes FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Allow admin full access" ON public.student_notes FOR ALL USING (is_admin());
CREATE POLICY "Allow individual access" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow admin read access" ON public.teacher_attendance FOR SELECT USING (is_admin());
CREATE POLICY "Allow authenticated read access" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access" ON public.schedule FOR ALL USING (is_admin());

-- 8. Create Views (for simplified queries)
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
  j.*,
  c.name as "className",
  s.name as "subjectName",
  p.full_name as "teacherName",
  EXTRACT(MONTH FROM j.date) as month
FROM
  journal_entries j
  JOIN classes c ON j.class_id = c.id
  JOIN subjects s ON j.subject_id = s.id
  JOIN profiles p ON j.teacher_id = p.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
  a.*,
  c.name as "className",
  s.name as "subjectName",
  p.full_name as "teacherName",
  EXTRACT(MONTH FROM a.date) as month
FROM
  attendance a
  JOIN classes c ON a.class_id = c.id
  JOIN subjects s ON a.subject_id = s.id
  JOIN profiles p ON a.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT
  g.*,
  c.name as "className",
  s.name as "subjectName",
  s.kkm as "subjectKkm",
  p.full_name as "teacherName",
  EXTRACT(MONTH FROM g.date) as month
FROM
  grades g
  JOIN classes c ON g.class_id = c.id
  JOIN subjects s ON g.subject_id = s.id
  JOIN profiles p ON g.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
  sn.*,
  p.full_name as teacher_name
FROM
  student_notes sn
  JOIN profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
  ta.*,
  p.full_name as "teacherName"
FROM
  teacher_attendance ta
  JOIN profiles p ON ta.teacher_id = p.id;

-- 9. RPC Functions for complex queries
-- No RPC functions needed yet beyond the initial handle_new_user and is_admin
CREATE OR REPLACE FUNCTION get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date text, score numeric, kkm int)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    s.name as "subjectName",
    g.assessment_type,
    g.date::text,
    (r->>'score')::numeric as score,
    s.kkm
  FROM
    grades g,
    jsonb_array_elements(g.records) as r
    JOIN subjects s ON g.subject_id = s.id
  WHERE
    (r->>'student_id')::uuid = p_student_id
  ORDER BY
    g.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date text, meeting_number int, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    s.name as "subjectName",
    a.date::text,
    a.meeting_number,
    r->>'status' as status
  FROM
    attendance a,
    jsonb_array_elements(a.records) as r
    JOIN subjects s ON a.subject_id = s.id
  WHERE
    (r->>'student_id')::uuid = p_student_id
  ORDER BY
    a.date DESC, a.meeting_number DESC;
END;
$$;


CREATE OR REPLACE FUNCTION get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT
            (r->>'student_id')::uuid as student_id,
            AVG((r->>'score')::numeric) as avg_score
        FROM grades g, jsonb_array_elements(g.records) r
        WHERE g.class_id = p_class_id
        GROUP BY 1
    ),
    student_attendance AS (
        SELECT
            (r->>'student_id')::uuid as student_id,
            COUNT(*) as total_meetings,
            SUM(CASE WHEN r->>'status' = 'Hadir' THEN 1 ELSE 0 END) as present_meetings
        FROM attendance a, jsonb_array_elements(a.records) r
        WHERE a.class_id = p_class_id
        GROUP BY 1
    )
    SELECT
        s.id,
        s.name,
        s.nis,
        COALESCE(ROUND(sg.avg_score, 1), 0) as average_grade,
        COALESCE(ROUND((sa.present_meetings::numeric / sa.total_meetings) * 100, 0), 0) as attendance_percentage
    FROM students s
    LEFT JOIN student_grades sg ON s.id = sg.student_id
    LEFT JOIN student_attendance sa ON s.id = sa.student_id
    WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;

-- 10. Initial Data (Optional)
-- You can add some default settings or data here if needed
INSERT INTO public.settings (key, value)
VALUES ('active_school_year_id', NULL)
ON CONFLICT (key) DO NOTHING;
