-- Initial migration script to set up the database schema

-- Create Profiles Table
-- This table will store user profile information.
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
    account_status TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'teacher',
    active_school_year_id UUID
);
COMMENT ON TABLE public.profiles IS 'Stores public-facing profile information for each user.';

-- Create Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.classes IS 'Stores information about different classes taught by teachers.';

-- Create Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm NUMERIC,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.subjects IS 'Stores information about subjects.';

-- Create School Years Table
CREATE TABLE IF NOT EXISTS public.school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.school_years IS 'Stores academic years for data organization.';

-- Add foreign key to profiles table for active school year
ALTER TABLE public.profiles ADD CONSTRAINT fk_active_school_year
   FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;

-- Create Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT,
    nisn TEXT,
    gender TEXT,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.students IS 'Stores information about individual students.';

-- Create Schedule Table
CREATE TABLE IF NOT EXISTS public.schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.schedule IS 'Stores the weekly teaching schedule.';

-- Create Attendance History Table
CREATE TABLE IF NOT EXISTS public.attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    meeting_number INTEGER,
    records JSONB, -- Example: [{"student_id": "uuid", "status": "Hadir"}, ...]
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.attendance_history IS 'Records historical attendance data.';

-- Create Grade History Table
CREATE TABLE IF NOT EXISTS public.grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    assessment_type TEXT,
    records JSONB, -- Example: [{"student_id": "uuid", "score": 85}, ...]
    teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
);
COMMENT ON TABLE public.grade_history IS 'Records historical grade data.';

-- Create Journals Table
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
COMMENT ON TABLE public.journals IS 'Stores teaching journal entries.';

-- Create Activation Codes Table
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID REFERENCES public.profiles(id),
    used_at TIMESTAMPTZ
);
COMMENT ON TABLE public.activation_codes IS 'Stores activation codes for Pro accounts.';

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
-- Users can see their own profile
CREATE POLICY "Allow individual user access to their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "Allow admin access to all profiles"
    ON public.profiles FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
    
-- Users can update their own profile
CREATE POLICY "Allow individual user to update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Allow admin to update any profile"
    ON public.profiles FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );


-- Policies for data tables (owned by teacher)
CREATE POLICY "Allow full access to own data"
    ON public.classes FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Allow full access to own data"
    ON public.subjects FOR ALL
    USING (auth.uid() = teacher_id);
    
CREATE POLICY "Allow full access to own data"
    ON public.school_years FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Allow teacher to manage students in their classes"
    ON public.students FOR ALL
    USING (
        (SELECT teacher_id FROM public.classes WHERE id = class_id) = auth.uid()
    );

CREATE POLICY "Allow full access to own data"
    ON public.schedule FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Allow full access to own data"
    ON public.attendance_history FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Allow full access to own data"
    ON public.grade_history FOR ALL
    USING (auth.uid() = teacher_id);

CREATE POLICY "Allow full access to own data"
    ON public.journals FOR ALL
    USING (auth.uid() = teacher_id);


-- Policies for activation_codes table
-- Admins can manage all codes
CREATE POLICY "Allow admin full access to activation codes"
    ON public.activation_codes FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );
    
-- Any authenticated user can read codes (to check validity)
CREATE POLICY "Allow authenticated users to read activation codes"
    ON public.activation_codes FOR SELECT
    USING (auth.role() = 'authenticated');


-- Function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    'teacher' -- Default role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a profile is deleted
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();


-- RPC for activating an account
CREATE OR REPLACE FUNCTION activate_account_with_code(activation_code_to_use TEXT, user_id_to_activate UUID, user_email_to_set TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  code_id UUID;
  is_code_used BOOLEAN;
BEGIN
  -- Check if the code exists and is not used
  SELECT id, is_used INTO code_id, is_code_used
  FROM public.activation_codes
  WHERE code = activation_code_to_use;

  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  IF is_code_used THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update the activation code
  UPDATE public.activation_codes
  SET 
    is_used = TRUE,
    used_by = user_id_to_activate,
    used_at = NOW()
  WHERE id = code_id;

  -- Update the user's profile
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

END;
$$;


-- Set up Storage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Policies for Storage
-- Allow anyone to view images
CREATE POLICY "Allow public read access to profile images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profile-images' );

-- Allow authenticated users to upload their own images
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'profile-images' AND auth.role() = 'authenticated' );

-- Allow users to update their own images
CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'profile-images' AND auth.uid() = (storage.foldername(name))[1]::uuid );

    