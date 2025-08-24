-- Classroom Zephyr Database Schema
-- Version: 1.6.0
-- Description: Final, idempotent schema with fixes for all reported issues including dependency, permission, and syntax errors.

-- =============================================
-- SECTION 1: CLEANUP (DROPPING OLD OBJECTS)
-- Drop dependent objects first to avoid errors.
-- =============================================

-- Drop Triggers first as they depend on functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Policies as they depend on functions
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Guru dapat melihat semua kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Guru dapat melihat semua mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya." ON public.students;
DROP POLICY IF EXISTS "Guru dapat memperbarui data siswa." ON public.students;
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka sendiri." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka sendiri." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat membuat dan melihat catatan siswa yang diajarnya." ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Pengguna dapat melihat pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Semua pengguna dapat mengakses file di bucket avatar." ON storage.objects;
DROP POLICY IF EXISTS "Admin dapat mengelola semua agenda." ON public.agendas;
DROP POLICY IF EXISTS "Guru dapat mengelola agenda mereka sendiri." ON public.agendas;

-- Drop Views
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- Drop Functions now that triggers and policies are removed
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);
DROP FUNCTION IF EXISTS public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text);


-- =============================================
-- SECTION 2: TABLE CREATION
-- Create tables if they don't exist.
-- =============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    full_name text NOT NULL,
    email text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status text DEFAULT 'Free'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL,
    is_homeroom_teacher boolean DEFAULT false,
    active_school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    kkm integer DEFAULT 75 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_year_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_year_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    school_year_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);

-- =============================================
-- SECTION 3: FUNCTIONS
-- Create or replace functions.
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) = 'admin';
END;
$$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    s.name AS "subjectName",
    g.assessment_type,
    g.date,
    (r->>'score')::numeric,
    s.kkm
  FROM
    public.grades g
  CROSS JOIN LATERAL jsonb_to_recordset(g.records) AS r(student_id uuid, score text)
  JOIN public.subjects s ON g.subject_id = s.id
  WHERE
    r.student_id = p_student_id;
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
    s.name AS "subjectName",
    a.date,
    a.meeting_number,
    r->>'status' AS status
  FROM
    public.attendance a
  CROSS JOIN LATERAL jsonb_to_recordset(a.records) AS r(student_id uuid, status text)
  JOIN public.subjects s ON a.subject_id = s.id
  WHERE
    r.student_id = p_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE sql
AS $$
  WITH student_grades AS (
    SELECT
      r.student_id,
      AVG((r.score)::numeric) as avg_grade
    FROM grades g
    CROSS JOIN jsonb_to_recordset(g.records) as r(student_id uuid, score text)
    WHERE g.class_id = p_class_id
    GROUP BY r.student_id
  ), student_attendance AS (
    SELECT
      r.student_id,
      (COUNT(*) FILTER (WHERE r.status = 'Hadir'))::numeric * 100 / COUNT(*)::numeric as att_perc
    FROM attendance a
    CROSS JOIN jsonb_to_recordset(a.records) as r(student_id uuid, status text)
    WHERE a.class_id = p_class_id
    GROUP BY r.student_id
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(sg.avg_grade, 0),
    COALESCE(sa.att_perc, 0)
  FROM students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id
  LEFT JOIN student_attendance sa ON s.id = sa.student_id
  WHERE s.class_id = p_class_id AND s.status = 'active';
$$;

-- Dummy function as activation system is removed
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Activation system is deprecated. This function does nothing.
  -- Kept for compatibility with older client versions if any.
END;
$$;


-- =============================================
-- SECTION 4: VIEWS
-- =============================================

CREATE OR REPLACE VIEW public.attendance_history AS
 SELECT a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.teacher_id,
    a.meeting_number,
    a.records,
    c.name AS "className",
    s.name AS "subjectName",
    date_part('month'::text, a.date) AS month
   FROM ((public.attendance a
     LEFT JOIN public.classes c ON ((a.class_id = c.id)))
     LEFT JOIN public.subjects s ON ((a.subject_id = s.id)));

CREATE OR REPLACE VIEW public.grades_history AS
 SELECT g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.teacher_id,
    g.assessment_type,
    g.records,
    c.name AS "className",
    s.name AS "subjectName",
    s.kkm AS "subjectKkm",
    date_part('month'::text, g.date) AS month
   FROM ((public.grades g
     LEFT JOIN public.classes c ON ((g.class_id = c.id)))
     LEFT JOIN public.subjects s ON ((g.subject_id = s.id)));

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
 SELECT j.id,
    j.date,
    j.class_id,
    j.subject_id,
    j.school_year_id,
    j.teacher_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    c.name AS "className",
    s.name AS "subjectName",
    date_part('month'::text, j.date) AS month
   FROM ((public.journal_entries j
     LEFT JOIN public.classes c ON ((j.class_id = c.id)))
     LEFT JOIN public.subjects s ON ((j.subject_id = s.id)));

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
 SELECT sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.date,
    sn.note,
    sn.type,
    p.full_name AS teacher_name
   FROM (public.student_notes sn
     LEFT JOIN public.profiles p ON ((sn.teacher_id = p.id)));

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
 SELECT ta.id,
    ta.teacher_id AS "teacherId",
    p.full_name AS "teacherName",
    ta.date,
    ta.check_in AS "checkIn",
    ta.check_out AS "checkOut",
    ta.status
   FROM (public.teacher_attendance ta
     JOIN public.profiles p ON ((ta.teacher_id = p.id)));


-- =============================================
-- SECTION 5: RELATIONS and CONSTRAINTS
-- Add foreign key constraints. Drop them first to be safe.
-- =============================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- =============================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

-- Classes Policies
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- Subjects Policies
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

-- Students Policies
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING (
  (auth.role() = 'authenticated' AND (EXISTS (SELECT 1 FROM schedule WHERE schedule.class_id = students.class_id AND schedule.teacher_id = auth.uid()))) 
  OR 
  ((EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid())))
);
CREATE POLICY "Guru dapat memperbarui data siswa." ON public.students FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- Attendance Policies
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi mereka sendiri." ON public.attendance FOR ALL USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));

-- Grades Policies
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai mereka sendiri." ON public.grades FOR ALL USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));

-- Journal Policies
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries FOR ALL USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));

-- Student Notes Policies
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR (EXISTS (SELECT 1 FROM classes c WHERE c.teacher_id = auth.uid() AND c.id = (SELECT s.class_id FROM students s WHERE s.id = student_notes.student_id))));
CREATE POLICY "Guru dapat membuat dan melihat catatan siswa yang diajarnya." ON public.student_notes FOR ALL USING ((auth.uid() = teacher_id));

-- Schedule Policies
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua jadwal." ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');

-- School Years Policies
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

-- Settings Policies
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Teacher Attendance Policies
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance FOR ALL USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));

-- Agendas Policies
CREATE POLICY "Admin dapat mengelola semua agenda." ON public.agendas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));


-- Storage Policies
CREATE POLICY "Semua pengguna dapat mengakses file di bucket avatar." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');


-- =============================================
-- SECTION 7: TRIGGERS
-- Create triggers after functions and tables are set up.
-- =============================================

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
