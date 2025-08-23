-- 1. Buat Tipe Kustom (Custom Types)
-- Pastikan tipe ini belum ada sebelum membuatnya
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('Free', 'Pro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
        CREATE TYPE public.student_status AS ENUM ('active', 'graduated', 'dropout', 'inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpha');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_note_type') THEN
        CREATE TYPE public.student_note_type AS ENUM ('positive', 'improvement', 'neutral');
    END IF;
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teacher_attendance_status') THEN
        CREATE TYPE public.teacher_attendance_status AS ENUM ('Tepat Waktu', 'Terlambat', 'Tidak Hadir');
    END IF;
END$$;


-- 2. Buat Tabel (Tables)
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
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
    account_status public.account_status DEFAULT 'Pro'::public.account_status,
    role public.user_role DEFAULT 'teacher'::public.user_role,
    active_school_year_id uuid REFERENCES public.school_years(id),
    is_homeroom_teacher boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nis text UNIQUE NOT NULL,
    gender text,
    class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT,
    status public.student_status DEFAULT 'active'::public.student_status,
    avatar_url text
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date timestamp with time zone NOT NULL DEFAULT now(),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text,
    learning_activities text,
    assessment text,
    reflection text
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type public.student_note_type NOT NULL
);

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time,
    check_out time,
    status public.teacher_attendance_status,
    notes text,
    UNIQUE(teacher_id, date)
);

-- 3. Buat Fungsi (Functions)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
        new.email,
        new.raw_user_meta_data->>'avatar_url',
        'teacher'
    );
    RETURN new;
END;
$$;


-- 4. Buat Pemicu (Triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 5. Aktifkan Row Level Security (RLS) & Buat Kebijakan (Policies)

-- Tabel: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles;
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin());

-- Tabel: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat semua kelas." ON public.classes;
CREATE POLICY "Pengguna terautentikasi dapat melihat semua kelas." ON public.classes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin());

-- Tabel: subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat semua mapel." ON public.subjects;
CREATE POLICY "Pengguna terautentikasi dapat melihat semua mapel." ON public.subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin());

-- Tabel: students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat semua siswa." ON public.students;
CREATE POLICY "Pengguna terautentikasi dapat melihat semua siswa." ON public.students FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin());

-- Tabel: attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka sendiri." ON public.attendance;
CREATE POLICY "Guru dapat mengelola presensi mereka sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());

-- Tabel: grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka sendiri." ON public.grades;
CREATE POLICY "Guru dapat mengelola nilai mereka sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());

-- Tabel: journal_entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries;
CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());

-- Tabel: student_notes
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat mengelola catatan yang mereka buat." ON public.student_notes;
CREATE POLICY "Guru dapat mengelola catatan yang mereka buat." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR EXISTS (SELECT 1 FROM classes WHERE classes.id = (SELECT class_id FROM students WHERE students.id = student_notes.student_id) AND classes.teacher_id = auth.uid()));

-- Tabel: schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat melihat jadwal mereka sendiri." ON public.schedule;
CREATE POLICY "Guru dapat melihat jadwal mereka sendiri." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin());

-- Tabel: school_years
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin());

-- Tabel: settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin());

-- Tabel: teacher_attendance
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Guru dapat mengelola absensi mereka sendiri." ON public.teacher_attendance;
CREATE POLICY "Guru dapat mengelola absensi mereka sendiri." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
