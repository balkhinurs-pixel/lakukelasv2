-- Drop existing objects in reverse order of dependency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code CASCADE;

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


-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Table for School Years
CREATE TABLE public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name character varying NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT school_years_pkey PRIMARY KEY (id)
);

-- Table for user profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    full_name character varying,
    avatar_url character varying,
    nip character varying,
    pangkat character varying,
    jabatan character varying,
    school_name character varying,
    school_address character varying,
    headmaster_name character varying,
    headmaster_nip character varying,
    school_logo_url character varying,
    account_status text NOT NULL DEFAULT 'Free'::text,
    role text NOT NULL DEFAULT 'teacher'::text,
    email character varying,
    active_school_year_id uuid,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Table for activation codes
CREATE TABLE public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying NOT NULL,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT activation_codes_pkey PRIMARY KEY (id),
    CONSTRAINT activation_codes_code_key UNIQUE (code),
    CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Table for classes
CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT classes_pkey PRIMARY KEY (id),
    CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for subjects
CREATE TABLE public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    kkm integer NOT NULL DEFAULT 75,
    teacher_id uuid NOT NULL,
    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for students
CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name character varying NOT NULL,
    nis character varying,
    nisn character varying,
    gender text,
    class_id uuid NOT NULL,
    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE
);

-- Table for schedule
CREATE TABLE public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time character varying NOT NULL,
    end_time character varying NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT schedule_pkey PRIMARY KEY (id),
    CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for attendance history
CREATE TABLE public.attendance_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT attendance_history_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for grade history
CREATE TABLE public.grade_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    assessment_type character varying NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT grade_history_pkey PRIMARY KEY (id),
    CONSTRAINT grade_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT grade_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT grade_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Table for journals
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
    CONSTRAINT journals_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT journals_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT journals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add foreign key for school years
ALTER TABLE public.school_years ADD CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'teacher', 'Free');
  RETURN new;
END;
$function$;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to safely get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Function for account activation
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_id UUID;
BEGIN
    -- Find the code and lock the row for update
    SELECT id INTO code_id
    FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false
    FOR UPDATE;

    -- If code is not found or already used, raise an exception
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code not found or already used';
    END IF;

    -- Update the user's account status to Pro
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the activation code as used
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id;

    RETURN true;
END;
$$;


-- RLS Policies
-- Profiles Table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON "public"."profiles"
AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON "public"."profiles"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON "public"."profiles"
AS PERMISSIVE FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON "public"."profiles"
AS PERMISSIVE FOR ALL TO authenticated
USING (public.get_my_role() = 'admin')
WITH CHECK (public.get_my_role() = 'admin');

-- Other tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."classes"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."subjects"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."school_years"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for users based on teacher_id" ON "public"."students"
AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1 FROM classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))));
CREATE POLICY "Enable insert for authenticated users only" ON "public"."students"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1 FROM classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))));

ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."schedule"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."attendance_history"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."grade_history"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable access for users based on user_id" ON "public"."journals"
AS PERMISSIVE FOR ALL TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Activation Codes Table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for admins" ON "public"."activation_codes"
AS PERMISSIVE FOR SELECT TO authenticated USING (public.get_my_role() = 'admin');
CREATE POLICY "Enable insert for admins" ON "public"."activation_codes"
AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (public.get_my_role() = 'admin');
