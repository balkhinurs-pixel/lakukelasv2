-- =========================================================================================
-- This is the single source of truth for the database schema.
-- 
-- To deploy this schema, you can run this file directly against your Supabase database instance.
-- For local development, this schema is automatically applied when you run `supabase start`.
-- =========================================================================================

-- =========================================================================================
-- Enable Row Level Security (RLS)
-- =========================================================================================
alter table "public"."activation_codes" enable row level security;
alter table "public"."classes" enable row level security;
alter table "public"."grade_history" enable row level security;
alter table "public"."journals" enable row level security;
alter table "public"."profiles" enable row level security;
alter table "public"."schedule" enable row level security;
alter table "public"."students" enable row level security;
alter table "public"."subjects" enable row level security;
alter table "public"."attendance_history" enable row level security;
alter table "public"."school_years" enable row level security;
alter table "public"."agendas" enable row level security;

-- =========================================================================================
-- Create Custom Types
-- =========================================================================================
drop type if exists public.gender;
create type public.gender as enum ('Laki-laki', 'Perempuan');

drop type if exists public.account_status;
create type public.account_status as enum ('Free', 'Pro');

drop type if exists public.user_role;
create type public.user_role as enum ('teacher', 'admin');

drop type if exists public.attendance_status;
create type public.attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');

drop type if exists public.student_status;
create type public.student_status as enum ('active', 'graduated', 'dropout', 'inactive');

-- =========================================================================================
-- Create Tables
-- =========================================================================================

-- Profiles Table - Stores user-specific data
create table public.profiles (
    id uuid not null,
    created_at timestamp with time zone not null default now(),
    full_name text not null,
    avatar_url text null,
    nip text null,
    pangkat text null,
    jabatan text null,
    school_name text null,
    school_address text null,
    headmaster_name text null,
    headmaster_nip text null,
    school_logo_url text null,
    account_status public.account_status not null default 'Free'::account_status,
    role public.user_role not null default 'teacher'::user_role,
    email text null,
    active_school_year_id uuid null,
    constraint profiles_pkey primary key (id),
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade,
    constraint profiles_email_key unique (email)
);
alter table public.profiles add constraint profiles_active_school_year_id_fkey foreign key (active_school_year_id) references public.school_years (id) on delete set null;

-- School Years Table
create table public.school_years (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    name text not null,
    teacher_id uuid not null,
    constraint school_years_pkey primary key (id),
    constraint school_years_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint school_years_name_teacher_id_key unique (name, teacher_id)
);

-- Classes Table
create table public.classes (
    id uuid not null default gen_random_uuid(),
    name text not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint classes_pkey primary key (id),
    constraint classes_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);

-- Subjects Table
create table public.subjects (
    id uuid not null default gen_random_uuid(),
    name text not null,
    kkm integer not null default 75,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint subjects_pkey primary key (id),
    constraint subjects_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);

-- Students Table
create table public.students (
    id uuid not null default gen_random_uuid(),
    name text not null,
    nis text not null,
    gender public.gender not null,
    class_id uuid not null,
    status public.student_status not null default 'active'::student_status,
    created_at timestamp with time zone not null default now(),
    constraint students_pkey primary key (id),
    constraint students_class_id_fkey foreign key (class_id) references classes (id) on delete cascade
);
-- Add unique constraint for NIS per teacher
create unique index students_nis_teacher_id_unique_idx on public.students (nis, (select teacher_id from public.classes where id = class_id));

-- Schedule Table
create table public.schedule (
    id uuid not null default gen_random_uuid(),
    day text not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    subject_id uuid not null,
    class_id uuid not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint schedule_pkey primary key (id),
    constraint schedule_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint schedule_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint schedule_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);

-- Journals Table
create table public.journals (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid null,
    meeting_number integer null,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text null,
    reflection text null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint journals_pkey primary key (id),
    constraint journals_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint journals_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint journals_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint journals_school_year_id_fkey foreign key (school_year_id) references school_years (id) on delete set null
);

-- Attendance History Table
create table public.attendance_history (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid null,
    meeting_number integer not null,
    records jsonb not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint attendance_history_pkey primary key (id),
    constraint attendance_history_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint attendance_history_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint attendance_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint attendance_history_school_year_id_fkey foreign key (school_year_id) references school_years (id) on delete set null
);

-- Grade History Table
create table public.grade_history (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid null,
    assessment_type text not null,
    records jsonb not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint grade_history_pkey primary key (id),
    constraint grade_history_class_id_fkey foreign key (class_id) references classes (id) on delete cascade,
    constraint grade_history_subject_id_fkey foreign key (subject_id) references subjects (id) on delete cascade,
    constraint grade_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint grade_history_school_year_id_fkey foreign key (school_year_id) references school_years (id) on delete set null
);

