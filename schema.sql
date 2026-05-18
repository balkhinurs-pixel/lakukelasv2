
-- LakuKelas Database Blueprint
-- Version: V19.2
-- Description: Full schema with Modul AI, Google Drive Integration, and Fix for Admin First Login (Grant Permissions)

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
-- Profiles: Main user table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Schedule
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- Attendance Records (Students)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid, -- Reference to school_years if table exists
  date date not null,
  meeting_number int not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- Grade Records (Students)
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid,
  date date not null,
  assessment_type text not null,
  score numeric not null check (score >= 0 and score <= 100),
  created_at timestamptz default now()
);

-- Journal Entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid,
  date timestamptz default now(),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- Agendas (Personal)
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

-- Teacher Attendance (Log Presence)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null,
  reason text,
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

-- Google Drive Integrations
create table if not exists public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
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

-- AI Documents Export History
create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null,
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Settings Table (Global Config)
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- School Years
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Holidays
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national',
  created_at timestamptz default now()
);

-- 3. VIEWS
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
    ar.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
from public.attendance_records ar
left join public.classes c on ar.class_id = c.id
left join public.subjects s on ar.subject_id = s.id
left join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
from public.grade_records gr
left join public.classes c on gr.class_id = c.id
left join public.subjects s on gr.subject_id = s.id
left join public.profiles p on gr.teacher_id = p.id;

-- 4. FUNCTIONS (RPC)
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
  where p.role in ('teacher', 'headmaster');
$$;

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
    v_expected_ids uuid[];
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    if v_policy = 'daily_based' then
        select array_agg(id) into v_expected_ids from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select array_agg(distinct teacher_id) into v_expected_ids from public.schedule where day = (
            case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
                when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
            end
        );
    end if;

    return query
    with stats as (
        select 
            coalesce(array_length(v_expected_ids, 1), 0)::bigint as expected,
            count(id) filter (where status in ('Tepat Waktu', 'Terlambat'))::bigint as present,
            count(id) filter (where status = 'Terlambat')::bigint as late
        from public.teacher_attendance
        where date = p_date and teacher_id = any(v_expected_ids)
    )
    select 
        expected,
        present,
        late,
        (expected - present) as absent,
        case when expected > 0 then round((present::numeric / expected::numeric) * 100, 1) else 100.0 end
    from stats;
end;
$$;

-- 5. TRIGGER: AUTO ADMIN & PROFILE SYNC
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  -- Cek apakah pendaftar pertama
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    case when is_first_user then 'admin' else 'teacher' end,
    case when is_first_user then true else false end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. RLS POLICIES (Simplified for Admin Detection)
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
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;
alter table public.settings enable row level security;
alter table public.school_years enable row level security;
alter table public.holidays enable row level security;

-- OPEN POLICIES (SELECT) - Essential for Middleware
create policy "Allow all authenticated users to read profiles" on public.profiles for select to authenticated using (true);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id);

-- ADMIN POLICIES (FULL ACCESS)
create policy "Admins have full access to everything" on public.profiles for all to authenticated 
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- USER DATA POLICIES (OWN DATA ONLY)
create policy "Users can manage own journal" on public.journal_entries for all to authenticated using (auth.uid() = teacher_id);
create policy "Users can manage own attendance" on public.attendance_records for all to authenticated using (auth.uid() = teacher_id);
create policy "Users can manage own grades" on public.grade_records for all to authenticated using (auth.uid() = teacher_id);
create policy "Users can manage own agenda" on public.agendas for all to authenticated using (auth.uid() = teacher_id);
create policy "Users can manage own questions" on public.questions for all to authenticated using (auth.uid() = created_by);

-- 7. GRANT PERMISSIONS (FIX FOR PROJECT PROJECTS)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to postgres, service_role;
grant select on public.profiles to anon, authenticated;
grant select on public.settings to anon, authenticated;
grant select on public.school_years to anon, authenticated;

-- 8. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_journal_date on public.journal_entries(date);
create index if not exists idx_questions_creator on public.questions(created_by);
