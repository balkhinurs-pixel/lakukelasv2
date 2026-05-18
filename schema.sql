
-- LakuKelas Database Blueprint V18.4
-- Author: App Prototyper
-- Description: Full schema including AI module and Google Drive integration

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. DROP EXISTING OBJECTS (IN REVERSE ORDER)
drop view if exists public.journal_entries_with_names;
drop view if exists public.grades_history;
drop view if exists public.attendance_history;
drop view if exists public.student_notes_with_teacher;
drop function if exists public.get_teacher_activity_counts;
drop function if exists public.get_teacher_attendance_summary;

-- 3. TABLES DEFINITION (BASE)

-- Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text default 'User LakuKelas',
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  gemini_api_key text,
  created_at timestamptz default now()
);

-- School Years
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete set null,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Schedule
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Attendance Records
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

-- Grade Records
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score decimal(5,2) not null,
  created_at timestamptz default now()
);

-- Journal Entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null default current_date,
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- Teacher Attendance (Log Masuk/Pulang Staf)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- Agendas
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

-- Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  link_url text not null,
  created_at timestamptz default now()
);

-- Holidays
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national' check (type in ('national', 'school'))
);

-- Student Notes
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- Settings
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Activation Tokens
create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now()
);

-- AI Questions (Bank Soal)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
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

-- Google Drive Integration
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

-- AI Documents
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

-- 4. VIEWS

create or replace view public.attendance_history as
select 
  ar.*,
  s.name as student_name,
  c.name as class_name,
  sb.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records ar
join public.students s on ar.student_id = s.id
join public.classes c on ar.class_id = c.id
join public.subjects sb on ar.subject_id = sb.id
join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
  gr.*,
  s.name as student_name,
  c.name as class_name,
  sb.name as subject_name,
  sb.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records gr
join public.students s on gr.student_id = s.id
join public.classes c on gr.class_id = c.id
join public.subjects sb on gr.subject_id = sb.id
join public.profiles p on gr.teacher_id = p.id;

create or replace view public.journal_entries_with_names as
select 
  je.*,
  c.name as "className",
  s.name as "subjectName"
from public.journal_entries je
left join public.classes c on je.class_id = c.id
left join public.subjects s on je.subject_id = s.id;

create or replace view public.student_notes_with_teacher as
select 
  sn.*,
  p.full_name as teacher_name
from public.student_notes sn
join public.profiles p on sn.teacher_id = p.id;

-- 5. FUNCTIONS (RPC)

create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
  total_expected bigint,
  total_present bigint,
  total_late bigint,
  total_absent bigint,
  attendance_rate decimal
) 
language plpgsql
security definer
as $$
declare
  v_policy text;
  v_expected_count bigint;
  v_day_name text;
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  v_day_name := trim(to_char(p_date, 'Day'));
  
  -- Indonesian day mapping
  v_day_name := case 
    when v_day_name = 'Monday' then 'Senin'
    when v_day_name = 'Tuesday' then 'Selasa'
    when v_day_name = 'Wednesday' then 'Rabu'
    when v_day_name = 'Thursday' then 'Kamis'
    when v_day_name = 'Friday' then 'Jumat'
    when v_day_name = 'Saturday' then 'Sabtu'
    when v_day_name = 'Sunday' then 'Minggu'
    else v_day_name
  end;

  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    select count(distinct teacher_id) into v_expected_count from public.schedule where day = v_day_name;
  end if;

  return query
  select 
    v_expected_count as total_expected,
    count(*) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
    count(*) filter (where status = 'Terlambat') as total_late,
    (v_expected_count - count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))) as total_absent,
    case when v_expected_count = 0 then 100 
         else round((count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))::decimal / v_expected_count) * 100, 1)
    end as attendance_rate
  from public.teacher_attendance
  where date = p_date;
end;
$$;

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
  where p.role in ('teacher', 'headmaster', 'admin') and p.is_activated = true;
$$;

-- 6. SECURITY (RLS & POLICIES)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.agendas enable row level security;
alter table public.materials enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- Example Global Policies
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Classes viewable by everyone" on public.classes for select using (true);
create policy "Admins can manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Everyone can view schedules" on public.schedule for select using (true);
create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Users can manage own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Users can manage own docs" on public.ai_documents for all using (auth.uid() = user_id);

-- 7. INDEXES
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_journal_date on public.journal_entries(date);
create index if not exists idx_questions_topic on public.questions(topic);
