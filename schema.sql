
-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- Allow anonymous access to the public schema
grant usage on schema public to postgres, anon, authenticated, service_role;

-- Allow anonymous access to all tables, functions, and sequences in the public schema
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

-- Drop existing tables if they exist
drop table if exists "public"."attendance_history" cascade;
drop table if exists "public"."grade_history" cascade;
drop table if exists "public"."journals" cascade;
drop table if exists "public"."schedule" cascade;
drop table if exists "public"."students" cascade;
drop table if exists "public"."classes" cascade;
drop table if exists "public"."subjects" cascade;
drop table if exists "public"."school_years" cascade;
drop table if exists "public"."profiles" cascade;
drop table if exists "public"."activation_codes" cascade;
drop table if exists "public"."agendas" cascade;

-- Custom Types
do $$
begin
    if not exists (select 1 from pg_type where typname = 'gender') then
        create type public.gender as enum ('Laki-laki', 'Perempuan');
    end if;
    if not exists (select 1 from pg_type where typname = 'student_status') then
        create type public.student_status as enum ('active', 'graduated', 'dropout', 'inactive');
    end if;
    if not exists (select 1 from pg_type where typname = 'attendance_status') then
       create type public.attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');
    end if;
     if not exists (select 1 from pg_type where typname = 'account_status') then
       create type public.account_status as enum ('Free', 'Pro');
    end if;
     if not exists (select 1 from pg_type where typname = 'user_role') then
       create type public.user_role as enum ('teacher', 'admin');
    end if;
end$$;


-- School Years Table
create table public.school_years (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    name text not null,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key (id),
    unique (teacher_id, name)
);
alter table public.school_years enable row level security;
create policy "Enable access to all users" on public.school_years for select using (true);
create policy "Users can insert their own school years" on public.school_years for insert with check (auth.uid() = teacher_id);
create policy "Users can update their own school years" on public.school_years for update using (auth.uid() = teacher_id);
create policy "Users can delete their own school years" on public.school_years for delete using (auth.uid() = teacher_id);

-- Profiles Table
create table public.profiles (
    id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    full_name text not null,
    email text,
    avatar_url text,
    nip text,
    pangkat text,
    jabatan text,
    school_name text,
    school_address text,
    headmaster_name text,
    headmaster_nip text,
    school_logo_url text,
    account_status public.account_status not null default 'Free',
    role public.user_role not null default 'teacher',
    active_school_year_id uuid references public.school_years(id) on delete set null,
    primary key (id),
    unique(email)
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id);


-- Function to create a profile for a new user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

-- Trigger to call the function when a new user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Activation Codes Table
create table public.activation_codes (
    id uuid not null default gen_random_uuid(),
    code text not null,
    is_used boolean not null default false,
    used_by uuid null references public.profiles(id) on delete set null,
    used_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    primary key (id),
    unique(code)
);
alter table public.activation_codes enable row level security;
-- Admin-only access
create policy "Enable read access for admins" on public.activation_codes for select using (public.is_admin());
create policy "Enable insert access for admins" on public.activation_codes for insert with check (public.is_admin());
create policy "Enable update access for admins" on public.activation_codes for update using (public.is_admin());

-- Classes Table
create table public.classes (
    id uuid not null default gen_random_uuid(),
    name text not null,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key (id)
);
alter table public.classes enable row level security;
create policy "Users can manage their own classes" on public.classes for all using (auth.uid() = teacher_id);

-- Subjects Table
create table public.subjects (
    id uuid not null default gen_random_uuid(),
    name text not null,
    kkm integer not null default 75,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key (id)
);
alter table public.subjects enable row level security;
create policy "Users can manage their own subjects" on public.subjects for all using (auth.uid() = teacher_id);

-- Students Table
create table public.students (
    id uuid not null default gen_random_uuid(),
    name text not null,
    nis text not null,
    gender public.gender not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    status public.student_status not null default 'active',
    primary key (id)
);
create unique index "unique_nis_per_teacher" on public.students (nis, (
    select teacher_id from public.classes where id = class_id
));
alter table public.students enable row level security;
create policy "Users can view students in their classes" on public.students for select using (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
);
create policy "Users can insert students into their classes" on public.students for insert with check (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
);
create policy "Users can update students in their classes" on public.students for update using (
    exists (select 1 from public.classes where id = class_id and teacher_id = auth.uid())
);


