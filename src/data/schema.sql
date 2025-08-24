-- 1. HAPUS OBJEK LAMA (URUTAN AMAN)
-- Hapus Kebijakan (Policies)
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Guru dapat melihat semua kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Guru dapat melihat semua mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat siswa di kelasnya atau kelas perwaliannya." ON public.students;
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka sendiri." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka sendiri." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat membuat catatan untuk siswa di kelas ajar mereka." ON public.student_notes;
DROP POLICY IF EXISTS "Pengguna dapat melihat catatan mereka sendiri." ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat jadwal mereka sendiri." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Admin dapat mengelola agenda." ON public.agendas;
DROP POLICY IF EXISTS "Guru dapat mengelola agenda mereka sendiri." ON public.agendas;


-- Hapus View
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- Hapus Fungsi
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);
DROP FUNCTION IF EXISTS public.is_homeroom_teacher_of_student(uuid, uuid);


-- 2. BUAT ULANG SEMUA OBJEK DARI AWAL
-- Membuat Tabel
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
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
    role text NOT NULL DEFAULT 'teacher'::text,
    email text,
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
    class_id uuid REFERENCES public.classes(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active'::text,
    avatar_url text
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid
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
    school_year_id uuid
);

CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text, -- 'positive', 'improvement', 'neutral'
    date timestamp with time zone NOT NULL DEFAULT now()
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

CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Membuat Fungsi
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    -- Coba ambil nama lengkap dari metadata, jika tidak ada, ambil dari email
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, subjectname text, assessment_type text, date date, score numeric, kkm numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    s.name AS subjectName,
    g.assessment_type,
    g.date,
    (gr.value ->> 'score')::numeric AS score,
    s.kkm
  FROM
    grades g
  CROSS JOIN LATERAL jsonb_array_elements(g.records) gr
  JOIN subjects s ON g.subject_id = s.id
  WHERE
    (gr.value ->> 'student_id')::uuid = p_student_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, subjectname text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    s.name AS subjectName,
    a.date,
    a.meeting_number,
    ar.value ->> 'status' AS status
  FROM
    attendance a
  CROSS JOIN LATERAL jsonb_array_elements(a.records) ar
  JOIN subjects s ON a.subject_id = s.id
  WHERE
    (ar.value ->> 'student_id')::uuid = p_student_id;
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
      (r.value ->> 'student_id')::uuid AS student_id,
      AVG((r.value ->> 'score')::numeric) AS avg_score
    FROM grades g, jsonb_array_elements(g.records) r
    WHERE g.class_id = p_class_id
    GROUP BY student_id
  ),
  student_attendance AS (
    SELECT
      (r.value ->> 'student_id')::uuid AS student_id,
      (COUNT(*) FILTER (WHERE r.value ->> 'status' = 'Hadir'))::numeric * 100 / COUNT(*)::numeric AS attendance_perc
    FROM attendance a, jsonb_array_elements(a.records) r
    WHERE a.class_id = p_class_id
    GROUP BY student_id
  )
  SELECT
    st.id,
    st.name,
    st.nis,
    COALESCE(sg.avg_score, 0) AS average_grade,
    COALESCE(sa.attendance_perc, 0) AS attendance_percentage
  FROM students st
  LEFT JOIN student_grades sg ON st.id = sg.student_id
  LEFT JOIN student_attendance sa ON st.id = sa.student_id
  WHERE st.class_id = p_class_id AND st.status = 'active';
END;
$$;

CREATE OR REPLACE FUNCTION public.is_homeroom_teacher_of_student(p_student_id uuid, p_teacher_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
    v_class_id uuid;
BEGIN
    SELECT class_id INTO v_class_id FROM public.students WHERE id = p_student_id;

    RETURN EXISTS (
        SELECT 1
        FROM public.classes
        WHERE id = v_class_id AND teacher_id = p_teacher_id
    );
END;
$$;


-- Membuat Views
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.meeting_number,
    a.records,
    c.name AS "className",
    s.name AS "subjectName",
    EXTRACT(MONTH FROM a.date) AS month
FROM
    attendance a
JOIN classes c ON a.class_id = c.id
JOIN subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    g.id,
    g.date,
    g.class_id,
    g.subject_id,
    g.school_year_id,
    g.assessment_type,
    g.records,
    c.name AS "className",
    s.name AS "subjectName",
    s.kkm AS "subjectKkm",
    EXTRACT(MONTH FROM g.date) AS month
FROM
    grades g
JOIN classes c ON g.class_id = c.id
JOIN subjects s ON g.subject_id = s.id;

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
    c.name AS "className",
    s.name AS "subjectName",
    EXTRACT(MONTH FROM j.date) as month
FROM
    journal_entries j
JOIN classes c ON j.class_id = c.id
JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    sn.note,
    sn.type,
    sn.date,
    p.full_name AS teacher_name
FROM
    student_notes sn
JOIN profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
SELECT
    ta.id,
    ta.teacher_id as "teacherId",
    p.full_name as "teacherName",
    ta.date,
    ta.check_in as "checkIn",
    ta.check_out as "checkOut",
    ta.status
FROM
    teacher_attendance ta
JOIN
    profiles p ON ta.teacher_id = p.id;


-- Menambahkan Foreign Key Constraints
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Mengaktifkan RLS
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


-- Membuat Kebijakan (Policies)
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat semua mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat siswa di kelasnya atau kelas perwaliannya." ON public.students FOR SELECT USING (((auth.role() = 'authenticated'::text) AND ((EXISTS ( SELECT 1 FROM schedule WHERE ((schedule.class_id = students.class_id) AND (schedule.teacher_id = auth.uid())))) OR ((EXISTS ( SELECT 1 FROM classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid()))))))));
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi mereka sendiri." ON public.attendance FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai mereka sendiri." ON public.grades FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR public.is_homeroom_teacher_of_student(student_id, auth.uid()));
CREATE POLICY "Guru dapat membuat catatan untuk siswa di kelas ajar mereka." ON public.student_notes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM schedule s WHERE s.class_id = (SELECT st.class_id FROM students st WHERE st.id = student_notes.student_id) AND s.teacher_id = auth.uid()));
CREATE POLICY "Pengguna dapat melihat catatan mereka sendiri." ON public.student_notes FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat melihat jadwal mereka sendiri." ON public.schedule FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Admin dapat mengelola agenda." ON public.agendas FOR ALL USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING (teacher_id = auth.uid());
