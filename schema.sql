-- ### SKEMA DATABASE LENGKAP (UNTUK DEPLOYMENT BARU) ###
-- Skrip ini idempotent, aman untuk dijalankan berkali-kali.
-- Menghapus semua objek lama sebelum membuat yang baru untuk memastikan kebersihan.

-- Hapus trigger dan fungsi lama jika ada (dengan CASCADE untuk mengatasi dependensi)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid) CASCADE;


-- Hapus tabel lama jika ada (dengan CASCADE untuk mengatasi dependensi foreign key)
DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Buat Tabel: profiles
CREATE TABLE public.profiles (
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
    email text
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information.';

-- Buat Tabel: activation_codes
CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

-- Buat Tabel: classes
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Represents a class or group of students.';

-- Buat Tabel: subjects
CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Represents a subject taught by a teacher.';

-- Buat Tabel: students
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text,
    nisn text,
    gender text,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores individual student data.';

-- Buat Tabel: schedule
CREATE TABLE public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Buat Tabel: journals
CREATE TABLE public.journals (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.journals IS 'Stores teaching journal entries.';

-- Buat Tabel: attendance_history
CREATE TABLE public.attendance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendance_history IS 'Stores historical attendance records.';

-- Buat Tabel: grade_history
CREATE TABLE public.grade_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.grade_history IS 'Stores historical grade records.';

-- Fungsi dan Trigger untuk menangani pengguna baru
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'teacher');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi helper untuk mendapatkan peran pengguna dengan aman
CREATE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Fungsi untuk proses aktivasi akun
CREATE FUNCTION public.activate_account_with_code(activation_code text, user_id uuid)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
  code_id uuid;
  is_code_valid boolean;
  is_code_used boolean;
BEGIN
  -- Cek validitas kode
  SELECT id, is_used INTO code_id, is_code_used
  FROM public.activation_codes
  WHERE code = activation_code;

  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  IF is_code_used THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update status akun pengguna menjadi Pro
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id;

  -- Update status kode aktivasi
  UPDATE public.activation_codes
  SET is_used = true, used_by = user_id, used_at = now()
  WHERE id = code_id;
  
  RETURN json_build_object('success', true, 'message', 'Account activated successfully');
END;
$$;


-- RLS POLICIES --
-- Aktifkan RLS dan definisikan aturan untuk setiap tabel

-- Table: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON "public"."profiles" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Table: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own classes" ON "public"."classes" FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert their own classes" ON "public"."classes" FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own classes" ON "public"."classes" FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their own classes" ON "public"."classes" FOR DELETE USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all classes" ON "public"."classes" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own subjects" ON "public"."subjects" FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert their own subjects" ON "public"."subjects" FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own subjects" ON "public"."subjects" FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their own subjects" ON "public"."subjects" FOR DELETE USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all subjects" ON "public"."subjects" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view students in their classes" ON "public"."students" FOR SELECT USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can insert students into their classes" ON "public"."students" FOR INSERT WITH CHECK (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can update students in their classes" ON "public"."students" FOR UPDATE USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete students from their classes" ON "public"."students" FOR DELETE USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Admins can manage all students" ON "public"."students" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own schedule" ON "public"."schedule" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all schedules" ON "public"."schedule" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: attendance_history
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own attendance" ON "public"."attendance_history" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all attendance" ON "public"."attendance_history" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: grade_history
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own grades" ON "public"."grade_history" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all grades" ON "public"."grade_history" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own journals" ON "public"."journals" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all journals" ON "public"."journals" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: activation_codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read codes" ON "public"."activation_codes" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage activation codes" ON "public"."activation_codes" FOR ALL USING (public.get_my_role() = 'admin');
