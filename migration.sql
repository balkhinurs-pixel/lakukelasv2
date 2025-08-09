-- Skrip Migrasi untuk Database yang Sudah Ada (AMAN DIJALANKAN)
-- Skrip ini TIDAK akan menghapus data Anda.
-- Tujuannya adalah untuk memperbaiki fungsi dan RLS policies yang salah.

-- 1. Hapus dan buat ulang fungsi yang salah/bermasalah

-- Menghapus trigger lama agar fungsi bisa dihapus
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Menghapus fungsi lama dengan CASCADE untuk menghapus dependensi
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_my_role() CASCADE;
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid) CASCADE;


-- 2. Buat ulang fungsi dengan definisi yang benar

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
    'teacher',
    'Free'
  );
  RETURN NEW;
END;
$$;

-- Fungsi untuk mendapatkan peran pengguna saat ini dengan aman
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE -- Functions that read the database but don't change it should be STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- [FIX] Fungsi untuk mengaktifkan akun dengan kode
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


-- 3. Buat ulang trigger yang menghubungkan ke fungsi handle_new_user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- 4. Hapus semua RLS policies yang lama dan berpotensi salah
-- Menggunakan "DROP POLICY IF EXISTS" agar aman dijalankan berkali-kali
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Admins can manage all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can read all profiles" ON "public"."profiles"; -- Menghapus policy yang menyebabkan error sebelumnya

-- Lakukan hal yang sama untuk semua tabel lain untuk kebersihan
-- (Bahkan jika belum ada, ini adalah praktik yang baik)
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."classes";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."subjects";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."students";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."schedule";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."attendance_history";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."grade_history";
DROP POLICY IF EXISTS "Enable read access for assigned teacher" ON "public"."journals";
DROP POLICY IF EXISTS "Enable read access for admin" ON "public"."activation_codes";


-- 5. Buat ulang semua RLS policies dengan definisi yang benar dan aman

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
SELECT 'Migration script completed successfully.' as status;
