-- Membuat ENUM (tipe data kustom) untuk role dan status
CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
CREATE TYPE public.account_status AS ENUM ('Free', 'Pro');
CREATE TYPE public.student_status AS ENUM ('active', 'graduated', 'dropout', 'inactive');
CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpha');
CREATE TYPE public.day_of_week AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
CREATE TYPE public.note_type AS ENUM ('positive', 'improvement', 'neutral');


-- Tabel untuk menyimpan profil pengguna
CREATE TABLE public.profiles (
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
    role public.user_role NOT NULL DEFAULT 'teacher'::public.user_role,
    account_status public.account_status NOT NULL DEFAULT 'Free'::public.account_status,
    active_school_year_id uuid,
    is_homeroom_teacher boolean DEFAULT false
);

-- Tabel untuk pengaturan aplikasi umum
CREATE TABLE public.settings (
    key text PRIMARY KEY,
    value text
);

-- Tabel Tahun Ajaran
CREATE TABLE public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Menambahkan foreign key constraint ke profiles setelah school_years dibuat
ALTER TABLE public.profiles ADD CONSTRAINT fk_active_school_year
FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Tabel Kelas
CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Wali Kelas
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Mata Pelajaran
CREATE TABLE public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    kkm integer NOT NULL DEFAULT 75,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Siswa
CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    nis text UNIQUE,
    gender text,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status public.student_status NOT NULL DEFAULT 'active'::public.student_status,
    avatar_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Jadwal Mengajar
CREATE TABLE public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day public.day_of_week NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Presensi
CREATE TABLE public.attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number integer,
    records jsonb, -- e.g., [{"student_id": "uuid", "status": "Hadir"}]
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Nilai
CREATE TABLE public.grades (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type text NOT NULL,
    records jsonb, -- e.g., [{"student_id": "uuid", "score": 85}]
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Jurnal Mengajar
CREATE TABLE public.journal_entries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id),
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Agenda Pribadi Guru
CREATE TABLE public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Catatan Perkembangan Siswa
CREATE TABLE public.student_notes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    type public.note_type NOT NULL DEFAULT 'neutral'::public.note_type,
    date timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Kode Aktivasi
CREATE TABLE public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid REFERENCES public.users(id),
    used_by_email text,
    used_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabel Absensi Guru
CREATE TABLE public.teacher_attendance (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time,
    check_out time,
    status text,
    latitude double precision,
    longitude double precision,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (teacher_id, date)
);

-- Mengaktifkan Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Kebijakan RLS: Pengguna bisa melihat dan mengubah profil mereka sendiri. Admin bisa melihat semua.
CREATE POLICY "Users can view and update their own profile."
ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles."
ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Tambahkan RLS untuk tabel lain sesuai kebutuhan...
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view subjects." ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage subjects." ON public.subjects FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view classes." ON public.classes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage classes." ON public.classes FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Dan seterusnya untuk tabel lain.

-- Fungsi untuk menangani pengguna baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url',
    'teacher', -- Default role
    'Pro'  -- Default status
  );
  RETURN NEW;
END;
$$;

-- Trigger untuk memanggil fungsi handle_new_user setiap kali ada pengguna baru
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fungsi untuk aktivasi akun (contoh)
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

-- Views untuk mempermudah query data
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT
    a.id,
    a.date,
    a.class_id,
    a.subject_id,
    a.school_year_id,
    a.meeting_number,
    a.records,
    c.name as "className",
    s.name as "subjectName",
    extract(month from a.date) as month
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
    c.name as "className",
    s.name as "subjectName",
    s.kkm as "subjectKkm",
    extract(month from g.date) as month
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
    j.teacher_id,
    j.meeting_number,
    j.learning_objectives,
    j.learning_activities,
    j.assessment,
    j.reflection,
    j.created_at,
    c.name as "className",
    s.name as "subjectName",
    extract(month from j.date) as month
FROM
    journal_entries j
JOIN classes c ON j.class_id = c.id
JOIN subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT
    sn.id,
    sn.student_id,
    sn.note,
    sn.type,
    sn.date,
    p.full_name as teacher_name
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

-- RPC Functions for complex queries

CREATE OR REPLACE FUNCTION public.get_student_performance_for_class(p_class_id uuid)
RETURNS TABLE(id uuid, name text, nis text, average_grade numeric, attendance_percentage numeric) AS $$
BEGIN
    RETURN QUERY
    WITH student_grades AS (
        SELECT
            r.student_id,
            AVG((r.score::text)::numeric) as avg_score
        FROM grades, jsonb_to_recordset(grades.records) as r(student_id uuid, score numeric)
        WHERE grades.class_id = p_class_id
        GROUP BY r.student_id
    ),
    student_attendance AS (
        SELECT
            r.student_id,
            COUNT(*) as total_records,
            SUM(CASE WHEN r.status = 'Hadir' THEN 1 ELSE 0 END) as hadir_count
        FROM attendance, jsonb_to_recordset(attendance.records) as r(student_id uuid, status text)
        WHERE attendance.class_id = p_class_id
        GROUP BY r.student_id
    )
    SELECT
        s.id,
        s.name,
        s.nis,
        COALESCE(ROUND(sg.avg_score, 2), 0) as average_grade,
        COALESCE(ROUND((sa.hadir_count * 100.0 / sa.total_records), 2), 0) as attendance_percentage
    FROM students s
    LEFT JOIN student_grades sg ON s.id = sg.student_id
    LEFT JOIN student_attendance sa ON s.id = sa.student_id
    WHERE s.class_id = p_class_id AND s.status = 'active';
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.get_student_grades_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, assessment_type text, date text, score numeric, kkm integer) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        sub.name as "subjectName",
        g.assessment_type,
        g.date::text,
        (r->>'score')::numeric as score,
        sub.kkm
    FROM
        grades g,
        jsonb_array_elements(g.records) r
    JOIN
        subjects sub ON g.subject_id = sub.id
    WHERE
        (r->>'student_id')::uuid = p_student_id;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION public.get_student_attendance_ledger(p_student_id uuid)
RETURNS TABLE(id uuid, "subjectName" text, date text, meeting_number integer, status text) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        sub.name as "subjectName",
        a.date::text,
        a.meeting_number,
        r->>'status' as status
    FROM
        attendance a,
        jsonb_array_elements(a.records) r
    JOIN
        subjects sub ON a.subject_id = sub.id
    WHERE
        (r->>'student_id')::uuid = p_student_id;
END;
$$ LANGUAGE plpgsql;

-- Memberikan akses ke pengguna terautentikasi
GRANT EXECUTE ON FUNCTION public.get_student_performance_for_class(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_grades_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attendance_ledger(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(text, uuid, text) TO authenticated;
