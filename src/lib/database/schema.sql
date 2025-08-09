-- Classroom Zephyr - Full Production Database Schema

-- Drop existing objects if they exist to ensure a clean setup.
-- This makes the script idempotent (safe to run multiple times).
DROP TABLE IF EXISTS "public"."grade_history" CASCADE;
DROP TABLE IF EXISTS "public"."attendance_history" CASCADE;
DROP TABLE IF EXISTS "public"."journals" CASCADE;
DROP TABLE IF EXISTS "public"."schedule" CASCADE;
DROP TABLE IF EXISTS "public"."students" CASCADE;
DROP TABLE IF EXISTS "public"."subjects" CASCADE;
DROP TABLE IF EXISTS "public"."classes" CASCADE;
DROP TABLE IF EXISTS "public"."activation_codes" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

DROP FUNCTION IF EXISTS "public"."handle_new_user"();
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";

-- Table: profiles
-- Stores user profile information, linking to auth.users.
CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "nip" "text",
    "pangkat" "text",
    "jabatan" "text",
    "school_name" "text",
    "school_address" "text",
    "headmaster_name" "text",
    "headmaster_nip" "text",
    "school_logo_url" "text",
    "account_status" "text" DEFAULT 'Free'::text NOT NULL,
    "role" "text" DEFAULT 'teacher'::text NOT NULL,
    "email" "text"
);
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY USING INDEX "profiles_pkey";
ALTER TABLE "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Table: activation_codes
-- Stores activation codes for Pro accounts.
CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid",
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."activation_codes" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX activation_codes_code_key ON public.activation_codes USING btree (code);
CREATE UNIQUE INDEX activation_codes_pkey ON public.activation_codes USING btree (id);
ALTER TABLE "public"."activation_codes" ADD CONSTRAINT "activation_codes_pkey" PRIMARY KEY USING INDEX "activation_codes_pkey";
ALTER TABLE "public"."activation_codes" ADD CONSTRAINT "activation_codes_used_by_fkey" FOREIGN KEY (used_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Table: classes
-- Stores class information.
CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX classes_pkey ON public.classes USING btree (id);
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY USING INDEX "classes_pkey";
ALTER TABLE "public"."classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Table: subjects
-- Stores subject information.
CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" smallint DEFAULT '75'::smallint NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."subjects" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX subjects_pkey ON public.subjects USING btree (id);
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_pkey" PRIMARY KEY USING INDEX "subjects_pkey";
ALTER TABLE "public"."subjects" ADD CONSTRAINT "subjects_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Table: students
-- Stores student information for each class.
CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text" NOT NULL,
    "nisn" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."students" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX students_pkey ON public.students USING btree (id);
ALTER TABLE "public"."students" ADD CONSTRAINT "students_pkey" PRIMARY KEY USING INDEX "students_pkey";
ALTER TABLE "public"."students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;

-- Table: schedule
-- Stores weekly teaching schedules.
CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" time NOT NULL,
    "end_time" time NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL
);
ALTER TABLE "public"."schedule" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX schedule_pkey ON public.schedule USING btree (id);
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_pkey" PRIMARY KEY USING INDEX "schedule_pkey";
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE "public"."schedule" ADD CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Table: journals
-- Stores teaching journal entries.
CREATE TABLE "public"."journals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer,
    "learning_objectives" "text" NOT NULL,
    "learning_activities" "text" NOT NULL,
    "assessment" "text",
    "reflection" "text",
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."journals" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX journals_pkey ON public.journals USING btree (id);
ALTER TABLE "public"."journals" ADD CONSTRAINT "journals_pkey" PRIMARY KEY USING INDEX "journals_pkey";
ALTER TABLE "public"."journals" ADD CONSTRAINT "journals_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE "public"."journals" ADD CONSTRAINT "journals_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE "public"."journals" ADD CONSTRAINT "journals_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Table: attendance_history
-- Stores historical attendance records.
CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."attendance_history" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX attendance_history_pkey ON public.attendance_history USING btree (id);
ALTER TABLE "public"."attendance_history" ADD CONSTRAINT "attendance_history_pkey" PRIMARY KEY USING INDEX "attendance_history_pkey";
ALTER TABLE "public"."attendance_history" ADD CONSTRAINT "attendance_history_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE "public"."attendance_history" ADD CONSTRAINT "attendance_history_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE "public"."attendance_history" ADD CONSTRAINT "attendance_history_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Table: grade_history
-- Stores historical grade records.
CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."grade_history" ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX grade_history_pkey ON public.grade_history USING btree (id);
ALTER TABLE "public"."grade_history" ADD CONSTRAINT "grade_history_pkey" PRIMARY KEY USING INDEX "grade_history_pkey";
ALTER TABLE "public"."grade_history" ADD CONSTRAINT "grade_history_class_id_fkey" FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE;
ALTER TABLE "public"."grade_history" ADD CONSTRAINT "grade_history_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;
ALTER TABLE "public"."grade_history" ADD CONSTRAINT "grade_history_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Function and Trigger for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Row Level Security (RLS) Policies

-- Profiles: Users can see their own profile. Admins can see all.
CREATE POLICY "Users can view their own profile." ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles." ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Activation Codes: Admins can manage codes. Users can see their used code.
CREATE POLICY "Admins can manage activation codes." ON public.activation_codes
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
CREATE POLICY "Users can view their own used code." ON public.activation_codes
  FOR SELECT USING (auth.uid() = used_by);

-- Generic Teacher Policies (Applies to classes, subjects, etc.)
CREATE POLICY "Teachers can manage their own data." ON public.classes
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.subjects
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.schedule
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.journals
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.attendance_history
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.grade_history
  FOR ALL USING (auth.uid() = teacher_id);

-- Students: Teachers can manage students in their own classes.
CREATE POLICY "Teachers can manage students in their classes." ON public.students
  FOR ALL USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

-- Admin Policies for Teacher Data
CREATE POLICY "Admins can manage all teacher data." ON public.classes
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.subjects
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.students
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.schedule
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.journals
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.attendance_history
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admins can manage all teacher data." ON public.grade_history
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
