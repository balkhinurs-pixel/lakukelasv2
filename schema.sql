-- ==========================================
-- LAKUKELAS DATABASE BLUEPRINT V19.6 (ULTIMATE)
-- ==========================================

-- 0. CLEANUP (Opsional: Aktifkan jika ingin reset total)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;
-- drop view if exists public.student_notes_with_teacher;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
do $$ begin
    create type public.user_role as enum ('admin', 'teacher', 'headmaster');
exception when duplicate_object then null; end $$;

do $$ begin
    create type public.attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');
exception when duplicate_object then null; end $$;

-- 3. CORE TABLES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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
  role public.user_role default 'teacher',
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  gemini_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. 2024/2025 - Ganjil
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
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  teacher_id uuid references public.profiles(id),
  school_year_id uuid references public.school_years(id),
  date date not null,
  meeting_number integer,
  status public.attendance_status not null,
  created_at timestamptz default now()
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  teacher_id uuid references public.profiles(id),
  school_year_id uuid references public.school_years(id),
  date date not null,
  assessment_type text not null,
  score numeric(5,2) not null,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  date timestamptz default now(),
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
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  title text not null,
  description text,
  link_url text not null,
  created_at timestamptz default now()
);

create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text default 'neutral', -- positive, improvement, neutral
  date timestamptz default now()
);

create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null, -- Tepat Waktu, Terlambat, Sakit, Izin, Tidak Hadir
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national', -- national, school
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
    created_at timestamptz default now(),
    used_by uuid references public.profiles(id),
    used_at timestamptz
);

-- 5. AI & INTEGRATION TABLES (V19.6 NEW)
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

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  generation_group_id uuid,
  jenjang text not null,
  kelas text not null,
  semester text,
  subject text not null,
  curriculum text,
  assessment_purpose text,
  topic text not null,
  subtopic text,
  sort_order integer not null,
  question_type text not null, -- multiple_choice, essay
  question_text text not null,
  options_json jsonb, -- { "A": "...", "B": "..." }
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  image_url text,
  status text default 'draft',
  needs_review boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. VIEWS
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
join public.students s on a.student_id = s.id
join public.classes c on a.class_id = c.id
join public.subjects sub on a.subject_id = sub.id
join public.profiles p on a.teacher_id = p.id;

create or replace view public.grades_history as
select 
  g.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records g
join public.students s on g.student_id = s.id
join public.classes c on g.class_id = c.id
join public.subjects sub on g.subject_id = sub.id
join public.profiles p on g.teacher_id = p.id;

create or replace view public.student_notes_with_teacher as
select 
  n.*,
  p.full_name as teacher_name
from public.student_notes n
join public.profiles p on n.teacher_id = p.id;

-- 7. FUNCTIONS (RPC)
create or replace function public.current_user_role()
returns text
language sql security definer set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid();
$$;

create or replace function public.get_teacher_activity_counts()
returns table (
  id uuid,
  attendance_count bigint,
  grades_count bigint,
  journal_count bigint,
  classes_handled_count bigint
) language sql security definer set search_path = public
as $$
  select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.is_activated = true;
$$;

