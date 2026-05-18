
-- LAKUKELAS DATABASE BLUEPRINT
-- VERSION: V19.5 (RLS Master Data Fix)
-- DESCRIPTION: Full schema for Next.js + Supabase Teacher Administration System

-- 0. CLEANUP (Optional: Use with caution)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;
-- drop view if exists public.student_notes_with_teacher;
-- drop function if exists public.get_teacher_activity_counts;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles: Link between Auth and Application data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
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

-- Master Data: School Years
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- Master Data: Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id), -- Assigned homeroom teacher
  created_at timestamptz default now()
);

-- Master Data: Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Master Data: Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id),
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  created_at timestamptz default now()
);

-- Teaching Schedule
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Records: Student Attendance
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  school_year_id uuid references public.school_years(id),
  teacher_id uuid references public.profiles(id),
  date date not null,
  meeting_number int,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- Records: Student Grades
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  school_year_id uuid references public.school_years(id),
  teacher_id uuid references public.profiles(id),
  date date not null,
  assessment_type text not null,
  score numeric not null,
  created_at timestamptz default now()
);

-- Records: Teacher Teaching Journal
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  teacher_id uuid references public.profiles(id),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- Teacher Attendance (Logbook)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id),
  date date not null,
  check_in time,
  check_out time,
  status text not null,
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- Student Notes (Character/Behavior)
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- Global Settings
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- Activation Tokens
create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- Agendas & Reminders
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

-- Materials & Files
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
  type text default 'national' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

-- AI Bank Soal (Questions)
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

-- AI Document Exports
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
  p.full_name as teacher_name,
  st.name as student_name
from public.attendance_records a
join public.classes c on a.class_id = c.id
join public.subjects s on a.subject_id = s.id
join public.profiles p on a.teacher_id = p.id
join public.students st on a.student_id = st.id;

create or replace view public.grades_history as
select
  g.*,
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
  sn.*,
  p.full_name as teacher_name
from public.student_notes sn
join public.profiles p on sn.teacher_id = p.id;

-- 4. FUNCTIONS (RPC)

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1
$$;

create or replace function public.get_teacher_activity_counts()
returns table (
  teacher_id uuid,
  attendance_count bigint,
  grades_count bigint,
  journal_count bigint,
  classes_handled_count bigint
) language sql security definer set search_path = public as $$
  select 
    p.id as teacher_id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.role in ('teacher', 'headmaster', 'admin');
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
begin
  select value into v_policy from public.settings where key = 'attendance_policy';
  v_policy := coalesce(v_policy, 'schedule_based');

  if v_policy = 'daily_based' then
    select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
  else
    select count(distinct teacher_id) into v_expected_count from public.schedule where day = (
      select 
        case extract(dow from p_date)
          when 0 then 'Minggu'
          when 1 then 'Senin'
          when 2 then 'Selasa'
          when 3 then 'Rabu'
          when 4 then 'Kamis'
          when 5 then 'Jumat'
          when 6 then 'Sabtu'
        end
    );
  end if;

  return query
  select 
    v_expected_count as total_expected,
    count(*) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
    count(*) filter (where status = 'Terlambat') as total_late,
    (v_expected_count - count(*) filter (where status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'))) as total_absent,
    case when v_expected_count = 0 then 100 else round((count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))::numeric / v_expected_count::numeric) * 100, 2) end as attendance_rate
  from public.teacher_attendance
  where date = p_date;
end;
$$;

