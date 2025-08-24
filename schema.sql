-- ========= EXTENSIONS =========
-- Aktifkan ekstensi yang diperlukan jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========= TABLES =========

-- Tabel untuk menyimpan profil pengguna, terhubung ke sistem autentikasi Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone,
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
    is_homeroom_teacher boolean DEFAULT false,
    active_school_year_id uuid
);
COMMENT ON TABLE public.profiles IS 'Stores public profile information for each user.';

-- Tabel untuk tahun ajaran (e.g., "2023/2024 - Ganjil")
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.school_years IS 'Stores academic years and semesters.';

-- Tabel untuk pengaturan umum aplikasi
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value jsonb,
    updated_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.settings IS 'Stores global application settings.';

-- Tabel untuk kelas (Rombel)
CREATE TABLE IF NOT-Exists public.classes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid, -- Foreign key constraint added later
    school_year_id uuid, -- Foreign key to active school year at time of creation (optional)
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.classes IS 'Stores class groups (rombel).';

-- Tabel untuk mata pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.subjects IS 'Stores all subjects taught.';

-- Tabel untuk data siswa
CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid, -- Foreign key constraint added later
    status text DEFAULT 'active'::text NOT NULL, -- active, graduated, dropout, inactive
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Stores student data.';

-- Tabel untuk catatan perkembangan siswa
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL, -- Foreign key constraint added later
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL -- 'positive', 'improvement', 'neutral'
);
COMMENT ON TABLE public.student_notes IS 'Stores notes and observations about students.';

-- Tabel untuk jadwal pelajaran
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL, -- Foreign key constraint added later
    subject_id uuid NOT NULL, -- Foreign key constraint added later
    teacher_id uuid NOT NULL -- Foreign key constraint added later
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Tabel untuk presensi siswa
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL, -- Foreign key constraint added later
    subject_id uuid NOT NULL, -- Foreign key constraint added later
    meeting_number integer,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    school_year_id uuid, -- Foreign key constraint added later
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.attendance IS 'Stores student attendance records for each session.';

-- Tabel untuk nilai siswa
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL, -- Foreign key constraint added later
    subject_id uuid NOT NULL, -- Foreign key constraint added later
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    school_year_id uuid, -- Foreign key constraint added later
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.grades IS 'Stores student grades for various assessments.';

-- Tabel untuk jurnal mengajar guru
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid NOT NULL, -- Foreign key constraint added later
    subject_id uuid NOT NULL, -- Foreign key constraint added later
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    school_year_id uuid -- Foreign key constraint added later
);
COMMENT ON TABLE public.journal_entries IS 'Stores teacher''s daily teaching journals.';

-- Tabel untuk agenda pribadi guru
CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.agendas IS 'Stores personal teacher agendas and reminders.';

-- Tabel untuk absensi guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT uuid_generate_v4() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL, -- Foreign key constraint added later
    date date DEFAULT now() NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text,
    latitude double precision,
    longitude double precision
);
COMMENT ON TABLE public.teacher_attendance IS 'Stores teacher daily attendance records.';

-- ========= FOREIGN KEY CONSTRAINTS =========

-- Pastikan relasi ditambahkan setelah semua tabel dibuat.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_teacher_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.classes DROP CONSTRAINT IF EXISTS classes_school_year_id_fkey;
ALTER TABLE public.classes ADD CONSTRAINT classes_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE SET NULL;

ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_student_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

ALTER TABLE public.student_notes DROP CONSTRAINT IF EXISTS student_notes_teacher_id_fkey;
ALTER TABLE public.student_notes ADD CONSTRAINT student_notes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_class_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_subject_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.schedule DROP CONSTRAINT IF EXISTS schedule_teacher_id_fkey;
ALTER TABLE public.schedule ADD CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_class_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_teacher_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_class_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_subject_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_teacher_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_class_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_subject_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_teacher_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_teacher_id_fkey;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.teacher_attendance DROP CONSTRAINT IF EXISTS teacher_attendance_teacher_id_fkey;
ALTER TABLE public.teacher_attendance ADD CONSTRAINT teacher_attendance_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ========= FUNCTIONS AND TRIGGERS =========

