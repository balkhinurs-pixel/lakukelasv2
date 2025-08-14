-- Tipe ENUM untuk jenis kelamin dan status akun
CREATE TYPE gender_enum AS ENUM ('Laki-laki', 'Perempuan');
CREATE TYPE account_status_enum AS ENUM ('Free', 'Pro');
CREATE TYPE user_role_enum AS ENUM ('teacher', 'admin');
CREATE TYPE student_status_enum AS ENUM ('active', 'graduated');

-- Tabel untuk menyimpan data profil pengguna (guru & admin)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name TEXT NOT NULL,
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
  account_status account_status_enum NOT NULL DEFAULT 'Free',
  role user_role_enum NOT NULL DEFAULT 'teacher',
  active_school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Tabel untuk menyimpan tahun ajaran
CREATE TABLE public.school_years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk kode aktivasi
CREATE TABLE public.activation_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk kelas
CREATE TABLE public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk mata pelajaran
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  kkm INT NOT NULL DEFAULT 75,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk data siswa
CREATE TABLE public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nis TEXT NOT NULL,
  gender gender_enum NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status student_status_enum NOT NULL DEFAULT 'active'
);
CREATE UNIQUE INDEX idx_unique_nis_per_teacher ON public.students (nis, (SELECT teacher_id FROM classes WHERE id = class_id));


-- Tabel untuk jadwal pelajaran
CREATE TABLE public.schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk riwayat presensi
CREATE TABLE public.attendance_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    meeting_number INT,
    records JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk riwayat nilai
CREATE TABLE public.grade_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    assessment_type TEXT NOT NULL,
    date DATE NOT NULL,
    records JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk jurnal mengajar
CREATE TABLE public.journals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    school_year_id UUID REFERENCES public.school_years(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    meeting_number INT,
    learning_objectives TEXT NOT NULL,
    learning_activities TEXT NOT NULL,
    assessment TEXT,
    reflection TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabel untuk agenda pribadi
CREATE TABLE public.agendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tag TEXT,
  color TEXT,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own school years" ON public.school_years FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own classes" ON public.classes FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own subjects" ON public.subjects FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can view their own students" ON public.students FOR SELECT USING (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));
CREATE POLICY "Teachers can insert students into their own classes" ON public.students FOR INSERT WITH CHECK (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));
CREATE POLICY "Teachers can update their own students" ON public.students FOR UPDATE USING (auth.uid() = (SELECT teacher_id FROM classes WHERE id = students.class_id));


ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own schedule" ON public.schedule FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own attendance history" ON public.attendance_history FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own grade history" ON public.grade_history FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own journals" ON public.journals FOR ALL USING (auth.uid() = teacher_id);

ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage their own agendas" ON public.agendas FOR ALL USING (auth.uid() = teacher_id);

-- Admins can do anything
CREATE POLICY "Admins can do anything" ON public.activation_codes FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can see all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.is_admin());


-- Function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, account_status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher', -- default role
    'Free'     -- default status
  );

  -- Create a default school year for the new user
  INSERT INTO public.school_years (name, teacher_id)
  VALUES ('2024/2025 - Semester Ganjil', new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  
-- Function for account activation
CREATE OR REPLACE FUNCTION public.activate_account_with_code(activation_code_to_use TEXT, user_id_to_activate UUID, user_email_to_set TEXT)
RETURNS void AS $$
DECLARE
  code_id UUID;
  is_code_used BOOLEAN;
BEGIN
  -- Check if the code exists and is not used, and get its ID
  SELECT id, is_used INTO code_id, is_code_used
  FROM public.activation_codes
  WHERE code = activation_code_to_use;

  -- Raise exceptions if code is not valid
  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found';
  END IF;

  IF is_code_used THEN
    RAISE EXCEPTION 'Code already used';
  END IF;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

  -- Update the activation_codes table to mark as used
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  WHERE id = code_id;

END;
$$ LANGUAGE plpgsql;

-- Function and trigger to handle user deletion
CREATE OR REPLACE FUNCTION public.on_delete_user()
RETURNS TRIGGER AS $$
BEGIN
    -- This function doesn't need to do anything with the profiles table
    -- because the FOREIGN KEY with ON DELETE CASCADE will handle it automatically.
    -- However, we still need to delete the user from auth.users
    -- This part must be done from a server-side client with the service_role key.
    -- Example from a backend: await supabase.auth.admin.deleteUser(old.id)
    RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.on_delete_user();

-- Function to add student with teacher check
CREATE OR REPLACE FUNCTION public.add_student_with_teacher_check(p_class_id UUID, p_nis TEXT, p_name TEXT, p_gender gender_enum)
RETURNS void AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id for the given class_id
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    IF EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
    ) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student
    INSERT INTO public.students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$ LANGUAGE plpgsql;

-- v_attendance_history: A view to simplify fetching attendance history with related data.
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT 
  ah.id,
  ah.teacher_id,
  ah.class_id,
  ah.subject_id,
  ah.school_year_id,
  ah.date,
  date_part('month'::text, ah.date) AS month,
  ah.meeting_number,
  ah.records,
  c.name AS class_name,
  s.name AS subject_name,
  (SELECT jsonb_object_agg(st.id, st.name)
   FROM jsonb_populate_recordset(null::record, ah.records) AS r(student_id uuid, status text)
   JOIN students st ON st.id = r.student_id) AS student_names
FROM 
  attendance_history ah
JOIN 
  classes c ON ah.class_id = c.id
JOIN 
  subjects s ON ah.subject_id = s.id;

-- v_grade_history: A view to simplify fetching grade history with related data.
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT 
  gh.id,
  gh.teacher_id,
  gh.class_id,
  gh.subject_id,
  gh.school_year_id,
  gh.date,
  date_part('month'::text, gh.date) AS month,
  gh.assessment_type,
  gh.records,
  c.name AS class_name,
  s.name AS subject_name,
  s.kkm AS subject_kkm,
  (SELECT jsonb_object_agg(st.id, st.name)
   FROM jsonb_populate_recordset(null::record, gh.records) AS r(student_id uuid, score numeric)
   JOIN students st ON st.id = r.student_id) AS student_names
FROM 
  grade_history gh
JOIN 
  classes c ON gh.class_id = c.id
JOIN 
  subjects s ON gh.subject_id = s.id;
