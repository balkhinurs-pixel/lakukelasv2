
-- LakuKelas Database Schema v3.1 (Reset Total & Security Fix)
-- PERINGATAN: Menjalankan skrip ini akan MENGHAPUS SEMUA DATA yang ada.

-- 1. PEMBERSIHAN TOTAL
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_teacher_activity_counts();
DROP VIEW IF EXISTS public.journal_entries_with_names;
DROP VIEW IF EXISTS public.grades_history;
DROP VIEW IF EXISTS public.attendance_history;
DROP VIEW IF EXISTS public.student_notes_with_teacher;
DROP TABLE IF EXISTS public.materials;
DROP TABLE IF EXISTS public.student_notes;
DROP TABLE IF EXISTS public.attendance_records;
DROP TABLE IF EXISTS public.grade_records;
DROP TABLE IF EXISTS public.agendas;
DROP TABLE IF EXISTS public.schedule;
DROP TABLE IF EXISTS public.students;
DROP TABLE IF EXISTS public.subjects;
DROP TABLE IF EXISTS public.classes;
DROP TABLE IF EXISTS public.school_years;
DROP TABLE IF EXISTS public.settings;
DROP TABLE IF EXISTS public.holidays;
DROP TABLE IF EXISTS public.profiles;

-- 2. TABEL PROFIL (Source of Truth untuk Role)
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
    school_name TEXT DEFAULT 'Nama Sekolah Anda',
    school_address TEXT DEFAULT 'Alamat Sekolah',
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    is_homeroom_teacher BOOLEAN DEFAULT FALSE
);

-- Aktifkan RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS yang sangat aman (Anti-Recursion)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admin Kebijakan khusus (Manual via DB Editor jika perlu)
CREATE POLICY "Admins can do everything on profiles" ON public.profiles
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 3. TABEL SISTEM
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT FALSE
);

CREATE TABLE public.holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL AKADEMIK
CREATE TABLE public.classes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    kkm INTEGER DEFAULT 75,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    nis TEXT UNIQUE NOT NULL,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT,
    learning_activities TEXT,
    assessment TEXT,
    reflection TEXT,
    school_year_id UUID REFERENCES public.school_years(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    subject_id UUID REFERENCES public.subjects(id),
    class_id UUID REFERENCES public.classes(id),
    school_year_id UUID REFERENCES public.school_years(id),
    date DATE DEFAULT CURRENT_DATE,
    meeting_number INTEGER,
    status TEXT NOT NULL CHECK (status IN ('Hadir', 'Sakit', 'Izin', 'Alpha')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.grade_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id),
    subject_id UUID REFERENCES public.subjects(id),
    class_id UUID REFERENCES public.classes(id),
    school_year_id UUID REFERENCES public.school_years(id),
    date DATE DEFAULT CURRENT_DATE,
    assessment_type TEXT NOT NULL,
    score NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE public.student_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    type TEXT DEFAULT 'neutral' CHECK (type IN ('positive', 'improvement', 'neutral')),
    date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.teacher_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status TEXT CHECK (status IN ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

-- 5. TRIGGER OTOMATISASI PROFIL (Paling Krusial)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Guru Baru'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. VIEWS UNTUK HISTORI
CREATE OR REPLACE VIEW public.attendance_history AS
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

CREATE OR REPLACE VIEW public.grades_history AS
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

-- 7. FUNGSI STATISTIK
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
        COUNT(DISTINCT ar.id) as attendance_count,
        COUNT(DISTINCT gr.id) as grades_count,
        COUNT(DISTINCT je.id) as journal_count
    FROM public.profiles p
    LEFT JOIN public.attendance_records ar ON ar.teacher_id = p.id
    LEFT JOIN public.grade_records gr ON gr.teacher_id = p.id
    LEFT JOIN public.journal_entries je ON je.teacher_id = p.id
    GROUP BY p.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. AKTIFKAN RLS UNTUK SEMUA TABEL LAIN
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- 9. KEBIJAKAN DASAR (Akses Penuh untuk yang sudah Login)
-- Untuk kemudahan awal, kita berikan akses ALL kepada user terautentikasi
-- Anda bisa memperketat RLS setelah sistem role berjalan lancar
CREATE POLICY "authenticated_access" ON public.settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.school_years FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.holidays FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.classes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.subjects FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.students FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.schedule FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.journal_entries FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.attendance_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.grade_records FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.agendas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.student_notes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.teacher_attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "authenticated_access" ON public.materials FOR ALL USING (auth.role() = 'authenticated');

-- 10. IZIN UNTUK POSTGRES & SERVICE ROLE (Wajib untuk Trigger)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
