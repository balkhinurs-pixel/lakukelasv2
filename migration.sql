
-- This is a migration script. You can use it to apply changes to your database.
-- It's recommended to keep this file in sync with your schema.sql file.

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    full_name TEXT,
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
    account_status TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'teacher',
    active_school_year_id UUID
);

-- Create classes table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    kkm NUMERIC NOT NULL DEFAULT 75,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create school_years table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Add foreign key from profiles to school_years
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_active_school_year_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Create students table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nis TEXT,
    nisn TEXT,
    gender TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);

-- Create schedule table
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create journals table
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create attendance_history table
CREATE TABLE IF NOT EXISTS public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create grade_history table
CREATE TABLE IF NOT EXISTS public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create activation_codes table
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    used_by_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create settings table (if needed, or use profiles table)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB
);

-- RLS POLICIES
-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');


-- Create policies for classes
DROP POLICY IF EXISTS "Teachers can manage their own classes" ON public.classes;
CREATE POLICY "Teachers can manage their own classes" ON public.classes
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can manage all classes" ON public.classes;
CREATE POLICY "Admins can manage all classes" ON public.classes
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Create policies for subjects
DROP POLICY IF EXISTS "Teachers can manage their own subjects" ON public.subjects;
CREATE POLICY "Teachers can manage their own subjects" ON public.subjects
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can manage all subjects" ON public.subjects;
CREATE POLICY "Admins can manage all subjects" ON public.subjects
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');


-- Create policies for school_years
DROP POLICY IF EXISTS "Teachers can manage their own school_years" ON public.school_years;
CREATE POLICY "Teachers can manage their own school_years" ON public.school_years
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can manage all school_years" ON public.school_years;
CREATE POLICY "Admins can manage all school_years" ON public.school_years
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');


-- Create policies for students
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
CREATE POLICY "Teachers can view students in their classes" ON public.students
  FOR SELECT USING (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );
  
DROP POLICY IF EXISTS "Teachers can insert students into their classes" ON public.students;
CREATE POLICY "Teachers can insert students into their classes" ON public.students
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT id FROM public.classes WHERE teacher_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage all students" ON public.students;
CREATE POLICY "Admins can manage all students" ON public.students
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

-- Create policies for schedule
DROP POLICY IF EXISTS "Teachers can manage their own schedule" ON public.schedule;
CREATE POLICY "Teachers can manage their own schedule" ON public.schedule
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all schedules" ON public.schedule;
CREATE POLICY "Admins can view all schedules" ON public.schedule
  FOR SELECT USING (get_my_role() = 'admin');


-- Create policies for journals
DROP POLICY IF EXISTS "Teachers can manage their own journals" ON public.journals;
CREATE POLICY "Teachers can manage their own journals" ON public.journals
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all journals" ON public.journals;
CREATE POLICY "Admins can view all journals" ON public.journals
  FOR SELECT USING (get_my_role() = 'admin');


-- Create policies for attendance_history
DROP POLICY IF EXISTS "Teachers can manage their own attendance history" ON public.attendance_history;
CREATE POLICY "Teachers can manage their own attendance history" ON public.attendance_history
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all attendance history" ON public.attendance_history;
CREATE POLICY "Admins can view all attendance history" ON public.attendance_history
  FOR SELECT USING (get_my_role() = 'admin');


-- Create policies for grade_history
DROP POLICY IF EXISTS "Teachers can manage their own grade history" ON public.grade_history;
CREATE POLICY "Teachers can manage their own grade history" ON public.grade_history
  FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "Admins can view all grade history" ON public.grade_history;
CREATE POLICY "Admins can view all grade history" ON public.grade_history
  FOR SELECT USING (get_my_role() = 'admin');


-- Create policies for activation_codes
DROP POLICY IF EXISTS "Admins can manage activation codes" ON public.activation_codes;
CREATE POLICY "Admins can manage activation codes" ON public.activation_codes
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');

DROP POLICY IF EXISTS "Users can read their own used code" ON public.activation_codes;
CREATE POLICY "Users can read their own used code" ON public.activation_codes
  FOR SELECT USING (auth.uid() = used_by);


-- Create policies for settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.settings;
CREATE POLICY "Users can manage their own settings" ON public.settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
DROP POLICY IF EXISTS "Admins can manage all settings" ON public.settings;
CREATE POLICY "Admins can manage all settings" ON public.settings
  FOR ALL USING (get_my_role() = 'admin') WITH CHECK (get_my_role() = 'admin');
  
-- Create a trigger to automatically create a profile for a new user
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

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to delete a profile when a user is deleted
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = old.id;
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- Create the trigger for user deletion
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();

-- Function to get the role of the current user
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
DECLARE
  my_role TEXT;
BEGIN
  SELECT role INTO my_role FROM public.profiles WHERE id = auth.uid();
  RETURN my_role;
END;
$$ LANGUAGE plpgsql;

-- Function to activate an account with a code
CREATE OR REPLACE FUNCTION activate_account_with_code(activation_code_to_use TEXT, user_id_to_activate UUID, user_email_to_set TEXT)
RETURNS void AS $$
DECLARE
  code_id UUID;
  code_is_used BOOLEAN;
BEGIN
  -- Check if the code exists and is not used
  SELECT id, is_used INTO code_id, code_is_used
  FROM public.activation_codes
  WHERE code = activation_code_to_use;

  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  IF code_is_used THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

  -- Update the activation_codes table
  UPDATE public.activation_codes
  SET 
    is_used = TRUE,
    used_by = user_id_to_activate,
    used_at = now(),
    used_by_email = user_email_to_set
  WHERE id = code_id;
END;
$$ LANGUAGE plpgsql;


-- Set up storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "Allow users to read their own folder" ON storage.objects;
CREATE POLICY "Allow users to read their own folder"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to update their own images" ON storage.objects;
CREATE POLICY "Allow users to update their own images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Allow users to delete their own images" ON storage.objects;
CREATE POLICY "Allow users to delete their own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

    