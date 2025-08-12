-- ===============================================================================================
-- 1. EXTENSIONS
-- ===============================================================================================
create extension if not exists "moddatetime" with schema "extensions";

-- ===============================================================================================
-- 2. TABLES
-- ===============================================================================================

-- Table: profiles
-- Stores user profile information, linked to auth.users.
create table if not exists "public"."profiles" (
    "id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "full_name" text,
    "avatar_url" text,
    "nip" text,
    "pangkat" text,
    "jabatan" text,
    "school_name" text,
    "school_address" text,
    "headmaster_name" text,
    "headmaster_nip" text,
    "school_logo_url" text,
    "account_status" text default 'Free'::text,
    "role" text default 'teacher'::text,
    "email" text,
    "active_school_year_id" uuid,
    constraint "profiles_pkey" primary key ("id"),
    constraint "profiles_id_fkey" foreign key ("id") references "auth"."users" ("id") on delete cascade,
    constraint "profiles_role_check" check (("role" = ANY (ARRAY['teacher'::text, 'admin'::text]))),
    constraint "profiles_account_status_check" check (("account_status" = ANY (ARRAY['Free'::text, 'Pro'::text])))
);
alter table "public"."profiles" enable row level security;

-- Table: school_years
-- Stores academic years defined by the teacher.
create table if not exists "public"."school_years" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "name" text not null,
    "teacher_id" uuid not null,
    constraint "school_years_pkey" primary key ("id"),
    constraint "school_years_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."school_years" enable row level security;

-- Add foreign key from profiles to school_years AFTER school_years table is created
alter table "public"."profiles" add constraint "profiles_active_school_year_id_fkey" foreign key ("active_school_year_id") references "public"."school_years" ("id") on delete set null;


-- Table: classes
-- Stores classes managed by a teacher.
create table if not exists "public"."classes" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "classes_pkey" primary key ("id"),
    constraint "classes_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."classes" enable row level security;

-- Table: subjects
-- Stores subjects taught by a teacher.
create table if not exists "public"."subjects" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "kkm" smallint not null default 75,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "subjects_pkey" primary key ("id"),
    constraint "subjects_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."subjects" enable row level security;

-- Table: students
-- Stores student data, linked to a class.
create table if not exists "public"."students" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "nis" text not null,
    "nisn" text not null,
    "gender" text not null,
    "class_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "status" text default 'active'::text,
    constraint "students_pkey" primary key ("id"),
    constraint "students_class_id_fkey" foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    constraint "students_gender_check" check (("gender" = ANY (ARRAY['Laki-laki'::text, 'Perempuan'::text])))
);
alter table "public"."students" enable row level security;

-- Table: schedule
-- Stores weekly teaching schedules.
create table if not exists "public"."schedule" (
    "id" uuid not null default gen_random_uuid(),
    "day" text not null,
    "start_time" time without time zone not null,
    "end_time" time without time zone not null,
    "subject_id" uuid not null,
    "class_id" uuid not null,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "schedule_pkey" primary key ("id"),
    constraint "schedule_class_id_fkey" foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    constraint "schedule_subject_id_fkey" foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    constraint "schedule_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."schedule" enable row level security;

-- Table: attendance_history
-- Stores historical attendance records.
create table if not exists "public"."attendance_history" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "class_id" uuid not null,
    "subject_id" uuid not null,
    "school_year_id" uuid,
    "meeting_number" smallint not null,
    "records" jsonb not null,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "attendance_history_pkey" primary key ("id"),
    constraint "attendance_history_class_id_fkey" foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    constraint "attendance_history_subject_id_fkey" foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    constraint "attendance_history_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade,
    constraint "attendance_history_school_year_id_fkey" foreign key ("school_year_id") references "public"."school_years" ("id") on delete set null
);
alter table "public"."attendance_history" enable row level security;

-- Table: grade_history
-- Stores historical grade records.
create table if not exists "public"."grade_history" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "class_id" uuid not null,
    "subject_id" uuid not null,
    "school_year_id" uuid,
    "assessment_type" text not null,
    "records" jsonb not null,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "grade_history_pkey" primary key ("id"),
    constraint "grade_history_class_id_fkey" foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    constraint "grade_history_subject_id_fkey" foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    constraint "grade_history_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade,
    constraint "grade_history_school_year_id_fkey" foreign key ("school_year_id") references "public"."school_years" ("id") on delete set null
);
alter table "public"."grade_history" enable row level security;

-- Table: journals
-- Stores teacher's teaching journals.
create table if not exists "public"."journals" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "class_id" uuid not null,
    "subject_id" uuid not null,
    "school_year_id" uuid,
    "meeting_number" smallint,
    "learning_objectives" text not null,
    "learning_activities" text not null,
    "assessment" text,
    "reflection" text,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    constraint "journals_pkey" primary key ("id"),
    constraint "journals_class_id_fkey" foreign key ("class_id") references "public"."classes" ("id") on delete cascade,
    constraint "journals_subject_id_fkey" foreign key ("subject_id") references "public"."subjects" ("id") on delete cascade,
    constraint "journals_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade,
    constraint "journals_school_year_id_fkey" foreign key ("school_year_id") references "public"."school_years" ("id") on delete set null
);
alter table "public"."journals" enable row level security;

