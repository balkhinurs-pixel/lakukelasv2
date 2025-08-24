-- Skema SQL Lakukelas v2.0 - Idempotent
-- Dapat dijalankan berulang kali tanpa error.

-- =================================================================
-- BAGIAN 1: PENGHAPUSAN OBJEK (JIKA ADA)
-- Menghapus objek dengan urutan terbalik dari dependensi untuk
-- menghindari error.
-- =================================================================

-- Hapus Pemicu (Triggers) terlebih dahulu karena bergantung pada fungsi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Hapus Kebijakan Keamanan (Policies) karena bergantung pada fungsi is_admin()
-- Urutan penghapusan kebijakan tidak penting.
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profilnya sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profilnya sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat semua siswa." ON public.students;
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensinya sendiri." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilainya sendiri." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnalnya sendiri." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat melihat catatan siswa di kelasnya." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat membuat catatan untuk siswanya." ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat jadwalnya sendiri." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat jadwal kelasnya." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola semua kode aktivasi." ON public.activation_codes;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;

-- Hapus Fungsi (Functions) setelah pemicu dan kebijakan dihapus
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);

-- Hapus Views
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- =================================================================
-- BAGIAN 2: PEMBUATAN TABEL (TABLES)
-- Membuat semua tabel jika belum ada.
-- =================================================================

-- Tabel untuk menyimpan profil pengguna, diperluas dari auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
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
    account_status text DEFAULT 'Pro'::text NOT NULL,
    role text DEFAULT 'teacher'::text NOT NULL,
    is_homeroom_teacher boolean DEFAULT false,
    active_school_year_id uuid
);
COMMENT ON TABLE public.profiles IS 'Tabel profil pengguna yang menyimpan data tambahan terkait akun.';

-- Tabel untuk tahun ajaran
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.school_years IS 'Menyimpan daftar tahun ajaran, e.g., "2023/2024 - Ganjil".';

-- Tabel untuk kelas
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.classes IS 'Menyimpan daftar kelas atau rombongan belajar.';

-- Tabel untuk mata pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    kkm integer NOT NULL DEFAULT 75,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.subjects IS 'Menyimpan daftar mata pelajaran beserta KKM-nya.';

-- Tabel untuk siswa
CREATE TABLE IF NOT EXISTS public.students (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Menyimpan data induk siswa.';

-- Tabel untuk presensi
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.attendance IS 'Menyimpan catatan presensi harian per kelas dan mapel.';

-- Tabel untuk nilai
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.grades IS 'Menyimpan catatan nilai siswa per jenis penilaian.';

-- Tabel untuk jurnal mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date timestamp with time zone NOT NULL DEFAULT now(),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL
);
COMMENT ON TABLE public.journal_entries IS 'Menyimpan catatan jurnal mengajar guru.';

-- Tabel untuk catatan siswa (oleh wali kelas atau guru mapel)
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type text NOT NULL DEFAULT 'neutral'::text -- positive, improvement, neutral
);
COMMENT ON TABLE public.student_notes IS 'Menyimpan catatan perkembangan atau kejadian terkait siswa.';

-- Tabel untuk jadwal pelajaran
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Menyimpan jadwal pelajaran mingguan.';

-- Tabel untuk pengaturan aplikasi
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text,
    description text
);
COMMENT ON TABLE public.settings IS 'Menyimpan pengaturan global aplikasi.';

-- Tabel untuk kode aktivasi (Meskipun tidak digunakan, tetap dibuat untuk jaga-jaga)
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid,
    used_by_email text,
    used_at timestamp with time zone
);
COMMENT ON TABLE public.activation_codes IS 'Menyimpan kode aktivasi untuk fitur premium.';

-- Tabel untuk absensi guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL,
    check_in_latitude double precision,
    check_in_longitude double precision,
    check_out_latitude double precision,
    check_out_longitude double precision,
    UNIQUE (teacher_id, date)
);
COMMENT ON TABLE public.teacher_attendance IS 'Menyimpan catatan absensi kehadiran guru.';

-- =================================================================
-- BAGIAN 3: PEMBUATAN FUNGSI (FUNCTIONS)
-- Membuat semua fungsi database.
-- =================================================================

-- Fungsi untuk memeriksa apakah pengguna adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;
COMMENT ON FUNCTION public.is_admin() IS 'Memeriksa apakah pengguna yang terautentikasi memiliki peran admin.';

-- Fungsi untuk menangani pengguna baru dari auth.users
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
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(new.raw_user_meta_data->>'full_name', SPLIT_PART(new.email, '@', 1)),
    email = new.email,
    avatar_url = new.raw_user_meta_data->>'avatar_url';
  RETURN new;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Secara otomatis membuat profil saat pengguna baru mendaftar.';

-- Fungsi aktivasi (meskipun tidak dipakai, tetap didefinisikan)
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  SELECT id INTO v_code_id FROM activation_codes WHERE code = p_code AND is_used = false FOR UPDATE;
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;
  UPDATE activation_codes SET is_used = true, used_by = p_user_id, used_at = now(), used_by_email = p_user_email WHERE id = v_code_id;
  UPDATE profiles SET account_status = 'Pro' WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profil pengguna tidak ditemukan.';
  END IF;
END;
$$;
COMMENT ON FUNCTION public.activate_account_with_code(text, uuid, text) IS 'Fungsi untuk mengaktifkan akun Pro dengan kode.';

