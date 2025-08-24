
-- =================================================================
--  LAKUKELAS DATABASE SCHEMA
--  VERSION: FINAL STABLE
--  DESCRIPTION: This script is idempotent and safe to run on
--  both new and existing databases. It correctly handles
--  object dependencies by dropping dependent objects first.
-- =================================================================

-- -----------------------------------------------------------------
--  STEP 1: DROP EXISTING DEPENDENT OBJECTS (TRIGGERS, POLICIES, VIEWS, FUNCTIONS)
--  This is to ensure a clean slate and avoid dependency conflicts.
-- -----------------------------------------------------------------

-- Drop Triggers (if any were created, none in final version but good practice)
-- No triggers on auth.users anymore.

-- Drop Policies (Only if tables exist)
DO $$ 
BEGIN
    -- Drop policies only if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
        DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
        DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'classes') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
        DROP POLICY IF EXISTS "Guru dapat melihat semua kelas." ON public.classes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subjects') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
        DROP POLICY IF EXISTS "Guru dapat melihat semua mapel." ON public.subjects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
        DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya." ON public.students;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'attendance') THEN
        DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
        DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka sendiri." ON public.attendance;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'grades') THEN
        DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
        DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka sendiri." ON public.grades;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'journal_entries') THEN
        DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
        DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_notes') THEN
        DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
        DROP POLICY IF EXISTS "Guru dapat melihat catatan siswa yang mereka ajar." ON public.student_notes;
        DROP POLICY IF EXISTS "Guru dapat membuat catatan untuk siswa." ON public.student_notes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schedule') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
        DROP POLICY IF EXISTS "Guru dapat melihat jadwal mereka." ON public.schedule;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'school_years') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
        DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'settings') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
        DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'teacher_attendance') THEN
        DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
        DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agendas') THEN
        DROP POLICY IF EXISTS "Admin dapat mengelola agenda." ON public.agendas;
        DROP POLICY IF EXISTS "Guru dapat mengelola agenda mereka sendiri." ON public.agendas;
    END IF;
END $$;

-- Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Views
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- Drop Functions
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);

-- -----------------------------------------------------------------
--  STEP 2: CREATE TABLES
--  Create all tables if they do not exist.
-- -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Stores class information.';

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL
);
COMMENT ON TABLE public.subjects IS 'Stores subject information.';

CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nis text UNIQUE NOT NULL,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Stores student information.';

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE
);
COMMENT ON TABLE public.school_years IS 'Stores school year information.';

CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);
COMMENT ON TABLE public.settings IS 'Stores application-wide settings.';

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores weekly teaching schedule.';

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Stores notes about students from teachers.';

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);
COMMENT ON TABLE public.teacher_attendance IS 'Stores daily teacher attendance records.';

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Add Foreign Key for active_school_year_id after school_years table is created
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- -----------------------------------------------------------------
--  STEP 3: CREATE FUNCTIONS
-- -----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) = 'admin';
END;
$$;
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current user has the admin role.';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
BEGIN
  -- Safely get the full_name from meta_data, fallback to splitting email
  v_full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create a new user profile upon registration.';

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
--  STEP 5: ENABLE RLS AND CREATE POLICIES
-- -----------------------------------------------------------------

-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Classes Table
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- Subjects Table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

-- Students Table
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING (
    (auth.role() = 'authenticated' AND (
        (EXISTS (SELECT 1 FROM schedule WHERE schedule.class_id = students.class_id AND schedule.teacher_id = auth.uid()))
        OR
        (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()))
    ))
);

-- Attendance Table
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi mereka sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Grades Table
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai mereka sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Journal Entries Table
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Student Notes Table
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (
    public.is_admin() OR
    (EXISTS (SELECT 1 FROM classes c WHERE c.id = (SELECT s.class_id FROM students s WHERE s.id = student_notes.student_id) AND c.teacher_id = auth.uid()))
);
CREATE POLICY "Guru dapat melihat catatan siswa yang mereka ajar." ON public.student_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM schedule sch WHERE sch.class_id = (SELECT s.class_id FROM students s WHERE s.id = student_notes.student_id) AND sch.teacher_id = auth.uid())
);
CREATE POLICY "Guru dapat membuat catatan untuk siswa." ON public.student_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Schedule Table
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat jadwal mereka." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);

-- School Years Table
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

-- Settings Table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Teacher Attendance Table
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance FOR SELECT USING (auth.uid() = teacher_id);

-- Agendas Table
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola agenda." ON public.agendas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- -----------------------------------------------------------------
--  STEP 6: SEED INITIAL DATA (If necessary)
--  This should be done carefully.
-- -----------------------------------------------------------------

-- Seed initial settings if they don't exist
INSERT INTO public.settings (key, value) VALUES ('active_school_year_id', NULL) ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------------------
--  STEP 7: CREATE TRIGGERS
-- -----------------------------------------------------------------

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
