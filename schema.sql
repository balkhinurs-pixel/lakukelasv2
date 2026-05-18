
-- ==========================================================
-- LAKUKELAS DATABASE BLUEPRINT
-- VERSION: V19.2 (Permission Fix)
-- ==========================================================

-- 0. CLEANUP (Optional - Use with caution)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Table: profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
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
  gemini_api_key text
);

-- Table: school_years
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Table: classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references auth.users(id), -- Walikelas
  created_at timestamptz default now()
);

-- Table: subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Table: schedule
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Table: students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id),
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- Table: attendance_records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  school_year_id uuid references public.school_years(id),
  meeting_number int,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- Table: grade_records
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  school_year_id uuid references public.school_years(id),
  assessment_type text not null,
  score decimal not null,
  created_at timestamptz default now()
);

-- Table: journal_entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete cascade,
  school_year_id uuid references public.school_years(id),
  meeting_number int,
  learning_objectives text,
  learning_activities text,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- Table: agendas
create table if not exists public.agendas (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

-- Table: teacher_attendance
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now()
);

-- Table: settings
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Table: activation_tokens
create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references auth.users(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- AI & DRIVE MODULE TABLES
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

-- 4. FUNCTIONS (RPC)

create or replace function public.get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) language sql security definer as $$
  select 
    p.id as teacher_id,
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
    v_count_expected bigint;
    v_count_present bigint;
    v_count_late bigint;
begin
    -- 1. Ambil kebijakan absensi
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    -- 2. Tentukan siapa saja yang wajib hadir hari ini
    if v_policy = 'daily_based' then
        -- Seluruh guru & kepala sekolah aktif
        select array_agg(id) into v_expected_ids from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        -- Hanya yang ada jadwal mengajar hari ini
        select array_agg(distinct teacher_id) into v_expected_ids from public.schedule where day = (
            select case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
                when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
            end
        );
    end if;

    v_count_expected := coalesce(cardinality(v_expected_ids), 0);

    -- 3. Hitung realita kehadiran
    select count(*) into v_count_present from public.teacher_attendance where date = p_date and teacher_id = any(v_expected_ids) and check_in is not null;
    select count(*) into v_count_late from public.teacher_attendance where date = p_date and teacher_id = any(v_expected_ids) and status = 'Terlambat';

    return query select 
        v_count_expected,
        v_count_present,
        v_count_late,
        (v_count_expected - v_count_present) as total_absent,
        case when v_count_expected > 0 then round((v_count_present::numeric / v_count_expected::numeric) * 100, 2) else 0 end;
end;
$$;

-- AUTOMATIC ADMIN TRIGGER
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

-- 5. RLS & PERMISSIONS (V19.2 Fix)

-- Pastikan peran database memiliki akses dasar ke schema public
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.schedule enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- Open policies for profiles (Essential for Middleware)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
on public.profiles for select
using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id);

-- Other critical policies
create policy "Public can see school years" on public.school_years for select using (true);
create policy "Users manage own school years" on public.school_years for all using (auth.uid() = teacher_id);

create policy "Public can see classes" on public.classes for select using (true);
create policy "Admins can manage classes" on public.classes for all using (true);

create policy "Questions managed by owner" on public.questions for all using (auth.uid() = created_by);
create policy "Drive integration managed by owner" on public.google_drive_integrations for all using (auth.uid() = user_id);

-- 6. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_schedule_teacher on public.schedule(teacher_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_student on public.grade_records(student_id);
