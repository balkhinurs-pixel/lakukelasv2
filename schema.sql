
-- Enable UUID generation
create extension if not exists "uuid-ossp" with schema "extensions";

-- Create custom types
do $$
begin
    if not exists (select 1 from pg_type where typname = 'account_status') then
        create type public.account_status as enum ('Free', 'Pro');
    end if;
end$$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'user_role') then
        create type public.user_role as enum ('admin', 'teacher');
    end if;
end$$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'student_status') then
        create type public.student_status as enum ('active', 'graduated', 'dropout', 'inactive');
    end if;
end$$;

do $$
begin
    if not exists (select 1 from pg_type where typname = 'attendance_status') then
        create type public.attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');
    end if;
end$$;

-- Define a composite type for attendance records
do $$
begin
    if not exists (select 1 from pg_type where typname = 'attendance_record') then
        create type public.attendance_record as (
            student_id uuid,
            status attendance_status
        );
    end if;
end$$;

-- Define a composite type for grade records
do $$
begin
    if not exists (select 1 from pg_type where typname = 'grade_record') then
        create type public.grade_record as (
            student_id uuid,
            score numeric(5, 2)
        );
    end if;
end$$;


-- Create tables
create table if not exists public.profiles (
    id uuid not null primary key,
    created_at timestamp with time zone not null default now(),
    full_name text,
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
    account_status public.account_status not null default 'Free'::public.account_status,
    role public.user_role not null default 'teacher'::public.user_role,
    active_school_year_id uuid,
    constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);
comment on table public.profiles is 'User profiles supplementing auth.users.';

create table if not exists public.school_years (
    id uuid not null primary key default uuid_generate_v4(),
    name text not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint school_years_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    unique(teacher_id, name)
);
comment on table public.school_years is 'Stores school academic years and semesters.';

-- Add foreign key from profiles to school_years
alter table public.profiles
    add constraint profiles_active_school_year_id_fkey foreign key (active_school_year_id) references public.school_years (id) on delete set null;


create table if not exists public.classes (
    id uuid not null primary key default uuid_generate_v4(),
    name text not null,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint classes_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);
comment on table public.classes is 'Stores class information.';

create table if not exists public.subjects (
    id uuid not null primary key default uuid_generate_v4(),
    name text not null,
    kkm integer not null default 75,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint subjects_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);
comment on table public.subjects is 'Stores subject information.';

create table if not exists public.students (
    id uuid not null primary key default uuid_generate_v4(),
    name text not null,
    nis text not null,
    gender text not null,
    class_id uuid not null,
    status public.student_status not null default 'active'::public.student_status,
    created_at timestamp with time zone not null default now(),
    constraint students_class_id_fkey foreign key (class_id) references public.classes (id) on delete cascade,
    constraint students_nis_class_id_teacher_id_key unique (nis, class_id)
);
comment on table public.students is 'Stores student data.';

-- Add index for faster lookups
create index if not exists students_class_id_idx on public.students (class_id);
create index if not exists students_status_idx on public.students (status);