create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
  total_expected bigint,
  total_present bigint,
  total_late bigint,
  total_absent bigint,
  attendance_rate numeric
) language plpgsql security definer set search_path = public
as $$
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
  select 
    cardinality(v_expected_ids)::bigint as total_expected,
    count(id) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
    count(id) filter (where status = 'Terlambat') as total_late,
    (cardinality(v_expected_ids) - count(id) filter (where status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin')))::bigint as total_absent,
    case when cardinality(v_expected_ids) > 0 
      then round((count(id) filter (where status in ('Tepat Waktu', 'Terlambat'))::numeric / cardinality(v_expected_ids)) * 100, 1)
      else 100::numeric
    end as attendance_rate
  from public.teacher_attendance
  where date = p_date and teacher_id = any(v_expected_ids);
end;
$$;

-- 8. AUTO ADMIN TRIGGER (V19.6)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    case when is_first_user then 'admin'::public.user_role else 'teacher'::public.user_role end,
    is_first_user -- Auto-activate if first user (admin)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. RLS POLICIES
alter table public.profiles enable row level security;
create policy "public_read_profiles" on public.profiles for select using (true);
create policy "admin_all_profiles" on public.profiles for all using (public.current_user_role() = 'admin');
create policy "self_update_profiles" on public.profiles for update using (auth.uid() = id);

alter table public.school_years enable row level security;
create policy "anyone_read_school_years" on public.school_years for select using (true);
create policy "admin_all_school_years" on public.school_years for all using (public.current_user_role() = 'admin');

alter table public.classes enable row level security;
create policy "anyone_read_classes" on public.classes for select using (true);
create policy "admin_all_classes" on public.classes for all using (public.current_user_role() = 'admin');

alter table public.subjects enable row level security;
create policy "anyone_read_subjects" on public.subjects for select using (true);
create policy "admin_all_subjects" on public.subjects for all using (public.current_user_role() = 'admin');

alter table public.students enable row level security;
create policy "anyone_read_students" on public.students for select using (true);
create policy "admin_all_students" on public.students for all using (public.current_user_role() = 'admin');

alter table public.schedule enable row level security;
create policy "anyone_read_schedule" on public.schedule for select using (true);
create policy "teacher_manage_own_schedule" on public.schedule for all using (auth.uid() = teacher_id or public.current_user_role() = 'admin');

alter table public.attendance_records enable row level security;
create policy "teachers_read_own_attendance" on public.attendance_records for select using (auth.uid() = teacher_id or public.current_user_role() in ('admin', 'headmaster'));
create policy "teachers_insert_own_attendance" on public.attendance_records for insert with check (auth.uid() = teacher_id);
create policy "teachers_update_own_attendance" on public.attendance_records for update using (auth.uid() = teacher_id);
create policy "teachers_delete_own_attendance" on public.attendance_records for delete using (auth.uid() = teacher_id);

alter table public.grade_records enable row level security;
create policy "teachers_read_own_grades" on public.grade_records for select using (auth.uid() = teacher_id or public.current_user_role() in ('admin', 'headmaster'));
create policy "teachers_insert_own_grades" on public.grade_records for insert with check (auth.uid() = teacher_id);
create policy "teachers_update_own_grades" on public.grade_records for update using (auth.uid() = teacher_id);
create policy "teachers_delete_own_grades" on public.grade_records for delete using (auth.uid() = teacher_id);

alter table public.journal_entries enable row level security;
create policy "teachers_read_own_journals" on public.journal_entries for select using (auth.uid() = teacher_id or public.current_user_role() in ('admin', 'headmaster'));
create policy "teachers_all_own_journals" on public.journal_entries for all using (auth.uid() = teacher_id);

alter table public.agendas enable row level security;
create policy "teachers_all_own_agendas" on public.agendas for all using (auth.uid() = teacher_id);

alter table public.materials enable row level security;
create policy "anyone_read_materials" on public.materials for select using (true);
create policy "teachers_all_own_materials" on public.materials for all using (auth.uid() = teacher_id);

alter table public.student_notes enable row level security;
create policy "homeroom_read_notes" on public.student_notes for select using (true);
create policy "teachers_all_own_notes" on public.student_notes for all using (auth.uid() = teacher_id);

alter table public.teacher_attendance enable row level security;
create policy "anyone_read_teacher_attendance" on public.teacher_attendance for select using (true);
create policy "teachers_insert_own_teacher_attendance" on public.teacher_attendance for insert with check (auth.uid() = teacher_id);
create policy "teachers_update_own_teacher_attendance" on public.teacher_attendance for update using (auth.uid() = teacher_id);

alter table public.holidays enable row level security;
create policy "anyone_read_holidays" on public.holidays for select using (true);
create policy "admin_all_holidays" on public.holidays for all using (public.current_user_role() = 'admin');

alter table public.settings enable row level security;
create policy "anyone_read_settings" on public.settings for select using (true);
create policy "admin_all_settings" on public.settings for all using (public.current_user_role() = 'admin');

alter table public.activation_tokens enable row level security;
create policy "admin_all_activation_tokens" on public.activation_tokens for all using (public.current_user_role() = 'admin');

-- AI RLS (NEW V19.6)
alter table public.google_drive_integrations enable row level security;
create policy "users_all_own_drive" on public.google_drive_integrations for all using (auth.uid() = user_id);

alter table public.ai_documents enable row level security;
create policy "users_all_own_ai_docs" on public.ai_documents for all using (auth.uid() = user_id);

alter table public.questions enable row level security;
create policy "users_all_own_questions" on public.questions for all using (auth.uid() = created_by);
create policy "monitoring_read_questions" on public.questions for select using (public.current_user_role() in ('admin', 'headmaster'));

-- 10. GRANTS
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- 11. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_attendance_student on public.attendance_records(student_id);
create index if not exists idx_grades_student on public.grade_records(student_id);
create index if not exists idx_schedule_teacher on public.schedule(teacher_id);
create index if not exists idx_questions_creator on public.questions(created_by);
create index if not exists idx_questions_topic on public.questions(topic);
