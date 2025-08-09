-- Initial schema for a new Supabase project for Lakukelas

-- 1. Create Profiles Table
-- This table will store user data that is safe to be publicly accessible.
-- It is linked to the auth.users table via a one-to-one relationship.
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    full_name text NOT NULL,
    avatar_url text NULL,
    nip text NULL,
    pangkat text NULL,
    jabatan text NULL,
    school_name text NULL,
    school_address text NULL,
    headmaster_name text NULL,
    headmaster_nip text NULL,
    school_logo_url text NULL,
    account_status text NOT NULL DEFAULT 'Free'::text,
    role text NOT NULL DEFAULT 'teacher'::text,
    active_school_year_id uuid NULL,
    email text NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'teacher'::text]))),
    CONSTRAINT profiles_account_status_check CHECK ((account_status = ANY (ARRAY['Free'::text, 'Pro'::text])))
);
-- Add comments for clarity
COMMENT ON TABLE public.profiles IS 'Stores public-facing user profile information.';
-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Policies for Profiles: Users can see their own profile and update it.
CREATE POLICY "Enable read access for user on their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Enable update access for user on their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);


-- 2. Create School Years Table
CREATE TABLE public.school_years (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT school_years_pkey PRIMARY KEY (id),
    CONSTRAINT school_years_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Add foreign key constraint from profiles to school_years
ALTER TABLE public.profiles ADD CONSTRAINT profiles_active_school_year_id_fkey FOREIGN KEY (active_school_year_id) REFERENCES public.school_years(id) ON DELETE SET NULL;
-- Enable RLS
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
-- Policies for School Years
CREATE POLICY "Enable read access for assigned teacher" ON public.school_years FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.school_years FOR INSERT WITH CHECK (auth.uid() = teacher_id);


-- 3. Create Classes Table
CREATE TABLE public.classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT classes_pkey PRIMARY KEY (id),
    CONSTRAINT classes_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
-- Policies for Classes
CREATE POLICY "Enable read access for assigned teacher" ON public.classes FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.classes FOR INSERT WITH CHECK (auth.uid() = teacher_id);


-- 4. Create Subjects Table
CREATE TABLE public.subjects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    kkm integer NOT NULL DEFAULT 75,
    teacher_id uuid NOT NULL,
    CONSTRAINT subjects_pkey PRIMARY KEY (id),
    CONSTRAINT subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
-- Policies for Subjects
CREATE POLICY "Enable read access for assigned teacher" ON public.subjects FOR SELECT USING (auth.uid() = teacher_id);
CREATE POLICY "Enable insert for assigned teacher" ON public.subjects FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "Enable update for assigned teacher" ON public.subjects FOR UPDATE USING (auth.uid() = teacher_id);

-- 5. Create Students Table
CREATE TABLE public.students (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    name text NOT NULL,
    nis text NOT NULL,
    nisn text NOT NULL,
    gender text NOT NULL,
    class_id uuid NOT NULL,
    CONSTRAINT students_pkey PRIMARY KEY (id),
    CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT students_gender_check CHECK ((gender = ANY (ARRAY['Laki-laki'::text, 'Perempuan'::text])))
);
-- Join with classes to check teacher_id for policies
CREATE POLICY "Enable read access for assigned teacher" ON public.students FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
    )
);
CREATE POLICY "Enable insert for assigned teacher" ON public.students FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM classes
        WHERE classes.id = students.class_id AND classes.teacher_id = auth.uid()
    )
);
-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;


-- 6. Create Schedule Table
CREATE TABLE public.schedule (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    day text NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    subject_id uuid NOT NULL,
    class_id uuid NOT NULL,
    teacher_id uuid NOT NULL,
    CONSTRAINT schedule_pkey PRIMARY KEY (id),
    CONSTRAINT schedule_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT schedule_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT schedule_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT schedule_day_check CHECK ((day = ANY (ARRAY['Senin'::text, 'Selasa'::text, 'Rabu'::text, 'Kamis'::text, 'Jumat'::text, 'Sabtu'::text, 'Minggu'::text])))
);
-- Enable RLS
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
-- Policies for Schedule
CREATE POLICY "Enable CUD for assigned teacher" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

-- 7. Create Attendance History Table
CREATE TABLE public.attendance_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    date date NOT NULL,
    meeting_number integer NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    CONSTRAINT attendance_history_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT attendance_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
-- Policies for Attendance History
CREATE POLICY "Enable CUD for assigned teacher" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);


-- 8. Create Grade History Table
CREATE TABLE public.grade_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    date date NOT NULL,
    assessment_type text NOT NULL,
    records jsonb NOT NULL,
    teacher_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    CONSTRAINT grade_history_pkey PRIMARY KEY (id),
    CONSTRAINT grade_history_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT grade_history_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT grade_history_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
-- Policies for Grade History
CREATE POLICY "Enable CUD for assigned teacher" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);


-- 9. Create Journals Table
CREATE TABLE public.journals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    date date NOT NULL,
    meeting_number integer,
    learning_objectives text NOT NULL,
    learning_activities text NOT NULL,
    assessment text,
    reflection text,
    teacher_id uuid NOT NULL,
    class_id uuid NOT NULL,
    subject_id uuid NOT NULL,
    CONSTRAINT journals_pkey PRIMARY KEY (id),
    CONSTRAINT journals_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE,
    CONSTRAINT journals_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE CASCADE,
    CONSTRAINT journals_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
-- Enable RLS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
-- Policies for Journals
CREATE POLICY "Enable CUD for assigned teacher" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

-- 10. Create Activation Codes Table
CREATE TABLE public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid NULL,
    used_at timestamp with time zone NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    used_by_email text NULL,
    CONSTRAINT activation_codes_pkey PRIMARY KEY (id),
    CONSTRAINT activation_codes_code_key UNIQUE (code),
    CONSTRAINT activation_codes_used_by_fkey FOREIGN KEY (used_by) REFERENCES auth.users(id) ON DELETE SET NULL
);
-- Enable RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
-- Policies for Activation Codes: Only admins can access.
CREATE POLICY "Enable read access for admin" ON public.activation_codes FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Enable insert for admin" ON public.activation_codes FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');


-- 11. Create a function to be called by a webhook when a new user signs up.
-- This function inserts a new row into the public.profiles table.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 12. Create a secure function for account activation, to be called via RPC.
CREATE OR REPLACE FUNCTION public.activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void AS $$
DECLARE
  code_id UUID;
BEGIN
    -- Check for the code's existence and get its ID
    SELECT id INTO code_id FROM public.activation_codes
    WHERE code = activation_code_to_use AND is_used = false;

    -- If no code was found or it's already used, raise an exception
    IF code_id IS NULL THEN
        RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
    END IF;

    -- Update the activation code table
    UPDATE public.activation_codes
    SET
        is_used = true,
        used_by = user_id_to_activate,
        used_at = now(),
        used_by_email = user_email_to_set
    WHERE id = code_id;

    -- Update the user's profile status
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users so they can call this from server actions.
GRANT EXECUTE ON FUNCTION public.activate_account_with_code(TEXT, UUID, TEXT) TO authenticated;