create table if not exists public.journals (
    id uuid not null primary key default uuid_generate_v4(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid,
    meeting_number integer,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint journals_class_id_fkey foreign key (class_id) references public.classes (id) on delete cascade,
    constraint journals_subject_id_fkey foreign key (subject_id) references public.subjects (id) on delete cascade,
    constraint journals_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint journals_school_year_id_fkey foreign key (school_year_id) references public.school_years(id) on delete set null
);
comment on table public.journals is 'Teaching journals for each session.';

create table if not exists public.agendas (
    id uuid not null primary key default uuid_generate_v4(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid not null,
    created_at timestamp with time zone not null default now(),
    constraint agendas_teacher_id_fkey foreign key (teacher_id) references auth.users(id) on delete cascade
);
comment on table public.agendas is 'Personal agendas and reminders for teachers.';


create table if not exists public.schedule (
    id uuid not null primary key default uuid_generate_v4(),
    day text not null,
    start_time time not null,
    end_time time not null,
    class_id uuid not null,
    subject_id uuid not null,
    teacher_id uuid not null,
    constraint schedule_class_id_fkey foreign key (class_id) references public.classes (id) on delete cascade,
    constraint schedule_subject_id_fkey foreign key (subject_id) references public.subjects (id) on delete cascade,
    constraint schedule_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade
);
comment on table public.schedule is 'Weekly teaching schedule.';

create table if not exists public.attendance_history (
    id uuid not null primary key default uuid_generate_v4(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid,
    meeting_number integer not null,
    records jsonb not null,
    teacher_id uuid not null,
    constraint attendance_history_class_id_fkey foreign key (class_id) references public.classes (id) on delete cascade,
    constraint attendance_history_subject_id_fkey foreign key (subject_id) references public.subjects (id) on delete cascade,
    constraint attendance_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint attendance_history_school_year_id_fkey foreign key (school_year_id) references public.school_years(id) on delete set null
);
comment on table public.attendance_history is 'Historical attendance records.';

create table if not exists public.grade_history (
    id uuid not null primary key default uuid_generate_v4(),
    date date not null,
    class_id uuid not null,
    subject_id uuid not null,
    school_year_id uuid,
    assessment_type text not null,
    records jsonb not null,
    teacher_id uuid not null,
    constraint grade_history_class_id_fkey foreign key (class_id) references public.classes (id) on delete cascade,
    constraint grade_history_subject_id_fkey foreign key (subject_id) references public.subjects (id) on delete cascade,
    constraint grade_history_teacher_id_fkey foreign key (teacher_id) references auth.users (id) on delete cascade,
    constraint grade_history_school_year_id_fkey foreign key (school_year_id) references public.school_years(id) on delete set null
);
comment on table public.grade_history is 'Historical grade records.';

create table if not exists public.activation_codes (
    id serial primary key,
    code text not null unique,
    is_used boolean not null default false,
    used_by uuid,
    used_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    used_by_email text,
    constraint activation_codes_used_by_fkey foreign key (used_by) references public.profiles (id) on delete set null
);
comment on table public.activation_codes is 'Activation codes for Pro accounts.';

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
comment on function public.handle_new_user() is 'Automatically creates a profile for a new user.';

-- Trigger for new user creation
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to handle user deletion
create or replace function public.handle_user_delete()
returns trigger as $$
begin
  delete from public.profiles where id = old.id;
  return old;
end;
$$ language plpgsql security definer;

-- Trigger for user deletion
create or replace trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();

-- Function to activate a user account with a code
create or replace function activate_account_with_code(
    activation_code_to_use text,
    user_id_to_activate uuid,
    user_email_to_set text
)
returns void as $$
declare
    code_id_to_use int;
begin
    -- Find the ID of the provided, unused activation code
    select id into code_id_to_use
    from public.activation_codes
    where code = activation_code_to_use and not is_used;

    -- If no such code is found, raise an exception
    if code_id_to_use is null then
        raise exception 'Code not found or already used';
    end if;

    -- Mark the code as used
    update public.activation_codes
    set 
        is_used = true,
        used_by = user_id_to_activate,
        used_by_email = user_email_to_set,
        used_at = now()
    where id = code_id_to_use;

    -- Update the user's profile to Pro
    update public.profiles
    set account_status = 'Pro'
    where id = user_id_to_activate;
end;
$$ language plpgsql security definer;


-- Function to add a student, ensuring the class belongs to the calling teacher
create or replace function add_student_with_teacher_check(
    p_class_id uuid,
    p_nis text,
    p_name text,
    p_gender text
)
returns void as $$
declare
    v_teacher_id uuid;
begin
    -- Get the teacher_id of the current authenticated user
    v_teacher_id := auth.uid();

    -- Check if a student with the same NIS already exists for this teacher across all their classes
    if exists (
        select 1
        from public.students s
        join public.classes c on s.class_id = c.id
        where s.nis = p_nis and c.teacher_id = v_teacher_id
    ) then
        raise exception 'NIS already exists for this teacher';
    end if;

    -- Verify that the class_id belongs to the current teacher
    if not exists (
        select 1 from public.classes
        where id = p_class_id and teacher_id = v_teacher_id
    ) then
        raise exception 'Invalid class ID for this teacher';
    end if;

    -- Insert the new student
    insert into public.students (class_id, nis, name, gender, status)
    values (p_class_id, p_nis, p_name, p_gender, 'active');

end;
$$ language plpgsql security definer;

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.journals enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_history enable row level security;
alter table public.grade_history enable row level security;
alter table public.activation_codes enable row level security;
alter table public.school_years enable row level security;
alter table public.agendas enable row level security;

-- Policies for profiles
create or replace policy "Users can view their own profile." on public.profiles for select using (auth.uid() = id);
create or replace policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create or replace policy "Admins can manage all profiles." on public.profiles for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for classes
create or replace policy "Teachers can manage their own classes." on public.classes for all using (auth.uid() = teacher_id);
create or replace policy "Admins can manage all classes." on public.classes for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for subjects
create or replace policy "Teachers can manage their own subjects." on public.subjects for all using (auth.uid() = teacher_id);
create or replace policy "Admins can manage all subjects." on public.subjects for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for school_years
create or replace policy "Teachers can manage their own school years." on public.school_years for all using (auth.uid() = teacher_id);
create or replace policy "Admins can manage all school years." on public.school_years for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for students
create or replace policy "Teachers can manage students in their own classes." on public.students for all
using (
  class_id in (select id from public.classes where teacher_id = auth.uid())
);
create or replace policy "Admins can manage all students." on public.students for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for journals
create or replace policy "Teachers can manage their own journals." on public.journals for all using (auth.uid() = teacher_id);
create or replace policy "Admins can read all journals." on public.journals for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for schedule
create or replace policy "Teachers can manage their own schedule." on public.schedule for all using (auth.uid() = teacher_id);
create or replace policy "Admins can read all schedules." on public.schedule for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for agendas
create or replace policy "Teachers can manage their own agendas." on public.agendas for all using (auth.uid() = teacher_id);

-- Policies for attendance_history
create or replace policy "Teachers can manage their own attendance history." on public.attendance_history for all using (auth.uid() = teacher_id);
create or replace policy "Admins can read all attendance history." on public.attendance_history for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for grade_history
create or replace policy "Teachers can manage their own grade history." on public.grade_history for all using (auth.uid() = teacher_id);
create or replace policy "Admins can read all grade history." on public.grade_history for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Policies for activation_codes
create or replace policy "Admins can manage activation codes." on public.activation_codes for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);
create or replace policy "Authenticated users can read activation codes." on public.activation_codes for select using (auth.role() = 'authenticated');


-- Storage policies
CREATE POLICY "Allow public read access to profile images" ON storage.objects
FOR SELECT
USING ( bucket_id = 'profile-images' );

CREATE POLICY "Allow authenticated users to upload their own images" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Allow authenticated users to update their own images" ON storage.objects
FOR UPDATE
USING (
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
