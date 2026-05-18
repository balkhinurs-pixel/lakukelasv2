
-- =========================================================
-- LAKUKELAS DATABASE BLUEPRINT - VERSION 18.6
-- Last Updated: 2025-05-18
-- Features: Auth, Profiles, Roster, Attendance, Grades, 
--           Journal, AI Questions, Google Drive, Auto-Admin
-- =========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. DROP EXISTING OBJECTS (FOR CLEAN SETUP)
drop view if exists public.journal_entries_with_names;
drop view if exists public.attendance_history;
drop view if exists public.grades_history;
drop view if exists public.student_notes_with_teacher;
drop view if exists public.ai_user_settings_safe;
drop function if exists public.get_teacher_activity_counts();
drop function if exists public.get_teacher_attendance_summary(date);
drop function if exists public.handle_new_user();

-- 3. TABLES DEFINITION

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  gemini_api_key text,
  created_at timestamptz default now()
);

-- SCHOOL YEARS
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- CLASSES
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- SUBJECTS
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- STUDENTS
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id),
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  created_at timestamptz default now()
);

-- SCHEDULE
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  day text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- ATTENDANCE RECORDS
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number int not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- GRADE RECORDS
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score int not null,
  created_at timestamptz default now()
);

-- JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date timestamptz default now(),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- AGENDAS
create table if not exists public.agendas (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  created_at timestamptz default now()
);

-- TEACHER ATTENDANCE (STAFF ABSENCE)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null check (status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- SETTINGS
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- HOLIDAYS
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'school' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

-- GOOGLE DRIVE INTEGRATIONS
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

-- AI QUESTIONS (BANK SOAL)
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

-- AI DOCUMENTS (EXPORT LOG)
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

-- 4. VIEWS DEFINITION

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
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records a
join public.classes c on a.class_id = c.id
join public.subjects s on a.subject_id = s.id
join public.profiles p on a.teacher_id = p.id;

create or replace view public.grades_history as
select 
  g.*,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records g
join public.classes c on g.class_id = c.id
join public.subjects s on g.subject_id = s.id
join public.profiles p on g.teacher_id = p.id;

-- 5. FUNCTIONS & RPC

-- TRIGGER: AUTO ASSIGN ADMIN TO FIRST USER
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_count int;
begin
  -- Hitung jumlah profil yang sudah ada
  select count(*) into user_count from public.profiles;
  
  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    -- Jika pendaftar pertama, jadikan admin dan aktifkan langsung
    case when user_count = 0 then 'admin' else 'teacher' end,
    case when user_count = 0 then true else false end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- TEACHER ACTIVITY STATS
create or replace function public.get_teacher_activity_counts()
returns table (
  id uuid,
  attendance_count bigint,
  grades_count bigint,
  journal_count bigint,
  classes_handled_count bigint
) language sql security definer as $$
  select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.is_activated = true;
$$;

-- ATTENDANCE SUMMARY FOR ADMIN
create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
  total_expected bigint,
  total_present bigint,
  total_late bigint,
  total_absent bigint,
  attendance_rate numeric
) language plpgsql security definer as $$
declare
  v_policy text;
  v_expected_count bigint;
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  v_policy := coalesce(v_policy, 'schedule_based');

  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    -- Base on schedule for current day name
    select count(distinct teacher_id) into v_expected_count 
    from public.schedule 
    where day = (
      case extract(dow from p_date)
        when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
        when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
      end
    );
  end if;

  return query
  select 
    v_expected_count as total_expected,
    count(*) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
    count(*) filter (where status = 'Terlambat') as total_late,
    (v_expected_count - count(*) filter (where status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'))) as total_absent,
    case when v_expected_count > 0 
      then round((count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))::numeric / v_expected_count) * 100, 1)
      else 100 
    end as attendance_rate
  from public.teacher_attendance
  where date = p_date;
end;
$$;

-- 6. RLS & POLICIES
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.settings enable row level security;
alter table public.holidays enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- Example Global Policy (simplified for blueprint)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Admins can manage everything" on public.profiles for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 7. INDEXES
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_journal_date on public.journal_entries(date);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(date);
create index if not exists idx_questions_topic on public.questions(topic);
