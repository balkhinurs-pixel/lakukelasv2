-- ### PROFILES TABLE ###
-- This table is used to store user data. It is linked to the auth.users table.
CREATE TABLE
  profiles (
    id UUID NOT NULL PRIMARY KEY, -- links to auth.users table
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    full_name TEXT,
    avatar_url TEXT,
    -- Teacher specific data
    nip TEXT,
    pangkat TEXT,
    jabatan TEXT,
    -- School data
    school_name TEXT,
    school_address TEXT,
    headmaster_name TEXT,
    headmaster_nip TEXT,
    school_logo_url TEXT,
    -- App specific data
    account_status TEXT NOT NULL DEFAULT 'Free',
    role TEXT NOT NULL DEFAULT 'teacher',
    email TEXT,
    active_school_year_id UUID,
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user () RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
CREATE TRIGGER
  on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE handle_new_user ();

-- Function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a user is deleted
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_user_delete();

-- ### TEACHER-SPECIFIC TABLES ###

-- Table for School Years
CREATE TABLE
  school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL,
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own school years." ON school_years FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Users can only insert their own school years." ON school_years FOR INSERT WITH CHECK (auth.uid() = teacher_id);

-- Add foreign key to profiles table
ALTER TABLE profiles
ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES school_years (id) ON DELETE SET NULL;


-- Table for Classes
CREATE TABLE
  classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL,
    CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own classes." ON classes FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Users can only insert their own classes." ON classes FOR INSERT WITH CHECK (auth.uid() = teacher_id);


-- Table for Subjects
CREATE TABLE
  subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    kkm NUMERIC NOT NULL DEFAULT 75,
    teacher_id UUID NOT NULL,
    CONSTRAINT subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own subjects." ON subjects FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Users can only insert their own subjects." ON subjects FOR INSERT WITH CHECK (auth.uid() = teacher_id);


-- Table for Students
CREATE TABLE
  students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT NOT NULL,
    nis TEXT NOT NULL,
    nisn TEXT,
    gender TEXT NOT NULL,
    class_id UUID NOT NULL,
    CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT students_nis_key UNIQUE (nis)
  );
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- To access students, users must own the class they belong to.
CREATE POLICY "Users can manage students in their own classes." ON students
  FOR ALL USING (
    (
      SELECT
        auth.uid ()
      FROM
        classes
      WHERE
        classes.id = students.class_id
    ) = auth.uid ()
  )
WITH
  CHECK (
    (
      SELECT
        auth.uid ()
      FROM
        classes
      WHERE
        classes.id = students.class_id
    ) = auth.uid ()
  );


-- Table for Schedule
CREATE TABLE
  schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    day TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own schedule." ON schedule FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Users can insert their own schedule." ON schedule FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Users can update their own schedule." ON schedule FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "Users can delete their own schedule." ON schedule FOR DELETE USING (auth.uid() = teacher_id);


-- Table for Attendance History
CREATE TABLE
  attendance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    school_year_id UUID,
    meeting_number INT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL,
    CONSTRAINT attendance_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE SET NULL
  );
ALTER TABLE attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own attendance history." ON attendance_history FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- Table for Grade History
CREATE TABLE
  grade_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    school_year_id UUID,
    assessment_type TEXT NOT NULL,
    records JSONB NOT NULL,
    teacher_id UUID NOT NULL,
    CONSTRAINT grade_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT grade_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT grade_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
     CONSTRAINT grade_history_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE SET NULL
  );
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own grade history." ON grade_history FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- Table for Journals
CREATE TABLE
  journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    date DATE NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    school_year_id UUID,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    teacher_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT journals_class_id_fkey FOREIGN KEY (class_id) REFERENCES classes (id) ON DELETE CASCADE,
    CONSTRAINT journals_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
    CONSTRAINT journals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT journals_school_year_id_fkey FOREIGN KEY (school_year_id) REFERENCES school_years(id) ON DELETE SET NULL
  );
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journals." ON journals FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

-- Table for Personal Agendas
CREATE TABLE
  agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID NOT NULL,
    CONSTRAINT agendas_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users (id) ON DELETE CASCADE
  );
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agendas." ON agendas FOR ALL USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);


-- ### ACTIVATION & ADMIN TABLES ###

-- Table for Activation Codes
CREATE TABLE
  activation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    code TEXT NOT NULL UNIQUE,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_by UUID,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users (id) ON DELETE SET NULL
  );

-- Function to activate an account
CREATE OR REPLACE FUNCTION activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
) RETURNS VOID AS $$
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

    -- Update the user's profile to Pro
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;
    
    -- Also update the email in the profiles table for admin reference
    UPDATE public.profiles
    SET email = user_email_to_set
    WHERE id = user_id_to_activate;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ### STORAGE ###
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('profile-images', 'profile-images', true, 1048576, '{"image/jpeg", "image/png", "image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- Policy for profile images
CREATE POLICY "Users can view their own profile images" ON storage.objects
  FOR SELECT USING ( bucket_id = 'profile-images' );
CREATE POLICY "Users can upload their own profile images" ON storage.objects
  FOR INSERT WITH CHECK ( bucket_id = 'profile-images' AND auth.uid() = (storage.foldername(name))[1]::uuid );
CREATE POLICY "Users can update their own profile images" ON storage.objects
  FOR UPDATE WITH CHECK ( bucket_id = 'profile-images' AND auth.uid() = (storage.foldername(name))[1]::uuid );
