--
-- Skema Database untuk Aplikasi LakuKelas
-- Versi: 2.0
-- Deskripsi: Skema ini mencakup semua tabel, relasi, fungsi, dan pemicu
--            yang diperlukan untuk menjalankan aplikasi LakuKelas dengan Supabase.
--

-- 1. Membuat Tabel
-- Urutan pembuatan tabel penting untuk memastikan integritas referensial.

CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
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
COMMENT ON TABLE public.profiles IS 'Data profil untuk setiap pengguna, baik guru maupun admin.';

CREATE TABLE public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.school_years IS 'Tabel untuk menyimpan data tahun ajaran (e.g., 2023/2024 - Ganjil).';

CREATE TABLE public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.classes IS 'Menyimpan daftar semua kelas atau rombongan belajar.';

CREATE TABLE public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.subjects IS 'Menyimpan daftar semua mata pelajaran.';

CREATE TABLE public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Data induk semua siswa.';

CREATE TABLE public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Jadwal mengajar mingguan untuk setiap guru.';

CREATE TABLE public.attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.attendance IS 'Mencatat kehadiran siswa per pertemuan.';

CREATE TABLE public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.grades IS 'Mencatat nilai siswa untuk berbagai jenis penilaian.';

CREATE TABLE public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date timestamp with time zone DEFAULT now() NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.journal_entries IS 'Catatan jurnal mengajar guru.';

CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    code text DEFAULT (('LKG-'::text || upper(substring(md5((random())::text), 1, 4))) || '-'::text) || upper(substring(md5((random())::text), 1, 4)) NOT NULL UNIQUE,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    used_by_email text
);
COMMENT ON TABLE public.activation_codes IS 'Kode untuk aktivasi akun Pro (legacy, fungsionalitas dihapus dari UI).';

CREATE TABLE public.settings (
    id bigint NOT NULL PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value text
);
COMMENT ON TABLE public.settings IS 'Pengaturan umum aplikasi.';
CREATE SEQUENCE public.settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;
ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


CREATE TABLE public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.agendas IS 'Agenda atau pengingat pribadi untuk guru.';

CREATE TABLE public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.teacher_attendance IS 'Mencatat kehadiran guru (check-in/check-out).';

CREATE TABLE public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Catatan perkembangan siswa dari guru mapel atau wali kelas.';


-- 2. Menambahkan Kendala (Constraints) dan Indeks
-- Foreign Key constraint untuk `active_school_year_id` di tabel `profiles`
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey
FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

CREATE INDEX idx_students_class_id ON public.students(class_id);
CREATE INDEX idx_attendance_teacher_id ON public.attendance(teacher_id);
CREATE INDEX idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX idx_journal_entries_teacher_id ON public.journal_entries(teacher_id);


-- 3. Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 4. Membuat Kebijakan RLS (Policies)

-- Kebijakan untuk tabel `profiles`
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);


-- Kebijakan umum untuk data yang dibuat oleh guru
-- Memungkinkan guru untuk mengelola data yang mereka buat sendiri.
CREATE POLICY "Guru dapat mengelola data mereka sendiri." ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat mengelola data mereka sendiri." ON public.subjects FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat mengelola data mereka sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat mengelola data mereka sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat mengelola data mereka sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

-- Kebijakan untuk admin agar bisa mengelola semua data
CREATE POLICY "Admin dapat mengelola semua data." ON public.classes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.subjects FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.students FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.schedule FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.attendance FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.grades FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.journal_entries FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.activation_codes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.settings FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.school_years FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.teacher_attendance FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Admin dapat mengelola semua data." ON public.student_notes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Kebijakan baca untuk pengguna yang terautentikasi (guru)
-- Memungkinkan guru melihat data yang relevan untuk pekerjaannya.
CREATE POLICY "Guru dapat melihat semua kelas, mapel, siswa, dan jadwal." ON public.classes FOR SELECT USING (true);
CREATE POLICY "Guru dapat melihat semua kelas, mapel, siswa, dan jadwal." ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Guru dapat melihat semua kelas, mapel, siswa, dan jadwal." ON public.students FOR SELECT USING (true);
CREATE POLICY "Guru dapat melihat semua kelas, mapel, siswa, dan jadwal." ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Guru dapat melihat semua catatan siswa." ON public.student_notes FOR SELECT USING (true);