-- Trigger for New User (Auto-Admin for first user)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  insert into public.profiles (id, email, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    new.email,
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

-- 5. RLS (ROW LEVEL SECURITY)

-- Profiles
alter table public.profiles enable row level security;
create policy "profile_select_policy" on public.profiles for select to authenticated using (true);
create policy "profile_update_own" on public.profiles for update to authenticated using (id = auth.uid());
create policy "profile_admin_all" on public.profiles for all to authenticated using (public.current_user_role() = 'admin');

-- School Years
alter table public.school_years enable row level security;
create policy "school_years_select_policy" on public.school_years for select to authenticated using (true);
create policy "school_years_admin_all" on public.school_years for all to authenticated using (public.current_user_role() = 'admin');

-- Classes
alter table public.classes enable row level security;
create policy "classes_select_policy" on public.classes for select to authenticated using (true);
create policy "classes_admin_all" on public.classes for all to authenticated using (public.current_user_role() = 'admin');

-- Subjects
alter table public.subjects enable row level security;
create policy "subjects_select_policy" on public.subjects for select to authenticated using (true);
create policy "subjects_admin_all" on public.subjects for all to authenticated using (public.current_user_role() = 'admin');

-- Students
alter table public.students enable row level security;
create policy "students_select_policy" on public.students for select to authenticated using (true);
create policy "students_admin_all" on public.students for all to authenticated using (public.current_user_role() = 'admin');

-- Schedule
alter table public.schedule enable row level security;
create policy "schedule_select_policy" on public.schedule for select to authenticated using (true);
create policy "schedule_teacher_manage" on public.schedule for all to authenticated using (teacher_id = auth.uid());
create policy "schedule_admin_all" on public.schedule for all to authenticated using (public.current_user_role() = 'admin');

-- Attendance Records
alter table public.attendance_records enable row level security;
create policy "att_select_monitoring" on public.attendance_records for select to authenticated 
  using (teacher_id = auth.uid() or public.current_user_role() in ('admin', 'headmaster') or 
  exists (select 1 from public.classes where id = attendance_records.class_id and teacher_id = auth.uid()));
create policy "att_insert_teacher" on public.attendance_records for insert to authenticated with check (teacher_id = auth.uid());
create policy "att_update_teacher" on public.attendance_records for update to authenticated using (teacher_id = auth.uid());
create policy "att_delete_teacher" on public.attendance_records for delete to authenticated using (teacher_id = auth.uid());

-- Grade Records
alter table public.grade_records enable row level security;
create policy "grade_select_monitoring" on public.grade_records for select to authenticated 
  using (teacher_id = auth.uid() or public.current_user_role() in ('admin', 'headmaster') or 
  exists (select 1 from public.classes where id = grade_records.class_id and teacher_id = auth.uid()));
create policy "grade_insert_teacher" on public.grade_records for insert to authenticated with check (teacher_id = auth.uid());
create policy "grade_update_teacher" on public.grade_records for update to authenticated using (teacher_id = auth.uid());
create policy "grade_delete_teacher" on public.grade_records for delete to authenticated using (teacher_id = auth.uid());

-- Journal Entries
alter table public.journal_entries enable row level security;
create policy "journal_select_monitoring" on public.journal_entries for select to authenticated 
  using (teacher_id = auth.uid() or public.current_user_role() in ('admin', 'headmaster'));
create policy "journal_insert_teacher" on public.journal_entries for insert to authenticated with check (teacher_id = auth.uid());
create policy "journal_update_teacher" on public.journal_entries for update to authenticated using (teacher_id = auth.uid());
create policy "journal_delete_teacher" on public.journal_entries for delete to authenticated using (teacher_id = auth.uid());

-- Settings
alter table public.settings enable row level security;
create policy "settings_select" on public.settings for select to authenticated using (true);
create policy "settings_admin_all" on public.settings for all to authenticated using (public.current_user_role() = 'admin');

-- Holidays
alter table public.holidays enable row level security;
create policy "holidays_select" on public.holidays for select to authenticated using (true);
create policy "holidays_admin_all" on public.holidays for all to authenticated using (public.current_user_role() = 'admin');

-- 6. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_journal_date on public.journal_entries(date);
create index if not exists idx_schedule_day on public.schedule(day);

-- 7. PERMISSIONS (GRANT)
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant all on all functions in schema public to authenticated;
