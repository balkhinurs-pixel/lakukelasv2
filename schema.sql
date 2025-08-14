-- Base schema for LakuKelas Application

-- Enable Row Level Security
ALTER TABLE
  IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE
  IF EXISTS public.activation_codes ENABLE ROW LEVEL SECURITY;


-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  avatar_url text NULL,
  nip text NULL,
  pangkat text NULL,
  jabatan text NULL,
  school_name text NULL,
  school_address text NULL,
  headmaster_name text NULL,
  headmaster_nip text NULL,
  school_logo_url text NULL,
  account_status text NOT NULL DEFAULT 'Free'::text,
  role text NOT NULL DEFAULT 'teacher'::text,
  email text NULL,
  active_school_year_id uuid NULL,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  teacher_id uuid NOT NULL,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  kkm integer NOT NULL DEFAULT 75,
  teacher_id uuid NOT NULL,
  CONSTRAINT subjects_pkey PRIMARY KEY (id),
  CONSTRAINT subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT school_years_pkey PRIMARY KEY (id),
  CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add foreign key to profiles table for active_school_year_id
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  nis text NOT NULL,
  gender text NOT NULL,
  class_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'::text,
  teacher_id uuid GENERATED ALWAYS AS (
    (
      SELECT
        classes.teacher_id
      FROM
        public.classes
      WHERE
        (classes.id = students.class_id)
    )
  ) STORED,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS students_teacher_id_nis_idx ON public.students USING btree (teacher_id, nis);


-- Schedule Table
CREATE TABLE IF NOT EXISTS public.schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  day text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  subject_id uuid NOT NULL,
  class_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  CONSTRAINT schedule_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

-- Attendance History Table
CREATE TABLE IF NOT EXISTS public.attendance_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  meeting_number integer,
  records jsonb NOT NULL,
  teacher_id uuid NOT NULL,
  school_year_id uuid NULL,
  CONSTRAINT attendance_history_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  CONSTRAINT attendance_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  CONSTRAINT attendance_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT attendance_history_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Grade History Table
CREATE TABLE IF NOT EXISTS public.grade_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  assessment_type text NOT NULL,
  records jsonb NOT NULL,
  teacher_id uuid NOT NULL,
  school_year_id uuid NULL,
  CONSTRAINT grade_history_pkey PRIMARY KEY (id),
  CONSTRAINT grade_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  CONSTRAINT grade_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  CONSTRAINT grade_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT grade_history_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Journals Table
CREATE TABLE IF NOT EXISTS public.journals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  class_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  meeting_number integer NULL,
  learning_objectives text NOT NULL,
  learning_activities text NOT NULL,
  assessment text NULL,
  reflection text NULL,
  teacher_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  school_year_id uuid NULL,
  CONSTRAINT journals_pkey PRIMARY KEY (id),
  CONSTRAINT journals_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes (id) ON DELETE CASCADE,
  CONSTRAINT journals_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects (id) ON DELETE CASCADE,
  CONSTRAINT journals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT journals_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Agendas Table
CREATE TABLE public.agendas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text DEFAULT '#6b7280'::text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT agendas_pkey PRIMARY KEY (id),
    CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Activation Codes Table
CREATE TABLE public.activation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    is_used boolean DEFAULT false NOT NULL,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT activation_codes_pkey PRIMARY KEY (id),
    CONSTRAINT activation_codes_code_key UNIQUE (code),
    CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create policies for all tables
-- Policies for 'profiles' table
CREATE POLICY "Allow authenticated users to read their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Policies for 'classes' table
CREATE POLICY "Allow users to manage their own classes" ON public.classes FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'subjects' table
CREATE POLICY "Allow users to manage their own subjects" ON public.subjects FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'students' table
CREATE POLICY "Allow users to manage students in their classes" ON public.students FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'schedule' table
CREATE POLICY "Allow users to manage their own schedule" ON public.schedule FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'attendance_history' table
CREATE POLICY "Allow users to manage their own attendance history" ON public.attendance_history FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'grade_history' table
CREATE POLICY "Allow users to manage their own grade history" ON public.grade_history FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'journals' table
CREATE POLICY "Allow users to manage their own journals" ON public.journals FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'agendas' table
CREATE POLICY "Allow users to manage their own agendas" ON public.agendas FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'school_years' table
CREATE POLICY "Allow users to manage their own school years" ON public.school_years FOR ALL TO authenticated USING (auth.uid() = teacher_id);

