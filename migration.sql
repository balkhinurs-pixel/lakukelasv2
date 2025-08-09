-- =================================================================
-- MIGRATION SCRIPT TO FIX RLS AND FUNCTIONS WITHOUT DATA LOSS
-- =================================================================
-- Aman untuk dijalankan pada database yang sudah ada.
-- Skrip ini TIDAK akan menghapus tabel atau data Anda.

-- STEP 1: Hapus trigger lama dan fungsi `handle_new_user`
-- Menggunakan CASCADE untuk juga menghapus trigger yang bergantung padanya.
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- STEP 2: Buat ulang fungsi `handle_new_user` yang benar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, account_status)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'teacher', -- Default role
    'Free'     -- Default account status
  );
  RETURN new;
END;
$$;

-- STEP 3: Buat kembali trigger di tabel auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 4: Buat fungsi helper `get_my_role` untuk RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- STEP 5: Hapus semua RLS policies lama dari semua tabel
-- Ini penting untuk memastikan tidak ada policy lama yang konflik.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;

ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;

ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage all subjects" ON public.subjects;

ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage students in their classes" ON public.students;
DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;

ALTER TABLE public.schedule DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own schedule" ON public.schedule;
DROP POLICY IF EXISTS "Admins can manage all schedules" ON public.schedule;

ALTER TABLE public.attendance_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own attendance history" ON public.attendance_history;
DROP POLICY IF EXISTS "Admins can manage all attendance history" ON public.attendance_history;

ALTER TABLE public.grade_history DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own grade history" ON public.grade_history;
DROP POLICY IF EXISTS "Admins can manage all grade history" ON public.grade_history;

ALTER TABLE public.journals DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Teachers can manage their own journals" ON public.journals;
DROP POLICY IF EXISTS "Admins can manage all journals" ON public.journals;

ALTER TABLE public.activation_codes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can manage activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Authenticated users can read their own used code" ON public.activation_codes;


-- STEP 6: Buat kembali semua RLS policies dengan logika yang benar

-- Table: profiles
CREATE POLICY "Users can read all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Table: classes
CREATE POLICY "Teachers can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all classes" ON public.classes FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Table: subjects
CREATE POLICY "Teachers can manage their own subjects" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all subjects" ON public.subjects FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Table: students
CREATE POLICY "Teachers can manage students in their classes" ON public.students FOR ALL USING (
  EXISTS (
    SELECT 1 FROM classes
    WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all students" ON public.students FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Table: schedule
CREATE POLICY "Teachers can manage their own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all schedules" ON public.schedule FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- Table: attendance_history
CREATE POLICY "Teachers can manage their own attendance history" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all attendance history" ON public.attendance_history FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;

-- Table: grade_history
CREATE POLICY "Teachers can manage their own grade history" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all grade history" ON public.grade_history FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;

-- Table: journals
CREATE POLICY "Teachers can manage their own journals" ON public.journals FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all journals" ON public.journals FOR ALL USING (public.get_my_role() = 'admin');
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;

-- Table: activation_codes
CREATE POLICY "Admins can manage activation codes" ON public.activation_codes FOR ALL USING (public.get_my_role() = 'admin');
CREATE POLICY "Authenticated users can read their own used code" ON public.activation_codes FOR SELECT USING (used_by = auth.uid());
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;


-- --- END OF SCRIPT ---
