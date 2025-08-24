
-- ### Lakukelas Schema v1.3 - Idempotent ###
-- Skrip ini dirancang untuk bisa dijalankan berkali-kali tanpa error.

-- =============================================
-- 1. HAPUS OBJEK YANG BERGANTUNG (TRIGGERS, POLICIES)
-- =============================================

-- Hapus trigger terlebih dahulu karena bergantung pada fungsi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Hapus semua kebijakan keamanan (policies)
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Guru dapat melihat semua kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Guru dapat melihat semua mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya." ON public.students;
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dapat mengelola kode aktivasi." ON public.activation_codes;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat kode." ON public.activation_codes;
DROP POLICY IF EXISTS "Pengguna dapat mengelola agenda mereka sendiri." ON public.agendas;
DROP POLICY IF EXISTS "Admin dapat mengelola semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat melihat catatan siswa mereka dan wali kelas bisa melihat semua." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat membuat catatan untuk siswa manapun." ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat jadwalnya sendiri." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Guru dapat melihat semua tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;

-- =============================================
-- 2. HAPUS FUNGSI
-- =============================================
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);

-- =============================================
-- 3. BUAT TABEL
-- =============================================

-- Tabel untuk menyimpan data pengguna tambahan
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
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
    role text NOT NULL DEFAULT 'teacher'::text,
    account_status text NOT NULL DEFAULT 'Free'::text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);
COMMENT ON TABLE public.profiles IS 'Tabel data profil untuk pengguna, terhubung dengan auth.users.';

-- Tabel untuk tahun ajaran
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT false
);
COMMENT ON TABLE public.school_years IS 'Menyimpan daftar tahun ajaran, e.g., "2023/204 - Ganjil".';

-- Tabel untuk pengaturan umum aplikasi
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);
COMMENT ON TABLE public.settings IS 'Tabel untuk menyimpan pengaturan global aplikasi.';

-- Tabel untuk rombongan belajar
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Menyimpan daftar kelas atau rombongan belajar.';

-- Tabel untuk mata pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75
);
COMMENT ON TABLE public.subjects IS 'Menyimpan daftar mata pelajaran beserta KKM-nya.';

-- Tabel untuk data siswa
CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active'::text, -- active, graduated, dropout, inactive
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Menyimpan data induk siswa.';

-- Tabel untuk jadwal mengajar
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    UNIQUE(day, start_time, end_time, class_id)
);
COMMENT ON TABLE public.schedule IS 'Menyimpan jadwal pelajaran mingguan.';

-- Tabel presensi
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.attendance IS 'Menyimpan catatan presensi harian per kelas dan mapel.';

-- Tabel nilai
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.grades IS 'Menyimpan catatan penilaian siswa.';

-- Tabel jurnal mengajar
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.journal_entries IS 'Menyimpan jurnal mengajar guru.';

-- Tabel kode aktivasi
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE DEFAULT (('LKG-'::text || upper(substring(replace(gen_random_uuid()::text, '-'::text, ''::text), 1, 4))) || '-'::text) || upper(substring(replace(gen_random_uuid()::text, '-'::text, ''::text), 1, 4)),
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid,
    used_by_email text,
    used_at timestamp with time zone
);
COMMENT ON TABLE public.activation_codes IS 'Menyimpan kode aktivasi untuk akun Pro.';

-- Tabel Agenda
CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.agendas IS 'Menyimpan agenda atau acara pribadi guru.';

-- Tabel catatan siswa
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type text NOT NULL DEFAULT 'neutral'::text -- 'positive', 'improvement', 'neutral'
);
COMMENT ON TABLE public.student_notes IS 'Menyimpan catatan perkembangan atau insiden siswa.';

-- Tabel Absensi Guru
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT now(),
    check_in time with time zone,
    check_out time with time zone,
    status text,
    location_in jsonb,
    location_out jsonb,
    UNIQUE(teacher_id, date)
);
COMMENT ON TABLE public.teacher_attendance IS 'Menyimpan catatan kehadiran harian guru.';

-- =============================================
-- 4. BUAT FUNGSI-FUNGSI
-- =============================================

-- Fungsi untuk memeriksa apakah pengguna adalah admin
CREATE FUNCTION public.is_admin()
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
COMMENT ON FUNCTION public.is_admin() IS 'Mengembalikan true jika pengguna yang sedang login memiliki peran admin.';

-- Fungsi yang dijalankan oleh trigger saat pengguna baru mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    -- Jika full_name tidak tersedia di metadata, gunakan nama dari email
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;
COMMENT ON FUNCTION public.handle_new_user() IS 'Secara otomatis membuat profil baru saat pengguna mendaftar.';

-- Fungsi untuk aktivasi akun
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
COMMENT ON FUNCTION public.activate_account_with_code(text, uuid, text) IS 'Mengaktivasi akun pengguna menjadi Pro menggunakan kode.';

-- =============================================
-- 5. RELASI DAN FOREIGN KEYS
-- =============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey
FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- =============================================
-- 6. BUAT TRIGGER
-- =============================================

-- Trigger untuk membuat profil saat user baru mendaftar
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 7. KEBIJAKAN KEAMANAN (ROW LEVEL SECURITY)
-- =============================================

-- Aktifkan RLS untuk semua tabel
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;


-- Kebijakan untuk tabel `profiles`
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Kebijakan untuk `classes` & `subjects` & `school_years` & `settings` (Admin bisa semua, guru bisa lihat)
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk `students`
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING ((auth.role() = 'authenticated' AND (EXISTS ( SELECT 1 FROM schedule WHERE schedule.class_id = students.class_id AND schedule.teacher_id = auth.uid())))) OR (( SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid()) AND (EXISTS ( SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()))));