-- Policies for 'activation_codes' table
-- Admins can do anything
CREATE POLICY "Allow admin full access" ON public.activation_codes FOR ALL TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
) WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
-- Authenticated users can only read the codes table (e.g. for checking if a code is valid)
CREATE POLICY "Allow authenticated read access" ON public.activation_codes FOR SELECT TO authenticated USING (true);


-- DB Functions

-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function when a new user is created
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user deletion
CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
  

-- Function for activating account
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_id uuid;
    is_code_used boolean;
BEGIN
    -- 1. Find the code and check its status
    SELECT id, is_used INTO code_id, is_code_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    -- 2. If code doesn't exist, raise an error
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    -- 3. If code is already used, raise an error
    IF is_code_used = TRUE THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- 4. Update the profiles table
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- 5. Mark the code as used
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = now()
    WHERE id = code_id;

    -- Also update the email in the profiles table, just in case
    UPDATE public.profiles
    SET email = user_email_to_set
    WHERE id = user_id_to_activate AND email IS NULL;
END;
$$;

-- Function to add a student with a teacher check
CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Important: This allows the function to check across all students
AS $$
DECLARE
    v_teacher_id uuid;
    v_existing_student_id uuid;
BEGIN
    -- Get the teacher_id from the provided class_id
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher
    SELECT id INTO v_existing_student_id
    FROM public.students s
    WHERE s.teacher_id = v_teacher_id AND s.nis = p_nis;
    
    IF v_existing_student_id IS NOT NULL THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$;

-- Clean up old views and functions if they exist
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;
DROP FUNCTION IF EXISTS public.get_report_data(uuid, uuid, integer);

