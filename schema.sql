-- ### BAGIAN 1: PEMBUATAN ENUM TYPES ###
-- (Dijalankan sekali, aman untuk dijalankan ulang)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'teacher');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('Free', 'Pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_status AS ENUM ('active', 'graduated', 'dropout', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpha');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_note_type AS ENUM ('positive', 'improvement', 'neutral');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ### BAGIAN 2: PEMBUATAN TABEL ###
-- Menggunakan IF NOT EXISTS agar aman dijalankan ulang

-- Tabel untuk menyimpan data sekolah dan pengaturan tahun ajaran aktif
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb
);

-- Tabel untuk menyimpan data pengguna, diperluas dari auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
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
    account_status account_status DEFAULT 'Pro'::account_status NOT NULL,
    role user_role DEFAULT 'teacher'::user_role NOT NULL,
    is_homeroom_teacher boolean DEFAULT false,
    active_school_year_id uuid
);

-- Tabel untuk tahun ajaran
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk kelas
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid, -- Foreign key ke profiles (wali kelas)
    school_year_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk mata pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk data siswa
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nis text UNIQUE,
    gender text,
    class_id uuid, -- Foreign key ke classes
    status student_status DEFAULT 'active'::student_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text
);

-- Tabel untuk jadwal pelajaran
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    subject_id uuid,
    class_id uuid,
    teacher_id uuid NOT NULL
);

-- Tabel untuk presensi siswa
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    records jsonb, -- [{ "student_id": "uuid", "status": "Hadir" }]
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk nilai siswa
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    assessment_type text NOT NULL,
    records jsonb, -- [{ "student_id": "uuid", "score": 95 }]
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk jurnal mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL,
    school_year_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk agenda guru
CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Tabel untuk catatan perkembangan siswa
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type student_note_type NOT NULL
);

-- Tabel untuk presensi guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL,
    date date NOT NULL DEFAULT CURRENT_DATE,
    check_in time,
    check_out time,
    status text, -- Tepat Waktu, Terlambat
    check_in_location jsonb,
    check_out_location jsonb,
    UNIQUE(teacher_id, date)
);


-- ### BAGIAN 3: PENAMBAHAN FOREIGN KEY ###
-- Menggunakan DROP CONSTRAINT IF EXISTS untuk keamanan

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_year_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_subject_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_class_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_teacher_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_teacher_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_class_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_subject_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_teacher_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_teacher_id_fkey;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_student_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_teacher_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- ### BAGIAN 4: FUNGSI DATABASE DAN KEAMANAN ###
-- Menggunakan CREATE OR REPLACE untuk fungsi dan DROP IF EXISTS untuk pemicu/kebijakan

-- Fungsi untuk mendapatkan peran pengguna
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$;

-- Fungsi untuk memeriksa apakah pengguna adalah admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id) = 'admin';
END;
$$;

-- Fungsi untuk menangani pengguna baru dari auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher'
  );
  RETURN new;
END;
$$;

-- Pemicu untuk handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ### BAGIAN 5: ROW LEVEL SECURITY (RLS) ###
-- Mengaktifkan RLS dan menetapkan kebijakan

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk `profiles`
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile." ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles." ON public.profiles;
CREATE POLICY "Admins can view all profiles." ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Kebijakan Umum: Admin dapat melakukan segalanya
DROP POLICY IF EXISTS "Admins can do anything." ON public.classes;
CREATE POLICY "Admins can do anything." ON public.classes FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can do anything." ON public.subjects;
CREATE POLICY "Admins can do anything." ON public.subjects FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can do anything." ON public.students;
CREATE POLICY "Admins can do anything." ON public.students FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can do anything." ON public.schedule;
CREATE POLICY "Admins can do anything." ON public.schedule FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can do anything." ON public.school_years;
CREATE POLICY "Admins can do anything." ON public.school_years FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can do anything." ON public.settings;
CREATE POLICY "Admins can do anything." ON public.settings FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all teacher attendance" ON public.teacher_attendance;
CREATE POLICY "Admins can view all teacher attendance" ON public.teacher_attendance FOR SELECT USING (public.is_admin(auth.uid()));

-- Kebijakan untuk Guru (Authenticated Users)
DROP POLICY IF EXISTS "Authenticated users can view classes, subjects, students, years." ON public.classes;
CREATE POLICY "Authenticated users can view classes, subjects, students, years." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view classes, subjects, students, years." ON public.subjects;
CREATE POLICY "Authenticated users can view classes, subjects, students, years." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view classes, subjects, students, years." ON public.students;
CREATE POLICY "Authenticated users can view classes, subjects, students, years." ON public.students FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view classes, subjects, students, years." ON public.school_years;
CREATE POLICY "Authenticated users can view classes, subjects, students, years." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can see all schedules" ON public.schedule;
CREATE POLICY "Authenticated users can see all schedules" ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.attendance;
CREATE POLICY "Teachers can manage their own data." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.grades;
CREATE POLICY "Teachers can manage their own data." ON public.grades FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.journal_entries;
CREATE POLICY "Teachers can manage their own data." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.agendas;
CREATE POLICY "Teachers can manage their own data." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own data." ON public.student_notes;
CREATE POLICY "Teachers can manage their own data." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Teachers can manage their own attendance." ON public.teacher_attendance;
CREATE POLICY "Teachers can manage their own attendance." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan tambahan untuk wali kelas
DROP POLICY IF EXISTS "Homeroom teachers can view notes for their students." ON public.student_notes;
CREATE POLICY "Homeroom teachers can view notes for their students." ON public.student_notes FOR SELECT USING (
  (SELECT class_id FROM students WHERE id = student_id) IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);

-- Grant usage on schema to roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

    