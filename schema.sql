
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

-- Grant usage on schema to required roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant permissions on tables to required roles
GRANT ALL ON TABLE public.profiles TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.classes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.subjects TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.school_years TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.students TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.schedule TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.journals TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.attendance_history TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.grade_history TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.activation_codes TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.settings TO postgres, anon, authenticated, service_role;

-- Grant permissions on sequences to required roles
GRANT ALL ON SEQUENCE public.profiles_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.classes_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.subjects_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.school_years_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.students_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.schedule_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.journals_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.attendance_history_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.grade_history_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.activation_codes_id_seq TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.settings_id_seq TO postgres, anon, authenticated, service_role;

    