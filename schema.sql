-- Classroom Zephyr Database Schema
-- Version: 2.0.0
-- Description: Final schema after removing activation system and fixing all reported issues.

-- ========= 1. RESET AND SETUP =========
-- Drop dependent objects first to avoid errors on re-run.
-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop policies for all tables
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Admin dapat mengelola semua data." ON public.' || quote_ident(rec.table_name);
        EXECUTE 'DROP POLICY IF EXISTS "Pengguna dapat melihat data sendiri." ON public.' || quote_ident(rec.table_name);
        EXECUTE 'DROP POLICY IF EXISTS "Guru dapat melihat data terkait." ON public.' || quote_ident(rec.table_name);
        EXECUTE 'DROP POLICY IF EXISTS "Admin memiliki akses penuh." ON public.' || quote_ident(rec.table_name);
    END LOOP;
END $$;


-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();

-- ========= 2. EXTENSIONS =========
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========= 3. HELPER FUNCTIONS =========

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.role() = 'authenticated' THEN
        RETURN (
            SELECT role = 'admin'
            FROM public.profiles
            WHERE id = auth.uid()
        );
    ELSE
        RETURN false;
    END IF;
END;
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    -- Use full_name from metadata if available, otherwise use part of the email
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;


-- ========= 4. TABLE CREATION =========

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
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
    is_homeroom_teacher boolean DEFAULT false
);

-- School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Homeroom teacher
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    kkm integer NOT NULL DEFAULT 75,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active',
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Schedule Table
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(day, start_time, class_id)
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(date, class_id, subject_id, meeting_number)
);

-- Grades Table
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Journal Entries Table
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Agendas Table
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

-- Student Notes Table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    type text NOT NULL DEFAULT 'neutral', -- 'positive', 'improvement', 'neutral'
    date timestamp with time zone DEFAULT now() NOT NULL
);

-- Settings Table (for app-wide settings)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now()
);

-- Teacher Attendance Table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    check_in time,
    check_out time,
    status text,
    UNIQUE(teacher_id, date)
);


-- ========= 5. VIEWS FOR SIMPLIFIED QUERIES =========

-- View for attendance history with class and subject names
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    att.id,
    att.date,
    att.class_id,
    att.subject_id,
    att.school_year_id,
    att.meeting_number,
    att.records,
    att.teacher_id,
    c.name as "className",
    s.name as "subjectName",
    EXTRACT(MONTH FROM att.date) as month
FROM attendance att
JOIN classes c ON att.class_id = c.id
JOIN subjects s ON att.subject_id = s.id;

-- View for grades history with class, subject, and kkm
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
    c.name as "className",
    s.name as "subjectName",
    s.kkm as "subjectKkm",
    EXTRACT(MONTH FROM g.date) as month
FROM grades g
JOIN classes c ON g.class_id = c.id
JOIN subjects s ON g.subject_id = s.id;

-- View for journal entries with names
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
    c.name AS "className",
    s.name AS "subjectName",
    EXTRACT(MONTH FROM j.date) as month
FROM journal_entries j
JOIN classes c ON j.class_id = c.id
JOIN subjects s ON j.subject_id = s.id;

-- View for student notes with teacher names
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.note,
    sn.type,
    sn.date,
    p.full_name as teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

-- View for teacher attendance history with teacher names
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id as "teacherId",
    p.full_name as "teacherName",
    ta.date,
    ta.check_in as "checkIn",
    ta.check_out as "checkOut",
    ta.status
FROM teacher_attendance ta
JOIN profiles p ON ta.teacher_id = p.id;


-- ========= 6. FOREIGN KEY CONSTRAINTS =========
-- Ensure active_school_year_id in profiles refers to school_years table
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey
    FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- ========= 7. ROW LEVEL SECURITY (RLS) POLICIES =========

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Admin dapat mengelola semua data." ON public.profiles FOR ALL USING (is_admin());
CREATE POLICY "Pengguna dapat melihat dan mengubah profilnya sendiri." ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING (
  (auth.role() = 'authenticated' AND (
    (EXISTS (SELECT 1 FROM schedule WHERE schedule.class_id = students.class_id AND schedule.teacher_id = auth.uid())) 
    OR 
    ((SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid()) AND (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid())))
  ))
);


CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (is_admin());
CREATE POLICY "Guru dapat mengelola presensinya sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (is_admin());
CREATE POLICY "Guru dapat mengelola nilainya sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (is_admin());
CREATE POLICY "Guru dapat mengelola jurnalnya sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Guru dapat mengelola agendanya sendiri." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (is_admin() OR (SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Guru dapat membuat dan melihat catatannya sendiri." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat jadwalnya sendiri." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat semua tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (is_admin());
CREATE POLICY "Guru dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (is_admin());
CREATE POLICY "Guru dapat mengelola absensinya sendiri." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);


-- ========= 8. TRIGGERS =========
-- Trigger to create a profile when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ========= 9. RPC FUNCTIONS FOR COMPLEX QUERIES =========

CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date text, score integer, kkm integer)
LANGUAGE sql
AS $$
    SELECT
        g.id,
        s.name as "subjectName",
        g.assessment_type,
        g.date::text,
        (gr.value->>'score')::integer as score,
        s.kkm
    FROM
        grades g
    JOIN subjects s ON g.subject_id = s.id,
    LATERAL jsonb_array_elements(g.records) gr
    WHERE (gr.value->>'student_id')::uuid = p_student_id
    ORDER BY g.date DESC, s.name;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date text, meeting_number integer, status text)
LANGUAGE sql
AS $$
    SELECT
        a.id,
        s.name as "subjectName",
        a.date::text,
        a.meeting_number,
        ar.value->>'status' as status
    FROM
        attendance a
    JOIN subjects s ON a.subject_id = s.id,
    LATERAL jsonb_array_elements(a.records) ar
    WHERE (ar.value->>'student_id')::uuid = p_student_id
    ORDER BY a.date DESC, s.name;
$$;

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE sql
AS $$
WITH student_grades AS (
    SELECT
        (r.value->>'student_id')::uuid as student_id,
        AVG((r.value->>'score')::numeric) as avg_score
    FROM grades g, LATERAL jsonb_array_elements(g.records) r
    WHERE g.class_id = p_class_id
    GROUP BY student_id
),
student_attendance AS (
    SELECT
        (r.value->>'student_id')::uuid as student_id,
        COUNT(*) as total_records,
        SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as present_records
    FROM attendance a, LATERAL jsonb_array_elements(a.records) r
    WHERE a.class_id = p_class_id
    GROUP BY student_id
)
SELECT
    st.id,
    st.name,
    st.nis,
    COALESCE(ROUND(sg.avg_score, 1), 0) as average_grade,
    COALESCE(ROUND((sa.present_records * 100.0) / sa.total_records, 1), 0) as attendance_percentage
FROM students st
LEFT JOIN student_grades sg ON st.id = sg.student_id
LEFT JOIN student_attendance sa ON st.id = sa.student_id
WHERE st.class_id = p_class_id AND st.status = 'active';
$$;
