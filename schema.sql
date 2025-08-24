-- Classroom Zephyr - Supabase Schema
-- Version: 1.6
-- Last Updated: To fix VIEW column name error and add DROP VIEW statements.
-- This script is designed to be idempotent and can be run multiple times safely.

-- 1. Drop existing objects in reverse order of dependency
-- This ensures that objects that depend on others are removed first.

-- Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Policies (We will drop them before recreating them on each table)
-- This is handled section by section below.

-- Drop Views
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;

-- Drop Functions
-- Using `CREATE OR REPLACE` for functions handles this, but explicit drop can be safer in complex scenarios.
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status text DEFAULT 'Pro'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL,
    email text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text UNIQUE,
    gender text NOT NULL,
    class_id uuid,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid,
    class_id uuid,
    teacher_id uuid
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid,
    subject_id uuid,
    meeting_number integer,
    records jsonb,
    teacher_id uuid,
    school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid,
    subject_id uuid,
    assessment_type text,
    records jsonb,
    teacher_id uuid,
    school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid,
    subject_id uuid,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid,
    school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    used_by_email text
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text,
    date timestamp with time zone DEFAULT now() NOT NULL
);


-- 3. Add foreign key constraints
-- Using DROP CONSTRAINT IF EXISTS to make it safe to re-run.

-- Profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Students
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

-- Schedule
ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_class_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_subject_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_teacher_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Attendance
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Grades
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_teacher_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Journal Entries
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_class_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_subject_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_teacher_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Agendas
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_teacher_id_fkey;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Teacher Attendance
ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Student Notes
ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_student_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_teacher_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 4. Create Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    NEW.id,
    -- Use full_name from metadata if available, otherwise use part of the email
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'teacher',
    'Pro' -- Set default account status to Pro
  );
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- 5. Create Views
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
    EXTRACT(MONTH FROM j.date) as month
FROM
    journal_entries j
JOIN
    classes c ON j.class_id = c.id
JOIN
    subjects s ON j.subject_id = s.id;

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
    EXTRACT(MONTH FROM a.date) as month
FROM
    attendance a
JOIN
    classes c ON a.class_id = c.id
JOIN
    subjects s ON a.subject_id = s.id;

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
    EXTRACT(MONTH FROM g.date) as month
FROM
    grades g
JOIN
    classes c ON g.class_id = c.id
JOIN
    subjects s ON g.subject_id = s.id;

-- Corrected View
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id as "teacherId",
    t.full_name as "teacherName",
    ta.date,
    ta.check_in as "checkIn",
    ta.check_out as "checkOut",
    ta.status
FROM
    teacher_attendance ta
JOIN
    profiles t ON ta.teacher_id = t.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    p.full_name AS teacher_name,
    sn.note,
    sn.type,
    sn.date
FROM
    student_notes sn
JOIN
    profiles p ON sn.teacher_id = p.id;

-- 6. Create Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;


-- 8. Create RLS Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Agendas
DROP POLICY IF EXISTS "Users can manage their own agendas" ON public.agendas;
CREATE POLICY "Users can manage their own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

-- Attendance
DROP POLICY IF EXISTS "Teachers can manage their own attendance records" ON public.attendance;
CREATE POLICY "Teachers can manage their own attendance records" ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all attendance" ON public.attendance;
CREATE POLICY "Admins can view all attendance" ON public.attendance FOR SELECT USING (public.is_admin());


-- Grades
DROP POLICY IF EXISTS "Teachers can manage their own grade records" ON public.grades;
CREATE POLICY "Teachers can manage their own grade records" ON public.grades FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all grades" ON public.grades;
CREATE POLICY "Admins can view all grades" ON public.grades FOR SELECT USING (public.is_admin());

-- Journal Entries
DROP POLICY IF EXISTS "Teachers can manage their own journal entries" ON public.journal_entries;
CREATE POLICY "Teachers can manage their own journal entries" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all journal entries" ON public.journal_entries;
CREATE POLICY "Admins can view all journal entries" ON public.journal_entries FOR SELECT USING (public.is_admin());

-- Schedule
DROP POLICY IF EXISTS "Authenticated users can view all schedules" ON public.schedule;
CREATE POLICY "Authenticated users can view all schedules" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage all schedules" ON public.schedule;
CREATE POLICY "Admins can manage all schedules" ON public.schedule FOR ALL USING (public.is_admin());

-- Classes, Subjects, Students, School Years (Admin only management)
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view classes" ON public.classes;
CREATE POLICY "Authenticated users can view classes" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view subjects" ON public.subjects;
CREATE POLICY "Authenticated users can view subjects" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view students" ON public.students;
CREATE POLICY "Authenticated users can view students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage school years" ON public.school_years;
CREATE POLICY "Admins can manage school years" ON public.school_years FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can view school years" ON public.school_years;
CREATE POLICY "Authenticated users can view school years" ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

-- Teacher Attendance (Admin management, Teacher insert/view self)
DROP POLICY IF EXISTS "Admins can manage all teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Admins can manage all teacher attendance" ON public.teacher_attendance FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Teachers can manage their own attendance" ON public.teacher_attendance;
CREATE POLICY "Teachers can manage their own attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

-- Student Notes (Homeroom teacher and subject teacher access)
DROP POLICY IF EXISTS "Teachers can manage notes for students in their classes" ON public.student_notes;
CREATE POLICY "Teachers can manage notes for students in their classes" ON public.student_notes FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM classes
        WHERE classes.id = (SELECT class_id FROM students WHERE students.id = student_notes.student_id)
        AND classes.teacher_id = auth.uid() -- Homeroom teacher can manage
    )
    OR (auth.uid() = teacher_id) -- The teacher who created it can manage
);
DROP POLICY IF EXISTS "Admins can manage all student notes" ON public.student_notes;
CREATE POLICY "Admins can manage all student notes" ON public.student_notes FOR ALL USING (public.is_admin());


-- 9. Insert initial settings (optional, but good for setup)
INSERT INTO public.settings (key, value)
VALUES ('active_school_year_id', (SELECT id FROM public.school_years LIMIT 1))
ON CONFLICT (key) DO NOTHING;
