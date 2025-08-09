
-- Memberikan hak penggunaan skema 'auth' kepada postgres dan anon, penting untuk fungsi trigger
grant usage on schema auth to postgres, anon;

-- Menonaktifkan RLS pada tabel untuk sementara agar bisa dihapus dan dibuat ulang
ALTER TABLE if exists public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.attendance_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.grade_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE if exists public.activation_codes DISABLE ROW LEVEL SECURITY;

-- Hapus tabel yang ada dengan urutan yang benar untuk menghindari error foreign key
DROP TABLE IF EXISTS public.grade_history;
DROP TABLE IF EXISTS public.attendance_history;
DROP TABLE IF EXISTS public.journals;
DROP TABLE IF EXISTS public.schedule;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.classes;
DROP TABLE IF EXISTS public.activation_codes;
DROP TABLE IF EXISTS public.profiles;

-- Hapus fungsi dan trigger yang ada
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_role();
DROP FUNCTION IF EXISTS public.delete_storage_object(bucket text, object_path text, out status int, out content text);
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;

-- Tipe Enum untuk peran dan status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('Free', 'Pro');
    END IF;
END$$;


-- 1. PROFILES
-- Menyimpan data profil pengguna, terhubung dengan auth.users
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text NOT NULL,
    email text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status public.account_status DEFAULT 'Free'::public.account_status NOT NULL,
    role public.user_role DEFAULT 'teacher'::public.user_role NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- 2. ACTIVATION_CODES
-- Menyimpan kode aktivasi untuk akun Pro
CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

-- 3. CLASSES
-- Menyimpan daftar kelas yang diajar guru
CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Represents a class taught by a teacher.';

-- 4. SUBJECTS
-- Menyimpan daftar mata pelajaran
CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL CHECK (kkm >= 0 AND kkm <= 100),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Represents a subject taught by a teacher.';

-- 5. STUDENTS
-- Menyimpan data siswa
CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text,
    nisn text UNIQUE,
    gender text,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores student data for each class.';

-- 6. SCHEDULE
-- Menyimpan jadwal mengajar mingguan
CREATE TABLE public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Weekly teaching schedule for teachers.';

-- 7. JOURNALS
-- Menyimpan jurnal mengajar guru
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
COMMENT ON TABLE public.journals IS 'Teacher''s teaching journal entries.';

-- 8. ATTENDANCE_HISTORY
-- Menyimpan riwayat presensi
CREATE TABLE public.attendance_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendance_history IS 'Stores student attendance records.';

-- 9. GRADE_HISTORY
-- Menyimpan riwayat penilaian
CREATE TABLE public.grade_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.grade_history IS 'Stores student grade records.';


-- FUNGSI DAN TRIGGER

-- Fungsi untuk membuat profil baru saat pengguna mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a new profile for a new user.';

-- Trigger yang memanggil handle_new_user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Fungsi untuk mendapatkan peran pengguna saat ini dengan aman (MENGHINDARI REKURSI)
create or replace function public.get_my_role()
returns text
language sql
security definer
set search_path = public
as $$
    select role from public.profiles where id = auth.uid()
$$;


-- RLS POLICIES

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;

-- Policies untuk PROFILES
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Policies untuk ACTIVATION_CODES
CREATE POLICY "Admin can manage activation codes" ON public.activation_codes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Authenticated users can read activation codes" ON public.activation_codes FOR SELECT TO authenticated USING (true);


-- Policies untuk data guru (Classes, Subjects, Students, dll.)
CREATE POLICY "Teachers can manage their own data" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data" ON public.journals FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can manage their own data" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

-- Policies untuk STUDENTS (lebih kompleks karena terkait dengan kelas milik guru)
CREATE POLICY "Teachers can view students in their classes" ON public.students FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can insert students into their classes" ON public.students FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Teachers can update students in their classes" ON public.students FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);

-- Admin juga harus bisa mengelola data ini
CREATE POLICY "Admins have full access to all teacher data" ON public.classes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all teacher data" ON public.subjects FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all teacher data" ON public.schedule FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all teacher data" ON public.journals FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all teacher data" ON public.attendance_history FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all teacher data" ON public.grade_history FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Admins have full access to all students" ON public.students FOR ALL USING (public.get_my_role() = 'admin');