-- Fungsi RPC untuk mendapatkan data leger siswa
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date text, score numeric, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    s.name AS "subjectName",
    g.assessment_type,
    g.date::text,
    (r.value->>'score')::numeric,
    s.kkm
  FROM
    public.grades g
    CROSS JOIN LATERAL jsonb_array_elements(g.records) r
    JOIN public.subjects s ON g.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY
    s.name, g.date;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date text, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    s.name AS "subjectName",
    a.date::text,
    a.meeting_number,
    r.value->>'status' AS status
  FROM
    public.attendance a
    CROSS JOIN LATERAL jsonb_array_elements(a.records) r
    JOIN public.subjects s ON a.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY
    a.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      (r.value->>'student_id')::uuid as student_id,
      AVG((r.value->>'score')::numeric) as avg_score
    FROM public.grades g, jsonb_array_elements(g.records) r
    WHERE g.class_id = p_class_id
    GROUP BY student_id
  ), student_attendance AS (
    SELECT
      (r.value->>'student_id')::uuid as student_id,
      (COUNT(*) FILTER (WHERE r.value->>'status' = 'Hadir'))::numeric * 100 / COUNT(*)::numeric as att_perc
    FROM public.attendance a, jsonb_array_elements(a.records) r
    WHERE a.class_id = p_class_id
    GROUP BY student_id
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(ROUND(sg.avg_score, 2), 0) as average_grade,
    COALESCE(ROUND(sa.att_perc, 2), 0) as attendance_percentage
  FROM public.students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id
  LEFT JOIN student_attendance sa ON s.id = sa.student_id
  WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;


-- =================================================================
-- BAGIAN 4: PEMBUATAN RELASI DAN PEMICU (CONSTRAINTS & TRIGGERS)
-- Membuat relasi dan pemicu setelah tabel dan fungsi ada.
-- =================================================================

-- Relasi untuk profiles.active_school_year_id
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Relasi untuk attendance.school_year_id
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_school_year_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

-- Relasi untuk grades.school_year_id
ALTER TABLE public.grades DROP CONSTRAINT IF EXISTS grades_school_year_id_fkey;
ALTER TABLE public.grades ADD CONSTRAINT grades_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

-- Relasi untuk journal_entries.school_year_id
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_school_year_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE CASCADE;

-- Pemicu untuk menangani pengguna baru
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- =================================================================
-- BAGIAN 5: KEAMANAN (ROW LEVEL SECURITY)
-- Mengaktifkan RLS dan membuat semua kebijakan.
-- =================================================================

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk tabel `profiles`
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profilnya sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profilnya sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Kebijakan untuk tabel `classes`
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `subjects`
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `students`
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua siswa." ON public.students FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `attendance`
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensinya sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk tabel `grades`
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilainya sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk tabel `journal_entries`
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnalnya sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk tabel `student_notes`
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR (EXISTS ( SELECT 1 FROM classes WHERE classes.id = student_notes.student_id AND classes.teacher_id = auth.uid())));
CREATE POLICY "Guru dapat melihat catatan siswa di kelasnya." ON public.student_notes FOR SELECT USING ((EXISTS ( SELECT 1 FROM schedule WHERE schedule.teacher_id = auth.uid() AND schedule.class_id = (SELECT class_id FROM students WHERE id = student_notes.student_id))));
CREATE POLICY "Guru dapat membuat catatan untuk siswanya." ON public.student_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `schedule`
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat jadwalnya sendiri." ON public.schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Guru dapat melihat jadwal kelasnya." ON public.schedule FOR SELECT USING ((EXISTS ( SELECT 1 FROM classes WHERE classes.teacher_id = auth.uid() AND classes.id = schedule.class_id)));

-- Kebijakan untuk tabel `school_years`
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `settings`
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk tabel `activation_codes`
CREATE POLICY "Admin dapat mengelola semua kode aktivasi." ON public.activation_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Kebijakan untuk `teacher_attendance`
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola absensinya sendiri." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id);

-- =================================================================
-- BAGIAN 6: VIEWS
-- Membuat views untuk mempermudah query data.
-- =================================================================

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT a.id, a.date, a.class_id, a.subject_id, a.school_year_id, a.meeting_number, a.records, a.teacher_id, c.name AS "className", s.name AS "subjectName", date_part('month', a.date) as month
FROM attendance a
JOIN classes c ON a.class_id = c.id
JOIN subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT g.id, g.date, g.class_id, g.subject_id, g.school_year_id, g.assessment_type, g.records, g.teacher_id, c.name AS "className", s.name AS "subjectName", s.kkm as "subjectKkm", date_part('month', g.date) as month
FROM grades g
JOIN classes c ON g.class_id = c.id
JOIN subjects s ON g.subject_id = s.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT j.id, j.date, j.class_id, j.subject_id, j.school_year_id, j.meeting_number, j.learning_objectives, j.learning_activities, j.assessment, j.reflection, j.teacher_id, c.name AS "className", s.name AS "subjectName", date_part('month', j.date) as month
FROM journal_entries j
JOIN classes c ON j.class_id = c.id
JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT sn.id, sn.student_id, sn.teacher_id, sn.date, sn.note, sn.type, p.full_name AS teacher_name
FROM student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT ta.id, ta.teacher_id as "teacherId", p.full_name as "teacherName", ta.date, ta.check_in as "checkIn", ta.check_out as "checkOut", ta.status
FROM teacher_attendance ta
JOIN profiles p ON ta.teacher_id = p.id;

-- =================================================================
-- BAGIAN 7: SEEDING DATA AWAL (JIKA DIPERLUKAN)
-- =================================================================

-- Seed data awal untuk `settings` jika tabelnya kosong
INSERT INTO public.settings (key, value, description)
SELECT 'active_school_year_id', NULL, 'ID dari tahun ajaran yang sedang aktif secara global.'
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE key = 'active_school_year_id');

-- Selesai --
