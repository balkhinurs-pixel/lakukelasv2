
-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS "public"."attendance_records" CASCADE;
DROP TABLE IF EXISTS "public"."grade_records" CASCADE;
DROP TABLE IF EXISTS "public"."attendance_history" CASCADE;
DROP TABLE IF EXISTS "public"."grade_history" CASCADE;
DROP TABLE IF EXISTS "public"."journals" CASCADE;
DROP TABLE IF EXISTS "public"."schedule" CASCADE;
DROP TABLE IF EXISTS "public"."students" CASCADE;
DROP TABLE IF EXISTS "public"."subjects" CASCADE;
DROP TABLE IF EXISTS "public"."classes" CASCADE;
DROP TABLE IF EXISTS "public"."school_years" CASCADE;
DROP TABLE IF EXISTS "public"."activation_codes" CASCADE;
DROP TABLE IF EXISTS "public"."profiles" CASCADE;

-- Create school_years table
CREATE TABLE "public"."school_years" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."school_years" OWNER TO "postgres";
ALTER TABLE ONLY "public"."school_years" ADD CONSTRAINT "school_years_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."school_years" ADD CONSTRAINT "school_years_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table
CREATE TABLE "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
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
    "active_school_year_id" "uuid"
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";
ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."profiles" ADD CONSTRAINT "profiles_active_school_year_id_fkey" FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Create activation_codes table
CREATE TABLE "public"."activation_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "is_used" boolean DEFAULT false NOT NULL,
    "used_by" "uuid",
    "used_at" "timestamp with time zone",
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."activation_codes" OWNER TO "postgres";
ALTER TABLE ONLY "public"."activation_codes" ADD CONSTRAINT "activation_codes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."activation_codes" ADD CONSTRAINT "activation_codes_code_key" UNIQUE ("code");
ALTER TABLE ONLY "public"."activation_codes" ADD CONSTRAINT "activation_codes_used_by_fkey" FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create classes table
CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "school_year_id" "uuid",
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."classes" OWNER TO "postgres";
ALTER TABLE ONLY "public"."classes" ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."classes" ADD CONSTRAINT "classes_school_year_id_fkey" FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Create subjects table
CREATE TABLE "public"."subjects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "kkm" smallint DEFAULT '75'::smallint NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."subjects" OWNER TO "postgres";
ALTER TABLE ONLY "public"."subjects" ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."subjects" ADD CONSTRAINT "subjects_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Create students table
CREATE TABLE "public"."students" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "nis" "text",
    "nisn" "text",
    "gender" "text" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."students" OWNER TO "postgres";
ALTER TABLE ONLY "public"."students" ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;


-- Create schedule table
CREATE TABLE "public"."schedule" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "text" NOT NULL,
    "start_time" "time without time zone" NOT NULL,
    "end_time" "time without time zone" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."schedule" OWNER TO "postgres";
ALTER TABLE ONLY "public"."schedule" ADD CONSTRAINT "schedule_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."schedule" ADD CONSTRAINT "schedule_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."schedule" ADD CONSTRAINT "schedule_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."schedule" ADD CONSTRAINT "schedule_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Create journals table
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
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."journals" OWNER TO "postgres";
ALTER TABLE ONLY "public"."journals" ADD CONSTRAINT "journals_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."journals" ADD CONSTRAINT "journals_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."journals" ADD CONSTRAINT "journals_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."journals" ADD CONSTRAINT "journals_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Create attendance_history table
CREATE TABLE "public"."attendance_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "meeting_number" integer NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."attendance_history" OWNER TO "postgres";
ALTER TABLE ONLY "public"."attendance_history" ADD CONSTRAINT "attendance_history_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."attendance_history" ADD CONSTRAINT "attendance_history_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."attendance_history" ADD CONSTRAINT "attendance_history_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."attendance_history" ADD CONSTRAINT "attendance_history_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Create grade_history table
CREATE TABLE "public"."grade_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "class_id" "uuid" NOT NULL,
    "subject_id" "uuid" NOT NULL,
    "assessment_type" "text" NOT NULL,
    "records" "jsonb" NOT NULL,
    "teacher_id" "uuid" NOT NULL,
    "created_at" "timestamp with time zone" DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."grade_history" OWNER TO "postgres";
ALTER TABLE ONLY "public"."grade_history" ADD CONSTRAINT "grade_history_pkey" PRIMARY KEY ("id");
ALTER TABLE ONLY "public"."grade_history" ADD CONSTRAINT "grade_history_class_id_fkey" FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."grade_history" ADD CONSTRAINT "grade_history_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;
ALTER TABLE ONLY "public"."grade_history" ADD CONSTRAINT "grade_history_teacher_id_fkey" FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;


-- Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for classes, subjects, students, etc. (teacher-based access)
CREATE POLICY "Teachers can manage their own data." ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data." ON public.subjects FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can view students in their classes." ON public.students FOR SELECT USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can manage students in their classes." ON public.students FOR ALL USING (EXISTS (SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()));
CREATE POLICY "Teachers can manage their own schedule." ON public.schedule FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own journals." ON public.journals FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own attendance." ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own grades." ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own school years." ON public.school_years FOR ALL USING (auth.uid() = teacher_id);

-- Policies for activation_codes (admin access)
-- Note: Admin-only policies are better managed via server-side checks with service_role key
-- But for basic RLS, we can restrict general access.
CREATE POLICY "Allow admin full access." ON activation_codes FOR ALL
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Allow users to read codes (optional, if needed)." ON activation_codes FOR SELECT USING (auth.role() = 'authenticated');


-- Function to create a new profile for a new user.
DROP FUNCTION IF EXISTS public.handle_new_user();
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'teacher');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to handle user deletion
DROP FUNCTION IF EXISTS public.handle_user_delete();
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is deleted.
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Function for account activation
DROP FUNCTION IF EXISTS public.activate_account_with_code(uuid, text, text);
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    user_id_to_activate uuid,
    activation_code_to_use text,
    user_email_to_set text
)
RETURNS void AS $$
DECLARE
    code_id uuid;
    code_is_used boolean;
BEGIN
    -- Check if the code exists and is not used
    SELECT id, is_used INTO code_id, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Update the profile to 'Pro'
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the code as used
    UPDATE public.activation_codes
    SET 
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage Bucket for Profile Images & Logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 524288, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public, 
    file_size_limit = EXCLUDED.file_size_limit, 
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
-- 1. Allow public read access
DROP POLICY IF EXISTS "Allow public read access on profile-images" ON storage.objects;
CREATE POLICY "Allow public read access on profile-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'profile-images');

-- 2. Allow authenticated users to upload
DROP POLICY IF EXISTS "Allow authenticated users to upload" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'profile-images');

-- 3. Allow users to update their own images
DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
CREATE POLICY "Allow users to update their own images" ON storage.objects FOR UPDATE TO authenticated USING (auth.uid() = owner) WITH CHECK (bucket_id = 'profile-images');

-- 4. Allow users to delete their own images
DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
CREATE POLICY "Allow users to delete their own images" ON storage.objects FOR DELETE TO authenticated USING (auth.uid() = owner);

    