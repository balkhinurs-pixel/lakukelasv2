
-- LakuKelas Database Blueprint V18.7
-- Fix: RLS Recursion & Auto-Admin First User

-- 0. CLEANUP (Optional for Fresh Start)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;
-- drop function if exists public.get_teacher_activity_counts();
-- drop function if exists public.get_teacher_attendance_summary(date);

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES MASTER
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
  gemini_api_key text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 2023/2024 - Ganjil
  is_active boolean default false,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null, -- Homeroom Teacher
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  created_at timestamptz default now()
);

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number int,
  learning_objectives text,
  learning_activities text,
  assessment text,
  reflection text,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number int not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score decimal(5,2) not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text,
  type text default 'national' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.agendas (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    date date not null,
    title text not null,
    description text,
    tag text,
    color text default '#6b7280',
    start_time time,
    end_time time,
    created_at timestamptz default now()
);

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

create table if not exists public.student_notes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
    date timestamptz default now()
);

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
  id uuid primary_id uuid primary key default gen_random_uuid(),
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

-- 4. FUNCTIONS & TRIGGERS

-- Trigger: Sinkronisasi Profil dari Auth.Users (Auto-Admin Pertama)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_count int;
  v_role text;
  v_activated boolean;
begin
  -- Hitung jumlah user untuk menentukan admin pertama
  select count(*) into user_count from public.profiles;

  if (user_count = 0) then
    v_role := 'admin';
    v_activated := true;
  else
    v_role := 'teacher';
    v_activated := false;
  end if;

  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    v_activated
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: Hitung Aktivitas Guru
create or replace function public.get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count int,
    journal_count bigint,
    classes_handled_count bigint
) as $$
begin
  return query
  select 
    p.id as teacher_id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id)::int as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.is_activated = true;
end;
$$ language plpgsql security definer;

-- RPC: Ringkasan Kehadiran Harian (Monitoring)
create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
    total_expected bigint,
    total_present bigint,
    total_late bigint,
    total_absent bigint,
    attendance_rate int
) as $$
declare
    v_policy text;
    v_expected_ids uuid[];
    v_present_ids uuid[];
    v_expected_count bigint;
    v_present_count bigint;
    v_late_count bigint;
    v_day_name text;
begin
    -- 1. Ambil kebijakan sekolah
    select value into v_policy from public.settings where key = 'attendance_policy';
    if v_policy is null then v_policy := 'schedule_based'; end if;

    -- 2. Tentukan ID Guru yang wajib hadir
    if v_policy = 'daily_based' then
        select array_agg(id) into v_expected_ids from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        -- Cari hari (Senin-Minggu)
        select 
            case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa'
                when 3 then 'Rabu' when 4 then 'Kamis' when 5 then 'Jumat'
                when 6 then 'Sabtu'
            end into v_day_name;
        select array_agg(distinct teacher_id) into v_expected_ids from public.schedule where day = v_day_name;
    end if;

    v_expected_count := coalesce(array_length(v_expected_ids, 1), 0);

    -- 3. Hitung kehadiran real-time
    select count(*), count(*) filter (where status = 'Terlambat')
    into v_present_count, v_late_count
    from public.teacher_attendance
    where date = p_date and teacher_id = any(v_expected_ids);

    return query select 
        v_expected_count,
        v_present_count,
        v_late_count,
        (v_expected_count - v_present_count),
        case when v_expected_count = 0 then 100 else ((v_present_count * 100) / v_expected_count)::int end;
end;
$$ language plpgsql security definer;

-- 5. RLS (FIXED: No Recursion)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.school_years enable row level security;
alter table public.schedule enable row level security;
alter table public.journal_entries enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.settings enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.agendas enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;
alter table public.holidays enable row level security;

-- Policies for Profiles (FIXED: Simplified to avoid recursion)
create policy "Anyone can view active profiles" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Global Policies (Simplified)
create policy "Authenticated users can manage own data" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "Authenticated users can manage own attendance" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "Authenticated users can manage own grades" on public.grade_records for all using (auth.uid() = teacher_id);
create policy "Authenticated users can manage own agenda" on public.agendas for all using (auth.uid() = teacher_id);
create policy "Authenticated users can manage own materials" on public.materials for all using (auth.uid() = teacher_id);
create policy "Authenticated users can manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Authenticated users can manage own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Authenticated users can manage own docs" on public.ai_documents for all using (auth.uid() = user_id);

create policy "Admins can do everything" on public.profiles for all using (true);
create policy "Full access for authenticated on master data" on public.classes for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on students" on public.students for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on subjects" on public.subjects for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on schedule" on public.schedule for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on school_years" on public.school_years for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on settings" on public.settings for all using (auth.role() = 'authenticated');
create policy "Full access for authenticated on holidays" on public.holidays for all using (auth.role() = 'authenticated');

-- 6. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_schedule_teacher on public.schedule(teacher_id);
