-- ==========================================
-- MASTER SQL BLUEPRINT: LAKUKELAS V35.0
-- ==========================================
-- Deskripsi: Skema database lengkap termasuk RLS, Views, RPC, Triggers, dan Izin.
-- Terakhir diperbarui: Monitoring Aktivitas Guru (Kelas, Absen, Jurnal, Nilai)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles: Inti identitas pengguna dan sekolah
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT DEFAULT 'User LakuKelas',
  avatar_url TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_activated BOOLEAN DEFAULT false,
  is_homeroom_teacher BOOLEAN DEFAULT false,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  phone_number TEXT,
  school_name TEXT,
  npsn TEXT,
  school_address TEXT,
  school_email TEXT,
  school_website TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activation Tokens: Untuk pendaftaran guru via kode
CREATE TABLE IF NOT EXISTS public.activation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Settings: Konfigurasi global (Tahun ajaran aktif, WhatsApp, Lokasi Absen)
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- School Years: Semester Ganjil/Genap
CREATE TABLE IF NOT EXISTS public.school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g. 2024/2025 - Ganjil
  teacher_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Classes: Rombongan Belajar
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id), -- Wali Kelas
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Subjects: Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students: Data Induk Peserta Didik
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  nis TEXT UNIQUE,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Master Schedule: Jadwal mengajar guru
CREATE TABLE IF NOT EXISTS public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Attendance Records: Presensi Siswa
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  meeting_number INTEGER,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grade Records: Nilai Akademik Siswa
CREATE TABLE IF NOT EXISTS public.grade_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  assessment_type TEXT NOT NULL, -- e.g. UH1, UTS, UAS
  score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal Entries: Jurnal Mengajar Guru
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMPTZ DEFAULT now(),
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  teacher_id UUID REFERENCES public.profiles(id),
  school_year_id UUID REFERENCES public.school_years(id),
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Agendas: Kalender/Agenda Guru
CREATE TABLE IF NOT EXISTS public.agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT DEFAULT '#6b7280',
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Materials: Link Materi Pembelajaran
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id),
  subject_id UUID REFERENCES public.subjects(id),
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher Attendance: Absensi Masuk/Pulang Guru (GPS Based)
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT DEFAULT 'Tepat Waktu' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, date)
);

-- Holidays: Hari Libur Nasional/Sekolah
CREATE TABLE IF NOT EXISTS public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'national' CHECK (type IN ('national', 'school')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Google Drive Integrations: Metadata folder guru
CREATE TABLE IF NOT EXISTS public.google_drive_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  folder_id TEXT,
  folder_url TEXT,
  folder_name TEXT DEFAULT 'LakuKelas AI',
  status TEXT DEFAULT 'connected',
  connected_at TIMESTAMPTZ DEFAULT now(),
  disconnected_at TIMESTAMPTZ
);

-- AI Documents: Metadata file di Drive
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'rpp', 'soal', 'naskah_ujian'
  title TEXT NOT NULL,
  subject TEXT,
  class_level TEXT,
  drive_file_id TEXT,
  drive_file_url TEXT,
  drive_folder_id TEXT,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions: Bank Soal AI
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  generation_group_id UUID,
  jenjang TEXT,
  kelas TEXT,
  subject TEXT,
  topic TEXT,
  question_text TEXT NOT NULL,
  options_json JSONB, -- {A: "...", B: "..."}
  correct_answer TEXT,
  explanation TEXT,
  difficulty TEXT,
  cognitive_level TEXT,
  language_direction TEXT DEFAULT 'ltr',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VIEWS

-- Riwayat Presensi Lengkap
CREATE OR REPLACE VIEW public.attendance_history AS
SELECT ar.*, c.name as class_name, s.name as subject_name, p.full_name as teacher_name
FROM attendance_records ar
JOIN classes c ON ar.class_id = c.id
JOIN subjects s ON ar.subject_id = s.id
JOIN profiles p ON ar.teacher_id = p.id;

-- Riwayat Nilai Lengkap
CREATE OR REPLACE VIEW public.grades_history AS
SELECT gr.*, c.name as class_name, s.name as subject_name, s.kkm as subject_kkm, p.full_name as teacher_name
FROM grade_records gr
JOIN classes c ON gr.class_id = c.id
JOIN subjects s ON gr.subject_id = s.id
JOIN profiles p ON gr.teacher_id = p.id;

