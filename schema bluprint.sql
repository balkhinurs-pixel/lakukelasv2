-- =========================================================================
-- 1. EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- =========================================================================
-- 2. ENUM / CUSTOM TYPES
-- =========================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_status') THEN
        CREATE TYPE public.account_status AS ENUM ('Free', 'Pro');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
        CREATE TYPE public.attendance_status AS ENUM ('Hadir', 'Sakit', 'Izin', 'Alpha');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_note_type') THEN
        CREATE TYPE public.student_note_type AS ENUM ('positive', 'improvement', 'neutral');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status') THEN
        CREATE TYPE public.student_status AS ENUM ('active', 'graduated', 'dropout', 'inactive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'teacher_attendance_status') THEN
        CREATE TYPE public.teacher_attendance_status AS ENUM ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('admin', 'teacher');
    END IF;
END $$;

-- =========================================================================
-- 3. TABLES (Sesuai Struktur Asli Mentah)
-- =========================================================================

-- MASTER: Tahun Ajaran (Sudah ditambahkan teacher_id agar tidak error cache)
CREATE TABLE IF NOT EXISTS public.school_years (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL UNIQUE,
    is_active boolean DEFAULT false,
    teacher_id uuid -- Dibuat tanpa fkey dulu agar tidak melingkar saat profiles dibuat
);
COMMENT ON TABLE public.school_years IS 'Stores school year information.';

-- MASTER: Profiles (Hubungan asli langsung ke auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    full_name text,
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
    role text DEFAULT 'teacher'::text NOT NULL,
    active_school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    is_homeroom_teacher boolean DEFAULT false NOT NULL,
    phone_number text,
    is_activated boolean DEFAULT false,
    gemini_api_key text,
    npsn text,
    school_email text,
    school_website text
);
COMMENT ON TABLE public.profiles IS 'Stores user profile information.';

-- Sambungkan FKey school_years ke profiles setelah profiles terbuat
ALTER TABLE public.school_years DROP CONSTRAINT IF EXISTS school_years_teacher_id_fkey;
ALTER TABLE public.school_years ADD CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Token Aktivasi
CREATE TABLE IF NOT EXISTS public.activation_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    token text NOT NULL UNIQUE,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Agendas
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
COMMENT ON TABLE public.agendas IS 'Stores personal teacher agendas and reminders.';

-- AI Documents (Asli: Mengarah langsung ke auth.users)
CREATE TABLE IF NOT EXISTS public.ai_documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type text NOT NULL,
    title text NOT NULL,
    subject text,
    class_level text,
    semester text,
    drive_file_id text,
    drive_file_url text,
    drive_folder_id text,
    mime_type text,
    is_public boolean DEFAULT false,
    status text DEFAULT 'created'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- MASTER: Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
COMMENT ON TABLE public.classes IS 'Stores class information.';

-- MASTER: Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    kkm integer DEFAULT 75 NOT NULL
);
COMMENT ON TABLE public.subjects IS 'Stores subject information.';

-- MASTER: Students
CREATE TABLE IF NOT EXISTS public.students (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    nis text NOT NULL UNIQUE,
    gender text NOT NULL,
    class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
    status text DEFAULT 'active'::text NOT NULL,
    avatar_url text
);
COMMENT ON TABLE public.students IS 'Stores student information.';

-- Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    date date NOT NULL,
    meeting_number integer NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attendance_records_status_check CHECK ((status = ANY (ARRAY['Hadir'::text, 'Sakit'::text, 'Izin'::text, 'Alpha'::text])))
);
COMMENT ON TABLE public.attendance_records IS 'Tabel individual untuk setiap entri absensi siswa.';

-- Google Drive Integrations (Asli: Mengarah langsung ke auth.users)
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text DEFAULT 'google'::text NOT NULL,
    drive_email text,
    folder_id text,
    folder_url text,
    folder_name text DEFAULT 'LakuKelas AI'::text,
    status text DEFAULT 'connected'::text NOT NULL,
    connected_at timestamp with time zone DEFAULT now(),
    disconnected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Grade Records
