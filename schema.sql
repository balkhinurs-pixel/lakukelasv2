
-- LAKUKELAS DATABASE BLUEPRINT V18.3
-- Last Updated: Perbaikan Type Casting untuk Konkatenasi UUID/Date

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text default 'User LakuKelas',
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

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id),
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

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number integer not null,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

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

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national' check (type in ('national', 'school'))
);

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null,
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- 3. AI & DRIVE TABLES
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

create or replace view public.attendance_history as
select 
  a.id, a.date, a.meeting_number, a.status,
  a.class_id, a.subject_id, a.teacher_id, a.school_year_id, a.student_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name,
  st.name as student_name
from public.attendance_records a
join public.classes c on a.class_id = c.id
join public.subjects s on a.subject_id = s.id
join public.profiles p on a.teacher_id = p.id
join public.students st on a.student_id = st.id;

create or replace view public.grades_history as
select 
  g.id, g.date, g.assessment_type, g.score,
  g.class_id, g.subject_id, g.teacher_id, g.school_year_id, g.student_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name,
  st.name as student_name
from public.grade_records g
join public.classes c on g.class_id = c.id
join public.subjects s on g.subject_id = s.id
join public.profiles p on g.teacher_id = p.id
join public.students st on g.student_id = st.id;

create or replace view public.student_notes_with_teacher as
select 
    n.*,
    p.full_name as teacher_name
from public.student_notes n
left join public.profiles p on n.teacher_id = p.id;

-- 5. FUNCTIONS & TRIGGERS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create or replace function public.get_active_school_year_id()
returns uuid
language sql
security definer
as $$
  select value::uuid from public.settings where key = 'active_school_year_id' limit 1;
$$;

-- FIXED FUNCTION V18.3 (Added explicit casting to text)
create or replace function public.get_teacher_activity_counts()
 returns table(id uuid, full_name text, attendance_count bigint, grades_count bigint, journal_count bigint, classes_handled_count bigint)
 language sql
 security definer
as $function$
  select 
    p.id,
    p.full_name,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.role in ('teacher', 'headmaster', 'admin') and p.is_activated = true;
$function$;

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
  v_present_count bigint;
  v_late_count bigint;
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  
  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    select count(distinct teacher_id) into v_expected_count from public.schedule 
    where day = (select 
      case extract(dow from p_date)
        when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
        when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
      end
    );
  end if;

  select count(*) into v_present_count from public.teacher_attendance where date = p_date and status in ('Tepat Waktu', 'Terlambat');
  select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';

  return query select 
    v_expected_count,
    v_present_count,
    v_late_count,
    (v_expected_count - v_present_count),
    case when v_expected_count > 0 then round((v_present_count::numeric / v_expected_count::numeric) * 100, 2) else 0 end;
end;
$$;

-- 6. SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.settings enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.holidays enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- 7. POLICIES (GENERAL)
create policy "Public settings read" on public.settings for select to authenticated using (true);
create policy "Admin manage settings" on public.settings for all to authenticated using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Profiles read access" on public.profiles for select to authenticated using (true);
create policy "Profiles self update" on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Users manage own data" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "Users manage own agendas" on public.agendas for all using (auth.uid() = teacher_id);
create policy "Users manage own materials" on public.materials for all using (auth.uid() = teacher_id);

create policy "Questions manage own" on public.questions for all using (auth.uid() = created_by);
create policy "Drive integrations manage own" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "AI documents manage own" on public.ai_documents for all using (auth.uid() = user_id);

-- 8. INDEXES
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_journal_date on public.journal_entries(date);
create index if not exists idx_questions_topic on public.questions(topic);
