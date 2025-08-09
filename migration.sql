-- Inisialisasi: Mengaktifkan RLS dan membuat fungsi bantu dasar.
-- Pastikan ekstensi http diaktifkan
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Fungsi untuk membuat profil baru saat pengguna mendaftar.
-- Akan dipanggil oleh webhook, bukan trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fungsi untuk aktivasi akun yang akan dipanggil via RPC dari server action.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void AS $$
DECLARE
    code_id_to_update UUID;
    code_is_used BOOLEAN;
BEGIN
    -- Cek apakah kode ada dan belum digunakan
    SELECT id, is_used INTO code_id_to_update, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use;

    IF code_id_to_update IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Update tabel profiles
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Update tabel activation_codes
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = NOW(),
        used_by_email = user_email_to_set
    WHERE id = code_id_to_update;
END;
$$ LANGUAGE plpgsql;


-- Pembuatan Tabel (jika belum ada)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
    account_status TEXT DEFAULT 'Free'::text NOT NULL,
    role TEXT DEFAULT 'teacher'::text NOT NULL,
    email TEXT,
    active_school_year_id UUID
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm NUMERIC NOT NULL DEFAULT 75,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT,
    nisn TEXT,
    gender TEXT NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    used_by_email TEXT
);
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;

-- Tambah kolom active_school_year_id ke profiles jika belum ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS active_school_year_id UUID;

-- Hapus dan buat ulang constraint untuk memastikan integritas
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;


-- Kebijakan RLS (Row Level Security)
-- Hapus policy yang mungkin sudah ada sebelum dibuat ulang
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;

CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Enable update for users based on email" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Ulangi untuk setiap tabel
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.classes;
CREATE POLICY "Enable all access for assigned teacher" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.subjects;
CREATE POLICY "Enable all access for assigned teacher" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON public.students;
DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.students;
CREATE POLICY "Enable all access for assigned teacher" ON public.students
FOR ALL USING ((
    SELECT auth.uid() FROM classes
    WHERE classes.id = students.class_id
));


DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.schedule;
CREATE POLICY "Enable all access for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.attendance_history;
CREATE POLICY "Enable all access for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.grade_history;
CREATE POLICY "Enable all access for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.journals;
CREATE POLICY "Enable all access for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Enable all access for admin" ON public.activation_codes;
CREATE POLICY "Enable all access for admin" ON public.activation_codes FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Enable all access for assigned teacher" ON public.school_years;
CREATE POLICY "Enable all access for assigned teacher" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);


-- Hapus trigger lama jika ada, untuk menghindari konflik
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Kosongkan fungsi lama untuk memastikan tidak ada sisa.
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_id() CASCADE;