CREATE TABLE IF NOT EXISTS public.grade_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL,
    date date NOT NULL,
    assessment_type text NOT NULL,
    score numeric(5,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
COMMENT ON TABLE public.grade_records IS 'Tabel individual untuk setiap entri nilai siswa.';

-- Holidays
CREATE TABLE IF NOT EXISTS public.holidays (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL PRIMARY KEY,
    date date NOT NULL UNIQUE,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    type text DEFAULT 'school'::text,
    CONSTRAINT holidays_type_check CHECK ((type = ANY (ARRAY['national'::text, 'school'::text])))
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    date timestamp with time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id uuid NOT NULL REFERENCES public.school_years(id) ON DELETE RESTRICT
);
COMMENT ON TABLE public.journal_entries IS 'Stores teaching journal entries.';

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    link_url text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Questions (Asli: Mengarah langsung ke auth.users)
CREATE TABLE IF NOT EXISTS public.questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    generation_group_id uuid DEFAULT gen_random_uuid(),
    jenjang text NOT NULL,
    kelas text NOT NULL,
    semester text,
    subject text NOT NULL,
    curriculum text,
    assessment_purpose text,
    topic text NOT NULL,
    subtopic text,
    sort_order integer NOT NULL,
    question_type text NOT NULL,
    question_text text NOT NULL,
    options_json jsonb,
    correct_answer text,
    explanation text,
    difficulty text,
    cognitive_level text,
    language_direction text DEFAULT 'ltr'::text,
    image_url text,
    needs_review boolean DEFAULT true,
    status text DEFAULT 'draft'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Schedule
CREATE TABLE IF NOT EXISTS public.schedule (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores weekly teaching schedule.';

-- Settings
CREATE TABLE IF NOT EXISTS public.settings (
    key text NOT NULL PRIMARY KEY,
    value text
);
COMMENT ON TABLE public.settings IS 'Stores application-wide settings.';

-- Student Notes
CREATE TABLE IF NOT EXISTS public.student_notes (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date timestamp with time zone DEFAULT now() NOT NULL,
    note text NOT NULL,
    type text DEFAULT 'neutral'::text NOT NULL
);
COMMENT ON TABLE public.student_notes IS 'Stores notes about students from teachers.';

-- Teacher Attendance
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    teacher_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date date NOT NULL,
    check_in time without time zone,
    check_out time without time zone,
    status text NOT NULL,
    reason text
);
COMMENT ON TABLE public.teacher_attendance IS 'Stores daily teacher attendance records.';

-- =========================================================================
-- 4. INDEXES
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_attendance_records_collaboration ON public.attendance_records USING btree (class_id, date, meeting_number DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_records_school_year_id ON public.attendance_records USING btree (school_year_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON public.attendance_records USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_school_year_id ON public.grade_records USING btree (school_year_id);
CREATE INDEX IF NOT EXISTS idx_grade_records_student_id ON public.grade_records USING btree (student_id);
CREATE INDEX IF NOT EXISTS idx_materials_class_id ON public.materials USING btree (class_id);
CREATE INDEX IF NOT EXISTS idx_materials_subject_id ON public.materials USING btree (subject_id);
CREATE INDEX IF NOT EXISTS idx_materials_teacher_id ON public.materials USING btree (teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON public.questions USING btree (subject);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON public.questions USING btree (topic);
CREATE INDEX IF NOT EXISTS idx_questions_user ON public.questions USING btree (created_by);

-- =========================================================================
-- 5. VIEWS
-- =========================================================================
CREATE OR REPLACE VIEW public.attendance_history AS
 SELECT ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id, ar.status, ar.student_id,
    c.name AS class_name, s.name AS subject_name, p.full_name AS teacher_name
   FROM public.attendance_records ar
     JOIN public.classes c ON ar.class_id = c.id
     JOIN public.subjects s ON ar.subject_id = s.id
     JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
 SELECT gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id, gr.score, gr.student_id,
    c.name AS class_name, s.name AS subject_name, s.kkm AS subject_kkm, p.full_name AS teacher_name
   FROM public.grade_records gr
     JOIN public.classes c ON gr.class_id = c.id
     JOIN public.subjects s ON gr.subject_id = s.id
     JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
 SELECT je.id, je.date, je.class_id, je.subject_id, je.meeting_number, je.learning_objectives, je.learning_activities, je.assessment, je.reflection, je.teacher_id, je.school_year_id,
    c.name AS "className", s.name AS "subjectName"
   FROM public.journal_entries je
     JOIN public.classes c ON je.class_id = c.id
     JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
 SELECT sn.id, sn.student_id, sn.teacher_id, p.full_name AS teacher_name, sn.date, sn.note, sn.type
   FROM public.student_notes sn
     JOIN public.profiles p ON sn.teacher_id = p.id;

CREATE OR REPLACE VIEW public.teacher_attendance_history AS
 SELECT ta.id, ta.teacher_id AS "teacherId", p.full_name AS "teacherName", ta.date, ta.check_in AS "checkIn", ta.check_out AS "checkOut", ta.status
   FROM public.teacher_attendance ta
     JOIN public.profiles p ON ta.teacher_id = p.id;

-- =========================================================================
-- 6. FUNCTIONS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
    AS $$
BEGIN
  RETURN COALESCE((SELECT role FROM public.profiles WHERE id = auth.uid()), 'teacher') = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
    AS $$
DECLARE
  v_code_id uuid;
BEGIN
  SELECT id INTO v_code_id FROM public.activation_tokens WHERE token = p_code AND used_by IS NULL FOR UPDATE;
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;
  UPDATE public.activation_tokens SET used_by = p_user_id, used_at = now() WHERE id = v_code_id;
  UPDATE public.profiles SET role = 'admin', is_activated = true WHERE id = p_user_id; 
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_school_year_id() RETURNS uuid
    LANGUAGE plpgsql AS $$
DECLARE active_year_id uuid;
BEGIN
    SELECT id INTO active_year_id FROM public.school_years WHERE is_active = true LIMIT 1;
    RETURN active_year_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_indonesian_day_name_from_date(p_date date) RETURNS text
    LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    v_day_num INT;
    v_days TEXT[] := ARRAY['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
BEGIN
    v_day_num := EXTRACT(DOW FROM p_date);
    RETURN v_days[v_day_num + 1];
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
    AS $$
DECLARE p_count INTEGER;
BEGIN
    SELECT count(*) INTO p_count FROM public.profiles;
    INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
        new.raw_user_meta_data->>'avatar_url',
        CASE WHEN p_count = 0 THEN 'admin' ELSE 'teacher' END,
        CASE WHEN p_count = 0 THEN true ELSE false END
    );
    RETURN new;
END;
$$;

-- =========================================================================
-- 7. TRIGGERS
-- =========================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- =========================================================================
-- 8. ROW LEVEL SECURITY (RLS) & POLICIES (Berdasarkan skrip awal Anda)
-- =========================================================================
-- Kebijakan dasar bawaan skrip awal yang disesuaikan agar aman & lancar
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Pengguna dapat memperbarui profil mereka sendiri" ON public.profiles FOR UPDATE USING ((auth.uid() = id)) WITH CHECK ((auth.uid() = id));
CREATE POLICY "Admin dapat mengelola semua profil" ON public.profiles USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Guru dapat mengelola agenda mereka sendiri" ON public.agendas USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));
CREATE POLICY "Admin dapat mengelola agenda" ON public.agendas USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own AI documents" ON public.ai_documents FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own AI documents" ON public.ai_documents FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own AI documents" ON public.ai_documents FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete own AI documents" ON public.ai_documents FOR DELETE USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage own AI documents" ON public.ai_documents USING ((auth.uid() = user_id));

CREATE POLICY "Guru dapat melihat semua kelas" ON public.classes FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Admin dapat mengelola kelas" ON public.classes USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Guru dapat melihat semua mapel" ON public.subjects FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Admin dapat mengelola mapel" ON public.subjects USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Guru dapat melihat siswa di kelasnya" ON public.students FOR SELECT USING (((auth.role() = 'authenticated'::text) AND ((EXISTS ( SELECT 1 FROM public.schedule WHERE ((schedule.class_id = students.class_id) AND (schedule.teacher_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM public.classes WHERE ((classes.id = students.class_id) AND (classes.teacher_id = auth.uid())))))));
CREATE POLICY "Admin dapat mengelola siswa" ON public.students USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Users can view own drive integration" ON public.google_drive_integrations FOR SELECT USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own drive integration" ON public.google_drive_integrations FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own drive integration" ON public.google_drive_integrations FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage own drive integration" ON public.google_drive_integrations USING ((auth.uid() = user_id));

CREATE POLICY "Allow public read holidays" ON public.holidays FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Allow admin manage holidays" ON public.holidays USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));

CREATE POLICY "Guru dapat mengelola jurnal mereka sendiri" ON public.journal_entries USING ((auth.uid() = teacher_id)) WITH CHECK ((auth.uid() = teacher_id));
CREATE POLICY "Admin dapat melihat semua jurnal" ON public.journal_entries FOR SELECT USING (public.is_admin());

CREATE POLICY "Teachers can view their own materials" ON public.materials FOR SELECT USING ((auth.uid() = teacher_id));
CREATE POLICY "Teachers can insert their own materials" ON public.materials FOR INSERT WITH CHECK ((auth.uid() = teacher_id));
CREATE POLICY "Teachers can update their own materials" ON public.materials FOR UPDATE USING ((auth.uid() = teacher_id));
CREATE POLICY "Teachers can delete their own materials" ON public.materials FOR DELETE USING ((auth.uid() = teacher_id));

CREATE POLICY "Users can manage own questions" ON public.questions USING ((auth.uid() = created_by));

CREATE POLICY "Guru dapat melihat jadwal mereka" ON public.schedule FOR SELECT USING ((auth.uid() = teacher_id));
CREATE POLICY "Schedules are viewable by owners and admins" ON public.schedule FOR SELECT USING (((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'headmaster'::text])))))));
CREATE POLICY "Admin dapat mengelola semua jadwal" ON public.schedule USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Pengguna terautentikasi dapat melihat pengaturan" ON public.settings FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Admin dapat mengelola pengaturan" ON public.settings USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Pengguna terautentikasi dapat melihat tahun ajaran" ON public.school_years FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Admin dapat mengelola tahun ajaran" ON public.school_years USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Guru dapat membuat catatan untuk siswa" ON public.student_notes FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Admin dan wali kelas dapat melihat semua catatan" ON public.student_notes FOR SELECT USING ((public.is_admin() OR (EXISTS ( SELECT 1 FROM public.classes c WHERE ((c.id = ( SELECT s.class_id FROM public.students s WHERE (s.id = student_notes.student_id))) AND (c.teacher_id = auth.uid()))))));
CREATE POLICY "Guru dapat melihat catatan siswa yang mereka ajar" ON public.student_notes FOR SELECT USING ((EXISTS ( SELECT 1 FROM public.schedule sch WHERE ((sch.class_id = ( SELECT s.class_id FROM public.students s WHERE (s.id = student_notes.student_id))) AND (sch.teacher_id = auth.uid())))));

CREATE POLICY "Teachers can manage their own attendance" ON public.teacher_attendance USING ((auth.uid() = teacher_id));
CREATE POLICY "Attendance viewable by owners and admins" ON public.teacher_attendance FOR SELECT USING (((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1 FROM public.profiles WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['admin'::text, 'headmaster'::text])))))));
CREATE POLICY "Admin can manage all teacher attendance" ON public.teacher_attendance USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Perbaikan penginputan nilai/absen agar terdeteksi RLS seadanya
ALTER TABLE public.grade_records FORCE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records FORCE ROW LEVEL SECURITY;
CREATE POLICY "Guru/Admin manage grades" ON public.grade_records TO authenticated USING (auth.uid() = teacher_id OR public.is_admin()) WITH CHECK (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Guru/Admin manage attendance" ON public.attendance_records TO authenticated USING (auth.uid() = teacher_id OR public.is_admin()) WITH CHECK (auth.uid() = teacher_id OR public.is_admin());

-- =========================================================================
-- 9. GRANTS & CACHE REFRESH
-- =========================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres, service_role, authenticated;

-- Memaksa API Supabase membaca ulang schema baru
NOTIFY pgrst, 'reload schema';