-- Kebijakan untuk `attendance`, `grades`, `journal_entries`
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi mereka." ON public.attendance FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai mereka." ON public.grades FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal mereka." ON public.journal_entries FOR ALL USING (teacher_id = auth.uid());

-- Kebijakan untuk `activation_codes`
CREATE POLICY "Admin dapat mengelola kode aktivasi." ON public.activation_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat kode." ON public.activation_codes FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk `agendas`
CREATE POLICY "Pengguna dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING (teacher_id = auth.uid());

-- Kebijakan untuk `student_notes`
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR (EXISTS (SELECT 1 FROM students s JOIN classes c ON s.class_id = c.id WHERE s.id = student_notes.student_id AND c.teacher_id = auth.uid())));
CREATE POLICY "Guru dapat melihat catatan yang mereka buat." ON public.student_notes FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Guru dapat membuat catatan untuk siswa manapun." ON public.student_notes FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Kebijakan untuk `schedule`
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat jadwalnya sendiri." ON public.schedule FOR SELECT USING (teacher_id = auth.uid());

-- Kebijakan untuk `teacher_attendance`
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola absensi mereka sendiri." ON public.teacher_attendance FOR ALL USING (teacher_id = auth.uid());


-- =============================================
-- 8. VIEWS (UNTUK MEMPERMUDAH QUERY)
-- =============================================
DROP VIEW IF EXISTS public.attendance_history;
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.meeting_number,
    a.records,
    a.teacher_id,
    c.name as "className",
    s.name as "subjectName",
    EXTRACT(MONTH FROM a.date) as month
FROM
    public.attendance a
JOIN public.classes c ON a.class_id = c.id
JOIN public.subjects s ON a.subject_id = s.id;

DROP VIEW IF EXISTS public.grades_history;
CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.assessment_type,
    g.records,
    g.teacher_id,
    c.name as "className",
    s.name as "subjectName",
    s.kkm as "subjectKkm",
    EXTRACT(MONTH FROM g.date) as month
FROM
    public.grades g
JOIN public.classes c ON g.class_id = c.id
JOIN public.subjects s ON g.subject_id = s.id;

DROP VIEW IF EXISTS public.journal_entries_with_names;
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
    j.id,
    j.date,
    j.class_id,
    j.subject_id,
    j.school_year_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    j.created_at,
    c.name as "className",
    s.name as "subjectName",
    EXTRACT(MONTH FROM j.date) as month
FROM
    public.journal_entries j
JOIN public.classes c ON j.class_id = c.id
JOIN public.subjects s ON j.subject_id = s.id;

DROP VIEW IF EXISTS public.student_notes_with_teacher;
CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.date,
    sn.note,
    sn.type,
    p.full_name as teacher_name
FROM
    public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;
    
DROP VIEW IF EXISTS public.teacher_attendance_history;
CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id as "teacherId",
    p.full_name as "teacherName",
    ta.date,
    ta.check_in,
    ta.check_out,
    ta.status
FROM
    public.teacher_attendance ta
JOIN public.profiles p ON ta.teacher_id = p.id;

-- =============================================
-- 9. RPC FUNCTIONS (UNTUK LOGIKA KOMPLEKS)
-- =============================================

-- Fungsi untuk mendapatkan rekap nilai siswa
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score numeric, kkm integer)
LANGUAGE sql
AS $$
  SELECT
      g.id,
      s.name AS "subjectName",
      g.assessment_type,
      g.date,
      (r->>'score')::numeric as score,
      s.kkm
  FROM
      public.grades g
      CROSS JOIN jsonb_array_elements(g.records) AS r
      JOIN public.subjects s ON g.subject_id = s.id
  WHERE
      (r->>'student_id')::uuid = p_student_id;
$$;

-- Fungsi untuk mendapatkan rekap absensi siswa
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE sql
AS $$
  SELECT
      a.id,
      s.name AS "subjectName",
      a.date,
      a.meeting_number,
      r->>'status' as status
  FROM
      public.attendance a
      CROSS JOIN jsonb_array_elements(a.records) AS r
      JOIN public.subjects s ON a.subject_id = s.id
  WHERE
      (r->>'student_id')::uuid = p_student_id;
$$;

-- Fungsi untuk mendapatkan statistik performa siswa per kelas
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);
CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE sql
AS $$
WITH student_grades AS (
  SELECT
    (r->>'student_id')::uuid as student_id,
    AVG((r->>'score')::numeric) as avg_score
  FROM grades
  WHERE class_id = p_class_id
  CROSS JOIN jsonb_array_elements(records) as r
  GROUP BY (r->>'student_id')::uuid
),
student_attendance AS (
  SELECT
    (r->>'student_id')::uuid as student_id,
    COUNT(*) as total_meetings,
    SUM(CASE WHEN r->>'status' = 'Hadir' THEN 1 ELSE 0 END) as present_meetings
  FROM attendance
  WHERE class_id = p_class_id
  CROSS JOIN jsonb_array_elements(records) as r
  GROUP BY (r->>'student_id')::uuid
)
SELECT
  s.id,
  s.name,
  s.nis,
  COALESCE(ROUND(sg.avg_score, 1), 0) as average_grade,
  COALESCE(ROUND((sa.present_meetings::numeric / sa.total_meetings::numeric) * 100, 1), 0) as attendance_percentage
FROM students s
LEFT JOIN student_grades sg ON s.id = sg.student_id
LEFT JOIN student_attendance sa ON s.id = sa.student_id
WHERE s.class_id = p_class_id AND s.status = 'active';
$$;

-- =============================================
-- 10. Grant permissions
-- =============================================
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;

-- Selesai