-- Schedule Table
create table public.schedule (
    id uuid not null default gen_random_uuid(),
    day text not null,
    start_time time without time zone not null,
    end_time time without time zone not null,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    class_id uuid not null references public.classes(id) on delete cascade,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key (id)
);
alter table public.schedule enable row level security;
create policy "Users can manage their own schedule" on public.schedule for all using (auth.uid() = teacher_id);

-- Attendance History Table
create table public.attendance_history (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade,
    meeting_number integer,
    records jsonb not null,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key(id)
);
alter table public.attendance_history enable row level security;
create policy "Users can manage their own attendance history" on public.attendance_history for all using (auth.uid() = teacher_id);

-- Grade History Table
create table public.grade_history (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade,
    assessment_type text not null,
    records jsonb not null,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    primary key(id)
);
alter table public.grade_history enable row level security;
create policy "Users can manage their own grade history" on public.grade_history for all using (auth.uid() = teacher_id);

-- Journals Table
create table public.journals (
    id uuid not null default gen_random_uuid(),
    date date not null,
    class_id uuid not null references public.classes(id) on delete cascade,
    subject_id uuid not null references public.subjects(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade,
    meeting_number integer,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    primary key(id)
);
alter table public.journals enable row level security;
create policy "Users can manage their own journals" on public.journals for all using (auth.uid() = teacher_id);


-- Agendas Table
create table public.agendas (
    id uuid not null default gen_random_uuid(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time without time zone,
    end_time time without time zone,
    teacher_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    primary key(id)
);
alter table public.agendas enable row level security;
create policy "Users can manage their own agendas" on public.agendas for all using (auth.uid() = teacher_id);


-- Function to check if user is admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Function to activate an account
create or replace function public.activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void
language plpgsql
as $$
declare
    code_id uuid;
    is_code_used boolean;
begin
    -- Find the code and check its status
    select id, is_used into code_id, is_code_used
    from public.activation_codes
    where code = activation_code_to_use;

    if code_id is null then
        raise exception 'Code not found';
    end if;

    if is_code_used then
        raise exception 'Code already used';
    end if;

    -- Update the activation_codes table
    update public.activation_codes
    set is_used = true,
        used_by = user_id_to_activate,
        used_at = now()
    where id = code_id;

    -- Update the profiles table
    update public.profiles
    set account_status = 'Pro'
    where id = user_id_to_activate;
end;
$$;


-- Function to safely add a student, checking for teacher ownership and duplicate NIS
create or replace function add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text -- Corrected data type from 'gender' to 'text'
)
returns void as $$
declare
    v_teacher_id uuid;
    v_existing_nis_teacher_id uuid;
begin
    -- 1. Get the teacher_id from the provided p_class_id
    select teacher_id into v_teacher_id
    from public.classes
    where id = p_class_id;

    -- If the class doesn't exist or doesn't belong to any teacher, raise an exception.
    if v_teacher_id is null then
        raise exception 'Kelas dengan ID yang diberikan tidak ditemukan.';
    end if;

    -- 2. Check if the NIS already exists for another class under the same teacher
    select c.teacher_id into v_existing_nis_teacher_id
    from public.students s
    join public.classes c on s.class_id = c.id
    where s.nis = p_nis and c.teacher_id = v_teacher_id
    limit 1;

    -- If the NIS is found for the same teacher, it's a violation.
    if v_existing_nis_teacher_id is not null then
        raise exception 'NIS sudah terdaftar untuk guru ini di kelas lain.';
    end if;
    
    -- 3. If all checks pass, insert the new student
    insert into public.students (class_id, nis, name, gender, status)
    values (p_class_id, p_nis, p_name, p_gender, 'active');
end;
$$ language plpgsql;

-- Reset all changes
-- alter default privileges in schema public revoke all on tables from postgres, anon, authenticated, service_role;
-- alter default privileges in schema public revoke all on functions from postgres, anon, authenticated, service_role;
-- alter default privileges in schema public revoke all on sequences from postgres, anon, authenticated, service_role;

-- revoke all on all tables in schema public from anon, authenticated, service_role;
-- revoke all on all functions in schema public from anon, authenticated, service_role;
-- revoke all on all sequences in schema public from anon, authenticated, service_role;

-- revoke usage on schema public from anon, authenticated, service_role;
