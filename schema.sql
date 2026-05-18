-- ==========================================================
-- LAKUKELAS DATABASE BLUEPRINT V19.6 (ULTIMATE)
-- Includes: Auth, Master Data, Admin Priorities, 
--           Google Drive Integration, & Bank Soal AI.
-- ==========================================================

-- 0. CLEANUP (Hanya gunakan saat setup ulang)
-- DROP VIEW IF EXISTS public.student_notes_with_teacher;
-- DROP VIEW IF EXISTS public.grades_history;
-- DROP VIEW IF EXISTS public.journal_entries_with_names;
-- DROP VIEW IF EXISTS public.attendance_history;
-- DROP FUNCTION IF EXISTS public.get_teacher_attendance_summary;
-- DROP FUNCTION IF EXISTS public.get_teacher_activity_counts;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CORE TABLES (Profiles & Settings)
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
  gemini_api_key text, -- Untuk fitur AI Mandiri
  created_at timestamptz default now()
);

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- 3. MASTER DATA TABLES
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
  teacher_id uuid references public.profiles(id), -- Wali Kelas
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
  class_id uuid references public.classes(id) on delete set null,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  created_at timestamptz default now()
);

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

-- 4. TRANSACTIONAL TABLES
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  meeting_number integer not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score numeric not null check (score >= 0 and score <= 100),
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
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  link_url text not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
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

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now()
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- 5. AI & GOOGLE DRIVE INTEGRATION TABLES
create table if not exists public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  provider text not null default 'google',
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text not null default 'connected' check (status in ('connected', 'disconnected', 'error')),
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  updated_at timestamptz default now()
);

create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_type text not null, -- 'rpp', 'soal', 'lkpd', 'test'
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  generation_group_id uuid default gen_random_uuid(),
  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,
  sort_order integer not null,
  question_type text not null, -- 'multiple_choice', 'essay'
  question_text text not null,
  options_json jsonb, -- { "A": "...", "B": "..." }
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  image_url text,
  needs_review boolean default true,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. VIEWS FOR REPORTING
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

create or replace view public.journal_entries_with_names as
select 
  je.*,
  c.name as "className",
  s.name as "subjectName"
from public.journal_entries je
join public.classes c on je.class_id = c.id
join public.subjects s on je.subject_id = s.id;

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

create or replace view public.student_notes_with_teacher as
select 
  sn.*,
  p.full_name as teacher_name
from public.student_notes sn
join public.profiles p on sn.teacher_id = p.id;

-- 7. SECURITY FUNCTIONS
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select count(*) = 0 into is_first_user from public.profiles;

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

-- Trigger Sync Auth -> Profiles
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8. ANALYTICS & MONITORING FUNCTIONS (RPC)
create or replace function public.get_teacher_activity_counts()
returns table (
  teacher_id uuid,
  attendance_count bigint,
  journal_count bigint,
  grades_count bigint,
  classes_handled_count bigint
) language sql security definer as $$
  select 
    p.id as teacher_id,
    (select count(distinct (date::text || class_id::text || subject_id::text || meeting_number::text)) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct (date::text || class_id::text || subject_id::text || assessment_type)) from public.grade_records where teacher_id = p.id) as grades_count,
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
  v_expected_count bigint;
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  
  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    select count(distinct teacher_id) into v_expected_count from public.schedule where day = (
      select 
        case extract(dow from p_date)
          when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
          when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
        end
    );
  end if;

  return query
  select 
    v_expected_count,
    count(*) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
    count(*) filter (where status = 'Terlambat') as total_late,
    (v_expected_count - count(*) filter (where status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'))) as total_absent,
    case when v_expected_count > 0 then 
      round((count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))::numeric / v_expected_count::numeric) * 100, 1)
    else 100 end as attendance_rate
  from public.teacher_attendance
  where date = p_date;
end;
$$;

-- 9. ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
create policy "Public Profiles Access" on public.profiles for select using (true);
create policy "Admin All Profiles" on public.profiles for all using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Users Update Own Profile" on public.profiles for update using (auth.uid() = id);

-- RLS Master Tables (Admin Power)
alter table public.school_years enable row level security;
create policy "Admin Control Years" on public.school_years for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Public Select Years" on public.school_years for select using (true);

alter table public.classes enable row level security;
create policy "Admin Control Classes" on public.classes for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Public Select Classes" on public.classes for select using (true);

alter table public.subjects enable row level security;
create policy "Admin Control Subjects" on public.subjects for all using ((select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Public Select Subjects" on public.subjects for select using (true);

-- RLS AI & Drive (Teacher Privacy)
alter table public.google_drive_integrations enable row level security;
create policy "Users own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);

alter table public.ai_documents enable row level security;
create policy "Users own ai docs" on public.ai_documents for all using (auth.uid() = user_id);

alter table public.questions enable row level security;
create policy "Users own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Admin view all questions" on public.questions for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'headmaster')
);

-- RLS Transactions
alter table public.journal_entries enable row level security;
create policy "Teachers own journal" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "Admin Headmaster view journals" on public.journal_entries for select using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'headmaster')
);

alter table public.attendance_records enable row level security;
create policy "Teachers own attendance" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "Homeroom view class attendance" on public.attendance_records for select using (
  exists (select 1 from public.classes where id = attendance_records.class_id and teacher_id = auth.uid())
);

-- 10. GRANTS (Final fix for Permission Denied)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to postgres, service_role, authenticated;
grant all on all sequences in schema public to postgres, service_role, authenticated;
grant all on all functions in schema public to postgres, service_role, authenticated;