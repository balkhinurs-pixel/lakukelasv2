-- 1. Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for all tables
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Classes
DROP POLICY IF EXISTS "Authenticated users can view classes." ON public.classes;
CREATE POLICY "Authenticated users can view classes." ON public.classes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage classes." ON public.classes;
CREATE POLICY "Admins can manage classes." ON public.classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Subjects
DROP POLICY IF EXISTS "Authenticated users can view subjects." ON public.subjects;
CREATE POLICY "Authenticated users can view subjects." ON public.subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage subjects." ON public.subjects;
CREATE POLICY "Admins can manage subjects." ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Students
DROP POLICY IF EXISTS "Authenticated users can view students." ON public.students;
CREATE POLICY "Authenticated users can view students." ON public.students FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage students." ON public.students;
CREATE POLICY "Admins can manage students." ON public.students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- School Years
DROP POLICY IF EXISTS "Authenticated users can view school years." ON public.school_years;
CREATE POLICY "Authenticated users can view school years." ON public.school_years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage school years." ON public.school_years;
CREATE POLICY "Admins can manage school years." ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Settings
DROP POLICY IF EXISTS "Authenticated users can view settings." ON public.settings;
CREATE POLICY "Authenticated users can view settings." ON public.settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Schedule
DROP POLICY IF EXISTS "Users can view their own schedule." ON public.schedule;
CREATE POLICY "Users can view their own schedule." ON public.schedule FOR SELECT TO authenticated USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can manage all schedules." ON public.schedule;
CREATE POLICY "Admins can manage all schedules." ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Attendance
DROP POLICY IF EXISTS "Teachers can manage their own attendance records." ON public.attendance;
CREATE POLICY "Teachers can manage their own attendance records." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all attendance." ON public.attendance;
CREATE POLICY "Admins can view all attendance." ON public.attendance FOR SELECT USING (public.is_admin());

-- Grades
DROP POLICY IF EXISTS "Teachers can manage their own grade records." ON public.grades;
CREATE POLICY "Teachers can manage their own grade records." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all grades." ON public.grades;
CREATE POLICY "Admins can view all grades." ON public.grades FOR SELECT USING (public.is_admin());

-- Journal Entries
DROP POLICY IF EXISTS "Teachers can manage their own journal entries." ON public.journal_entries;
CREATE POLICY "Teachers can manage their own journal entries." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all journal entries." ON public.journal_entries;
CREATE POLICY "Admins can view all journal entries." ON public.journal_entries FOR SELECT USING (public.is_admin());

-- Agendas
DROP POLICY IF EXISTS "Teachers can manage their own agendas." ON public.agendas;
CREATE POLICY "Teachers can manage their own agendas." ON public.agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Student Notes
DROP POLICY IF EXISTS "Teachers can manage notes for students." ON public.student_notes;
CREATE POLICY "Teachers can manage notes for students." ON public.student_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Create Views for easier data access
-- Create a view for attendance history with class and subject names
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
    c.name AS class_name,
    s.name AS subject_name,
    EXTRACT(MONTH FROM att.date) as month
FROM 
    public.attendance att
JOIN 
    public.classes c ON att.class_id = c.id
JOIN 
    public.subjects s ON att.subject_id = s.id;

-- Create a view for grades history with class and subject names and KKM
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
    c.name AS class_name,
    s.name AS subject_name,
    s.kkm AS subject_kkm,
    EXTRACT(MONTH FROM g.date) as month
FROM 
    public.grades g
JOIN 
    public.classes c ON g.class_id = c.id
JOIN 
    public.subjects s ON g.subject_id = s.id;

-- Create a view for journal entries with names
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
    c.name as class_name,
    s.name as subject_name,
    EXTRACT(MONTH FROM j.date) as month
FROM
    public.journal_entries j
JOIN
    public.classes c ON j.class_id = c.id
JOIN
    public.subjects s ON j.subject_id = s.id;
    
-- Create a view for student notes with teacher names
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
    
-- Create a view for teacher attendance history with names
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id,
    p.full_name as teacher_name,
    ta.date,
    ta.check_in,
    ta.check_out,
    ta.status
FROM
    public.teacher_attendance ta
JOIN
    public.profiles p ON ta.teacher_id = p.id;
    
-- 4. Create RPC Functions
-- Function to check if the current user is an admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher' -- Default role for new sign-ups
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user is created in auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to get student grades for the ledger view
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id UUID)
RETURNS TABLE(id UUID, subject_name TEXT, assessment_type TEXT, date TEXT, score NUMERIC, kkm INT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        s.name AS subject_name,
        g.assessment_type,
        g.date::text,
        (r->>'score')::numeric,
        s.kkm
    FROM
        public.grades g,
        jsonb_to_recordset(g.records) AS r(student_id UUID, score TEXT)
    JOIN
        public.subjects s ON g.subject_id = s.id
    WHERE
        r.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get student attendance for the ledger view
CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id UUID)
RETURNS TABLE(id UUID, subject_name TEXT, date TEXT, meeting_number INT, status TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        s.name AS subject_name,
        a.date::text,
        a.meeting_number,
        r->>'status' AS status
    FROM
        public.attendance a,
        jsonb_to_recordset(a.records) AS r(student_id UUID, status TEXT)
    JOIN
        public.subjects s ON a.subject_id = s.id
    WHERE
        r.student_id = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get aggregated student performance for a class
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id UUID)
RETURNS TABLE(id UUID, name TEXT, nis TEXT, average_grade NUMERIC, attendance_percentage NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT
            r.student_id,
            AVG((r.score::numeric)) AS avg_grade
        FROM
            public.grades g,
            jsonb_to_recordset(g.records) AS r(student_id UUID, score TEXT)
        WHERE g.class_id = p_class_id
        GROUP BY r.student_id
    ),
    student_attendance AS (
        SELECT
            r.student_id,
            COUNT(*) AS total_records,
            COUNT(*) FILTER (WHERE r.status = 'Hadir') AS hadir_count
        FROM
            public.attendance a,
            jsonb_to_recordset(a.records) AS r(student_id UUID, status TEXT)
        WHERE a.class_id = p_class_id
        GROUP BY r.student_id
    )
    SELECT
        st.id,
        st.name,
        st.nis,
        COALESCE(ROUND(sg.avg_grade, 2), 0) AS average_grade,
        COALESCE(ROUND((sa.hadir_count * 100.0) / sa.total_records, 2), 0) AS attendance_percentage
    FROM
        public.students st
    LEFT JOIN
        student_grades sg ON st.id = sg.student_id
    LEFT JOIN
        student_attendance sa ON st.id = sa.student_id
    WHERE
        st.class_id = p_class_id AND st.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- 5. Set initial data
-- Create a default school year if none exists
INSERT INTO public.school_years (name)
SELECT '2023/2024 - Genap'
WHERE NOT EXISTS (SELECT 1 FROM public.school_years);

-- Set a default active school year if not set
INSERT INTO public.settings (key, value)
SELECT 'active_school_year_id', (SELECT id FROM public.school_years LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'active_school_year_id');

-- Grant usage on schema to required roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant all privileges to the postgres role
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Grant permissions to anon role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Note: The policies above will restrict access for 'anon' and 'authenticated' roles.
-- 'service_role' is a super-user role and should have full access.

    