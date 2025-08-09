-- This script can be used to set up the database from scratch.
-- WARNING: Running this script will delete all existing data.

-- Drop existing objects in reverse order of dependency
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid) CASCADE;

DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;

-- Create tables
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
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
    account_status text NOT NULL DEFAULT 'Free'::text,
    role text NOT NULL DEFAULT 'teacher'::text,
    email text,
    active_school_year_id uuid,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT school_years_pkey PRIMARY KEY (id),
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years (id) ON DELETE SET NULL;

CREATE TABLE public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT activation_codes_pkey PRIMARY KEY (id),
    CONSTRAINT activation_codes_code_key UNIQUE (code),
    CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT classes_pkey PRIMARY KEY (id),
    CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75,
    teacher_id uuid NOT NULL,
    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nis text NOT NULL,
    nisn text NOT NULL,
    gender text NOT NULL,
    class_id uuid NOT NULL,
    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT schedule_pkey PRIMARY KEY (id),
    CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.attendance_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT attendance_history_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendance_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT attendance_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.grade_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT grade_history_pkey PRIMARY KEY (id),
    CONSTRAINT grade_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grade_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT grade_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE public.journals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL,
    CONSTRAINT journals_pkey PRIMARY KEY (id),
    CONSTRAINT journals_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT journals_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT journals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE CASCADE
);


-- Create functions
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'anon';
  ELSE
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = auth.uid()
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    'teacher', -- Default role
    'Free'     -- Default account status
  );
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Check if the code exists and is not used
    SELECT * INTO code_record
    FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false
    FOR UPDATE; -- Lock the row to prevent race conditions

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Code not found or already used';
    END IF;

    -- Update the user's account status
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the code as used
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_record.id;

END;
$$;


-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- PROFILES
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- CLASSES
CREATE POLICY "Enable read access for assigned teacher" ON public.classes FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

-- SUBJECTS
CREATE POLICY "Enable read access for assigned teacher" ON public.subjects FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

-- STUDENTS
CREATE POLICY "Enable read access for assigned teacher" ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Enable full access for assigned teacher" ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));

-- SCHEDULE
CREATE POLICY "Enable read access for assigned teacher" ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- ATTENDANCE HISTORY
CREATE POLICY "Enable read access for assigned teacher" ON public.attendance_history FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

-- GRADE HISTORY
CREATE POLICY "Enable read access for assigned teacher" ON public.grade_history FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- JOURNALS
CREATE POLICY "Enable read access for assigned teacher" ON public.journals FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- ACTIVATION CODES
CREATE POLICY "Enable read access for admin" ON public.activation_codes FOR SELECT USING (get_my_role() = 'admin');
CREATE POLICY "Enable full access for admin" ON public.activation_codes FOR ALL USING (get_my_role() = 'admin');

-- SCHOOL YEARS
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable full access for assigned teacher" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);
