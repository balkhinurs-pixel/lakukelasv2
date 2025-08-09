-- Classroom Zephyr - Supabase Schema
-- Version: 1.5
-- Last Updated: 2024-05-22
-- Description: Final production-ready schema for the Lakukelas application.
-- This script is designed to be idempotent and can be run on a new or existing database.

-- ----------------------------
-- Section 1: Teardown and Cleanup
-- Drop dependent objects first in reverse order of creation.
-- ----------------------------

-- Drop Triggers first as they depend on functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop Functions
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop Policies (if any were created manually or in previous versions)
-- Note: RLS policies are dropped when the table is dropped, but this is for good measure.
-- Example: DROP POLICY IF EXISTS "Allow individual read access" ON public.profiles;

-- Drop Tables, using CASCADE to handle dependencies like foreign keys.
DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- ----------------------------
-- Section 2: Table Creation
-- ----------------------------

-- Table for user profiles, linked to auth.users
CREATE TABLE public.profiles (
    "id" uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "full_name" text NULL,
    "avatar_url" text NULL,
    "nip" text NULL,
    "pangkat" text NULL,
    "jabatan" text NULL,
    "school_name" text NULL,
    "school_address" text NULL,
    "headmaster_name" text NULL,
    "headmaster_nip" text NULL,
    "school_logo_url" text NULL,
    "account_status" text NOT NULL DEFAULT 'Free'::text,
    "role" text NOT NULL DEFAULT 'teacher'::text,
    "email" text NULL
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing user profile information.';

-- Table for classes taught by a teacher
CREATE TABLE public.classes (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.classes IS 'Stores class groups taught by teachers.';

-- Table for subjects taught by a teacher
CREATE TABLE public.subjects (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "kkm" smallint NOT NULL DEFAULT 75,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.subjects IS 'Stores subjects and their passing criteria (KKM).';

-- Table for students, belonging to a class
CREATE TABLE public.students (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "nis" text NOT NULL,
    "nisn" text NOT NULL,
    "gender" text NOT NULL,
    "class_id" uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.students IS 'Stores student data for each class.';

-- Table for weekly teaching schedule
CREATE TABLE public.schedule (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "day" text NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "subject_id" uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    "class_id" uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Table for teaching journals
CREATE TABLE public.journals (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" timestamp with time zone NOT NULL DEFAULT now(),
    "class_id" uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    "meeting_number" integer,
    "learning_objectives" text NOT NULL,
    "learning_activities" text NOT NULL,
    "assessment" text,
    "reflection" text,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.journals IS 'Stores daily teaching journal entries.';

-- Table for attendance history
CREATE TABLE public.attendance_history (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" date NOT NULL,
    "class_id" uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    "meeting_number" integer NOT NULL,
    "records" jsonb NOT NULL,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.attendance_history IS 'Stores historical attendance records.';

-- Table for grade history
CREATE TABLE public.grade_history (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "date" date NOT NULL,
    "class_id" uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    "subject_id" uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    "assessment_type" text NOT NULL,
    "records" jsonb NOT NULL,
    "teacher_id" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.grade_history IS 'Stores historical grade records for various assessments.';

-- Table for Pro account activation codes
CREATE TABLE public.activation_codes (
    "id" uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    "code" text NOT NULL UNIQUE,
    "is_used" boolean NOT NULL DEFAULT false,
    "used_by" uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    "used_at" timestamp with time zone NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';


-- ----------------------------
-- Section 3: Functions and Triggers
-- ----------------------------

-- Function to create a new profile entry when a new user signs up in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile upon new user registration in auth.users.';

-- Trigger to execute the function after a new user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ----------------------------
-- Section 4: Row Level Security (RLS)
-- ----------------------------

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for 'profiles'
CREATE POLICY "Allow individual read access" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual update access" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can see all profiles" ON public.profiles FOR SELECT TO authenticated USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );

-- RLS Policies for teacher-specific data
-- Classes, Subjects, Schedule, Journals, History tables
CREATE POLICY "Allow full access for owners" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow full access for owners" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow full access for owners" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow full access for owners" ON public.journals FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow full access for owners" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Allow full access for owners" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- RLS Policies for 'students' (accessible if user owns the class)
CREATE POLICY "Allow read access to students in owned classes" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Allow full access to students in owned classes" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- RLS Policies for 'activation_codes'
CREATE POLICY "Allow admin full access to activation codes" ON public.activation_codes FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' );
CREATE POLICY "Allow authenticated users to read codes" ON public.activation_codes FOR SELECT TO authenticated USING (true);


-- ----------------------------
-- Section 5: Initial Data (Optional)
-- You can add any initial seed data here if needed.
-- ----------------------------
-- Example:
-- INSERT INTO public.classes (name, teacher_id) VALUES ('Kelas Contoh', 'user-uuid-goes-here');

-- --- END OF SCHEMA ---
