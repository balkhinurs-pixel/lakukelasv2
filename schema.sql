-- LakuKelas Database Blueprint
-- Version: V18.5 (Integrated Auth Sync)
-- Last Updated: May 2024

-- ==========================================
-- 1. EXTENSIONS & INITIAL DROPS
-- ==========================================
create extension if not exists "uuid-ossp";

drop view if exists public.journal_entries_with_names;
drop view if exists public.attendance_history;
drop view if exists public.grades_history;
drop view if exists public.student_notes_with_teacher;
drop function if exists public.get_teacher_activity_counts();
drop function if exists public.get_teacher_attendance_summary(date);
drop function if exists public.handle_new_user();

-- ==========================================
-- 2. MASTER TABLES
-- ==========================================

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text check (role in ('admin', 'teacher', 'headmaster')) default 'teacher',
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  gemini_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLASSES
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null, -- Wali Kelas
  created_at timestamptz default now()
);

-- SUBJECTS
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- STUDENTS
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active',
  avatar_url text,
  created_at timestamptz default now()
);

-- SCHEDULE
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- ==========================================
-- 3. TRANSACTIONAL TABLES
-- ==========================================

-- ATTENDANCE RECORDS
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  status text not null,
  meeting_number integer,
  school_year_id uuid,
  created_at timestamptz default now()
);

-- GRADE RECORDS
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  assessment_type text not null,
  score numeric(5,2) not null,
  school_year_id uuid,
  created_at timestamptz default now()
);

-- JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  meeting_number integer,
  learning_objectives text,
  learning_activities text,
  assessment text,
  reflection text,
  school_year_id uuid,
  created_at timestamptz default now()
);

-- ==========================================
-- 4. AI & INTEGRATION TABLES
-- ==========================================

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  generation_group_id uuid,
  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,
  sort_order int not null,
  question_type text not null,
  question_text text not null,
  options_json jsonb,
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  status text default 'draft',
  needs_review boolean default true,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ==========================================
-- 5. VIEWS
-- ==========================================

create or replace view public.journal_entries_with_names as
select 
  j.*,
  c.name as "className",
  s.name as "subjectName"
from public.journal_entries j
left join public.classes c on j.class_id = c.id
left join public.subjects s on j.subject_id = s.id;

create or replace view public.attendance_history as
select
  a.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records a
left join public.students s on a.student_id = s.id
left join public.classes c on a.class_id = c.id
left join public.subjects sub on a.subject_id = sub.id
left join public.profiles p on a.teacher_id = p.id;

create or replace view public.grades_history as
select
  g.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records g
left join public.students s on g.student_id = s.id
left join public.classes c on g.class_id = c.id
left join public.subjects sub on g.subject_id = sub.id
left join public.profiles p on g.teacher_id = p.id;

-- ==========================================
-- 6. FUNCTIONS (RPC)
-- ==========================================

create or replace function public.get_teacher_activity_counts()
returns table (
  id uuid,
  attendance_count bigint,
  grades_count bigint,
  journal_count bigint,
  classes_handled_count bigint
) as $$
begin
  return query
  select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p;
end;
$$ language plpgsql;

create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
  total_expected bigint,
  total_present bigint,
  total_late bigint,
  total_absent bigint,
  attendance_rate bigint
) as $$
declare
  v_policy text;
  v_expected_count bigint;
  v_present_count bigint;
  v_late_count bigint;
  v_day_name text;
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  v_day_name := trim(to_char(p_date, 'Day'));
  -- Mapping English to Indonesian Day
  if v_day_name = 'Monday' then v_day_name := 'Senin';
  elsif v_day_name = 'Tuesday' then v_day_name := 'Selasa';
  elsif v_day_name = 'Wednesday' then v_day_name := 'Rabu';
  elsif v_day_name = 'Thursday' then v_day_name := 'Kamis';
  elsif v_day_name = 'Friday' then v_day_name := 'Jumat';
  elsif v_day_name = 'Saturday' then v_day_name := 'Sabtu';
  elsif v_day_name = 'Sunday' then v_day_name := 'Minggu';
  end if;

  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    select count(distinct teacher_id) into v_expected_count from public.schedule where day = v_day_name;
  end if;

  select count(*) into v_present_count from public.teacher_attendance where date = p_date and status in ('Tepat Waktu', 'Terlambat');
  select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';
  
  return query select 
    v_expected_count,
    v_present_count,
    v_late_count,
    greatest(0, v_expected_count - v_present_count),
    case when v_expected_count > 0 then (v_present_count * 100 / v_expected_count) else 0 end;
end;
$$ language plpgsql;

-- ==========================================
-- 7. AUTH & SYNC TRIGGER
-- ==========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    'teacher',
    false
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 8. SECURITY (RLS)
-- ==========================================

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Users can manage own drive integration" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Users can manage own AI documents" on public.ai_documents for all using (auth.uid() = user_id);
