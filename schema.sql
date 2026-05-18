
-- LAKUKELAS DATABASE BLUEPRINT
-- VERSION: V18.9
-- DESCRIPTION: Fix RLS recursion and robust Admin-first logic

-- 0. CLEANUP (Optional: Uncomment to reset)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;
-- drop view if exists public.student_notes_with_teacher;
-- drop function if exists public.get_teacher_activity_counts;
-- drop function if exists public.get_teacher_attendance_summary;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz default now(),
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
  gemini_api_key text
);

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  is_active boolean default false
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null -- Wali Kelas
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive'))
);

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number integer not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score numeric not null
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text
);

create table if not exists public.agendas (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time
);

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null,
  reason text,
  unique(teacher_id, date)
);

create table if not exists public.materials (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    title text not null,
    description text,
    link_url text not null
);

create table if not exists public.student_notes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
    date timestamptz default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national' check (type in ('national', 'school'))
);

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists public.activation_tokens (
    id uuid primary key default gen_random_uuid(),
    token text unique not null,
    created_at timestamptz default now(),
    used_by uuid references public.profiles(id),
    used_at timestamptz
);

-- AI & DRIVE TABLES (V18+)
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
    a.*,
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name
from public.attendance_records a
left join public.classes c on a.class_id = c.id
left join public.subjects s on a.subject_id = s.id
left join public.profiles p on a.teacher_id = p.id;

create or replace view public.grades_history as
select 
    g.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
from public.grade_records g
left join public.classes c on g.class_id = c.id
left join public.subjects s on g.subject_id = s.id
left join public.profiles p on g.teacher_id = p.id;

create or replace view public.student_notes_with_teacher as
select 
    sn.*,
    p.full_name as teacher_name
from public.student_notes sn
left join public.profiles p on sn.teacher_id = p.id;

-- 4. FUNCTIONS (RPC)
create or replace function public.get_teacher_activity_counts()
returns table (
    id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) language sql security definer set search_path = public as $$
  select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p;
$$;

create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
    total_expected bigint,
    total_present bigint,
    total_late bigint,
    total_absent bigint,
    attendance_rate numeric
) language plpgsql security definer set search_path = public as $$
declare
    v_policy text;
    v_expected_count bigint;
    v_present_count bigint;
    v_late_count bigint;
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    if v_policy = 'daily_based' then
        select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into v_expected_count from public.schedule where day = (
            select case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
                when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
            end
        );
    end if;
    select count(*) into v_present_count from public.teacher_attendance where date = p_date and check_in is not null;
    select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';
    return query select 
        v_expected_count,
        v_present_count,
        v_late_count,
        greatest(0, v_expected_count - v_present_count),
        case when v_expected_count = 0 then 100 else round((v_present_count::numeric / v_expected_count::numeric) * 100, 1) end;
end;
$$;

-- AUTO-ADMIN FUNCTION
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;

  if is_first_user then
    insert into public.profiles (id, full_name, avatar_url, role, is_activated)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
      new.raw_user_meta_data->>'avatar_url',
      'admin',
      true
    );
  else
    insert into public.profiles (id, full_name, avatar_url, role, is_activated)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
      new.raw_user_meta_data->>'avatar_url',
      'teacher',
      false
    );
  end if;
  return new;
end;
$$;

-- TRIGGER
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. RLS (ROW LEVEL SECURITY)
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- 6. POLICIES
-- Profiles: Bypass recursion with simple check
create policy "Profiles are viewable by owner" on public.profiles for select using (auth.uid() = id);
create policy "Profiles are viewable by admins" on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "Profiles are updateable by owner" on public.profiles for update using (auth.uid() = id);
create policy "Profiles are manageable by admins" on public.profiles for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- General Access
create policy "Public read for authenticated" on public.school_years for select to authenticated using (true);
create policy "Public read for authenticated classes" on public.classes for select to authenticated using (true);
create policy "Public read for authenticated subjects" on public.subjects for select to authenticated using (true);
create policy "Public read for authenticated students" on public.students for select to authenticated using (true);
create policy "Public read for authenticated schedule" on public.schedule for select to authenticated using (true);

-- Manage Own Data
create policy "Users can manage own journals" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "Users can manage own attendance" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "Users can manage own grades" on public.grade_records for all using (auth.uid() = teacher_id);
create policy "Users can manage own agendas" on public.agendas for all using (auth.uid() = teacher_id);
create policy "Users can manage own teacher_attendance" on public.teacher_attendance for all using (auth.uid() = teacher_id);
create policy "Users can manage own materials" on public.materials for all using (auth.uid() = teacher_id);
create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Users can manage own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Users can manage own ai_docs" on public.ai_documents for all using (auth.uid() = user_id);

-- Admin Global Manage
create policy "Admins can manage everything" on public.school_years for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admins can manage classes" on public.classes for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admins can manage subjects" on public.subjects for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admins can manage students" on public.students for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));
create policy "Admins can manage schedule" on public.schedule for all using (exists(select 1 from public.profiles where id=auth.uid() and role='admin'));

-- 7. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(date);
