
-- Full SQL Schema for Classroom Zephyr

-- 1. Drop existing triggers and policies to avoid dependency errors.
-- This makes the script idempotent and safe to run multiple times.

-- Drop Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Policies (Example, add for all tables with RLS)
DROP POLICY IF EXISTS "Admin can manage all settings" ON public.settings;
DROP POLICY IF EXISTS "Users can read their own settings" ON public.settings;
-- Add DROP POLICY statements for all other tables as needed...
-- (For brevity, we will rely on CREATE OR REPLACE POLICY where possible, 
-- but explicit dropping is safer for complex changes)


-- 2. Create helper functions
-- is_admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin_user boolean;
BEGIN
  SELECT (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')) INTO is_admin_user;
  RETURN is_admin_user;
END;
$$;


-- 3. Create tables with IF NOT EXISTS
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    account_status text DEFAULT 'Free'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing user profile information.';

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.school_years IS 'Stores academic years and semesters, e.g., "2023/2024 - Ganjil".';

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Stores class/group information, e.g., "Kelas 10-A".';

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.subjects IS 'Stores subjects taught, e.g., "Matematika Wajib".';

CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Stores individual student data.';

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.attendance IS 'Records student attendance for each session.';

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.grades IS 'Records student grades for various assessments.';

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.journal_entries IS 'Stores teacher''s daily teaching journals.';

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text UNIQUE NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_by_email text
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value jsonb
);
COMMENT ON TABLE public.settings IS 'Stores global application settings.';

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.agendas IS 'Stores personal teacher agendas and reminders.';

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule for teachers.';

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time,
    check_out time,
    status text,
    latitude double precision,
    longitude double precision,
    UNIQUE (teacher_id, date)
);
COMMENT ON TABLE public.teacher_attendance IS 'Records daily teacher check-in and check-out.';

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Stores notes and observations about students.';


-- 4. Add foreign key constraints with IF NOT EXISTS logic
-- (This requires a custom function as ALTER TABLE doesn't support IF NOT EXISTS for constraints)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_active_school_year_id_fkey' AND conrelid = 'public.profiles'::regclass
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey 
        FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;
    END IF;
END;
$$;

-- 5. Create functions and triggers
-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    -- Use full_name from metadata if available, otherwise derive from email
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    -- Default role for new users
    'teacher'
  );
  RETURN new;
END;
$$;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Activation function
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  SELECT id INTO v_code_id
  FROM public.activation_codes
  WHERE code = p_code AND is_used = false
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;
END;
$$;


-- 6. Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;


-- 7. Create Policies
-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can manage all profiles." ON public.profiles;
CREATE POLICY "Admins can manage all profiles." ON public.profiles FOR ALL USING (public.is_admin());

-- Classes, Subjects, School Years, Students
DROP POLICY IF EXISTS "All authenticated users can view." ON public.classes;
CREATE POLICY "All authenticated users can view." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage all." ON public.classes;
CREATE POLICY "Admins can manage all." ON public.classes FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "All authenticated users can view." ON public.subjects;
CREATE POLICY "All authenticated users can view." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage all." ON public.subjects;
CREATE POLICY "Admins can manage all." ON public.subjects FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "All authenticated users can view." ON public.school_years;
CREATE POLICY "All authenticated users can view." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage all." ON public.school_years;
CREATE POLICY "Admins can manage all." ON public.school_years FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "All authenticated users can view." ON public.students;
CREATE POLICY "All authenticated users can view." ON public.students FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Admins can manage all." ON public.students;
CREATE POLICY "Admins can manage all." ON public.students FOR ALL USING (public.is_admin());

