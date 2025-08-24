-- ### BAGIAN 1: PENGHAPUSAN OBJEK LAMA (AGAR SKRIP BISA DIJALANKAN ULANG) ###

-- Hapus Pemicu (Triggers)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Hapus Kebijakan Keamanan (Policies)
-- Hapus semua kebijakan dari setiap tabel yang memiliki RLS
DROP POLICY IF EXISTS "Admin dapat mengelola semua profil." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat melihat profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles;
DROP POLICY IF EXISTS "Admin dapat mengelola kelas." ON public.classes;
DROP POLICY IF EXISTS "Semua pengguna terautentikasi dapat melihat kelas." ON public.classes;
DROP POLICY IF EXISTS "Admin dapat mengelola mapel." ON public.subjects;
DROP POLICY IF EXISTS "Semua pengguna terautentikasi dapat melihat mapel." ON public.subjects;
DROP POLICY IF EXISTS "Admin dapat mengelola siswa." ON public.students;
DROP POLICY IF EXISTS "Guru dapat melihat semua siswa." ON public.students;
DROP POLICY IF EXISTS "Admin dapat melihat semua presensi." ON public.attendance;
DROP POLICY IF EXISTS "Guru dapat mengelola presensi mereka sendiri." ON public.attendance;
DROP POLICY IF EXISTS "Admin dapat melihat semua nilai." ON public.grades;
DROP POLICY IF EXISTS "Guru dapat mengelola nilai mereka sendiri." ON public.grades;
DROP POLICY IF EXISTS "Admin dapat melihat semua jurnal." ON public.journal_entries;
DROP POLICY IF EXISTS "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries;
DROP POLICY IF EXISTS "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes;
DROP POLICY IF EXISTS "Guru dapat membuat dan melihat catatan mereka sendiri." ON public.student_notes;
DROP POLICY IF EXISTS "Admin dapat mengelola semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Guru dapat melihat semua jadwal." ON public.schedule;
DROP POLICY IF EXISTS "Admin dapat mengelola tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Semua pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years;
DROP POLICY IF EXISTS "Admin dapat mengelola pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Semua pengguna terautentikasi dapat melihat pengaturan." ON public.settings;
DROP POLICY IF EXISTS "Admin dapat mengelola kode aktivasi." ON public.activation_codes;
DROP POLICY IF EXISTS "Admin dapat melihat semua absensi guru." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance;
DROP POLICY IF EXISTS "Admin dapat mengelola agenda." ON public.agendas;
DROP POLICY IF EXISTS "Guru dapat mengelola agenda mereka sendiri." ON public.agendas;
DROP POLICY IF EXISTS "Pengguna dapat mengunggah ke bucket avatars." ON storage.objects;
DROP POLICY IF EXISTS "Pengguna dapat melihat file di bucket avatars." ON storage.objects;
DROP POLICY IF EXISTS "Pengguna dapat memperbarui file mereka di bucket avatars." ON storage.objects;


-- Hapus Fungsi (Functions)
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.get_student_performance_for_class(uuid);
DROP FUNCTION IF EXISTS public.get_student_grades_ledger(uuid);
DROP FUNCTION IF EXISTS public.get_student_attendance_ledger(uuid);

-- Hapus View (Views)
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP VIEW IF EXISTS public.teacher_attendance_history;

-- ### BAGIAN 2: PEMBUATAN SKEMA DATABASE ###

-- == FUNGSI ==
-- Fungsi untuk mengecek apakah user adalah admin
CREATE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$;

-- Fungsi untuk menangani user baru dari auth.users
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    'teacher',
    'Pro' -- Semua pengguna baru sekarang langsung Pro
  );
  RETURN NEW;
END;
$$;


-- == TABEL & RELASI ==
-- Tabel: Profiles (Profil Pengguna)
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
    account_status text NOT NULL DEFAULT 'Pro'::text,
    role text NOT NULL DEFAULT 'teacher'::text,
    email text,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);

-- Tabel: School Years (Tahun Ajaran)
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tambahkan relasi dari profiles ke school_years
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Tabel: Classes (Kelas)
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Tabel: Subjects (Mata Pelajaran)
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Tabel: Students (Siswa)
CREATE TABLE IF NOT EXISTS public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'active'::text,
    avatar_url text
);

-- Tabel: Attendance (Presensi)
CREATE TABLE IF NOT EXISTS public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel: Grades (Nilai)
CREATE TABLE IF NOT EXISTS public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel: Journal Entries (Jurnal Mengajar)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel: Student Notes (Catatan Siswa)
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL DEFAULT now(),
    note text NOT NULL,
    type text NOT NULL DEFAULT 'neutral'::text
);

-- Tabel: Schedule (Jadwal)
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel: Settings (Pengaturan)
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);

-- Tabel: Activation Codes (Kode Aktivasi) - Dipertahankan untuk masa depan
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    used_by_email text
);

-- Tabel: Teacher Attendance (Absensi Guru)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text,
    UNIQUE (teacher_id, date)
);

-- Tabel: Agendas (Agenda Pribadi Guru)
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