-- Activation Codes Table
create table public.activation_codes (
    id uuid not null default gen_random_uuid(),
    code text not null,
    is_used boolean not null default false,
    used_by uuid null,
    used_at timestamp with time zone null,
    created_at timestamp with time zone not null default now(),
    used_by_email text null,
    constraint activation_codes_pkey primary key (id),
    constraint activation_codes_code_key unique (code),
    constraint activation_codes_used_by_fkey foreign key (used_by) references auth.users (id) on delete set null
);

-- Agendas Table
create table public.agendas (
    id uuid not null default gen_random_uuid(),
    date date not null,
    title text not null,
    description text null,
    tag text null,
    color text null default '#6b7280',
    start_time time null,
    end_time time null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint agendas_pkey primary key (id),
    constraint agendas_teacher_id_fkey foreign key (teacher_id) references auth.users(id) on delete cascade
);

-- =========================================================================================
-- Create Policies (RLS)
-- =========================================================================================
-- Policies for Profiles Table
create policy "Users can view their own profile." on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);

-- Policies for Classes Table
create policy "Teachers can manage their own classes." on public.classes for all using (auth.uid() = teacher_id);

-- Policies for Subjects Table
create policy "Teachers can manage their own subjects." on public.subjects for all using (auth.uid() = teacher_id);

-- Policies for Students Table
create policy "Teachers can view students in their classes." on public.students for select using (
    class_id in (select id from public.classes where teacher_id = auth.uid())
);
create policy "Teachers can insert students into their own classes." on public.students for insert with check (
    class_id in (select id from public.classes where teacher_id = auth.uid())
);
create policy "Teachers can update students in their own classes." on public.students for update using (
    class_id in (select id from public.classes where teacher_id = auth.uid())
);

-- Policies for Schedule Table
create policy "Teachers can manage their own schedule." on public.schedule for all using (auth.uid() = teacher_id);

-- Policies for Journals Table
create policy "Teachers can manage their own journals." on public.journals for all using (auth.uid() = teacher_id);

-- Policies for Attendance History Table
create policy "Teachers can manage their own attendance history." on public.attendance_history for all using (auth.uid() = teacher_id);

-- Policies for Grade History Table
create policy "Teachers can manage their own grade history." on public.grade_history for all using (auth.uid() = teacher_id);

-- Policies for Activation Codes Table
create policy "Admins can manage activation codes." on public.activation_codes for all using ((select role from public.profiles where id = auth.uid()) = 'admin'::public.user_role);

-- Policies for School Years Table
create policy "Teachers can manage their own school years." on public.school_years for all using (auth.uid() = teacher_id);

-- Policies for Agendas Table
create policy "Teachers can manage their own agendas." on public.agendas for all using (auth.uid() = teacher_id);

-- =========================================================================================
-- Create Functions and Triggers
-- =========================================================================================

-- Function to create a user profile when a new user signs up in auth.users
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

-- Trigger to call handle_new_user on new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user deletion
create or replace function public.handle_user_delete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$;

-- Trigger for user deletion
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- Function to activate a user account with a code
DROP FUNCTION IF EXISTS public.activate_account_with_code(text, uuid, text);
CREATE OR REPLACE FUNCTION public.activate_account_with_code(p_code text, p_user_id uuid, p_user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_id uuid;
BEGIN
  -- 1. Find the code_id for the given activation code, ensuring it's not used.
  SELECT id INTO v_code_id
  FROM activation_codes
  WHERE code = p_code AND is_used = false;

  -- 2. Check if a valid, unused code was found. If not, raise an exception.
  IF v_code_id IS NULL THEN
    RAISE EXCEPTION 'Kode aktivasi tidak valid atau sudah digunakan.';
  END IF;

  -- 3. Update the activation_codes table using the specific ID found.
  UPDATE activation_codes
  SET 
    is_used = true,
    used_by = p_user_id,
    used_at = now(),
    used_by_email = p_user_email
  WHERE id = v_code_id;

  -- 4. Update the user's profile to 'Pro'.
  UPDATE profiles
  SET account_status = 'Pro'
  WHERE id = p_user_id;

END;
$$;
ALTER FUNCTION activate_account_with_code(text, uuid, text) OWNER TO postgres;


-- Function to add a student, checking for teacher ownership and NIS uniqueness
create or replace function public.add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
returns void
language plpgsql
as $$
declare
    v_teacher_id uuid;
    v_student_exists boolean;
begin
    -- Get the teacher_id from the provided class_id
    select teacher_id into v_teacher_id from public.classes where id = p_class_id;

    -- Check if the teacher ID was found and matches the current user
    if v_teacher_id is null or v_teacher_id != auth.uid() then
        raise exception 'Invalid class or permission denied.';
    end if;

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    select exists (
        select 1
        from public.students s
        join public.classes c on s.class_id = c.id
        where c.teacher_id = v_teacher_id and s.nis = p_nis
    ) into v_student_exists;

    if v_student_exists then
        raise exception 'A student with this NIS already exists for this teacher.';
    end if;

    -- If all checks pass, insert the new student
    insert into public.students (class_id, nis, name, gender)
    values (p_class_id, p_nis, p_name, p_gender::public.gender);
end;
$$;