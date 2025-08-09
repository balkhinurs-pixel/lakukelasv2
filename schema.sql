
-- Lakukelas Application Database Schema
-- Version: 1.0.0
-- This script is designed to be idempotent. It can be run multiple times safely.

-- 1. Drop existing objects to ensure a clean setup
-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS "public"."grade_history";
DROP TABLE IF EXISTS "public"."attendance_history";
DROP TABLE IF EXISTS "public"."journals";
DROP TABLE IF EXISTS "public"."schedule";
DROP TABLE IF EXISTS "public"."students";
DROP TABLE IF EXISTS "public"."subjects";
DROP TABLE IF EXISTS "public"."classes";
DROP TABLE IF EXISTS "public"."activation_codes";
DROP TABLE IF EXISTS "public"."profiles";

-- Drop functions and triggers
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
DROP FUNCTION IF EXISTS "public"."handle_new_user";


-- 2. Create `profiles` table
-- This table will store user data. Every user from auth.users will have a row here.
CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL PRIMARY KEY REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" UNIQUE,
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
    "role" "text" DEFAULT 'teacher'::"text" NOT NULL
);
-- Add comments for clarity
COMMENT ON TABLE "public"."profiles" IS 'Stores public profile information for each user.';
COMMENT ON COLUMN "public"."profiles"."role" IS 'User role: ''teacher'' or ''admin''';


-- 3. Create `activation_codes` table
-- This table stores activation codes for Pro accounts.
CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "code" "text" NOT NULL UNIQUE,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid" REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
COMMENT ON TABLE "public"."activation_codes" IS 'Stores activation codes for Pro account feature.';


-- 4. Create `classes` table
-- Stores class groups (e.g., "Kelas 10-A").
CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."classes" IS 'Stores class groups taught by a teacher.';


-- 5. Create `subjects` table
-- Stores subjects taught by a teacher.
CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "kkm" integer DEFAULT 75 NOT NULL,
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."subjects" IS 'Stores subjects and their minimum passing criteria (KKM).';


-- 6. Create `students` table
-- Stores student data, linked to a class.
CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "nis" "text",
    "nisn" "text" UNIQUE,
    "gender" "text" NOT NULL,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."students" IS 'Stores student master data.';


-- 7. Create `schedule` table
-- Stores the weekly teaching schedule.
CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "day" "text" NOT NULL,
    "start_time" "time" without time zone NOT NULL,
    "end_time" "time" without time zone NOT NULL,
    "subject_id" "uuid" NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."schedule" IS 'Stores the weekly teaching schedule for each teacher.';


-- 8. Create `journals` table
-- Stores teaching journal entries.
CREATE TABLE "public"."journals" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" "uuid" NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "meeting_number" integer,
    "learning_objectives" "text" NOT NULL,
    "learning_activities" "text" NOT NULL,
    "assessment" "text",
    "reflection" "text",
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."journals" IS 'Stores daily or per-meeting teaching journals.';


-- 9. Create `attendance_history` table
-- Stores historical attendance records.
CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" "uuid" NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "meeting_number" integer,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."attendance_history" IS 'Stores historical attendance records for each session.';
COMMENT ON COLUMN "public"."attendance_history"."records" IS 'JSONB array of {student_id, status}. Example: [{"student_id": "uuid", "status": "Hadir"}]';


-- 10. Create `grade_history` table
-- Stores historical grade records.
CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL REFERENCES "public"."classes"("id") ON DELETE CASCADE,
    "subject_id" "uuid" NOT NULL REFERENCES "public"."subjects"("id") ON DELETE CASCADE,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
COMMENT ON TABLE "public"."grade_history" IS 'Stores historical grade/assessment records.';
COMMENT ON COLUMN "public"."grade_history"."records" IS 'JSONB array of {student_id, score}. Example: [{"student_id": "uuid", "score": 85}]';


-- 11. Set up Row Level Security (RLS)
-- Enable RLS for all tables to enforce data access policies.
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;


-- 12. Create RLS Policies
-- Policies to control who can access what data.

-- Profiles: Users can view all profiles, but only edit their own.
CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles." ON "public"."profiles" FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Activation Codes: Only admins can manage codes. Logged-in users can view available codes.
CREATE POLICY "Admins can manage activation codes." ON "public"."activation_codes" FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Authenticated users can see unused codes." ON "public"."activation_codes" FOR SELECT USING (auth.role() = 'authenticated');

-- Generic Teacher Data: Teachers can manage their own data.
CREATE POLICY "Teachers can manage their own classes." ON "public"."classes" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own subjects." ON "public"."subjects" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own schedule." ON "public"."schedule" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own journals." ON "public"."journals" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own attendance records." ON "public"."attendance_history" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own grade records." ON "public"."grade_history" FOR ALL USING (auth.uid() = teacher_id);

-- Students: Teachers can manage students in their own classes.
CREATE POLICY "Teachers can manage students in their classes." ON "public"."students" FOR ALL
    USING ("class_id" IN (SELECT "id" FROM "public"."classes" WHERE "teacher_id" = auth.uid()));


-- 13. Create Function to Handle New Users
-- This function automatically creates a profile for a new user upon registration.
CREATE FUNCTION "public"."handle_new_user"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Ensures a profile is created for every new user.';


-- 14. Create Trigger for New User Function
-- This trigger calls the function whenever a new user is added to auth.users.
CREATE TRIGGER "on_auth_user_created"
AFTER INSERT ON "auth"."users"
FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();


-- End of Schema
