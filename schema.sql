-- Skema Database Aplikasi Lakukelas (Versi Final & Idempotent)
-- Didesain untuk Supabase PostgreSQL.
-- Skrip ini bersifat idempotent, artinya dapat dijalankan berulang kali tanpa error.

-- Menonaktifkan RLS untuk sementara pada tabel yang akan dimodifikasi
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journal_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activation_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schedule DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.school_years DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.teacher_attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agendas DISABLE ROW LEVEL SECURITY;


-- 1. HAPUS OBJEK DATABASE YANG BERGANTUNG (TRIGGERS, POLICIES)
-- Urutan ini penting untuk menghindari error dependensi.

-- Hapus Pemicu (Triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Hapus Kebijakan Keamanan (Policies)
-- Urutan penghapusan kebijakan tidak terlalu krusial, tapi lebih baik dihapus semua di awal.
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profilnya sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profilnya sendiri." ON public.profiles;

DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat semua kelas." ON public.classes;

DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat semua mapel." ON public.subjects;

DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya." ON public.students;

DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi miliknya." ON public.attendance;

DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai miliknya." ON public.grades;

DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal miliknya." ON public.journal_entries;

DROP POLICY IF EXISTS "Admin dapat mengelola kode aktivasi." ON public.activation_codes;

DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat mengelola catatan yang dibuatnya." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat melihat catatan siswa yang diajarnya." ON public.student_notes;

DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat jadwalnya sendiri." ON public.schedule;

DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;

DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;

DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;

DROP POLICY IF EXISTS "Guru dapat mengelola agenda pribadinya." ON public.agendas;

-- 2. HAPUS DAN BUAT ULANG FUNGSI
-- Menggunakan CREATE OR REPLACE FUNCTION adalah cara aman untuk ini.

-- Fungsi untuk memeriksa apakah pengguna adalah admin
-- FIX: Menambahkan 'LANGUAGE plpgsql' yang hilang.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Fungsi untuk menangani pengguna baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Coba ambil nama lengkap dari metadata, jika tidak ada, gunakan nama dari email
  user_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    SPLIT_PART(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id,
    user_full_name,
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher' -- Role default untuk pengguna baru
  );
  RETURN new;
END;
$$;


-- 3. BUAT TABEL JIKA BELUM ADA

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    account_status text DEFAULT 'Free'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);
COMMENT ON TABLE public.profiles IS 'Tabel untuk menyimpan data profil pengguna, termasuk guru dan admin.';

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.school_years IS 'Menyimpan daftar tahun ajaran, e.g., "2023/2024 - Ganjil".';

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Menyimpan daftar kelas atau rombongan belajar.';

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.subjects IS 'Menyimpan daftar mata pelajaran.';

CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text UNIQUE NOT NULL,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Menyimpan data induk siswa.';

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.attendance IS 'Mencatat kehadiran siswa per pertemuan.';

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.grades IS 'Mencatat nilai siswa.';

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.journal_entries IS 'Catatan jurnal mengajar harian guru.';

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text UNIQUE NOT NULL,
    is_used boolean DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    used_by_email text
);
COMMENT ON TABLE public.activation_codes IS 'Kode untuk aktivasi akun Pro.';

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Catatan perkembangan atau kejadian siswa.';

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Jadwal mengajar mingguan guru.';

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value jsonb,
    description text
);
COMMENT ON TABLE public.settings IS 'Pengaturan umum aplikasi.';

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);
COMMENT ON TABLE public.teacher_attendance IS 'Mencatat kehadiran guru.';

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.agendas IS 'Agenda atau jadwal pribadi guru.';


-- 4. BUAT ULANG RELASI (FOREIGN KEY)
-- Ini memastikan relasi terdefinisi dengan benar setelah semua tabel dibuat.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- 5. BUAT ULANG VIEWS
-- Hapus dulu view lama untuk menghindari konflik kolom.
DROP VIEW IF EXISTS public.teacher_attendance_history;
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
 SELECT ta.id,
    ta.teacher_id,
    p.full_name AS teacher_name,
    ta.date,
    ta.check_in,
    ta.check_out,
    ta.status
   FROM (public.teacher_attendance ta
     JOIN public.profiles p ON ((ta.teacher_id = p.id)));

