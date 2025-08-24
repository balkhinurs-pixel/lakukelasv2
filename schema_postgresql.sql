-- =================================================================
--  LAKUKELAS DATABASE SCHEMA - POSTGRESQL VERSION
--  VERSION: POSTGRESQL COMPATIBLE
--  DESCRIPTION: This script is adapted for regular PostgreSQL
--  without Supabase dependencies. It removes auth.users dependencies
--  and RLS policies that require Supabase auth functions.
-- =================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------
--  STEP 1: DROP EXISTING DEPENDENT OBJECTS
-- -----------------------------------------------------------------

-- Drop Views
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- Drop Functions
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);

-- Drop Tables (in dependency order)
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.teacher_attendance CASCADE;
DROP TABLE IF EXISTS public.student_notes CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- -----------------------------------------------------------------
--  STEP 2: CREATE TABLES
-- -----------------------------------------------------------------

-- Users table (replaces auth.users dependency)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    password_hash text, -- You'll need to handle authentication separately
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.users IS 'Basic user authentication table.';

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
    email text UNIQUE,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    role text DEFAULT 'teacher'::text NOT NULL,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information.';

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE
);
COMMENT ON TABLE public.school_years IS 'Stores school year information.';

-- Add Foreign Key for active_school_year_id after school_years table is created
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Stores class information.';

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL
);
COMMENT ON TABLE public.subjects IS 'Stores subject information.';

CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    nis text UNIQUE NOT NULL,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Stores student information.';

CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);
COMMENT ON TABLE public.settings IS 'Stores application-wide settings.';

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores weekly teaching schedule.';

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.attendance IS 'Stores student attendance records for each session.';

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.grades IS 'Stores student grade records.';

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date timestamp with time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.journal_entries IS 'Stores teaching journal entries.';

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Stores notes about students from teachers.';

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);
COMMENT ON TABLE public.teacher_attendance IS 'Stores daily teacher attendance records.';

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.agendas IS 'Stores personal teacher agendas and reminders.';

-- -----------------------------------------------------------------
--  STEP 3: CREATE FUNCTIONS (PostgreSQL Compatible)
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        s.name as "subjectName",
        g.assessment_type,
        g.date,
        (r.value ->> 'score')::numeric,
        s.kkm
    FROM
        public.grades g
    JOIN
        public.subjects s ON g.subject_id = s.id
    CROSS JOIN
        jsonb_array_elements(g.records) r
    WHERE
        (r.value ->> 'student_id')::uuid = p_student_id
    ORDER BY
        g.date DESC, s.name;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        s.name as "subjectName",
        a.date,
        a.meeting_number,
        r.value ->> 'status' as status
    FROM
        public.attendance a
    JOIN
        public.subjects s ON a.subject_id = s.id
    CROSS JOIN
        jsonb_array_elements(a.records) r
    WHERE
        (r.value ->> 'student_id')::uuid = p_student_id
    ORDER BY
        a.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      AVG((r.value->>'score')::numeric) AS avg_score
    FROM grades, jsonb_array_elements(records) r
    JOIN students st ON (r.value->>'student_id')::uuid = st.id
    WHERE st.class_id = p_class_id
    GROUP BY student_id
  ),
  student_attendance AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      (SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) * 100.0) / COUNT(*) AS att_perc
    FROM attendance, jsonb_array_elements(records) r
    JOIN students st ON (r.value->>'student_id')::uuid = st.id
    WHERE st.class_id = p_class_id
    GROUP BY student_id
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(ROUND(sg.avg_score, 1), 0) AS average_grade,
    COALESCE(ROUND(sa.att_perc, 1), 0) AS attendance_percentage
  FROM students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id
  LEFT JOIN student_attendance sa ON s.id = sa.student_id
  WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;

-- -----------------------------------------------------------------
-- STEP 4: CREATE VIEWS
-- -----------------------------------------------------------------

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.class_id,
    c.name AS "className",
    a.subject_id,
    s.name AS "subjectName",
    a.meeting_number,
    a.records,
    a.teacher_id,
    a.school_year_id,
    date_part('month'::text, a.date) AS month
FROM
    public.attendance a
JOIN
    public.classes c ON a.class_id = c.id
JOIN
    public.subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    g.id,
    g.date,
    g.class_id,
    c.name AS "className",
    g.subject_id,
    s.name AS "subjectName",
    s.kkm AS "subjectKkm",
    g.assessment_type,
    g.records,
    g.teacher_id,
    g.school_year_id,
    date_part('month'::text, g.date) AS month
FROM
    public.grades g
JOIN
    public.classes c ON g.class_id = c.id
JOIN
    public.subjects s ON g.subject_id = s.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
    j.id,
    j.date,
    j.class_id,
    c.name AS "className",
    j.subject_id,
    s.name AS "subjectName",
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    j.school_year_id,
    date_part('month'::text, j.date) AS month
FROM
    public.journal_entries j
JOIN
    public.classes c ON j.class_id = c.id
JOIN
    public.subjects s ON j.subject_id = s.id;
    
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    p.full_name AS teacher_name,
    sn.date,
    sn.note,
    sn.type
FROM
    public.student_notes sn
JOIN
    public.profiles p ON sn.teacher_id = p.id;
    
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id as "teacherId",
    p.full_name as "teacherName",
    ta.date,
    ta.check_in as "checkIn",
    ta.check_out as "checkOut",
    ta.status
FROM
    public.teacher_attendance ta
JOIN
    public.profiles p ON ta.teacher_id = p.id;

-- -----------------------------------------------------------------
--  STEP 5: SEED INITIAL DATA
-- -----------------------------------------------------------------

-- Seed initial settings if they don't exist
INSERT INTO public.settings (key, value) VALUES ('active_school_year_id', NULL) ON CONFLICT (key) DO NOTHING;

-- NOTE: Row Level Security (RLS) policies have been removed as they require Supabase auth functions.
-- You'll need to implement authentication and authorization at the application level.