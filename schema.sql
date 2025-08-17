-- This is the schema for the Lakukelas application.
-- It is designed to be run once to set up the entire database structure.

-- Enable Row Level Security
alter table profiles enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table school_years enable row level security;
alter table schedule enable row level security;
alter table journals enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table activation_codes enable row level security;
alter table agendas enable row level security;


-- Create Policies for tables

-- PROFILES
create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

-- CLASSES
create policy "Users can view their own classes." on classes
  for select using (auth.uid() = teacher_id);

create policy "Users can insert their own classes." on classes
  for insert with check (auth.uid() = teacher_id);

create policy "Users can update their own classes." on classes
  for update using (auth.uid() = teacher_id);

-- SUBJECTS
create policy "Users can view their own subjects." on subjects
  for select using (auth.uid() = teacher_id);

create policy "Users can insert their own subjects." on subjects
  for insert with check (auth.uid() = teacher_id);
  
create policy "Users can update their own subjects." on subjects
  for update using (auth.uid() = teacher_id);

-- STUDENTS
create policy "Users can view students in their classes." on students
  for select using (exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  ));

create policy "Users can insert students into their own classes." on students
  for insert with check (exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  ));

create policy "Users can update students in their own classes." on students
  for update using (exists (
    select 1 from classes
    where classes.id = students.class_id and classes.teacher_id = auth.uid()
  ));

-- SCHOOL_YEARS
create policy "Users can view their own school years." on school_years
  for select using (auth.uid() = teacher_id);
  
create policy "Users can insert their own school years." on school_years
  for insert with check (auth.uid() = teacher_id);

-- SCHEDULE
create policy "Users can view their own schedule." on schedule
  for select using (auth.uid() = teacher_id);

create policy "Users can manage their own schedule." on schedule
  for all using (auth.uid() = teacher_id);

-- JOURNALS
create policy "Users can view their own journals." on journals
  for select using (auth.uid() = teacher_id);
  
create policy "Users can manage their own journals." on journals
  for all using (auth.uid() = teacher_id);

-- ATTENDANCE_HISTORY
create policy "Users can view their own attendance history." on attendance_history
  for select using (auth.uid() = teacher_id);

create policy "Users can manage their own attendance history." on attendance_history
  for all using (auth.uid() = teacher_id);

-- GRADE_HISTORY
create policy "Users can view their own grade history." on grade_history
  for select using (auth.uid() = teacher_id);
  
create policy "Users can manage their own grade history." on grade_history
  for all using (auth.uid() = teacher_id);
  
-- ACTIVATION_CODES
create policy "Admins can manage activation codes." on activation_codes
  for all using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );
  
create policy "Authenticated users can view codes used by them." on activation_codes
  for select using (auth.uid() = used_by);

-- AGENDAS
create policy "Users can view their own agendas." on agendas
  for select using (auth.uid() = teacher_id);

create policy "Users can manage their own agendas." on agendas
  for all using (auth.uid() = teacher_id);


-- This trigger and function automatically creates a profile for a new user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$;

-- Connect trigger to auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- This function automatically deletes a user's profile when they are deleted from auth.
create function public.handle_user_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- Function to add a student, checking for duplicates based on teacher_id and NIS
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
RETURNS void AS $$
DECLARE
    v_teacher_id uuid;
    v_nis_exists boolean;
BEGIN
    -- Get the teacher_id from the provided class_id
    SELECT teacher_id INTO v_teacher_id FROM classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher
    SELECT EXISTS (
        SELECT 1
        FROM students s
        JOIN classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = p_nis
    ) INTO v_nis_exists;

    -- If the NIS already exists for this teacher, raise an exception
    IF v_nis_exists THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If the NIS does not exist for this teacher, insert the new student
    INSERT INTO students (class_id, nis, name, gender, status)
    VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$ LANGUAGE plpgsql;


-- Function for account activation
-- This is a security-critical function. It must handle all steps atomically.
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid, text);

CREATE OR REPLACE FUNCTION activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
-- SECURITY DEFINER allows the function to run with the permissions of the user who created it (postgres).
SECURITY DEFINER
-- SET search_path is the critical fix. It tells the function to look for tables in the 'public' schema.
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  -- 1. Find the ID of the provided activation code, but only if it's not already used.
  -- The "FOR UPDATE" clause locks the selected row to prevent race conditions where two users might try to use the same code simultaneously.
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false
  LIMIT 1
  FOR UPDATE;

  -- 2. If no valid, unused code is found (v_code_id is null), raise a specific error.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. If a valid code was found, proceed with the transaction.
  -- Update the activation_codes table to mark the code as used.
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update the user's profile to set their account status to 'Pro'.
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

END;
$$;
