
-- LakuKelas Database Blueprint V19.0
-- Terakhir diperbarui: Fix Admin Recognition & RLS Transparency

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CLEANUP (Optional: Uncomment if you want a fresh start)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.student_notes_with_teacher;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;

-- 3. TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null
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
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text
);

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  meeting_number integer not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  assessment_type text not null,
  score numeric(5,2) not null,
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date timestamptz not null,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade
);

create table if not exists public.agendas (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  date date not null,
  check_in time,
  check_out time,
  status text not null check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.materials (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    title text not null,
    description text,
    link_url text not null,
    class_id uuid references public.classes(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'school' check (type in ('national', 'school'))
);

create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  created_at timestamptz default now(),
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamptz
);

create table if not exists public.student_notes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date timestamptz not null default now(),
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade
);

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

-- 4. VIEWS
create or replace view public.journal_entries_with_names as
select 
  j.*, 
  c.name as "className", 
  s.name as "subjectName"
from public.journal_entries j
left join public.classes c on j.class_id = c.id
left join public.subjects s on j.subject_id = s.id;

create or replace view public.student_notes_with_teacher as
select 
    sn.*,
    p.full_name as teacher_name
from public.student_notes sn
left join public.profiles p on sn.teacher_id = p.id;

create or replace view public.attendance_history as
select
  ar.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records ar
join public.students s on ar.student_id = s.id
join public.classes c on ar.class_id = c.id
join public.subjects sub on ar.subject_id = sub.id
join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select
  gr.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records gr
join public.students s on gr.student_id = s.id
join public.classes c on gr.class_id = c.id
join public.subjects sub on gr.subject_id = sub.id
join public.profiles p on gr.teacher_id = p.id;

-- 5. FUNCTIONS & RPC
create or replace function public.get_teacher_activity_counts()
returns table (
    id uuid,
    attendance_count bigint,
    grades_count integer,
    journal_count bigint,
    classes_handled_count bigint
) as $$
begin
    return query
    select 
        p.id,
        (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
        (select count(distinct date::text || class_id::text || subject_id::text || assessment_type::text) from public.grade_records where teacher_id = p.id)::integer as grades_count,
        (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
        (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
    from public.profiles p;
end;
$$ language plpgsql security definer;

create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
    total_expected bigint,
    total_present bigint,
    total_late bigint,
    total_absent bigint,
    attendance_rate numeric
) as $$
declare
    v_policy text;
    v_expected_ids uuid[];
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
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
    with expected as (
        select unnest(v_expected_ids) as t_id
    ),
    actual as (
        select teacher_id, status from public.teacher_attendance where date = p_date
    )
    select 
        count(e.t_id)::bigint as total_expected,
        count(a.teacher_id) filter (where a.status in ('Tepat Waktu', 'Terlambat'))::bigint as total_present,
        count(a.teacher_id) filter (where a.status = 'Terlambat')::bigint as total_late,
        (count(e.t_id) - count(a.teacher_id))::bigint as total_absent,
        case when count(e.t_id) > 0 
            then round((count(a.teacher_id) filter (where a.status in ('Tepat Waktu', 'Terlambat'))::numeric / count(e.t_id)::numeric) * 100, 2)
            else 0::numeric
        end as attendance_rate
    from expected e
    left join actual a on e.t_id = a.teacher_id;
end;
$$ language plpgsql security definer;

-- 6. AUTH TRIGGER (AUTO ADMIN FOR FIRST USER)
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
      coalesce(new.raw_user_meta_data->>'full_name', 'Administrator LakuKelas'),
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. RLS POLICIES (IMPROVED FOR MIDDLEWARE)
alter table public.profiles enable row level security;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.classes enable row level security;
create policy "Classes are viewable by everyone" on public.classes for select using (true);
create policy "Admins can manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

alter table public.subjects enable row level security;
create policy "Subjects are viewable by everyone" on public.subjects for select using (true);
create policy "Admins can manage subjects" on public.subjects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

alter table public.students enable row level security;
create policy "Students are viewable by everyone" on public.students for select using (true);
create policy "Admins can manage students" on public.students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- RLS for Activity Tables
alter table public.attendance_records enable row level security;
create policy "Users can manage own attendance records" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "Admins/Headmasters can view all attendance" on public.attendance_records for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

alter table public.grade_records enable row level security;
create policy "Users can manage own grade records" on public.grade_records for all using (auth.uid() = teacher_id);

alter table public.journal_entries enable row level security;
create policy "Users can manage own journals" on public.journal_entries for all using (auth.uid() = teacher_id);

alter table public.agendas enable row level security;
create policy "Users can manage own agendas" on public.agendas for all using (auth.uid() = teacher_id);

alter table public.teacher_attendance enable row level security;
create policy "Users can manage own attendance" on public.teacher_attendance for all using (auth.uid() = teacher_id);
create policy "Admins can view all teacher attendance" on public.teacher_attendance for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

alter table public.questions enable row level security;
create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);

alter table public.google_drive_integrations enable row level security;
create policy "Users can manage own drive integration" on public.google_drive_integrations for all using (auth.uid() = user_id);

alter table public.ai_documents enable row level security;
create policy "Users can manage own AI documents" on public.ai_documents for all using (auth.uid() = user_id);

-- 8. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(date);
create index if not exists idx_questions_topic on public.questions(topic);