-- Fungsi untuk menangani pembuatan profil pengguna baru secara otomatis
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    new.id,
    -- Coba ambil nama lengkap dari metadata, jika tidak ada, gunakan bagian dari email
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    'teacher', -- Role default untuk pengguna baru
    'Pro'      -- Status akun default
  );
  return new;
END;
$$;

-- Trigger untuk menjalankan handle_new_user setiap kali ada pengguna baru di tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi untuk memeriksa apakah pengguna adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role = 'admin';
END;
$$;

-- ========= ROW LEVEL SECURITY (RLS) =========

-- Aktifkan RLS untuk semua tabel
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
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;


-- --- Kebijakan untuk tabel `profiles` ---
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri" ON public.profiles;
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin dapat mengelola semua profil" ON public.profiles;
CREATE POLICY "Admin dapat mengelola semua profil" ON public.profiles FOR ALL USING (public.is_admin());

-- --- Kebijakan untuk tabel `classes`, `subjects`, `students`, `school_years` ---
-- Hanya admin yang dapat mengelola data master ini. Guru hanya bisa membaca.
DROP POLICY IF EXISTS "Admin dapat mengelola data master" ON public.classes;
CREATE POLICY "Admin dapat mengelola data master" ON public.classes FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca data master" ON public.classes;
CREATE POLICY "Pengguna terautentikasi dapat membaca data master" ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin dapat mengelola data master" ON public.subjects;
CREATE POLICY "Admin dapat mengelola data master" ON public.subjects FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca data master" ON public.subjects;
CREATE POLICY "Pengguna terautentikasi dapat membaca data master" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin dapat mengelola data master" ON public.students;
CREATE POLICY "Admin dapat mengelola data master" ON public.students FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca data master" ON public.students;
CREATE POLICY "Pengguna terautentikasi dapat membaca data master" ON public.students FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin dapat mengelola data master" ON public.school_years;
CREATE POLICY "Admin dapat mengelola data master" ON public.school_years FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca data master" ON public.school_years;
CREATE POLICY "Pengguna terautentikasi dapat membaca data master" ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin dapat mengelola settings" ON public.settings;
CREATE POLICY "Admin dapat mengelola settings" ON public.settings FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca settings" ON public.settings;
CREATE POLICY "Pengguna terautentikasi dapat membaca settings" ON public.settings FOR SELECT USING (auth.role() = 'authenticated');


-- --- Kebijakan untuk tabel transaksional (attendance, grades, journal, dll.) ---
-- Guru hanya bisa melihat dan mengelola data yang mereka buat sendiri. Admin bisa melihat semua.
DROP POLICY IF EXISTS "Guru dapat mengelola data mereka sendiri" ON public.attendance;
CREATE POLICY "Guru dapat mengelola data mereka sendiri" ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua data" ON public.attendance;
CREATE POLICY "Admin dapat melihat semua data" ON public.attendance FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Guru dapat mengelola data mereka sendiri" ON public.grades;
CREATE POLICY "Guru dapat mengelola data mereka sendiri" ON public.grades FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua data" ON public.grades;
CREATE POLICY "Admin dapat melihat semua data" ON public.grades FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Guru dapat mengelola data mereka sendiri" ON public.journal_entries;
CREATE POLICY "Guru dapat mengelola data mereka sendiri" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua data" ON public.journal_entries;
CREATE POLICY "Admin dapat melihat semua data" ON public.journal_entries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Guru dapat mengelola agenda mereka sendiri" ON public.agendas;
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Guru dapat mengelola catatan siswa mereka sendiri" ON public.student_notes;
CREATE POLICY "Guru dapat mengelola catatan siswa mereka sendiri" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Wali kelas dapat melihat semua catatan siswanya" ON public.student_notes;
CREATE POLICY "Wali kelas dapat melihat semua catatan siswanya" ON public.student_notes FOR SELECT USING (
  (SELECT class_id FROM students WHERE id = student_id) IN (SELECT id FROM classes WHERE teacher_id = auth.uid())
);
DROP POLICY IF EXISTS "Admin dapat melihat semua catatan" ON public.student_notes;
CREATE POLICY "Admin dapat melihat semua catatan" ON public.student_notes FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Guru dapat melihat jadwal mereka" ON public.schedule;
CREATE POLICY "Guru dapat melihat jadwal mereka" ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal" ON public.schedule;
CREATE POLICY "Admin dapat mengelola semua jadwal" ON public.schedule FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Guru dapat mengelola absensi mereka sendiri" ON public.teacher_attendance;
CREATE POLICY "Guru dapat mengelola absensi mereka sendiri" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru" ON public.teacher_attendance;
CREATE POLICY "Admin dapat melihat semua absensi guru" ON public.teacher_attendance FOR SELECT USING (public.is_admin());