-- Teacher-specific data
DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.attendance;
CREATE POLICY "Teachers can manage their own data." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all attendance." ON public.attendance;
CREATE POLICY "Admins can view all attendance." ON public.attendance FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.grades;
CREATE POLICY "Teachers can manage their own data." ON public.grades FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all grades." ON public.grades;
CREATE POLICY "Admins can view all grades." ON public.grades FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.journal_entries;
CREATE POLICY "Teachers can manage their own data." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can view all journals." ON public.journal_entries;
CREATE POLICY "Admins can view all journals." ON public.journal_entries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.agendas;
CREATE POLICY "Teachers can manage their own data." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can view their own schedule." ON public.schedule;
CREATE POLICY "Teachers can view their own schedule." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can manage all schedules." ON public.schedule;
CREATE POLICY "Admins can manage all schedules." ON public.schedule FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own attendance." ON public.teacher_attendance;
CREATE POLICY "Teachers can manage their own attendance." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admins can manage all teacher attendance." ON public.teacher_attendance;
CREATE POLICY "Admins can manage all teacher attendance." ON public.teacher_attendance FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage their own notes." ON public.student_notes;
CREATE POLICY "Teachers can manage their own notes." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
-- Allow homeroom teachers to view all notes for their students
-- This would require a more complex check, e.g., JOIN with classes table
-- For now, we keep it simple. Admins and note creators can see them.
DROP POLICY IF EXISTS "Admins can view all notes." ON public.student_notes;
CREATE POLICY "Admins can view all notes." ON public.student_notes FOR SELECT USING (public.is_admin());

-- Activation Codes & Settings
DROP POLICY IF EXISTS "Admins can manage activation codes." ON public.activation_codes;
CREATE POLICY "Admins can manage activation codes." ON public.activation_codes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Authenticated users can use activation codes." ON public.activation_codes;
CREATE POLICY "Authenticated users can use activation codes." ON public.activation_codes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "All users can read settings." ON public.settings;
CREATE POLICY "All users can read settings." ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage settings." ON public.settings;
CREATE POLICY "Admins can manage settings." ON public.settings FOR ALL USING (public.is_admin());

-- Create views for simplified data access
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
    c.name as className,
    s.name as subjectName,
    EXTRACT(MONTH FROM att.date) as month
FROM 
    public.attendance att
JOIN 
    public.classes c ON att.class_id = c.id
JOIN 
    public.subjects s ON att.subject_id = s.id;

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
    c.name as className,
    s.name as subjectName,
    s.kkm as subjectKkm,
    EXTRACT(MONTH FROM g.date) as month
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
    j.subject_id,
    j.school_year_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    c.name as className,
    s.name as subjectName,
    EXTRACT(MONTH FROM j.date) as month
FROM 
    public.journal_entries j
JOIN 
    public.classes c ON j.class_id = c.id
JOIN 
    public.subjects s ON j.subject_id = s.id;
    
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

-- RPC functions for complex queries
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT 
            r.student_id,
            AVG((r.value->>'score')::numeric) as avg_grade
        FROM public.grades g, jsonb_to_recordset(g.records) as r(student_id uuid, score text)
        WHERE g.class_id = p_class_id
        GROUP BY r.student_id
    ),
    student_attendance AS (
        SELECT
            r.student_id,
            COUNT(*) as total_records,
            SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as hadir_count
        FROM public.attendance a, jsonb_to_recordset(a.records) as r(student_id uuid, status text)
        WHERE a.class_id = p_class_id
        GROUP BY r.student_id
    )
    SELECT
        s.id,
        s.name,
        s.nis,
        COALESCE(sg.avg_grade, 0) as average_grade,
        CASE 
            WHEN sa.total_records > 0 THEN (sa.hadir_count::numeric / sa.total_records) * 100
            ELSE 0 
        END as attendance_percentage
    FROM public.students s
    LEFT JOIN student_grades sg ON s.id = sg.student_id
    LEFT JOIN student_attendance sa ON s.id = sa.student_id
    WHERE s.class_id = p_class_id AND s.status = 'active';
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
        s.name as "subjectName",
        g.assessment_type,
        g.date,
        (r.value->>'score')::numeric as score,
        s.kkm
    FROM public.grades g
    JOIN public.subjects s ON g.subject_id = s.id,
    jsonb_array_elements(g.records) r
    WHERE 
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY g.date DESC, s.name;
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
        r.value->>'status' as status
    FROM public.attendance a
    JOIN public.subjects s ON a.subject_id = s.id,
    jsonb_array_elements(a.records) r
    WHERE 
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY a.date DESC, s.name;
END;
$$;