DROP VIEW IF EXISTS public.attendance_history;
CREATE OR REPLACE VIEW public.attendance_history AS
 SELECT a.id,
    a.date,
    a.class_id,
    c.name AS class_name,
    a.subject_id,
    s.name AS subject_name,
    a.meeting_number,
    a.records,
    a.teacher_id,
    a.school_year_id,
    date_part('month'::text, a.date) AS month
   FROM ((public.attendance a
     JOIN public.classes c ON ((a.class_id = c.id)))
     JOIN public.subjects s ON ((a.subject_id = s.id)));

DROP VIEW IF EXISTS public.grades_history;
CREATE OR REPLACE VIEW public.grades_history AS
 SELECT g.id,
    g.date,
    g.class_id,
    c.name AS class_name,
    g.subject_id,
    s.name AS subject_name,
    s.kkm AS subject_kkm,
    g.assessment_type,
    g.records,
    g.teacher_id,
    g.school_year_id,
    date_part('month'::text, g.date) AS month
   FROM ((public.grades g
     JOIN public.classes c ON ((g.class_id = c.id)))
     JOIN public.subjects s ON ((g.subject_id = s.id)));

DROP VIEW IF EXISTS public.journal_entries_with_names;
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
 SELECT je.id,
    je.date,
    je.class_id,
    c.name AS class_name,
    je.subject_id,
    s.name AS subject_name,
    je.meeting_number,
    je.learning_objectives,
    je.learning_activities,
    je.assessment,
    je.reflection,
    je.teacher_id,
    je.school_year_id,
    date_part('month'::text, je.date) AS month
   FROM ((public.journal_entries je
     JOIN public.classes c ON ((je.class_id = c.id)))
     JOIN public.subjects s ON ((je.subject_id = s.id)));

DROP VIEW IF EXISTS public.student_notes_with_teacher;
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
 SELECT sn.id,
    sn.student_id,
    sn.teacher_id,
    p.full_name AS teacher_name,
    sn.date,
    sn.note,
    sn.type
   FROM (public.student_notes sn
     JOIN public.profiles p ON ((sn.teacher_id = p.id)));


-- 6. AKTIFKAN RLS DAN BUAT ULANG KEBIJAKAN
-- Kebijakan dibuat setelah fungsi dan tabel dijamin ada.

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profilnya sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profilnya sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- Subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.schedule sch WHERE sch.class_id = students.class_id AND sch.teacher_id = auth.uid()
) OR (
    SELECT is_homeroom_teacher FROM public.profiles WHERE id = auth.uid()
));

-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi miliknya." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);

-- Grades
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai miliknya." ON public.grades FOR ALL USING (auth.uid() = teacher_id);

-- Journal Entries
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal miliknya." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);

-- Activation Codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola kode aktivasi." ON public.activation_codes FOR ALL USING (public.is_admin());

-- Student Notes
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR (
    EXISTS (SELECT 1 FROM public.classes WHERE id = student_notes.student_id AND teacher_id = auth.uid())
));
CREATE POLICY "Guru dapat mengelola catatan yang dibuatnya." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat melihat catatan siswa yang diajarnya." ON public.student_notes FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.students s JOIN public.schedule sch ON s.class_id = sch.class_id WHERE s.id = student_notes.student_id AND sch.teacher_id = auth.uid()
));

-- Schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat jadwalnya sendiri." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);

-- School Years
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

-- Settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Teacher Attendance
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());

-- Agendas
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guru dapat mengelola agenda pribadinya." ON public.agendas FOR ALL USING (auth.uid() = teacher_id);


-- 7. BUAT ULANG PEMICU (TRIGGER)
-- Pemicu dibuat paling akhir setelah semua fungsi dan tabel ada.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Selesai.
