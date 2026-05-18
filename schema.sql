-- ==========================================================
-- MASTER BLUEPRINT LAKUKELAS V21.0 (FINAL GOLD)
-- Satu skrip untuk seluruh infrastruktur database.
-- Mencakup: Profiles, Rombel, AI, Google Drive, RLS, & Otomasi.
-- ==========================================================

-- 0. EKSTENSI & PEMBERSIHAN (Opsional jika ingin bersih total)
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFILES (Master Identitas)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  full_name text DEFAULT 'User LakuKelas',
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_activated boolean DEFAULT false,
  is_homeroom_teacher boolean DEFAULT false,
  
  -- Metadata Sekolah (Hanya diisi oleh Admin)
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  
  -- Integrasi AI
  gemini_api_key text
);

-- 2. TABEL AKADEMIK (Tahun Ajaran, Kelas, Mapel, Siswa)
CREATE TABLE public.school_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  teacher_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id), -- Wali Kelas
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kkm int DEFAULT 75,
  teacher_id uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nis text UNIQUE NOT NULL,
  gender text CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 3. TABEL AKTIVITAS (Absen, Nilai, Jurnal, Agenda)
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  meeting_number int NOT NULL,
  status text NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.grade_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  assessment_type text NOT NULL,
  score int NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date timestamptz DEFAULT now(),
  meeting_number int,
  learning_objectives text NOT NULL,
  learning_activities text NOT NULL,
  assessment text,
  reflection text,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE CASCADE
);

CREATE TABLE public.agendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  title text NOT NULL,
  description text,
  tag text,
  color text DEFAULT '#6b7280',
  start_time time,
  end_time time,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 4. TABEL AI & DRIVE (Fitur Terbaru V21.0)
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid DEFAULT '00000000-0000-0000-0000-000000000000', -- Reserved for multi-school
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  generation_group_id uuid DEFAULT gen_random_uuid(),
  jenjang text NOT NULL,
  kelas text NOT NULL,
  semester text,
  subject text NOT NULL,
  curriculum text,
  assessment_purpose text,
  topic text NOT NULL,
  subtopic text,
  sort_order int NOT NULL,
  question_type text NOT NULL,
  question_text text NOT NULL,
  options_json jsonb,
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text DEFAULT 'ltr',
  needs_review boolean DEFAULT true,
  status text DEFAULT 'draft',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.google_drive_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id text,
  folder_url text,
  folder_name text DEFAULT 'LakuKelas AI',
  status text DEFAULT 'connected',
  connected_at timestamptz DEFAULT now(),
  disconnected_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  title text NOT NULL,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text DEFAULT 'created',
  created_at timestamptz DEFAULT now()
);

-- 5. TABEL SETTINGS & HOLIDAYS
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  description text NOT NULL,
  type text DEFAULT 'national' CHECK (type IN ('national', 'school'))
);

CREATE TABLE public.teacher_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text DEFAULT 'Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, date)
);

CREATE TABLE public.materials (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    link_url text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.student_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    note text NOT NULL,
    type text DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date timestamptz DEFAULT now()
);

-- 6. VIEW & HELPER FUNCTIONS
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
  j.*,
  c.name as "className",
  s.name as "subjectName"
FROM public.journal_entries j
LEFT JOIN public.classes c ON j.class_id = c.id
LEFT JOIN public.subjects s ON j.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
  ar.id, ar.date, ar.meeting_number, ar.status, ar.student_id, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.students s ON ar.student_id = s.id
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects sub ON ar.subject_id = sub.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
  gr.id, gr.date, gr.assessment_type, gr.score, gr.student_id, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.students s ON gr.student_id = s.id
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects sub ON gr.subject_id = sub.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- 7. SECURITY (RLS & POLICIES)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_drive_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_headmaster() RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'headmaster');
$$ LANGUAGE sql SECURITY DEFINER;

-- Policies for Profiles (Open SELECT for middleware)
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.is_admin());

-- Policies for Master Data (Admin Power)
CREATE POLICY "admin_all_years" ON public.school_years FOR ALL TO authenticated USING (public.is_admin() OR auth.uid() = teacher_id) WITH CHECK (true);
CREATE POLICY "select_years" ON public.school_years FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_all_classes" ON public.classes FOR ALL TO authenticated USING (public.is_admin() OR auth.uid() = teacher_id) WITH CHECK (true);
CREATE POLICY "select_classes" ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_all_subjects" ON public.subjects FOR ALL TO authenticated USING (public.is_admin() OR auth.uid() = teacher_id) WITH CHECK (true);
CREATE POLICY "select_subjects" ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_all_students" ON public.students FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (true);
CREATE POLICY "select_students" ON public.students FOR SELECT TO authenticated USING (true);

-- Policies for Activities (Teacher Private + Headmaster/Admin Monitor)
CREATE POLICY "teacher_journal" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin() OR public.is_headmaster()) WITH CHECK (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "teacher_attendance" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin() OR public.is_headmaster()) WITH CHECK (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "teacher_grades" ON public.grade_records FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.is_admin() OR public.is_headmaster()) WITH CHECK (auth.uid() = teacher_id OR public.is_admin());

-- Special Policy for Homeroom Teacher (Wali Kelas) to see their students' performance
CREATE POLICY "homeroom_view_grades" ON public.grade_records FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = grade_records.class_id AND teacher_id = auth.uid()));

CREATE POLICY "homeroom_view_attendance" ON public.attendance_records FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = attendance_records.class_id AND teacher_id = auth.uid()));

-- Policies for AI & Drive
CREATE POLICY "ai_questions_own" ON public.questions FOR ALL TO authenticated USING (auth.uid() = created_by OR public.is_admin()) WITH CHECK (auth.uid() = created_by OR public.is_admin());
CREATE POLICY "drive_integration_own" ON public.google_drive_integrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ai_docs_own" ON public.ai_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. AUTOMATION (TRIGGERS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
    -- Pendaftar pertama otomatis jadi Admin & Aktif
    INSERT INTO public.profiles (id, full_name, role, is_activated)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Administrator'), 'admin', true);
  ELSE
    -- Pendaftar berikutnya jadi Guru & Belum Aktif
    INSERT INTO public.profiles (id, full_name, role, is_activated)
    VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'User LakuKelas'), 'teacher', false);
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 9. PERMISSIONS (Fix Vercel Error)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Default Settings
INSERT INTO public.settings (key, value) VALUES ('attendance_policy', 'schedule_based') ON CONFLICT DO NOTHING;
