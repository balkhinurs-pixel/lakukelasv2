-- =================================================================
-- KELAS DIGITAL - SKEMA DATABASE FINAL v2.0
-- Deskripsi: Skema komprehensif yang telah diperbaiki.
-- Menghapus semua objek yang ada untuk memastikan eksekusi bersih.
-- =================================================================

-- NONAKTIFKAN SEMENTARA TRIGGER UNTUK MENGHAPUS FUNGSI
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- =================================================================
-- STEP 1: HAPUS SEMUA OBJEK YANG ADA (URUTAN TERBALIK DARI DEPENDENSI)
-- =================================================================

-- 1.1 Hapus Pemicu (Triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 1.2 Hapus Kebijakan (Policies)
-- Urutan tidak terlalu penting di sini karena semua akan dihapus
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.classes;
DROP POLICY IF EXISTS "Guru dapat melihat semua kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.subjects;
DROP POLICY IF EXISTS "Guru dapat melihat semua mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya." ON public.students;
DROP POLICY IF EXISTS "Wali kelas dapat melihat siswa di kelas perwaliannya" ON public.students;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi milik mereka." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai milik mereka." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal milik mereka." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat mengelola catatan yang mereka buat." ON public.student_notes;
DROP POLICY IF EXISTS "Wali kelas dapat melihat semua catatan siswa di kelasnya" ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.school_years;
DROP POLICY IF EXISTS "Guru dapat melihat semua tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.settings;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Admin dapat mengelola semua." ON public.agendas;
DROP POLICY IF EXISTS "Pengguna dapat mengelola agenda mereka sendiri." ON public.agendas;

-- 1.3 Hapus Views
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- 1.4 Hapus Fungsi (Functions) - INI LANGKAH PENTING YANG TERLEWAT
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);

-- =================================================================
-- STEP 2: BUAT ULANG TABEL
-- =================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
    role text NOT NULL DEFAULT 'teacher'::text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75
);

CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'active'::text,
    avatar_url text
);

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date timestamp with time zone NOT NULL DEFAULT now(),
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type text NOT NULL DEFAULT 'neutral'::text
);

CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.settings (
    id bigint NOT NULL PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    key text NOT NULL UNIQUE,
    value jsonb
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    check_in time without time zone,
    check_out time without time zone,
    status text,
    CONSTRAINT teacher_attendance_date_unique UNIQUE (teacher_id, date)
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);


-- =================================================================
-- STEP 3: BUAT ULANG FUNGSI
-- =================================================================

-- Fungsi untuk menangani pengguna baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Fungsi untuk memeriksa apakah pengguna adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
  ) = 'admin';
END;
$$;


