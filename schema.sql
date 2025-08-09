-- Skrip Skema Database Lengkap untuk Classroom Zephyr (Lakukelas)
-- Dirancang untuk deployment baru. Menjalankan ini akan menghapus semua data yang ada.

-- 1. Hapus objek lama untuk memastikan skrip bisa dijalankan ulang (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid) CASCADE;

DROP TABLE IF EXISTS public.grade_history CASCADE;
DROP TABLE IF EXISTS public.attendance_history CASCADE;
DROP TABLE IF EXISTS public.journals CASCADE;
DROP TABLE IF EXISTS public.schedule CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.activation_codes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;


-- 2. Buat fungsi helper
-- Fungsi untuk membuat profil baru secara otomatis saat user mendaftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, account_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'teacher', -- Default role untuk pengguna baru
    'Free'     -- Default status akun
  );
  RETURN NEW;
END;
$$;

-- Fungsi untuk mendapatkan peran pengguna saat ini dengan aman
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Fungsi untuk mengaktifkan akun dengan kode
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code TEXT,
    user_id UUID
)
RETURNS TABLE (
  id uuid,
  code text,
  is_used boolean,
  used_by uuid,
  used_at timestamptz
) AS $$
DECLARE
    code_id UUID;
BEGIN
    -- Temukan ID kode aktivasi yang valid dan belum digunakan
    SELECT a.id INTO code_id
    FROM public.activation_codes a
    WHERE a.code = activation_code AND a.is_used = FALSE
    LIMIT 1;

    -- Jika kode tidak ditemukan atau sudah digunakan, lempar error
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Activation code not found or already used';
    END IF;

    -- Update status akun pengguna menjadi 'Pro'
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE public.profiles.id = user_id;

    -- Update kode aktivasi menjadi telah digunakan
    RETURN QUERY
    UPDATE public.activation_codes a
    SET
        is_used = TRUE,
        used_by = user_id,
        used_at = NOW()
    WHERE a.id = code_id
    RETURNING a.id, a.code, a.is_used, a.used_by, a.used_at;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Buat tabel-tabel
-- Tabel untuk profil pengguna
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  nip TEXT,
  pangkat TEXT,
  jabatan TEXT,
  school_name TEXT,
  school_address TEXT,
  headmaster_name TEXT,
  headmaster_nip TEXT,
  school_logo_url TEXT,
  account_status TEXT NOT NULL CHECK (account_status IN ('Free', 'Pro')) DEFAULT 'Free',
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')) DEFAULT 'teacher'
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';

-- Tabel untuk kode aktivasi
CREATE TABLE public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

-- Tabel untuk kelas
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Stores class information.';

-- Tabel untuk mata pelajaran
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm NUMERIC NOT NULL DEFAULT 75,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Stores subject information and their minimum passing criteria (KKM).';

-- Tabel untuk siswa
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT,
    nisn TEXT UNIQUE,
    gender TEXT CHECK (gender IN ('Laki-laki', 'Perempuan')),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores student master data.';

-- Tabel untuk jadwal pelajaran
CREATE TABLE public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL CHECK (day IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Tabel untuk riwayat presensi
CREATE TABLE public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number INT,
    records JSONB NOT NULL -- [{ "student_id": "uuid", "status": "Hadir" | "Sakit" | "Izin" | "Alpha" }]
);
COMMENT ON TABLE public.attendance_history IS 'Stores historical attendance records for each session.';

-- Tabel untuk riwayat nilai
CREATE TABLE public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL -- [{ "student_id": "uuid", "score": 95 }]
);
COMMENT ON TABLE public.grade_history IS 'Stores historical grade records for each assessment.';

-- Tabel untuk jurnal mengajar
CREATE TABLE public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT
);
COMMENT ON TABLE public.journals IS 'Stores teaching journal entries.';


-- 4. Buat trigger
-- Trigger untuk menjalankan fungsi handle_new_user setiap kali ada user baru
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 5. Terapkan Row Level Security (RLS)
-- Nyalakan RLS untuk setiap tabel dan definisikan kebijakannya

-- Table: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON "public"."profiles" FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Table: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."classes" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."subjects" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: students (diakses melalui kelas)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."students" FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = students.class_id AND c.teacher_id = auth.uid()
    ) OR public.get_my_role() = 'admin'
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = students.class_id AND c.teacher_id = auth.uid()
    ) OR public.get_my_role() = 'admin'
);

-- Table: schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."schedule" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: attendance_history
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."attendance_history" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: grade_history
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."grade_history" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for assigned teacher" ON "public"."journals" FOR ALL TO authenticated USING (auth.uid() = teacher_id OR public.get_my_role() = 'admin') WITH CHECK (auth.uid() = teacher_id OR public.get_my_role() = 'admin');

-- Table: activation_codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for admin" ON "public"."activation_codes" FOR ALL TO authenticated USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Pesan akhir
SELECT 'Schema creation script completed successfully.' as status;
