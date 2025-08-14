-- RLS (Row Level Security) Policies
-- These policies ensure that users can only access their own data.

-- Enable RLS for all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;


-- PROFILES
-- Users can see their own profile.
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile.
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);


-- CLASSES
-- Users can view their own classes.
CREATE POLICY "Users can view their own classes"
ON public.classes FOR SELECT
USING (auth.uid() = teacher_id);

-- Users can insert new classes for themselves.
CREATE POLICY "Users can insert their own classes"
ON public.classes FOR INSERT
WITH CHECK (auth.uid() = teacher_id);


-- SUBJECTS
-- Users can view their own subjects.
CREATE POLICY "Users can view their own subjects"
ON public.subjects FOR SELECT
USING (auth.uid() = teacher_id);

-- Users can insert new subjects for themselves.
CREATE POLICY "Users can insert their own subjects"
ON public.subjects FOR INSERT
WITH CHECK (auth.uid() = teacher_id);

-- Users can update their own subjects.
CREATE POLICY "Users can update their own subjects"
ON public.subjects FOR UPDATE
USING (auth.uid() = teacher_id);


-- STUDENTS
-- Users can view students in their own classes.
CREATE POLICY "Users can view students in their classes"
ON public.students FOR SELECT
USING (
  auth.uid() = (
    SELECT teacher_id FROM classes WHERE id = students.class_id
  )
);

-- Users can insert students into their own classes.
CREATE POLICY "Users can insert students into their classes"
ON public.students FOR INSERT
WITH CHECK (
  auth.uid() = (
    SELECT teacher_id FROM classes WHERE id = students.class_id
  )
);

-- Users can update students in their own classes.
CREATE POLICY "Teachers can update their own students"
ON public.students FOR UPDATE
USING (
  auth.uid() = (
    SELECT teacher_id FROM classes WHERE id = students.class_id
  )
);

-- SCHEDULE
-- Users can view, insert, update, and delete their own schedule entries.
CREATE POLICY "Users can manage their own schedule"
ON public.schedule FOR ALL
USING (auth.uid() = teacher_id);


-- ATTENDANCE HISTORY
-- Users can manage their own attendance records.
CREATE POLICY "Users can manage their own attendance history"
ON public.attendance_history FOR ALL
USING (auth.uid() = teacher_id);


-- GRADE HISTORY
-- Users can manage their own grade records.
CREATE POLICY "Users can manage their own grade history"
ON public.grade_history FOR ALL
USING (auth.uid() = teacher_id);


-- JOURNALS
-- Users can manage their own journal entries.
CREATE POLICY "Users can manage their own journals"
ON public.journals FOR ALL
USING (auth.uid() = teacher_id);

-- AGENDAS
-- Users can manage their own agenda entries.
CREATE POLICY "Users can manage their own agendas"
ON public.agendas FOR ALL
USING (auth.uid() = teacher_id);


-- SCHOOL YEARS
-- Users can manage their own school year entries.
CREATE POLICY "Users can manage their own school years"
ON public.school_years FOR ALL
USING (auth.uid() = teacher_id);

-- ACTIVATION CODES
-- Admin can manage all codes.
CREATE POLICY "Admin can manage all codes"
ON public.activation_codes FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
-- Users can view codes they have used.
CREATE POLICY "Users can view their used code"
ON public.activation_codes FOR SELECT
USING (auth.uid() = used_by);


--
-- Functions
--

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role, account_status)
  values (
      new.id, 
      new.raw_user_meta_data->>'full_name',
      new.email,
      new.raw_user_meta_data->>'avatar_url',
      'teacher', -- Default role for new users
      'Free'     -- Default account status for new users
  );
  return new;
end;
$$;

-- Trigger to call the function when a new user signs up
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to ensure a student's NIS is unique per teacher
CREATE OR REPLACE FUNCTION is_nis_unique_for_teacher(p_nis TEXT, p_teacher_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_unique BOOLEAN;
BEGIN
    SELECT NOT EXISTS (
        SELECT 1
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE s.nis = p_nis AND c.teacher_id = p_teacher_id
    ) INTO is_unique;
    
    RETURN is_unique;
END;
$$ LANGUAGE plpgsql;

-- Function to add a student, with a check for NIS uniqueness for the teacher
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id UUID,
    p_nis TEXT,
    p_name TEXT,
    p_gender TEXT
)
RETURNS void AS $$
DECLARE
    v_teacher_id UUID;
BEGIN
    -- Get the teacher_id from the class
    SELECT teacher_id INTO v_teacher_id FROM classes WHERE id = p_class_id;

    -- Check if the NIS is unique for this teacher
    IF NOT is_nis_unique_for_teacher(p_nis, v_teacher_id) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- Insert the new student
    INSERT INTO students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function for account activation
CREATE OR REPLACE FUNCTION activate_account_with_code(
    activation_code_to_use TEXT,
    user_id_to_activate UUID,
    user_email_to_set TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    code_id_to_update UUID;
    code_is_used BOOLEAN;
BEGIN
    -- Find the code and lock the row for update to prevent race conditions
    SELECT id, is_used INTO code_id_to_update, code_is_used
    FROM public.activation_codes
    WHERE code = activation_code_to_use
    FOR UPDATE;

    -- Check if the code exists
    IF code_id_to_update IS NULL THEN
        RAISE EXCEPTION 'Code not found';
    END IF;

    -- Check if the code has already been used
    IF code_is_used THEN
        RAISE EXCEPTION 'Code already used';
    END IF;

    -- Update the profiles table to set the user's account status to 'Pro'
    UPDATE public.profiles
    SET account_status = 'Pro'
    WHERE id = user_id_to_activate;

    -- Mark the activation code as used
    UPDATE public.activation_codes
    SET 
        is_used = TRUE,
        used_by = user_id_to_activate,
        used_at = now(),
        used_by_email = user_email_to_set
    WHERE id = code_id_to_update;
END;
$$;

-- Function to handle user deletion, cascading to profiles
create or replace function public.on_delete_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

-- Trigger to call the user deletion function
create or replace trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.on_delete_user();


--
-- Views for Reporting
--
-- Drop the existing views if they exist to avoid column name/order conflicts
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;

-- Recreate the attendance history view with the correct column definitions and joins
CREATE OR REPLACE VIEW public.v_attendance_history AS
SELECT
  ah.id,
  ah.date,
  date_part('month', ah.date) as month,
  ah.class_id,
  c.name AS class_name,
  ah.subject_id,
  s.name AS subject_name,
  ah.teacher_id,
  ah.school_year_id,
  ah.meeting_number,
  ah.records,
  (
    SELECT json_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(ah.records) AS r(student_id uuid, status text)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  attendance_history ah
  JOIN classes c ON ah.class_id = c.id
  JOIN subjects s ON ah.subject_id = s.id;

-- Recreate the grade history view with the correct column definitions and joins
CREATE OR REPLACE VIEW public.v_grade_history AS
SELECT
  gh.id,
  gh.date,
  date_part('month', gh.date) as month,
  gh.class_id,
  c.name AS class_name,
  gh.subject_id,
  s.name AS subject_name,
  s.kkm AS subject_kkm,
  gh.teacher_id,
  gh.school_year_id,
  gh.assessment_type,
  gh.records,
  (
    SELECT json_object_agg(st.id, st.name)
    FROM jsonb_to_recordset(gh.records) AS r(student_id uuid, score numeric)
    JOIN students st ON st.id = r.student_id
  ) AS student_names
FROM
  grade_history gh
  JOIN classes c ON gh.class_id = c.id
  JOIN subjects s ON gh.subject_id = s.id;