-- ### SKRIP MIGRASI DATABASE (AMAN UNTUK DATA YANG SUDAH ADA) ###
-- Tujuan: Memperbaiki fungsi dan RLS Policies tanpa menghapus data.

-- Langkah 1: Hapus trigger dan fungsi lama yang menyebabkan rekursi
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Langkah 2: Buat ulang fungsi handle_new_user yang benar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'teacher');
  RETURN new;
END;
$$;

-- Langkah 3: Sambungkan kembali trigger ke fungsi yang baru
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Langkah 4: Buat fungsi helper untuk memeriksa peran dengan aman
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Langkah 5: Hapus SEMUA RLS policies lama dari semua tabel untuk memastikan kebersihan
-- (Aman dijalankan, hanya menghapus aturan, bukan data)
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";
DROP POLICY IF EXISTS "Admins can manage all profiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can read all profiles" ON "public"."profiles"; -- Menghapus policy yang menyebabkan error

DROP POLICY IF EXISTS "Teachers can view their own classes" ON "public"."classes";
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON "public"."classes";
DROP POLICY IF EXISTS "Teachers can update their own classes" ON "public"."classes";
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON "public"."classes";
DROP POLICY IF EXISTS "Admins can manage all classes" ON "public"."classes";

DROP POLICY IF EXISTS "Teachers can view their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Teachers can insert their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Teachers can update their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Teachers can delete their own subjects" ON "public"."subjects";
DROP POLICY IF EXISTS "Admins can manage all subjects" ON "public"."subjects";

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON "public"."students";
DROP POLICY IF EXISTS "Teachers can insert students into their classes" ON "public"."students";
DROP POLICY IF EXISTS "Teachers can update students in their classes" ON "public"."students";
DROP POLICY IF EXISTS "Teachers can delete students from their classes" ON "public"."students";
DROP POLICY IF EXISTS "Admins can manage all students" ON "public"."students";

DROP POLICY IF EXISTS "Teachers can manage their own schedule" ON "public"."schedule";
DROP POLICY IF EXISTS "Admins can manage all schedules" ON "public"."schedule";

DROP POLICY IF EXISTS "Teachers can manage their own attendance" ON "public"."attendance_history";
DROP POLICY IF EXISTS "Admins can manage all attendance" ON "public"."attendance_history";

DROP POLICY IF EXISTS "Teachers can manage their own grades" ON "public"."grade_history";
DROP POLICY IF EXISTS "Admins can manage all grades" ON "public"."grade_history";

DROP POLICY IF EXISTS "Teachers can manage their own journals" ON "public"."journals";
DROP POLICY IF EXISTS "Admins can manage all journals" ON "public"."journals";

DROP POLICY IF EXISTS "Enable read access for admins" ON "public"."activation_codes";
DROP POLICY IF EXISTS "Admins can manage activation codes" ON "public"."activation_codes";
DROP POLICY IF EXISTS "Authenticated users can read codes" ON "public"."activation_codes";

-- Langkah 6: Buat ulang SEMUA RLS policies dengan benar

-- Table: profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all authenticated users" ON "public"."profiles" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can manage all profiles" ON "public"."profiles" FOR ALL USING (public.get_my_role() = 'admin') WITH CHECK (public.get_my_role() = 'admin');

-- Table: classes
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own classes" ON "public"."classes" FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert their own classes" ON "public"."classes" FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own classes" ON "public"."classes" FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their own classes" ON "public"."classes" FOR DELETE USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all classes" ON "public"."classes" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own subjects" ON "public"."subjects" FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can insert their own subjects" ON "public"."subjects" FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Teachers can update their own subjects" ON "public"."subjects" FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Teachers can delete their own subjects" ON "public"."subjects" FOR DELETE USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all subjects" ON "public"."subjects" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view students in their classes" ON "public"."students" FOR SELECT USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can insert students into their classes" ON "public"."students" FOR INSERT WITH CHECK (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can update students in their classes" ON "public"."students" FOR UPDATE USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Teachers can delete students from their classes" ON "public"."students" FOR DELETE USING (class_id IN (SELECT id FROM classes WHERE teacher_id = auth.uid()));
CREATE POLICY "Admins can manage all students" ON "public"."students" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: schedule
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own schedule" ON "public"."schedule" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all schedules" ON "public"."schedule" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: attendance_history
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own attendance" ON "public"."attendance_history" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all attendance" ON "public"."attendance_history" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: grade_history
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own grades" ON "public"."grade_history" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all grades" ON "public"."grade_history" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: journals
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own journals" ON "public"."journals" FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "Admins can manage all journals" ON "public"."journals" FOR ALL USING (public.get_my_role() = 'admin');

-- Table: activation_codes
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read codes" ON "public"."activation_codes" FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage activation codes" ON "public"."activation_codes" FOR ALL USING (public.get_my_role() = 'admin');