-- 5. Membuat Fungsi dan Pemicu

-- Fungsi untuk membuat profil baru setiap kali pengguna baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher', -- Default role
    'Pro'      -- Default status, semua pengguna sekarang Pro
  );
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Secara otomatis membuat profil pengguna baru saat ada entri baru di tabel auth.users.';

-- Pemicu untuk fungsi `handle_new_user`
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fungsi untuk aktivasi akun (legacy)
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false
  FOR UPDATE;

  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.activate_account_with_code IS 'Mengaktifkan status akun pengguna menjadi Pro menggunakan kode aktivasi.';

-- Memberikan hak eksekusi ke pengguna terautentikasi
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;


-- 6. Membuat Views untuk mempermudah query
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
JOIN 
    public.profiles p ON ta.teacher_id = p.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    a.id,
    a.date,
    a.class_id,
    c.name AS class_name,
    a.subject_id,
    s.name AS subject_name,
    a.meeting_number,
    a.records,
    a.teacher_id,
    a.school_year_id,
    EXTRACT(MONTH FROM a.date) as month
FROM 
    public.attendance a
JOIN 
    public.classes c ON a.class_id = c.id
JOIN 
    public.subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    g.id,
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
    EXTRACT(MONTH FROM g.date) as month
FROM 
    public.grades g
JOIN 
    public.classes c ON g.class_id = c.id
JOIN 
    public.subjects s ON g.subject_id = s.id;
    
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.id,
    je.date,
    je.class_id,
    c.name as class_name,
    je.subject_id,
    s.name as subject_name,
    je.meeting_number,
    je.learning_objectives,
    je.learning_activities,
    je.assessment,
    je.reflection,
    je.teacher_id,
    je.school_year_id,
    EXTRACT(MONTH FROM je.date) as month
FROM
    public.journal_entries je
JOIN
    public.classes c ON je.class_id = c.id
JOIN
    public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.id,
    sn.student_id,
    sn.teacher_id,
    p.full_name AS teacher_name,
    sn.note,
    sn.type,
    sn.date
FROM 
    public.student_notes sn
JOIN 
    public.profiles p ON sn.teacher_id = p.id;

-- 7. Membuat Functions untuk kalkulasi
CREATE OR REPLACE FUNCTION get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT
            r.student_id,
            AVG((r.value->>'score')::numeric) as avg_score
        FROM
            grades g,
            jsonb_to_recordset(g.records) as r(student_id uuid, score text)
        WHERE g.class_id = p_class_id
        GROUP BY r.student_id
    ),
    student_attendance AS (
        SELECT
            r.student_id,
            COUNT(*) as total_records,
            SUM(CASE WHEN r.value->>'status' = 'Hadir' THEN 1 ELSE 0 END) as present_count
        FROM
            attendance a,
            jsonb_to_recordset(a.records) as r(student_id uuid, status text)
        WHERE a.class_id = p_class_id
        GROUP BY r.student_id
    )
    SELECT
        s.id,
        s.name,
        s.nis,
        COALESCE(ROUND(sg.avg_score, 2), 0) as average_grade,
        COALESCE(ROUND((sa.present_count::numeric / sa.total_records) * 100, 2), 0) as attendance_percentage
    FROM
        students s
    LEFT JOIN
        student_grades sg ON s.id = sg.student_id
    LEFT JOIN
        student_attendance sa ON s.id = sa.student_id
    WHERE
        s.class_id = p_class_id AND s.status = 'active';
END;
$$;


CREATE OR REPLACE FUNCTION get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, subject_name text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        s.name as subject_name,
        g.assessment_type,
        g.date,
        (r.value->>'score')::numeric as score,
        s.kkm
    FROM
        grades g
    JOIN
        subjects s ON g.subject_id = s.id,
        jsonb_to_recordset(g.records) as r(student_id uuid, score text)
    WHERE
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY g.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, subject_name text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        s.name as subject_name,
        a.date,
        a.meeting_number,
        r.value->>'status' as status
    FROM
        attendance a
    JOIN
        subjects s ON a.subject_id = s.id,
        jsonb_to_recordset(a.records) as r(student_id uuid, status text)
    WHERE
        (r.value->>'student_id')::uuid = p_student_id
    ORDER BY a.date DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_student_performance_for_class(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_attendance_ledger(uuid) TO authenticated;
```