-- Jurnal dengan Nama
CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT je.*, c.name as "className", s.name as "subjectName"
FROM journal_entries je
LEFT JOIN classes c ON je.class_id = c.id
LEFT JOIN subjects s ON je.subject_id = s.id;

-- 4. FUNCTIONS & RPC

-- Auto Admin untuk Pendaftar Pertama
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT (NOT EXISTS (SELECT 1 FROM public.profiles)) INTO is_first_user;
  IF is_first_user THEN
    INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Admin Pertama'), NEW.raw_user_meta_data->>'avatar_url', 'admin', true);
  ELSE
    INSERT INTO public.profiles (id, full_name, avatar_url, role, is_activated)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Guru Baru'), NEW.raw_user_meta_data->>'avatar_url', 'teacher', false);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ringkasan Kehadiran Guru (Dashboard)
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
    total_expected BIGINT, total_present BIGINT, total_late BIGINT, total_absent BIGINT, attendance_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_policy TEXT; v_expected_count BIGINT; v_present_count BIGINT; v_day_name TEXT;
BEGIN
    SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
    v_policy := COALESCE(v_policy, 'schedule_based');
    v_day_name := CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu' END;
    IF v_policy = 'daily_based' THEN
        SELECT count(*) INTO v_expected_count FROM public.profiles WHERE role IN ('teacher', 'headmaster') AND is_activated = true;
    ELSE
        SELECT count(DISTINCT teacher_id) INTO v_expected_count FROM public.schedule WHERE day = v_day_name;
    END IF;
    SELECT count(*) INTO v_present_count FROM public.teacher_attendance WHERE date = p_date AND status IN ('Tepat Waktu', 'Terlambat');
    RETURN QUERY SELECT v_expected_count, v_present_count, (SELECT count(*) FROM public.teacher_attendance WHERE date = p_date AND status = 'Terlambat'), (v_expected_count - v_present_count),
        CASE WHEN v_expected_count = 0 THEN 100 ELSE ROUND((v_present_count::NUMERIC / v_expected_count::NUMERIC) * 100, 1) END;
END;
$$;

-- Monitoring Aktivitas Guru (Fungsi Baru/V35)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID, teacher_name TEXT, attendance_count BIGINT, grades_count BIGINT, journal_count BIGINT, classes_handled_count BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.full_name,
        COALESCE(att.cnt, 0), COALESCE(grd.cnt, 0), COALESCE(jrn.cnt, 0), COALESCE(sch.cnt, 0)
    FROM public.profiles p
    LEFT JOIN (SELECT ar.teacher_id, count(DISTINCT (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as cnt FROM public.attendance_records ar GROUP BY ar.teacher_id) att ON p.id = att.teacher_id
    LEFT JOIN (SELECT gr.teacher_id, count(DISTINCT (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as cnt FROM public.grade_records gr GROUP BY gr.teacher_id) grd ON p.id = grd.teacher_id
    LEFT JOIN (SELECT je.teacher_id, count(*) as cnt FROM public.journal_entries je GROUP BY je.teacher_id) jrn ON p.id = jrn.teacher_id
    LEFT JOIN (SELECT s.teacher_id, count(DISTINCT s.class_id) as cnt FROM public.schedule s GROUP BY s.teacher_id) sch ON p.id = sch.teacher_id
    WHERE p.role IN ('teacher', 'headmaster') AND p.is_activated = true
    ORDER BY p.full_name ASC;
END;
$$;

-- 5. TRIGGERS
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All staff can view holidays." ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Only admin can manage holidays." ON public.holidays FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 7. GRANTS
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.classes TO authenticated;
GRANT ALL ON public.subjects TO authenticated;
GRANT ALL ON public.students TO authenticated;
GRANT ALL ON public.attendance_records TO authenticated;
GRANT ALL ON public.grade_records TO authenticated;
GRANT ALL ON public.journal_entries TO authenticated;
GRANT ALL ON public.schedule TO authenticated;
GRANT ALL ON public.holidays TO authenticated;
GRANT ALL ON public.teacher_attendance TO authenticated;
GRANT ALL ON public.google_drive_integrations TO authenticated;
GRANT ALL ON public.ai_documents TO authenticated;
GRANT ALL ON public.questions TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_teacher_attendance_summary(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_teacher_activity_counts() TO authenticated;
GRANT SELECT ON public.attendance_history TO authenticated;
GRANT SELECT ON public.grades_history TO authenticated;
GRANT SELECT ON public.journal_entries_with_names TO authenticated;
