
-- ### POLICIES ###

-- 1. Enable RLS for all tables
alter table "public"."profiles" enable row level security;
alter table "public"."classes" enable row level security;
alter table "public"."subjects" enable row level security;
alter table "public"."students" enable row level security;
alter table "public"."schedule" enable row level security;
alter table "public"."attendance_history" enable row level security;
alter table "public"."grade_history" enable row level security;
alter table "public"."journals" enable row level security;
alter table "public"."agendas" enable row level security;
alter table "public"."school_years" enable row level security;
alter table "public"."activation_codes" enable row level security;

-- 2. Profiles Policies
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on profiles for update using (auth.uid() = id);

-- 3. Teacher Data Policies (Classes, Subjects, Students, Schedule, etc.)
-- This generic policy applies to most tables where a `teacher_id` column exists.
create policy "Teachers can view their own data." on classes for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on classes for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on classes for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on classes for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on subjects for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on subjects for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on subjects for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on subjects for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on students for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on students for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on students for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on students for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on schedule for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on schedule for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on schedule for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on schedule for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on attendance_history for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on attendance_history for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on attendance_history for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on attendance_history for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on grade_history for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on grade_history for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on grade_history for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on grade_history for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on journals for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on journals for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on journals for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on journals for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on agendas for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on agendas for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on agendas for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on agendas for delete using (auth.uid() = teacher_id);

create policy "Teachers can view their own data." on school_years for select using (auth.uid() = teacher_id);
create policy "Teachers can create their own data." on school_years for insert with check (auth.uid() = teacher_id);
create policy "Teachers can update their own data." on school_years for update using (auth.uid() = teacher_id);
create policy "Teachers can delete their own data." on school_years for delete using (auth.uid() = teacher_id);

-- 4. Admin Policies for Activation Codes
create policy "Admins can manage activation codes" on activation_codes for all using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);
create policy "Users can view activation codes (for admin panel)" on activation_codes for select using (
  exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  )
);


-- ### TABLES ###

-- Profiles Table
-- This table stores user profile information.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text NOT NULL,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  account_status text NOT NULL DEFAULT 'Free'::text,
  role text NOT NULL DEFAULT 'teacher'::text,
  email text,
  active_school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- School Years Table
-- Stores academic years, e.g., "2023/2024 - Ganjil"
CREATE TABLE IF NOT EXISTS public.school_years (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Classes Table
-- Stores class information, e.g., "Kelas 10-A"
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Subjects Table
-- Stores subjects taught by a teacher, e.g., "Matematika"
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  kkm integer NOT NULL DEFAULT 75,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Students Table
-- Stores student information for each class.
CREATE TABLE IF NOT EXISTS public.students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  nis text NOT NULL,
  gender text NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT students_teacher_id_nis_key UNIQUE (teacher_id, nis)
);

-- Schedule Table
-- Stores the weekly teaching schedule.
CREATE TABLE IF NOT EXISTS public.schedule (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  day text NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Journals Table
-- Stores teaching journal entries.
CREATE TABLE IF NOT EXISTS public.journals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  learning_objectives text NOT NULL,
  learning_activities text NOT NULL,
  assessment text,
  reflection text,
  meeting_number integer,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Attendance History Table
-- Stores historical attendance records.
CREATE TABLE IF NOT EXISTS public.attendance_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  meeting_number integer NOT NULL,
  records jsonb NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Grade History Table
-- Stores historical grade records.
CREATE TABLE IF NOT EXISTS public.grade_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  date date NOT NULL,
  assessment_type text NOT NULL,
  records jsonb NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_year_id uuid REFERENCES public.school_years(id) ON DELETE SET NULL
);

-- Agendas Table
-- Stores personal teacher agendas/reminders.
CREATE TABLE IF NOT EXISTS public.agendas (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    date date NOT NULL,
    title text NOT NULL,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Activation Codes Table
-- Stores activation codes for Pro accounts.
CREATE TABLE IF NOT EXISTS public.activation_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    code text NOT NULL UNIQUE,
    is_used boolean NOT NULL DEFAULT false,
    used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    used_at timestamp with time zone
);


-- ### STORAGE ###

-- Create a bucket for profile images with public access.
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

-- Set up RLS policies for the profile_images bucket.
create policy "Profile images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'profile-images' );

create policy "Anyone can upload a profile image."
  on storage.objects for insert
  with check ( bucket_id = 'profile-images' );

create policy "Users can update their own profile image"
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'profile-images' );

-- ### FUNCTIONS ###

-- Function to create a public profile for a new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    'teacher' -- default role
  );
  return new;
end;
$$;

-- Trigger to call `handle_new_user` when a new user signs up.
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user deletion, cascading to the profiles table.
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call `handle_user_delete` when a user is deleted from auth.users
CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_delete();
  
-- Function to activate a user account and redeem a code
CREATE OR REPLACE FUNCTION activate_account_with_code(activation_code_to_use text, user_id_to_activate uuid, user_email_to_set text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  code_id uuid;
BEGIN
  -- Find the code and lock the row for update
  SELECT id INTO code_id FROM public.activation_codes WHERE code = activation_code_to_use AND NOT is_used FOR UPDATE;

  -- If code doesn't exist or is already used, raise an error
  IF code_id IS NULL THEN
    RAISE EXCEPTION 'Code not found or already used';
  END IF;

  -- Update the activation_codes table
  UPDATE public.activation_codes
  SET 
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  WHERE id = code_id;

  -- Update the profiles table
  UPDATE public.profiles
  SET account_status = 'Pro'
  WHERE id = user_id_to_activate;

END;
$$;