-- ========= VIEWS =========
-- Views untuk mempermudah query data laporan

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.teacher_id,
    a.meeting_number,
    a.records,
    c.name AS class_name,
    s.name AS subject_name,
    EXTRACT(MONTH FROM a.date) as month
FROM
    public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.teacher_id,
    g.assessment_type,
    g.records,
    c.name AS class_name,
    s.name AS subject_name,
    s.kkm AS subject_kkm,
    EXTRACT(MONTH FROM g.date) as month
FROM
    public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
    j.id,
    j.date,
    j.class_id,
    j.subject_id,
    j.school_year_id,
    j.teacher_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    c.name as class_name,
    s.name as subject_name,
    EXTRACT(MONTH FROM j.date) as month
FROM
    public.journal_entries j
JOIN public.classes c ON j.class_id = c.id
JOIN public.subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.date,
    sn.note,
    sn.type,
    p.full_name AS teacher_name
FROM
    public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id,
    p.full_name AS teacher_name,
    ta.date,
    ta.check_in,
    ta.check_out,
    ta.status
FROM
    public.teacher_attendance ta
JOIN public.profiles p ON ta.teacher_id = p.id;

-- ========= RPC FUNCTIONS =========
-- Fungsi RPC untuk Laporan

-- RPC untuk leger nilai siswa
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE (
    id uuid,
    "subjectName" text,
    assessment_type text,
    date date,
    score numeric,
    kkm integer
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        s.name as "subjectName",
        g.assessment_type,
        g.date,
        (r.value->>'score')::numeric as score,
        s.kkm
    FROM
        public.grades g,
        jsonb_array_elements(g.records) r
    JOIN public.subjects s ON g.subject_id = s.id
    WHERE
        (r.value->>'student_id')::uuid = p_student_id;
END;
$$;

-- RPC untuk leger absensi siswa
CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE (
    id uuid,
    "subjectName" text,
    date date,
    meeting_number integer,
    status text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        s.name as "subjectName",
        a.date,
        a.meeting_number,
        r.value->>'status' as status
    FROM
        public.attendance a,
        jsonb_array_elements(a.records) r
    JOIN public.subjects s ON a.subject_id = s.id
    WHERE
        (r.value->>'student_id')::uuid = p_student_id;
END;
$$;

-- RPC untuk rekap performa siswa per kelas (untuk wali kelas)
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE (
    id uuid,
    name text,
    nis text,
    average_grade numeric,
    attendance_percentage numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT
            (r.value->>'student_id')::uuid as student_id,
            AVG((r.value->>'score')::numeric) as avg_score
        FROM
            public.grades g,
            jsonb_array_elements(g.records) r
        WHERE g.class_id = p_class_id
        GROUP BY 1
    ),
    student_attendance AS (
        SELECT
            (r.value->>'student_id')::uuid as student_id,
            COUNT(*) as total_records,
            SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as hadir_count
        FROM
            public.attendance a,
            jsonb_array_elements(a.records) r
        WHERE a.class_id = p_class_id
        GROUP BY 1
    )
    SELECT
        st.id,
        st.name,
        st.nis,
        COALESCE(ROUND(sg.avg_score, 1), 0) as average_grade,
        COALESCE(ROUND((sa.hadir_count * 100.0) / sa.total_records, 0), 0) as attendance_percentage
    FROM
        public.students st
    LEFT JOIN student_grades sg ON st.id = sg.student_id
    LEFT JOIN student_attendance sa ON st.id = sa.student_id
    WHERE st.class_id = p_class_id AND st.status = 'active';
END;
$$;
