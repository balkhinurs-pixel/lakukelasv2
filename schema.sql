-- Lakukelas DB Schema
-- Version: 3.0
-- Description: Complete schema for a new deployment. Includes RLS, triggers, and functions.

-- Drop existing objects in reverse order of dependency to avoid errors.
-- Using CASCADE to ensure dependent objects are also dropped.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid) CASCADE;

DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- Table: profiles
-- Stores user profile data, linked to auth.users.
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
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
    account_status text NOT NULL DEFAULT 'Free'::text,
    role text NOT NULL DEFAULT 'teacher'::text,
    active_school_year_id integer
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing user profile information.';

-- Table: school_years
-- Stores academic years defined by the teacher.
CREATE TABLE public.school_years (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.school_years IS 'Stores academic years, e.g., "2023/2024 - Ganjil".';

-- Add foreign key from profiles to school_years
ALTER TABLE public.profiles ADD CONSTRAINT fk_active_school_year FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Table: classes
-- Stores class groups, like "Kelas 10-A".
CREATE TABLE public.classes (
    id text NOT NULL PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 10),
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.classes IS 'Represents a group of students, e.g., "Kelas 10-A".';


-- Table: subjects
-- Stores subjects taught by the teacher.
CREATE TABLE public.subjects (
    id text NOT NULL PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 10),
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.subjects IS 'Stores subjects taught by a teacher, e.g., "Matematika".';


-- Table: students
-- Stores student data.
CREATE TABLE public.students (
    id text NOT NULL PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 10),
    name text NOT NULL,
    nis text,
    nisn text UNIQUE,
    gender text NOT NULL,
    class_id text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.students IS 'Stores individual student data.';


-- Table: schedule
-- Stores the weekly teaching schedule.
CREATE TABLE public.schedule (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (day, start_time, teacher_id)
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule for a teacher.';


-- Table: journals
-- Stores teaching journals.
CREATE TABLE public.journals (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date date NOT NULL DEFAULT CURRENT_DATE,
    class_id text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.journals IS 'Stores daily teaching journals and reflections.';


-- Table: attendance_history
-- Stores attendance records.
CREATE TABLE public.attendance_history (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date date NOT NULL,
    class_id text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(date, class_id, subject_id, meeting_number)
);
COMMENT ON TABLE public.attendance_history IS 'Stores historical attendance records for each meeting.';


-- Table: grade_history
-- Stores grade/assessment records.
CREATE TABLE public.grade_history (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    date date NOT NULL,
    class_id text NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id text NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.grade_history IS 'Stores historical grade records for various assessments.';


-- Table: activation_codes
-- Stores activation codes for Pro accounts.
CREATE TABLE public.activation_codes (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    code text NOT NULL UNIQUE,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid REFERENCES public.profiles(id),
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts, managed by admins.';


-- Function: handle_new_user
-- Automatically creates a profile entry when a new user signs up in auth.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'teacher',
    'Free'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trigger: on_auth_user_created
-- Executes the handle_new_user function after a new user is inserted.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Function: get_my_role
-- Retrieves the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  my_role TEXT;
BEGIN
  SELECT role INTO my_role FROM public.profiles WHERE id = auth.uid();
  RETURN my_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function: activate_account_with_code
-- Handles the logic for activating a Pro account using a code in a single transaction.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_id_to_use int;
    code_is_used boolean;
BEGIN
    SELECT id, is_used INTO code_id_to_use, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use
    FOR UPDATE;

    IF code_id_to_use IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    UPDATE public.activation_codes
    SET
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id_to_use;
END;
$$;


-- Row Level Security (RLS) Policies

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);

-- CLASSES
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

-- SUBJECTS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

-- SCHOOL_YEARS
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);

-- STUDENTS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- SCHEDULE
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- ATTENDANCE_HISTORY
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

-- GRADE_HISTORY
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- JOURNALS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- ACTIVATION_CODES
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin" ON public.activation_codes FOR ALL USING (public.get_my_role() = 'admin');
