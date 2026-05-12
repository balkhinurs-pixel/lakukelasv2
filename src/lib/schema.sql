
-- ================================================================================
-- LAKUKELAS DATABASE SCHEMA V4.0 (NUCLEAR RESET & FINAL STRUCTURE)
-- ================================================================================
-- Deskripsi: Mereset total database dan membangun struktur paling stabil.
-- Perbaikan: Menghapus kebijakan RLS pada VIEW untuk menghindari error 42809.
-- ================================================================================

-- 1. PEMBERSIHAN TOTAL (NUCLEAR RESET)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. EKSTENSI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 3. FUNGSI PEMBANTU (SANGAT PENTING: Harus dibuat sebelum tabel/policy)
-- Fungsi untuk mengecek Admin tanpa loop RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TABEL UTAMA
-- Tabel Profil Pengguna
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT,
    email TEXT,
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

-- Tabel Tahun Ajaran
CREATE TABLE public.school_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT UNIQUE NOT NULL, -- e.g. "2024/2025 - Ganjil"
    teacher_id UUID REFERENCES public.profiles(id),
    is_active BOOLEAN DEFAULT FALSE
);

-- Tabel Pengaturan Global
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Kelas
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

-- Tabel Mata Pelajaran
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75
);

-- Tabel Siswa
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT
);

-- Tabel Jadwal Mengajar
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Tabel Presensi Siswa
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Nilai Siswa
CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Jurnal Mengajar
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Agenda Pribadi
CREATE TABLE public.agendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Tabel Catatan Siswa
CREATE TABLE public.student_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel Hari Libur
CREATE TABLE public.holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    description TEXT NOT NULL
);

-- Tabel Absensi Kehadiran Guru
CREATE TABLE public.teacher_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT NOT NULL DEFAULT 'Tidak Hadir' CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT, -- Keterangan untuk Sakit/Izin
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, date)
);

-- Tabel Materi Pembelajaran (Update 3.6)
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    link_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VIEW (REKAP DATA)
-- View Riwayat Presensi
CREATE VIEW public.attendance_history AS
SELECT 
    ar.*,
    s.name as student_name,
    c.name as class_name,
    sub.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.students s ON ar.student_id = s.id
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects sub ON ar.subject_id = sub.id
JOIN public.profiles p ON ar.teacher_id = p.id;

-- View Riwayat Nilai
CREATE VIEW public.grades_history AS
SELECT 
    gr.*,
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

-- View Jurnal dengan Nama
CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id
JOIN public.profiles p ON je.teacher_id = p.id;

-- View Catatan Siswa
CREATE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 6. RPC FUNCTIONS (LOGIKA SERVER-SIDE)

-- RPC: Ambil ID Tahun Ajaran Aktif
CREATE OR REPLACE FUNCTION public.get_active_school_year_id()
RETURNS UUID AS $$
  SELECT value::UUID FROM public.settings WHERE key = 'active_school_year_id';
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RPC: Rekap Aktivitas Guru (Update v3.9)
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
  -- Ambil ID Tahun Ajaran Aktif
  SELECT value::UUID INTO v_active_year_id FROM public.settings WHERE key = 'active_school_year_id';

  RETURN QUERY
  SELECT
    p.id AS teacher_id,
    -- Sesi Presensi Unik
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, meeting_number)) 
     FROM public.attendance_records ar 
     WHERE ar.teacher_id = p.id AND ar.school_year_id = v_active_year_id) AS attendance_count,
    -- Set Penilaian Unik
    (SELECT COUNT(DISTINCT (date, class_id, subject_id, assessment_type)) 
     FROM public.grade_records gr 
     WHERE gr.teacher_id = p.id AND gr.school_year_id = v_active_year_id) AS grades_count,
    -- Jurnal
    (SELECT COUNT(*) 
     FROM public.journal_entries je 
     WHERE je.teacher_id = p.id AND je.school_year_id = v_active_year_id) AS journal_count,
    -- Beban Kelas diampu (berdasarkan jadwal)
    (SELECT COUNT(DISTINCT class_id) 
     FROM public.schedule s 
     WHERE s.teacher_id = p.id) AS classes_handled_count
  FROM
    public.profiles p
  WHERE
    p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Trigger Pendaftaran Pengguna Baru
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

-- Trigger: Jalankan fungsi saat ada user baru di Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. KEBIJAKAN KEAMANAN (RLS) - HANYA UNTUK TABEL
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- --- KEBIJAKAN UMUM (ADMIN & GURU) ---

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins have full access on profiles" ON public.profiles FOR ALL USING (public.is_admin());

-- Settings
CREATE POLICY "Settings are viewable by everyone" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Only admins can modify settings" ON public.settings FOR ALL USING (public.is_admin());

-- Classes, Subjects, School Years, Holidays
CREATE POLICY "Roster data is viewable by everyone" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Roster data is viewable by everyone" ON public.subjects FOR SELECT USING (true);
CREATE POLICY "Roster data is viewable by everyone" ON public.school_years FOR SELECT USING (true);
CREATE POLICY "Roster data is viewable by everyone" ON public.holidays FOR SELECT USING (true);

CREATE POLICY "Admin full access on roster" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on roster" ON public.subjects FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on roster" ON public.school_years FOR ALL USING (public.is_admin());
CREATE POLICY "Admin full access on roster" ON public.holidays FOR ALL USING (public.is_admin());

-- Students
CREATE POLICY "Students are viewable by authenticated users" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admin full access on students" ON public.students FOR ALL USING (public.is_admin());

-- Schedule
CREATE POLICY "Schedule is viewable by everyone" ON public.schedule FOR SELECT USING (true);
CREATE POLICY "Admin full access on schedule" ON public.schedule FOR ALL USING (public.is_admin());

-- Attendance, Grades, Journal, Agendas, Notes (Owner or Admin)
CREATE POLICY "Users can manage own attendance" ON public.attendance_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Users can manage own grades" ON public.grade_records FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Users can manage own journals" ON public.journal_entries FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Users can manage own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());
CREATE POLICY "Users can manage own materials" ON public.materials FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

CREATE POLICY "Teacher attendance viewable by all" ON public.teacher_attendance FOR SELECT USING (true);
CREATE POLICY "Users can manage own teacher attendance" ON public.teacher_attendance FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- Student Notes (Special: Viewable by anyone authenticated, manageable by owner/admin)
CREATE POLICY "Student notes are viewable by teachers" ON public.student_notes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own student notes" ON public.student_notes FOR ALL USING (auth.uid() = teacher_id OR public.is_admin());

-- 8. STORAGE PERMISSIONS (Jika bucket sudah dibuat)
-- Perizinan untuk folder avatars (public view, user upload own)
-- Perlu dijalankan manual di dashboard Storage jika script ini tidak memiliki izin storage.