-- Fungsi RPC lainnya
CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score integer, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    s.name AS "subjectName",
    g.assessment_type,
    g.date,
    (r.value->>'score')::integer AS score,
    s.kkm
  FROM
    public.grades AS g
  CROSS JOIN LATERAL jsonb_array_elements(g.records) AS r(value)
  JOIN
    public.subjects AS s ON g.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY
    g.date DESC, s.name;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    s.name AS "subjectName",
    a.date,
    a.meeting_number,
    r.value->>'status' AS status
  FROM
    public.attendance AS a
  CROSS JOIN LATERAL jsonb_array_elements(a.records) AS r(value)
  JOIN
    public.subjects AS s ON a.subject_id = s.id
  WHERE
    (r.value->>'student_id')::uuid = p_student_id
  ORDER BY
    a.date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      AVG((r.value->>'score')::numeric) AS avg_score
    FROM
      grades g
    CROSS JOIN LATERAL jsonb_array_elements(g.records) AS r(value)
    WHERE g.class_id = p_class_id
    GROUP BY (r.value->>'student_id')::uuid
  ),
  student_attendance AS (
    SELECT
      (r.value->>'student_id')::uuid AS student_id,
      (COUNT(*) FILTER (WHERE r.value->>'status' = 'Hadir'))::numeric * 100 / COUNT(*)::numeric AS attendance_perc
    FROM
      attendance a
    CROSS JOIN LATERAL jsonb_array_elements(a.records) AS r(value)
    WHERE a.class_id = p_class_id
    GROUP BY (r.value->>'student_id')::uuid
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(ROUND(sg.avg_score, 1), 0) AS average_grade,
    COALESCE(ROUND(sa.attendance_perc, 1), 0) AS attendance_percentage
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


-- =================================================================
-- STEP 4: BUAT ULANG VIEWS
-- =================================================================

CREATE OR REPLACE VIEW public.attendance_history AS
 SELECT a.id, a.date, a.class_id, a.subject_id, a.school_year_id, a.meeting_number, a.records, c.name AS "className", s.name AS "subjectName", date_part('month'::text, a.date) AS month
   FROM attendance a
   JOIN classes c ON a.class_id = c.id
   JOIN subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
 SELECT g.id, g.date, g.class_id, g.subject_id, g.school_year_id, g.assessment_type, g.records, c.name AS "className", s.name AS "subjectName", s.kkm AS "subjectKkm", date_part('month'::text, g.date) AS month
   FROM grades g
   JOIN classes c ON g.class_id = c.id
   JOIN subjects s ON g.subject_id = s.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
 SELECT j.id, j.date, j.class_id, j.subject_id, j.school_year_id, j.meeting_number, j.learning_objectives, j.learning_activities, j.assessment, j.reflection, j.teacher_id, c.name AS "className", s.name AS "subjectName", date_part('month'::text, j.date) AS month
   FROM journal_entries j
   JOIN classes c ON j.class_id = c.id
   JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
 SELECT sn.id, sn.student_id, sn.teacher_id, sn.date, sn.note, sn.type, p.full_name AS teacher_name
   FROM student_notes sn
   JOIN profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
 SELECT ta.id, ta.teacher_id AS "teacherId", p.full_name AS "teacherName", ta.date, ta.check_in AS "checkIn", ta.check_out AS "checkOut", ta.status
   FROM teacher_attendance ta
   JOIN profiles p ON ta.teacher_id = p.id;


-- =================================================================
-- STEP 5: BUAT ULANG KEBIJAKAN KEAMANAN (RLS)
-- =================================================================

-- Enable RLS for all tables
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
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Policies for 'profiles'
CREATE POLICY "Admin dapat mengelola semua." ON public.profiles FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));

-- Policies for 'classes', 'subjects', 'school_years', 'schedule'
CREATE POLICY "Admin dapat mengelola semua." ON public.classes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola semua." ON public.subjects FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola semua." ON public.school_years FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat semua tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola semua." ON public.schedule FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat semua jadwal." ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'students'
CREATE POLICY "Admin dapat mengelola semua." ON public.students FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya." ON public.students FOR SELECT USING (
    (auth.role() = 'authenticated' AND (EXISTS (
        SELECT 1 FROM schedule WHERE schedule.class_id = students.class_id AND schedule.teacher_id = auth.uid()
    )))
    OR
    ((SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid()) AND (EXISTS (
        SELECT 1 FROM classes WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
    )))
);
CREATE POLICY "Wali kelas dapat melihat siswa di kelas perwaliannya" ON public.students FOR SELECT USING (
    (SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid())
    AND
    (EXISTS (SELECT 1 FROM classes c WHERE c.id = students.class_id AND c.teacher_id = auth.uid()))
);


-- Policies for 'attendance', 'grades', 'journal_entries', 'agendas'
CREATE POLICY "Admin dapat mengelola semua." ON public.attendance FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat mengelola presensi milik mereka." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Admin dapat mengelola semua." ON public.grades FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat mengelola nilai milik mereka." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Admin dapat mengelola semua." ON public.journal_entries FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat mengelola jurnal milik mereka." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Admin dapat mengelola semua." ON public.agendas FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Pengguna dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Policies for 'student_notes'
CREATE POLICY "Admin dapat mengelola semua." ON public.student_notes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat mengelola catatan yang mereka buat." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Wali kelas dapat melihat semua catatan siswa di kelasnya" ON public.student_notes FOR SELECT USING (
    (SELECT is_homeroom_teacher FROM profiles WHERE profiles.id = auth.uid())
    AND
    (EXISTS (
        SELECT 1 FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = student_notes.student_id AND c.teacher_id = auth.uid()
    ))
);


-- Policies for 'settings'
CREATE POLICY "Admin dapat mengelola semua." ON public.settings FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Pengguna terautentikasi dapat membaca pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for 'teacher_attendance'
CREATE POLICY "Admin dapat mengelola semua." ON public.teacher_attendance FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance FOR SELECT USING (auth.uid() = teacher_id);


-- =================================================================
-- STEP 6: BUAT ULANG PEMICU (TRIGGERS)
-- =================================================================

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
