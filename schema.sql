
-- RLS (Row Level Security) Policies
-- These policies ensure that users can only access their own data.
-- They are crucial for security in a multi-tenant application.

-- Enable RLS for all relevant tables
alter table profiles enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table schedule enable row level security;
alter table students enable row level security;
alter table attendance_history enable row level security;
alter table grade_history enable row level security;
alter table journals enable row level security;
alter table activation_codes enable row level security;
alter table school_years enable row level security;
alter table agendas enable row level security;

-- Drop existing policies to prevent conflicts during re-creation
drop policy if exists "Users can view their own profile." on profiles;
drop policy if exists "Users can update their own profile." on profiles;
drop policy if exists "Admins can manage all profiles." on profiles;

drop policy if exists "Users can manage their own classes." on classes;
drop policy if exists "Admins can manage all classes." on classes;

drop policy if exists "Users can manage their own subjects." on subjects;
drop policy if exists "Admins can manage all subjects." on subjects;

drop policy if exists "Users can manage their own schedule." on schedule;
drop policy if exists "Admins can manage all schedules." on schedule;

drop policy if exists "Users can manage their own students." on students;
drop policy if exists "Admins can manage all students." on students;

drop policy if exists "Users can manage their own attendance records." on attendance_history;
drop policy if exists "Admins can manage all attendance records." on attendance_history;

drop policy if exists "Users can manage their own grade records." on grade_history;
drop policy if exists "Admins can manage all grade records." on grade_history;

drop policy if exists "Users can manage their own journals." on journals;
drop policy if exists "Admins can manage all journals." on journals;

drop policy if exists "Admins can manage activation codes." on activation_codes;
drop policy if exists "Authenticated users can view codes (for activation)." on activation_codes;

drop policy if exists "Users can manage their own school years." on school_years;
drop policy if exists "Admins can manage all school years." on school_years;

drop policy if exists "Users can manage their own agendas." on agendas;
drop policy if exists "Admins can manage all agendas." on agendas;


-- Get User Role Function
-- A helper function to easily get a user's role from their ID.
create or replace function get_user_role(user_id uuid)
returns text
language plpgsql
security definer
as $$
begin
  return (select role from public.profiles where id = user_id);
end;
$$;


-- Profiles Table Policies
create policy "Users can view their own profile." on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins can manage all profiles." on profiles for all using (get_user_role(auth.uid()) = 'admin');

-- Classes Table Policies
create policy "Users can manage their own classes." on classes for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all classes." on classes for all using (get_user_role(auth.uid()) = 'admin');

-- Subjects Table Policies
create policy "Users can manage their own subjects." on subjects for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all subjects." on subjects for all using (get_user_role(auth.uid()) = 'admin');

-- Schedule Table Policies
create policy "Users can manage their own schedule." on schedule for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all schedules." on schedule for all using (get_user_role(auth.uid()) = 'admin');

-- Students Table Policies
-- This policy is slightly more complex. A teacher can manage students if the student belongs to a class taught by that teacher.
create policy "Users can manage their own students." on students for all 
  using (teacher_id = (select teacher_id from classes where id = students.class_id))
  with check (teacher_id = (select teacher_id from classes where id = students.class_id));
create policy "Admins can manage all students." on students for all using (get_user_role(auth.uid()) = 'admin');

-- Attendance History Table Policies
create policy "Users can manage their own attendance records." on attendance_history for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all attendance records." on attendance_history for all using (get_user_role(auth.uid()) = 'admin');

-- Grade History Table Policies
create policy "Users can manage their own grade records." on grade_history for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all grade records." on grade_history for all using (get_user_role(auth.uid()) = 'admin');

-- Journals Table Policies
create policy "Users can manage their own journals." on journals for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all journals." on journals for all using (get_user_role(auth.uid()) = 'admin');

-- Activation Codes Table Policies
create policy "Admins can manage activation codes." on activation_codes for all using (get_user_role(auth.uid()) = 'admin');
create policy "Authenticated users can view codes (for activation)." on activation_codes for select using (auth.role() = 'authenticated');

-- School Years Table Policies
create policy "Users can manage their own school years." on school_years for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all school years." on school_years for all using (get_user_role(auth.uid()) = 'admin');

-- Agendas Table Policies
create policy "Users can manage their own agendas." on agendas for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "Admins can manage all agendas." on agendas for all using (get_user_role(auth.uid()) = 'admin');


-- Functions and Triggers
-- These automated functions handle tasks like creating user profiles
-- when a new user signs up in Supabase Auth.

-- Function to handle new user signup
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

-- Trigger to call the function after a new user is created in the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Function to automatically delete a user's profile when their auth account is deleted
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

-- Trigger to call the delete function
drop trigger if exists on_auth_user_deleted on auth.users;
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();


-- Function to handle student import, checking for duplicates for the same teacher
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
    -- Get the teacher_id from the provided class_id
    SELECT teacher_id INTO v_teacher_id FROM public.classes WHERE id = p_class_id;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    IF EXISTS (
        SELECT 1
        FROM public.students s
        JOIN public.classes c ON s.class_id = c.id
        WHERE c.teacher_id = v_teacher_id AND s.nis = p_nis
    ) THEN
        RAISE EXCEPTION 'NIS already exists for this teacher';
    END IF;

    -- If no duplicate is found, insert the new student
    INSERT INTO public.students(name, nis, gender, class_id, status)
    VALUES (p_name, p_nis, p_gender, p_class_id, 'active');
END;
$$ LANGUAGE plpgsql;


-- Function for account activation using a code
create or replace function activate_account_with_code(
  activation_code_to_use text,
  user_id_to_activate uuid,
  user_email_to_set text
)
returns void
language plpgsql
as $$
declare
  code_id_to_use uuid;
begin
  -- Find the code and lock it to prevent race conditions
  select id into code_id_to_use from public.activation_codes
  where code = activation_code_to_use and is_used = false
  for update;

  -- If the code doesn't exist or is already used, raise an error
  if code_id_to_use is null then
    raise exception 'Code not found or already used';
  end if;

  -- Update the activation code to mark it as used
  update public.activation_codes
  set
    is_used = true,
    used_by = user_id_to_activate,
    used_by_email = user_email_to_set,
    used_at = now()
  where id = code_id_to_use;

  -- Update the user's profile to Pro status
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;
end;
$$;


-- Add UNIQUE constraint to school_years table
-- This is wrapped in a DO block to avoid errors if the constraint already exists.
DO $$
BEGIN
   IF NOT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'school_years_name_teacher_id_key'
   ) THEN
       ALTER TABLE public.school_years ADD CONSTRAINT school_years_name_teacher_id_key UNIQUE (name, teacher_id);
   END IF;
END;
$$;

-- Drop the old, problematic views and functions if they exist.
DROP VIEW IF EXISTS public.v_attendance_history;
DROP VIEW IF EXISTS public.v_grade_history;
DROP FUNCTION IF EXISTS get_report_data(uuid, uuid, integer);
