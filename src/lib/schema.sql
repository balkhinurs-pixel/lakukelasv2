
-- ========================================================================================
-- LAKUKELAS DATABASE SCHEMA V4.1 (FINAL STABILITY)
-- Deskripsi: Skema bersih dengan perbaikan izin akses (GRANT) dan pencegahan rekursi RLS.
-- ========================================================================================

-- 0. PEMBERSIHAN TOTAL (Nuclear Reset)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

-- Izinkan akses dasar ke skema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, service_role;

-- 1. FUNGSI PEMBANTU (Helper Functions)
-- Fungsi ini harus SECURITY DEFINER untuk memutus loop RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. TABEL PROFIL (Profiles)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
    is_homeroom_teacher BOOLEAN DEFAULT false,
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT
);

-- 3. TABEL TAHUN AJARAN (School Years)
CREATE TABLE public.school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    teacher_id UUID REFERENCES public.profiles(id)
);

-- 4. TABEL KELAS (Classes)
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) -- Wali Kelas
);

-- 5. TABEL MATA PELAJARAN (Subjects)
CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75
);

-- 6. TABEL SISWA (Students)
CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- 7. TABEL JADWAL (Schedule)
CREATE TABLE public.schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 8. TABEL PRESENSI SISWA (Attendance Records)
CREATE TABLE public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    meeting_number INTEGER NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    UNIQUE(date, student_id, subject_id, meeting_number)
);

-- 9. TABEL NILAI SISWA (Grade Records)
CREATE TABLE public.grade_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    assessment_type TEXT NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100)
);

-- 10. TABEL JURNAL MENGAJAR (Journal Entries)
CREATE TABLE public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE
);

-- 11. TABEL AGENDA (Agendas)
CREATE TABLE public.agendas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 12. TABEL MATERI (Materials)
CREATE TABLE public.materials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL
);

-- 13. TABEL ABSENSI GURU (Teacher Attendance)
CREATE TABLE public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    UNIQUE(teacher_id, date)
);

-- 14. TABEL HARI LIBUR (Holidays)
CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- 15. TABEL PENGATURAN (Settings)
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 16. TABEL CATATAN SISWA (Student Notes)
CREATE TABLE public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================================================
-- VIEW & RPC FUNCTIONS
-- ========================================================================================

-- View Riwayat Presensi
CREATE VIEW public.attendance_history AS
SELECT 
    ar.id, ar.date, ar.meeting_number, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id, ar.status, ar.student_id,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

-- View Riwayat Nilai
CREATE VIEW public.grades_history AS
SELECT 
    gr.id, gr.date, gr.assessment_type, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id, gr.score, gr.student_id,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
FROM public.grade_records gr
JOIN public.classes c ON gr.class_id = c.id
JOIN public.subjects s ON gr.subject_id = s.id
JOIN public.profiles p ON gr.teacher_id = p.id;

-- View Jurnal dengan Nama
CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as class_name,
    s.name as subject_name
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

-- View Catatan Siswa dengan Nama Guru
CREATE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- RPC: Hitung Aktivitas Guru Berdasarkan Sesi
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

-- ========================================================================================
-- IZIN AKSES (GRANTS) - SANGAT PENTING
-- ========================================================================================

-- Berikan izin eksplisit ke peran authenticated (pengguna login) dan anon (middleware/cek awal)
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.settings TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ========================================================================================
-- KEBIJAKAN KEAMANAN (RLS POLICIES)
-- ========================================================================================

-- Aktifkan RLS
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
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin can do everything on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- 2. General Read Access for Authenticated Users
CREATE POLICY "Auth users can view school years" ON public.school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view schedule" ON public.schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can view materials" ON public.materials FOR SELECT TO authenticated USING (true);

-- 3. Owner-based Write Access (Guru)
CREATE POLICY "Guru can manage own journal" ON public.journal_entries FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own attendance records" ON public.attendance_records FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own grade records" ON public.grade_records FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own agenda" ON public.agendas FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own materials" ON public.materials FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own attendance" ON public.teacher_attendance FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());
CREATE POLICY "Guru can manage own notes" ON public.student_notes FOR ALL USING (teacher_id = auth.uid() OR public.is_admin());

-- 4. Admin-only Write Access
CREATE POLICY "Admin manage school years" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage classes" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage subjects" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage schedule" ON public.schedule FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage settings" ON public.settings FOR ALL USING (public.is_admin());
CREATE POLICY "Admin manage holidays" ON public.holidays FOR ALL USING (public.is_admin());

-- ========================================================================================
-- AUTOMATIC PROFILE CREATION (TRIGGER)
-- ========================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
