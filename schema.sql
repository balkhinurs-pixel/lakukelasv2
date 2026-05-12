-- ==========================================
-- LAKUKELAS DATABASE SCHEMA V3.4 (NUCLEAR RESET)
-- Deskripsi: Reset total semua tabel, view, dan fungsi.
-- Menjamin tidak ada error "already exists".
-- ==========================================

-- 1. PEMBERSIHAN TOTAL (NUCLEAR DROP)
-- Menghapus semua yang mungkin ada dari versi sebelumnya
DROP VIEW IF EXISTS public.attendance_history CASCADE;
DROP VIEW IF EXISTS public.grades_history CASCADE;
DROP VIEW IF EXISTS public.journal_entries_with_names CASCADE;
DROP VIEW IF EXISTS public.student_notes_with_teacher CASCADE;

DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.school_years CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.grade_records CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.agendas CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.teacher_attendance CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.student_notes CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_activity_counts() CASCADE;

-- 2. TABEL PROFIL (Source of Truth untuk Role)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- 3. TABEL PENDUKUNG DASAR
CREATE TABLE public.school_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE -- e.g., "2023/2024 - Ganjil"
);

CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INTEGER DEFAULT 75
);

CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL -- Wali Kelas
);

CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 4. TABEL SISWA
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nis TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url TEXT
);

-- 5. TABEL TRANSAKSI (GURU & PEMBELAJARAN)
CREATE TABLE public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  check_in TIME,
  check_out TIME,
  status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason TEXT, -- Alasan jika sakit/izin
  UNIQUE(teacher_id, date)
);

CREATE TABLE public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
  meeting_number INTEGER,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT
);

CREATE TABLE public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  meeting_number INTEGER NOT NULL,
  status TEXT CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  UNIQUE(student_id, subject_id, date, meeting_number)
);

CREATE TABLE public.grade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  assessment_type TEXT NOT NULL, -- e.g., "UH1", "UTS"
  score DECIMAL(5,2) CHECK (score >= 0 AND score <= 100),
  UNIQUE(student_id, subject_id, assessment_type, date)
);

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

CREATE TABLE public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  day TEXT CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE public.student_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
  date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  description TEXT NOT NULL
);

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

-- 6. VIEWS UNTUK RIWAYAT (Mempermudah Query Aplikasi)
CREATE VIEW public.attendance_history AS
SELECT 
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
FROM public.attendance_records ar
JOIN public.classes c ON ar.class_id = c.id
JOIN public.subjects s ON ar.subject_id = s.id
JOIN public.profiles p ON ar.teacher_id = p.id;

CREATE VIEW public.grades_history AS
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

CREATE VIEW public.journal_entries_with_names AS
SELECT 
    je.*,
    c.name as class_name,
    s.name as subject_name
FROM public.journal_entries je
JOIN public.classes c ON je.class_id = c.id
JOIN public.subjects s ON je.subject_id = s.id;

CREATE VIEW public.student_notes_with_teacher AS
SELECT 
    sn.*,
    p.full_name as teacher_name
FROM public.student_notes sn
JOIN public.profiles p ON sn.teacher_id = p.id;

-- 7. FUNGSI OTOMATISASI (TRIGGER & RPC)
-- Trigger untuk membuat profil otomatis saat user daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Guru Baru'),
    new.email,
    'teacher'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Izin agar trigger bisa menulis ke tabel public.profiles
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;

-- Fungsi untuk statistik aktivitas guru (Panel Admin)
CREATE OR REPLACE FUNCTION public.get_teacher_activity_counts()
RETURNS TABLE (
    teacher_id UUID,
    attendance_count BIGINT,
    grades_count BIGINT,
    journal_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as teacher_id,
        (SELECT COUNT(*) FROM public.attendance_records ar WHERE ar.teacher_id = p.id) as attendance_count,
        (SELECT COUNT(*) FROM public.grade_records gr WHERE gr.teacher_id = p.id) as grades_count,
        (SELECT COUNT(*) FROM public.journal_entries je WHERE je.teacher_id = p.id) as journal_count
    FROM public.profiles p
    WHERE p.role IN ('teacher', 'headmaster');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Kebijakan Dasar: Pemilik bisa melihat datanya sendiri
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Kebijakan Umum: Semua guru terautentikasi bisa melihat data pendukung
CREATE POLICY "Allow authenticated to view school_years" ON public.school_years FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to view classes" ON public.classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to view subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to view students" ON public.students FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to view settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated to view holidays" ON public.holidays FOR SELECT TO authenticated USING (true);

-- Kebijakan Transaksi: Hanya pemilik data yang bisa kelola
CREATE POLICY "Owners can manage journals" ON public.journal_entries FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage agendas" ON public.agendas FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage schedule" ON public.schedule FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage personal attendance" ON public.teacher_attendance FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage student attendance" ON public.attendance_records FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage student grades" ON public.grade_records FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Owners can manage materials" ON public.materials FOR ALL TO authenticated USING (auth.uid() = teacher_id);
CREATE POLICY "Anyone can view notes" ON public.student_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners can manage own notes" ON public.student_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = teacher_id);

-- KHUSUS ADMIN: Bypass semua proteksi
-- Catatan: Admin diberikan hak akses luas melalui kebijakan spesifik di setiap tabel jika diperlukan, 
-- namun untuk efisiensi, kebijakan di atas sudah mencakup kebutuhan guru. 
-- Admin akan mendaftarkan diri secara manual dan mengelola tabel melalui UI Admin.

-- IZIN AKSES PUBLIK (Jika diperlukan)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role, authenticated;
