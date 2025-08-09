
-- ===============================================================================================
--
--  Lakukelas Production Schema
--  Version: 1.2
--  Author: AI Assistant
--  Description: This script sets up the complete database schema for the Lakukelas application.
--               It is designed to be idempotent and can be run on a fresh or existing database.
--
-- ===============================================================================================

-- -----------------------------------------------------------------------------------------------
--  I. Dropping existing objects
--     We drop objects in reverse order of dependency to avoid errors.
--     Triggers -> Functions -> Tables.
--     Using `CASCADE` for tables handles foreign key dependencies automatically.
-- -----------------------------------------------------------------------------------------------

-- Drop the trigger first because it depends on the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now, drop the function
DROP FUNCTION IF EXISTS handle_new_user;

-- Drop all tables. `CASCADE` will also remove dependent objects like foreign keys.
DROP TABLE IF EXISTS "public"."grade_history" CASCADE;
DROP TABLE IF EXISTS "public"."attendance_history" CASCADE;
DROP TABLE IF EXISTS "public"."journals" CASCADE;
DROP TABLE IF EXISTS "public"."schedule" CASCADE;
DROP TABLE IF EXISTS "public"."activation_codes" CASCADE;
DROP TABLE IF EXISTS "public"."students" CASCADE;
DROP TABLE IF EXISTS "public"."subjects" CASCADE;
DROP TABLE IF EXISTS "public"."classes" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- -----------------------------------------------------------------------------------------------
--  II. Creating Tables
--      Defines the core structure of the application's data.
-- -----------------------------------------------------------------------------------------------

-- Profiles Table: Stores user-specific data, linked to Supabase Auth.
CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "nip" "text",
    "pangkat" "text",
    "jabatan" "text",
    "school_name" "text",
    "school_address" "text",
    "headmaster_name" "text",
    "headmaster_nip" "text",
    "school_logo_url" "text",
    "account_status" "text" DEFAULT 'Free'::"text" NOT NULL,
    "role" "text" DEFAULT 'teacher'::"text" NOT NULL,
    "email" "text",
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- Classes Table: Stores class information managed by a teacher.
CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "classes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

-- Subjects Table: Stores subject information and KKM, managed by a teacher.
CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" "smallint" DEFAULT 75 NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subjects_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;

-- Students Table: Stores student data, linked to a specific class.
CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text",
    "nisn" "text",
    "gender" "text" NOT NULL,
    "class_id" "uuid" NOT NULL,
    CONSTRAINT "students_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;

-- Schedule Table: Stores the weekly teaching schedule for a teacher.
CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "schedule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;

-- Journals Table: Stores teaching journal entries.
CREATE TABLE "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" "integer",
    "learning_objectives" "text" NOT NULL,
    "learning_activities" "text" NOT NULL,
    "assessment" "text",
    "reflection" "text",
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "journals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "journals_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    CONSTRAINT "journals_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    CONSTRAINT "journals_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;

-- Attendance History Table: Records attendance for each session.
CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" "integer" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "attendance_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    CONSTRAINT "attendance_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    CONSTRAINT "attendance_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;

-- Grade History Table: Records grades for various assessments.
CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    CONSTRAINT "grade_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "grade_history_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    CONSTRAINT "grade_history_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    CONSTRAINT "grade_history_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;

-- Activation Codes Table: Manages Pro account activation codes.
CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid",
    "used_at" "timestamp with time zone",
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL,
    CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "activation_codes_code_key" UNIQUE ("code"),
    CONSTRAINT "activation_codes_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL
);
ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------------------------
-- III. Functions and Triggers
--      Automates database operations, like creating a user profile on new sign-ups.
-- -----------------------------------------------------------------------------------------------

-- Function to create a new profile when a new user signs up in Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger to execute the function after a new user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------------------------
-- IV. Row Level Security (RLS) Policies
--     Secures data by ensuring users can only access their own information.
-- -----------------------------------------------------------------------------------------------

-- Policies for 'profiles' table
CREATE POLICY "Users can view their own profile." ON "public"."profiles"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON "public"."profiles"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Policies for 'classes' table
CREATE POLICY "Teachers can view their own classes." ON "public"."classes"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create classes for themselves." ON "public"."classes"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'subjects' table
CREATE POLICY "Teachers can view their own subjects." ON "public"."subjects"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create subjects for themselves." ON "public"."subjects"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own subjects." ON "public"."subjects"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id);

-- Policies for 'students' table (access is determined by class ownership)
CREATE POLICY "Teachers can view students in their own classes." ON "public"."students"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can add students to their own classes." ON "public"."students"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- Policies for 'schedule' table
CREATE POLICY "Teachers can manage their own schedule." ON "public"."schedule"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'journals' table
CREATE POLICY "Teachers can manage their own journals." ON "public"."journals"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'attendance_history' table
CREATE POLICY "Teachers can manage their own attendance records." ON "public"."attendance_history"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'grade_history' table
CREATE POLICY "Teachers can manage their own grade records." ON "public"."grade_history"
AS PERMISSIVE FOR ALL
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'activation_codes' (Admins have full access via service_role key, users have none)
CREATE POLICY "Allow admin full access." ON "public"."activation_codes"
AS PERMISSIVE FOR ALL
TO service_role
USING (true);

-- -----------------------------------------------------------------------------------------------
--  V. Granting Permissions
--     Allows the 'authenticated' role to read from tables, which is required for RLS to work.
-- -----------------------------------------------------------------------------------------------
GRANT SELECT ON TABLE "public"."profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."classes" TO "authenticated";
GRANT SELECT ON TABLE "public"."subjects" TO "authenticated";
GRANT SELECT ON TABLE "public"."students" TO "authenticated";
GRANT SELECT ON TABLE "public"."schedule" TO "authenticated";
GRANT SELECT ON TABLE "public"."journals" TO "authenticated";
GRANT SELECT ON TABLE "public"."attendance_history" TO "authenticated";
GRANT SELECT ON TABLE "public"."grade_history" TO "authenticated";

-- ===============================================================================================
--  End of Schema
-- ===============================================================================================