-- Create a robust function to get all report data
CREATE OR REPLACE FUNCTION public.get_report_data(
  p_teacher_id uuid,
  p_school_year_id uuid DEFAULT NULL,
  p_month integer DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variabel untuk menyimpan hasil
    v_summary_cards json;
    v_student_performance json;
    v_attendance_by_class json;
    v_overall_attendance_distribution json;
    v_journal_entries json;
    v_attendance_history json;
    v_grade_history json;
    v_all_students json;
    v_active_school_year_id uuid;

BEGIN
    -- Tentukan tahun ajaran aktif jika tidak disediakan
    IF p_school_year_id IS NULL THEN
        SELECT p.active_school_year_id INTO v_active_school_year_id FROM public.profiles p WHERE p.id = p_teacher_id;
    ELSE
        v_active_school_year_id := p_school_year_id;
    END IF;

    -- CTE untuk data yang sudah difilter
    WITH
    filtered_attendance AS (
      SELECT * FROM public.attendance_history
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    filtered_grades AS (
      SELECT * FROM public.grade_history
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    filtered_journals AS (
      SELECT * FROM public.journals
      WHERE teacher_id = p_teacher_id
        AND (v_active_school_year_id IS NULL OR school_year_id = v_active_school_year_id)
        AND (p_month IS NULL OR EXTRACT(MONTH FROM date) = p_month)
    ),
    teacher_students AS (
      SELECT s.id, s.name, s.class_id, c.name as class_name
      FROM public.students s
      JOIN public.classes c ON s.class_id = c.id
      WHERE c.teacher_id = p_teacher_id AND s.status = 'active'
    ),
    
    -- Kalkulasi untuk setiap bagian laporan
    calc_summary AS (
      SELECT
        COALESCE(
          (SELECT json_build_object(
            'overallAttendanceRate', ROUND(COALESCE((SUM(CASE WHEN (r->>'status') = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 0), 2),
            'overallAverageGrade', ROUND(COALESCE(AVG((r->>'score')::numeric), 0), 2),
            'totalJournals', (SELECT COUNT(*) FROM filtered_journals)
          )
          FROM filtered_attendance, jsonb_to_recordset(records) as r(status text)),
          '{"overallAttendanceRate": 0, "overallAverageGrade": 0, "totalJournals": 0}'::json
        ) AS data
    ),
    calc_performance AS (
      SELECT COALESCE(json_agg(sp), '[]'::json) AS data FROM (
        SELECT
            s.id,
            s.name,
            s.class_name,
            ROUND(COALESCE(AVG((gr.r->>'score')::numeric), 0), 2) AS average_grade,
            ROUND(COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100), 2) AS attendance,
            CASE
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) >= 85 AND COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) >= 90 THEN 'Sangat Baik'
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) >= 75 AND COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) >= 80 THEN 'Stabil'
                WHEN COALESCE(AVG((gr.r->>'score')::numeric), 0) < 75 OR COALESCE((SUM(CASE WHEN ar.r->>'status' = 'Hadir' THEN 1 ELSE 0 END)::decimal / NULLIF(COUNT(ar.r), 0)) * 100, 100) < 80 THEN 'Butuh Perhatian'
                ELSE 'Berisiko'
            END AS status
        FROM teacher_students s
        LEFT JOIN filtered_attendance fa ON (SELECT COUNT(*) FROM jsonb_to_recordset(fa.records) as r(student_id uuid) WHERE r.student_id = s.id) > 0
        LEFT JOIN jsonb_to_recordset(fa.records) AS ar(r) ON (ar.r->>'student_id')::uuid = s.id
        LEFT JOIN filtered_grades fg ON (SELECT COUNT(*) FROM jsonb_to_recordset(fg.records) as r(student_id uuid) WHERE r.student_id = s.id) > 0
        LEFT JOIN jsonb_to_recordset(fg.records) AS gr(r) ON (gr.r->>'student_id')::uuid = s.id
        GROUP BY s.id, s.name, s.class_name
        ORDER BY average_grade DESC
      ) sp
    ),
    calc_att_by_class AS (
      SELECT COALESCE(json_agg(abc), '[]'::json) AS data FROM (
        SELECT c.name,
          COALESCE(SUM(CASE WHEN r.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS "Hadir",
          COALESCE(SUM(CASE WHEN r.status = 'Sakit' THEN 1 ELSE 0 END), 0) AS "Sakit",
          COALESCE(SUM(CASE WHEN r.status = 'Izin' THEN 1 ELSE 0 END), 0) AS "Izin",
          COALESCE(SUM(CASE WHEN r.status = 'Alpha' THEN 1 ELSE 0 END), 0) AS "Alpha"
        FROM filtered_attendance fa
        JOIN public.classes c ON fa.class_id = c.id,
        jsonb_to_recordset(fa.records) AS r(status text)
        GROUP BY c.name
      ) abc
    ),
    calc_overall_dist AS (
      SELECT COALESCE(json_object_agg(status, count), '{}'::json) AS data FROM (
        SELECT r->>'status' AS status, COUNT(*)
        FROM filtered_attendance, jsonb_array_elements(records) AS r
        GROUP BY r->>'status'
      ) t
    ),
    calc_journals AS (
      SELECT COALESCE(json_agg(j), '[]'::json) AS data FROM (
        SELECT j.id, j.date, j.class_id, j.subject_id, j.meeting_number, j.learning_objectives, c.name AS "className", s.name AS "subjectName"
        FROM filtered_journals j
        JOIN public.classes c ON j.class_id = c.id
        JOIN public.subjects s ON j.subject_id = s.id
        ORDER BY j.date DESC
      ) j
    ),
    calc_att_history AS (
      SELECT COALESCE(json_agg(ah), '[]'::json) AS data FROM (
        SELECT ah.id, ah.date, ah.class_id, ah.subject_id, ah.meeting_number, ah.records, c.name AS "className", s.name AS "subjectName"
        FROM filtered_attendance ah
        JOIN public.classes c ON ah.class_id = c.id
        JOIN public.subjects s ON ah.subject_id = s.id
        ORDER BY ah.date DESC
      ) ah
    ),
    calc_grade_history AS (
      SELECT COALESCE(json_agg(gh), '[]'::json) AS data FROM (
        SELECT gh.id, gh.date, gh.class_id, gh.subject_id, gh.assessment_type, gh.records, c.name AS "className", s.name AS "subjectName"
        FROM filtered_grades gh
        JOIN public.classes c ON gh.class_id = c.id
        JOIN public.subjects s ON gh.subject_id = s.id
        ORDER BY gh.date DESC
      ) gh
    ),
    calc_students AS (
      SELECT COALESCE(json_agg(s), '[]'::json) AS data FROM teacher_students s
    )
    SELECT json_build_object(
        'summary_cards', (SELECT data FROM calc_summary),
        'student_performance', (SELECT data FROM calc_performance),
        'attendance_by_class', (SELECT data FROM calc_att_by_class),
        'overall_attendance_distribution', (SELECT data FROM calc_overall_dist),
        'journal_entries', (SELECT data FROM calc_journals),
        'attendance_history', (SELECT data FROM calc_att_history),
        'grade_history', (SELECT data FROM calc_grade_history),
        'all_students', (SELECT data FROM calc_students)
    ) INTO v_summary_cards; -- reuse variable just to build the final json object

    -- Mengembalikan hasil dalam satu baris JSON
    RETURN v_summary_cards;
END;
$$;
