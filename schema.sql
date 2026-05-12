-- SCHEMA SQL LAKUKELAS V4.3 (STABIL)
-- Diletakkan di root direktori sebagai referensi tunggal.

-- 0. PEMBERSIHAN (Hapus jika ingin reset total)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- 1. TABEL PROFIL (Pusat Data Pengguna)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- 2. TABEL SETTINGS (Konfigurasi Global)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL HARI LIBUR
CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TAHUN AJARAN
CREATE TABLE public.school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    teacher_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL KELAS
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Wali Kelas
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL MATA PELAJARAN
CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    kkm INT DEFAULT 75,
    teacher_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL SISWA
CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nis TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL JADWAL MENGAJAR
CREATE TABLE public.schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL PRESENSI SISWA
CREATE TABLE public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    date DATE NOT NULL,
    meeting_number INT,
    status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL NILAI SISWA
CREATE TABLE public.grade_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    school_year_id UUID REFERENCES public.school_years(id),
    date DATE NOT NULL,
    assessment_type TEXT, -- e.g., 'Tugas 1', 'UTS'
    score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL JURNAL MENGAJAR
CREATE TABLE public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id),
    date DATE DEFAULT CURRENT_DATE,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABEL AGENDA PRIBADI
CREATE TABLE public.agendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABEL ABSENSI GURU (Check-in/Out)
CREATE TABLE public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
    reason TEXT,
    location_lat NUMERIC,
    location_lng NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

-- 14. TABEL MATERI PEMBELAJARAN
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. TABEL CATATAN SISWA
CREATE TABLE public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- FUNGSI PEMBANTU & LOGIKA
-- ==========================================

-- Fungsi Cek Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi Nama Hari Indonesia
CREATE OR REPLACE FUNCTION public.get_indonesian_day_name_from_date(p_date DATE)
RETURNS TEXT AS $$
DECLARE
    v_day_num INT;
    v_days TEXT[] := ARRAY['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
BEGIN
    v_day_num := EXTRACT(DOW FROM p_date);
    RETURN v_days[v_day_num + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger Profil Baru
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- VIEW (UNTUK LAPORAN)
-- ==========================================

CREATE OR REPLACE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as "className",
    s.name as "subjectName"
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE OR REPLACE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE OR REPLACE VIEW public.grades_history AS
SELECT 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

CREATE OR REPLACE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- ==========================================
-- RPC FUNCTIONS (STATISTIK)
-- ==========================================

-- 1. Statistik Aktivitas Guru per Semester
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
  teacher_id UUID,
  attendance_count BIGINT,
  grades_count BIGINT,
  journal_count BIGINT,
  classes_handled_count BIGINT
) AS $$
DECLARE
  v_active_year_id UUID;
BEGIN
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';
  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) FROM public.attendance_records ar WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) FROM public.grade_records gr WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    (SELECT COUNT(*) FROM public.journal_entries je WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    (SELECT COUNT(DISTINCT class_id) FROM public.schedule s WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM public.profiles p
  WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ringkasan Kehadiran Berbasis Kebijakan
CREATE OR REPLACE FUNCTION public.get_teacher_attendance_summary(p_date DATE)
RETURNS TABLE (
  total_expected BIGINT,
  total_present BIGINT,
  total_late BIGINT,
  total_absent BIGINT,
  attendance_rate NUMERIC
) AS $$
DECLARE
  v_policy TEXT;
  v_is_holiday BOOLEAN;
  v_day_name TEXT;
BEGIN
  SELECT value INTO v_policy FROM public.settings WHERE key = 'attendance_policy';
  v_policy := COALESCE(v_policy, 'schedule_based');
  SELECT EXISTS(SELECT 1 FROM public.holidays WHERE date = p_date) INTO v_is_holiday;
  v_day_name := public.get_indonesian_day_name_from_date(p_date);
  IF v_is_holiday OR v_day_name = 'Minggu' THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::BIGINT, 0::NUMERIC;
    RETURN;
  END IF;
  RETURN QUERY
  WITH expected_teachers AS (
    SELECT DISTINCT p.id FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster')
    AND (v_policy = 'daily_based' OR (v_policy = 'schedule_based' AND EXISTS (SELECT 1 FROM public.schedule s WHERE s.teacher_id = p.id AND s.day = v_day_name)))
  ),
  actual_attendance AS (
    SELECT teacher_id, status FROM public.teacher_attendance WHERE date = p_date
  )
  SELECT
    (SELECT COUNT(*) FROM expected_teachers) AS total_expected,
    (SELECT COUNT(*) FROM actual_attendance WHERE status IN ('Tepat Waktu', 'Terlambat')) AS total_present,
    (SELECT COUNT(*) FROM actual_attendance WHERE status = 'Terlambat') AS total_late,
    (SELECT COUNT(*) FROM expected_teachers et LEFT JOIN actual_attendance aa ON et.id = aa.teacher_id WHERE aa.teacher_id IS NULL) AS total_absent,
    COALESCE(ROUND((SELECT COUNT(*) FROM actual_attendance WHERE status IN ('Tepat Waktu', 'Terlambat'))::NUMERIC / NULLIF((SELECT COUNT(*) FROM expected_teachers), 0)::NUMERIC * 100, 1), 0) AS attendance_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- KEBIJAKAN KEAMANAN (RLS)
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- Contoh Policy (Profil)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Policy Lainnya (Secara Umum: Guru bisa akses data miliknya, Admin bisa akses semua)
-- School Years
CREATE POLICY "Admin manage school years" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Everyone read active school years" ON public.school_years FOR SELECT USING (true);

-- Settings & Holidays
CREATE POLICY "Everyone read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Everyone read holidays" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- Global Read (Classes, Subjects, Students, Schedule)
CREATE POLICY "Global read on academic data" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Global read on academic data" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Global read on academic data" ON public.students FOR SELECT USING (true);
CREATE POLICY "Global read on academic data" ON public.schedule FOR SELECT USING (true);

-- Admin Manage (Classes, Subjects, Students, Schedule)
CREATE POLICY "Admin manage academic data" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage academic data" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage academic data" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage academic data" ON public.schedule FOR ALL USING (public.is_admin());

-- Journal, Attendance, Grades, Notes, Materials, Agendas (Owner or Admin)
CREATE POLICY "Owner or Admin access" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Owner or Admin access" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- ==========================================
-- IZIN AKSES (GRANT)
-- ==========================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon, service_role;