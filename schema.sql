
-- ### PROFILES TABLE ###
-- This table stores public profile data for each user.
CREATE TABLE profiles (
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
  active_school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);
-- RLS policy for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);


-- ### SCHOOL_YEARS TABLE ###
-- This table stores academic years defined by teachers.
CREATE TABLE school_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(teacher_id, name)
);
-- RLS policy for school_years
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own school years" ON school_years
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### CLASSES TABLE ###
-- This table stores classes managed by teachers.
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, name)
);
-- RLS policy for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own classes" ON classes
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### SUBJECTS TABLE ###
-- This table stores subjects taught by teachers.
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kkm NUMERIC NOT NULL DEFAULT 75,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(teacher_id, name)
);
-- RLS policy for subjects
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own subjects" ON subjects
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### STUDENTS TABLE ###
-- This table stores student data.
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  nis TEXT NOT NULL,
  gender TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Batasan unik untuk NIS per guru akan ditangani oleh trigger di bawah
);
-- RLS policy for students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage students in their classes" ON students
    FOR ALL
    USING (
        (SELECT teacher_id FROM classes WHERE id = students.class_id) = auth.uid()
    );


-- ### SCHEDULE TABLE ###
-- This table stores the weekly teaching schedule.
CREATE TABLE schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS policy for schedule
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own schedule" ON schedule
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### ATTENDANCE_HISTORY TABLE ###
-- This table stores historical attendance records.
CREATE TABLE attendance_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
  meeting_number INT,
  records JSONB NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, class_id, subject_id, meeting_number)
);
-- RLS policy for attendance_history
ALTER TABLE attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own attendance history" ON attendance_history
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### GRADE_HISTORY TABLE ###
-- This table stores historical grade records.
CREATE TABLE grade_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
  assessment_type TEXT NOT NULL,
  records JSONB NOT NULL,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, subject_id, assessment_type)
);
-- RLS policy for grade_history
ALTER TABLE grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own grade history" ON grade_history
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### JOURNALS TABLE ###
-- This table stores teaching journal entries.
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
  meeting_number INT,
  learning_objectives TEXT NOT NULL,
  learning_activities TEXT NOT NULL,
  assessment TEXT,
  reflection TEXT,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS policy for journals
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journals" ON journals
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### AGENDAS TABLE ###
-- This table stores personal teacher agendas.
CREATE TABLE agendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    tag TEXT,
    color TEXT,
    start_time TIME,
    end_time TIME,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS policy for agendas
ALTER TABLE agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own agendas" ON agendas
    FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);


-- ### ACTIVATION_CODES TABLE ###
-- This table stores activation codes for Pro accounts.
CREATE TABLE activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- RLS policy for activation_codes
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
-- Admin can do anything
CREATE POLICY "Admin full access" ON activation_codes FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
-- All users can view, but only for security definer functions
CREATE POLICY "All users can view" ON activation_codes FOR SELECT USING (true);


-- ### DATABASE FUNCTIONS AND TRIGGERS ###

-- Function to create a public profile when a new user signs up in auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, account_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher', -- Default role
    'Free'     -- Default account status
  );
  RETURN new;
END;
$$;
-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Function to delete a user profile when the user is deleted from auth.
CREATE OR REPLACE FUNCTION public.handle_delete_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE from public.profiles where id = old.id;
    RETURN old;
END;
$$;
-- Trigger to call the function
CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_delete_user();


-- Function for account activation
CREATE OR REPLACE FUNCTION activate_account_with_code(activation_code_to_use TEXT, user_id_to_activate UUID, user_email_to_set TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  code_id UUID;
BEGIN
  -- Find the code and lock the row for update
  SELECT id INTO code_id FROM public.activation_codes WHERE code = activation_code_to_use AND is_used = false FOR UPDATE;

  -- If code is not found or already used, raise an exception
  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- Update the activation code
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id_to_activate,
    used_at = NOW()
  WHERE id = code_id;

  -- Update the user's profile
  UPDATE public.profiles
  SET 
    account_status = 'Pro',
    email = user_email_to_set -- Also update email for consistency
  WHERE id = user_id_to_activate;
END;
$$;


-- Function to check for unique NIS per teacher
CREATE OR REPLACE FUNCTION check_unique_nis_per_teacher()
RETURNS TRIGGER AS $$
DECLARE
    v_teacher_id UUID;
    v_count INT;
BEGIN
    -- Get the teacher_id from the associated class
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = NEW.class_id;

    -- If it's an UPDATE, we must exclude the current row from the check
    IF TG_OP = 'UPDATE' THEN
        SELECT COUNT(*) INTO v_count
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = NEW.nis AND s.id != NEW.id;
    ELSE -- For INSERT
        SELECT COUNT(*) INTO v_count
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = NEW.nis;
    END IF;

    -- If a student with the same NIS is found for the same teacher, raise an error
    IF v_count > 0 THEN
        RAISE EXCEPTION 'NIS "%" sudah terdaftar untuk guru ini.', NEW.nis;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to enforce the unique NIS check
CREATE TRIGGER before_student_insert_update
BEFORE INSERT OR UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION check_unique_nis_per_teacher();
