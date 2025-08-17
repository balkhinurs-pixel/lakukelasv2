
-- RLS POLICIES

alter table profiles enable row level security;
alter table activation_codes enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table schedule enable row level security;
alter table journals enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table school_years enable row level security;
alter table agendas enable row level security;


-- PROFILES TABLE

drop policy if exists "Profiles are viewable by users who created them." on profiles;
create policy "Profiles are viewable by users who created them." on profiles
  for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile." on profiles;
create policy "Users can update their own profile." on profiles
  for update using (auth.uid() = id);

drop policy if exists "Admin users can view all profiles" on profiles;
create policy "Admin users can view all profiles" on profiles for select
  using (
    (select role from profiles where id = auth.uid()) = 'admin'
  );

drop policy if exists "Admin users can update any profile" on profiles;
create policy "Admin users can update any profile" on profiles for update
    using (
        (select role from profiles where id = auth.uid()) = 'admin'
    )
    with check (
        (select role from profiles where id = auth.uid()) = 'admin'
    );


-- ACTIVATION_CODES TABLE

drop policy if exists "Admin users can manage activation codes" on activation_codes;
create policy "Admin users can manage activation codes" on activation_codes for all
    using (
        (select role from profiles where id = auth.uid()) = 'admin'
    )
    with check (
        (select role from profiles where id = auth.uid()) = 'admin'
    );

drop policy if exists "Authenticated users can view unused codes for activation" on activation_codes;
create policy "Authenticated users can view unused codes for activation" on activation_codes for select
    using (
        auth.role() = 'authenticated' and is_used = false
    );


-- CLASSES TABLE

drop policy if exists "Users can view their own classes" on classes;
create policy "Users can view their own classes" on classes for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create classes for themselves" on classes;
create policy "Users can create classes for themselves" on classes for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own classes" on classes;
create policy "Users can update their own classes" on classes for update
    using (auth.uid() = teacher_id);


-- SUBJECTS TABLE

drop policy if exists "Users can view their own subjects" on subjects;
create policy "Users can view their own subjects" on subjects for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create subjects for themselves" on subjects;
create policy "Users can create subjects for themselves" on subjects for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own subjects" on subjects;
create policy "Users can update their own subjects" on subjects for update
    using (auth.uid() = teacher_id);


-- STUDENTS TABLE

drop policy if exists "Users can view students in their classes" on students;
create policy "Users can view students in their classes" on students for select
    using (
        class_id in (
            select id from classes where teacher_id = auth.uid()
        )
    );

drop policy if exists "Users can add students to their classes" on students;
create policy "Users can add students to their classes" on students for insert
    with check (
        class_id in (
            select id from classes where teacher_id = auth.uid()
        )
    );

drop policy if exists "Users can update students in their classes" on students;
create policy "Users can update students in their classes" on students for update
    using (
        class_id in (
            select id from classes where teacher_id = auth.uid()
        )
    );

-- SCHEDULE TABLE

drop policy if exists "Users can view their own schedule" on schedule;
create policy "Users can view their own schedule" on schedule for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create schedule for themselves" on schedule;
create policy "Users can create schedule for themselves" on schedule for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own schedule" on schedule;
create policy "Users can update their own schedule" on schedule for update
    using (auth.uid() = teacher_id);

drop policy if exists "Users can delete their own schedule" on schedule;
create policy "Users can delete their own schedule" on schedule for delete
    using (auth.uid() = teacher_id);


-- JOURNALS TABLE

drop policy if exists "Users can view their own journals" on journals;
create policy "Users can view their own journals" on journals for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create journals for themselves" on journals;
create policy "Users can create journals for themselves" on journals for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own journals" on journals;
create policy "Users can update their own journals" on journals for update
    using (auth.uid() = teacher_id);

drop policy if exists "Users can delete their own journals" on journals;
create policy "Users can delete their own journals" on journals for delete
    using (auth.uid() = teacher_id);

-- ATTENDANCE_HISTORY TABLE

drop policy if exists "Users can view their own attendance history" on attendance_history;
create policy "Users can view their own attendance history" on attendance_history for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create attendance history for themselves" on attendance_history;
create policy "Users can create attendance history for themselves" on attendance_history for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own attendance history" on attendance_history;
create policy "Users can update their own attendance history" on attendance_history for update
    using (auth.uid() = teacher_id);