-- == PEMICU (TRIGGERS) ==
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- == KEBIJAKAN KEAMANAN (ROW LEVEL SECURITY) ==

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
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Kebijakan untuk 'profiles'
CREATE POLICY "Admin dapat mengelola semua profil." ON public.profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Pengguna dapat melihat profil mereka sendiri." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri." ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Kebijakan untuk 'classes', 'subjects', 'school_years', 'settings'
CREATE POLICY "Admin dapat mengelola kelas." ON public.classes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Semua pengguna terautentikasi dapat melihat kelas." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola mapel." ON public.subjects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Semua pengguna terautentikasi dapat melihat mapel." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola tahun ajaran." ON public.school_years FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Semua pengguna terautentikasi dapat melihat tahun ajaran." ON public.school_years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin dapat mengelola pengaturan." ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Semua pengguna terautentikasi dapat melihat pengaturan." ON public.settings FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk 'students'
CREATE POLICY "Admin dapat mengelola siswa." ON public.students FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua siswa." ON public.students FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk data transaksional ('attendance', 'grades', 'journal_entries')
CREATE POLICY "Admin dapat melihat semua presensi." ON public.attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola presensi mereka sendiri." ON public.attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Admin dapat melihat semua nilai." ON public.grades FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola nilai mereka sendiri." ON public.grades FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Admin dapat melihat semua jurnal." ON public.journal_entries FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri." ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk 'student_notes'
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan." ON public.student_notes FOR SELECT USING (public.is_admin() OR (EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = (SELECT students.class_id FROM students WHERE students.id = student_notes.student_id)
    AND classes.teacher_id = auth.uid()
)));
CREATE POLICY "Guru dapat membuat dan melihat catatan mereka sendiri." ON public.student_notes FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk 'schedule'
CREATE POLICY "Admin dapat mengelola semua jadwal." ON public.schedule FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat melihat semua jadwal." ON public.schedule FOR SELECT USING (auth.role() = 'authenticated');

-- Kebijakan untuk 'activation_codes'
CREATE POLICY "Admin dapat mengelola kode aktivasi." ON public.activation_codes FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Kebijakan untuk 'teacher_attendance'
CREATE POLICY "Admin dapat melihat semua absensi guru." ON public.teacher_attendance FOR SELECT USING (public.is_admin());
CREATE POLICY "Guru dapat melihat absensi mereka sendiri." ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Kebijakan untuk 'agendas'
CREATE POLICY "Admin dapat mengelola agenda." ON public.agendas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Guru dapat mengelola agenda mereka sendiri." ON public.agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- Kebijakan untuk Storage (Avatars)
CREATE POLICY "Pengguna dapat mengunggah ke bucket avatars." ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Pengguna dapat melihat file di bucket avatars." ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Pengguna dapat memperbarui file mereka di bucket avatars." ON storage.objects FOR UPDATE USING (auth.uid() = owner) WITH CHECK (bucket_id = 'avatars');

-- == VIEWS & FUNGSI LANJUTAN ==
-- Views untuk mempermudah query laporan
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    EXTRACT(MONTH FROM a.date) as month,
    a.class_id,
    c.name AS className,
    a.subject_id,
    s.name AS subjectName,
    a.meeting_number,
    a.records,
    a.teacher_id,
    a.school_year_id
FROM
    attendance a
    JOIN classes c ON a.class_id = c.id
    JOIN subjects s ON a.subject_id = s.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT
    g.id,
    g.date,
    EXTRACT(MONTH FROM g.date) as month,
    g.class_id,
    c.name AS className,
    g.subject_id,
    s.name AS subjectName,
    s.kkm AS subjectKkm,
    g.assessment_type,
    g.records,
    g.teacher_id,
    g.school_year_id
FROM
    grades g
    JOIN classes c ON g.class_id = c.id
    JOIN subjects s ON g.subject_id = s.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT
    j.id,
    j.date,
    EXTRACT(MONTH FROM j.date) as month,
    j.class_id,
    c.name AS className,
    j.subject_id,
    s.name AS subjectName,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.teacher_id,
    j.school_year_id
FROM
    journal_entries j
    JOIN classes c ON j.class_id = c.id
    JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.teacher_id,
    p.full_name as teacher_name,
    sn.date,
    sn.note,
    sn.type
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
    JOIN profiles p ON ta.teacher_id = p.id;

-- Fungsi untuk mengambil rekap performa siswa per kelas
CREATE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH student_grades AS (
    SELECT
      r.student_id,
      AVG((r.score::numeric)) as avg_grade
    FROM grades g, jsonb_to_recordset(g.records) as r(student_id uuid, score text)
    WHERE g.class_id = p_class_id
    GROUP BY r.student_id
  ),
  student_attendance AS (
    SELECT
      r.student_id,
      (COUNT(*) FILTER (WHERE r.status = 'Hadir'))::numeric / COUNT(*)::numeric * 100 as att_perc
    FROM attendance a, jsonb_to_recordset(a.records) as r(student_id uuid, status text)
    WHERE a.class_id = p_class_id
    GROUP BY r.student_id
  )
  SELECT
    s.id,
    s.name,
    s.nis,
    COALESCE(ROUND(sg.avg_grade, 1), 0) as average_grade,
    COALESCE(ROUND(sa.att_perc, 1), 100) as attendance_percentage
  FROM students s
  LEFT JOIN student_grades sg ON s.id = sg.student_id
  LEFT JOIN student_attendance sa ON s.id = sa.student_id
  WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$;

-- Fungsi untuk ledger nilai siswa
CREATE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date date, score integer, kkm integer)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    sub.name as "subjectName",
    g.assessment_type,
    g.date,
    (r.score::integer) as score,
    sub.kkm
  FROM grades g
  JOIN subjects sub ON g.subject_id = sub.id,
  jsonb_to_recordset(g.records) as r(student_id uuid, score text)
  WHERE r.student_id = p_student_id
  ORDER BY g.date DESC;
END;
$$;

-- Fungsi untuk ledger absensi siswa
CREATE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date date, meeting_number integer, status text)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    sub.name as "subjectName",
    a.date,
    a.meeting_number,
    r.status
  FROM attendance a
  JOIN subjects sub ON a.subject_id = sub.id,
  jsonb_to_recordset(a.records) as r(student_id uuid, status text)
  WHERE r.student_id = p_student_id
  ORDER BY a.date DESC;
END;
$$;