-- Table: agendas
-- Stores personal teacher agendas.
create table if not exists "public"."agendas" (
    "id" uuid not null default gen_random_uuid(),
    "date" date not null,
    "title" text not null,
    "description" text,
    "tag" text,
    "color" text,
    "start_time" time,
    "end_time" time,
    "teacher_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    constraint "agendas_pkey" primary key ("id"),
    constraint "agendas_teacher_id_fkey" foreign key ("teacher_id") references "auth"."users" ("id") on delete cascade
);
alter table "public"."agendas" enable row level security;

-- Table: activation_codes
-- Stores activation codes for Pro accounts.
create table if not exists "public"."activation_codes" (
    "id" uuid not null default gen_random_uuid(),
    "code" character varying not null,
    "is_used" boolean not null default false,
    "used_by" uuid,
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    constraint "activation_codes_pkey" primary key ("id"),
    constraint "activation_codes_code_key" unique ("code"),
    constraint "activation_codes_used_by_fkey" foreign key ("used_by") references "auth"."users" ("id") on delete set null
);
alter table "public"."activation_codes" enable row level security;

-- ===============================================================================================
-- 3. TRIGGERS
-- ===============================================================================================

-- Trigger for `profiles` table to handle new user creation.
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
      'teacher', -- Default role
      'Free'     -- Default account status
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Trigger for `profiles` table to handle user deletion.
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

create or replace trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute procedure public.handle_user_delete();


-- Trigger to automatically update `updated_at` timestamp on `journals` table.
create or replace trigger handle_updated_at
before update on public.journals
for each row
execute procedure extensions.moddatetime (updated_at);

-- ===============================================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================================================================

-- RLS for profiles
drop policy if exists "Users can view their own profile." on public.profiles;
create policy "Users can view their own profile." on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Admins can manage all profiles." on public.profiles;
create policy "Admins can manage all profiles." on public.profiles for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- RLS for school_years
drop policy if exists "Users can manage their own school years." on public.school_years;
create policy "Users can manage their own school years." on public.school_years for all using (auth.uid() = teacher_id);

-- RLS for classes
drop policy if exists "Users can manage their own classes." on public.classes;
create policy "Users can manage their own classes." on public.classes for all using (auth.uid() = teacher_id);

-- RLS for subjects
drop policy if exists "Users can manage their own subjects." on public.subjects;
create policy "Users can manage their own subjects." on public.subjects for all using (auth.uid() = teacher_id);

-- RLS for students
drop policy if exists "Users can manage students in their classes." on public.students;
create policy "Users can manage students in their classes." on public.students for all using (
    class_id in (select id from public.classes where teacher_id = auth.uid())
);

-- RLS for schedule
drop policy if exists "Users can manage their own schedule." on public.schedule;
create policy "Users can manage their own schedule." on public.schedule for all using (auth.uid() = teacher_id);

-- RLS for attendance_history
drop policy if exists "Users can manage their own attendance history." on public.attendance_history;
create policy "Users can manage their own attendance history." on public.attendance_history for all using (auth.uid() = teacher_id);

-- RLS for grade_history
drop policy if exists "Users can manage their own grade history." on public.grade_history;
create policy "Users can manage their own grade history." on public.grade_history for all using (auth.uid() = teacher_id);

-- RLS for journals
drop policy if exists "Users can manage their own journals." on public.journals;
create policy "Users can manage their own journals." on public.journals for all using (auth.uid() = teacher_id);

-- RLS for agendas
drop policy if exists "Users can manage their own agendas." on public.agendas;
create policy "Users can manage their own agendas." on public.agendas for all using (auth.uid() = teacher_id);

-- RLS for activation_codes
drop policy if exists "Admins can manage activation codes." on public.activation_codes;
create policy "Admins can manage activation codes." on public.activation_codes for all using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
) with check (
    (select role from public.profiles where id = auth.uid()) = 'admin'
);
drop policy if exists "Authenticated users can read activation codes." on public.activation_codes;
create policy "Authenticated users can read activation codes." on public.activation_codes for select using (auth.role() = 'authenticated');


-- ===============================================================================================
-- 5. RPC FUNCTIONS
-- ===============================================================================================

-- Function to activate a user account and mark the code as used in a single transaction.
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
  code_is_used boolean;
begin
  -- Check if the code exists and is not used
  select id, is_used into code_id, code_is_used
  from public.activation_codes
  where code = activation_code_to_use;

  if code_id is null then
    raise exception 'Code not found';
  end if;

  if code_is_used then
    raise exception 'Code already used';
  end if;

  -- Update the profiles table
  update public.profiles
  set account_status = 'Pro'
  where id = user_id_to_activate;

  -- Mark the code as used
  update public.activation_codes
  set
    is_used = true,
    used_by = user_id_to_activate,
    used_at = now()
  where id = code_id;
end;
$$;