-- GRADE_HISTORY TABLE

drop policy if exists "Users can view their own grade history" on grade_history;
create policy "Users can view their own grade history" on grade_history for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create grade history for themselves" on grade_history;
create policy "Users can create grade history for themselves" on grade_history for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own grade history" on grade_history;
create policy "Users can update their own grade history" on grade_history for update
    using (auth.uid() = teacher_id);


-- SCHOOL_YEARS TABLE

drop policy if exists "Users can view their own school years" on school_years;
create policy "Users can view their own school years" on school_years for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create school years for themselves" on school_years;
create policy "Users can create school years for themselves" on school_years for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can delete their own school years" on school_years;
create policy "Users can delete their own school years" on school_years for delete
    using (auth.uid() = teacher_id);

-- AGENDAS TABLE

drop policy if exists "Users can view their own agendas" on agendas;
create policy "Users can view their own agendas" on agendas for select
    using (auth.uid() = teacher_id);

drop policy if exists "Users can create agendas for themselves" on agendas;
create policy "Users can create agendas for themselves" on agendas for insert
    with check (auth.uid() = teacher_id);

drop policy if exists "Users can update their own agendas" on agendas;
create policy "Users can update their own agendas" on agendas for update
    using (auth.uid() = teacher_id);

drop policy if exists "Users can delete their own agendas" on agendas;
create policy "Users can delete their own agendas" on agendas for delete
    using (auth.uid() = teacher_id);


-- FUNCTIONS AND TRIGGERS

-- This trigger automatically creates a profile for a new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email, role, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    'teacher',
    'Free'
  );
  return new;
end;
$$;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to delete a user's profile when they are deleted from auth.users
create or replace function public.handle_user_delete()
returns trigger
language plpgsql
security definer
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row
  execute procedure public.handle_user_delete();

-- Function to add a student, ensuring the NIS is unique for the teacher
CREATE OR REPLACE FUNCTION add_student_with_teacher_check(p_class_id uuid, p_nis text, p_name text, p_gender text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_teacher_id uuid;
  v_nis_exists boolean;
BEGIN
  -- Get the teacher_id from the class
  SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

  -- Check if the NIS already exists for any student in any class belonging to this teacher
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.classes c ON s.class_id = c.id
    WHERE s.nis = p_nis AND c.teacher_id = v_teacher_id
  ) INTO v_nis_exists;

  IF v_nis_exists THEN
    RAISE EXCEPTION 'NIS already exists for this teacher';
  END IF;

  -- If NIS does not exist for this teacher, insert the new student
  INSERT INTO public.students (class_id, nis, name, gender, status)
  VALUES (p_class_id, p_nis, p_name, p_gender, 'active');
END;
$$;


-- First, drop the existing function to avoid conflicts with return type changes.
DROP FUNCTION IF EXISTS activate_account_with_code(text, uuid, text);

-- Then, create the function with the correct logic and explicit return type.
CREATE OR REPLACE FUNCTION activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void -- Explicitly state that this function does not return a value.
LANGUAGE plpgsql
SECURITY DEFINER -- Allows the function to run with the permissions of the user who defined it.
AS $$
DECLARE
  v_code_id UUID;
BEGIN
  -- 1. Find the ID of a valid, unused activation code.
  SELECT id INTO v_code_id FROM public.activation_codes
  WHERE code = p_code AND is_used = false
  LIMIT 1;

  -- 2. If no valid code is found, raise a specific error.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- 3. Update the user's profile to 'Pro'.
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

  -- 4. Mark the specific code as used, recording who used it and when.
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;
  
END;
$$;

-- Grant ownership to the postgres superuser to ensure it has all necessary permissions.
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;

-- STORAGE POLICIES
-- Create a bucket for profile images
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- Set up RLS policies for the profile-images bucket
drop policy if exists "Avatar images are publicly accessible." on storage.objects;
create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'profile-images');

drop policy if exists "Anyone can upload an avatar." on storage.objects;
create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'profile-images');

drop policy if exists "Users can update their own images." on storage.objects;
create policy "Users can update their own images." on storage.objects
    for update using (auth.uid() = owner);

drop policy if exists "Users can delete their own images." on storage.objects;
create policy "Users can delete their own images." on storage.objects
    for delete using (auth.uid() = owner);

