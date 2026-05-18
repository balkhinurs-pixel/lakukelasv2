-- MASTER BLUEPRINT LAKUKELAS V20.0 (ULTIMATE)
-- Includes: Auto-Admin, Master Data Fix, Wali Kelas, Monitoring, AI Bank Soal, Google Drive, and Holidays.

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
-- Profiles: Central user table
create table public.profiles (
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
  role text check (role in ('admin', 'teacher', 'headmaster')) default 'teacher',
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  gemini_api_key text
);

-- Master Data
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id)
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) -- Homeroom Teacher
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id),
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active',
  created_at timestamptz default now()
);

-- Academic Records
create table public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  school_year_id uuid references public.school_years(id),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  school_year_id uuid references public.school_years(id),
  date date default current_date,
  meeting_number int,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  teacher_id uuid references public.profiles(id),
  school_year_id uuid references public.school_years(id),
  date date default current_date,
  assessment_type text not null,
  score numeric check (score >= 0 and score <= 100)
);

-- Teacher Attendance & Agendas
create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  unique(teacher_id, date)
);

create table public.agendas (
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

-- Infrastructure & Settings
create table public.settings (
  key text primary key,
  value text not null
);

create table public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  created_at timestamptz default now(),
  used_by uuid references public.profiles(id),
  used_at timestamptz
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text check (type in ('national', 'school')) default 'school'
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id),
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  title text not null,
  description text,
  link_url text not null,
  created_at timestamptz default now()
);

create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id),
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text check (type in ('positive', 'improvement', 'neutral')) default 'neutral',
  date timestamptz default now()
);

-- AI & Cloud Integrations
create table public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz,
  unique(user_id)
);

create table public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  document_type text not null,
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now()
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete cascade,
  generation_group_id uuid,
  jenjang text,
  kelas text,
  semester text,
  subject text,
  curriculum text,
  assessment_purpose text,
  topic text,
  subtopic text,
  sort_order int,
  question_type text,
  question_text text not null,
  options_json jsonb,
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  image_url text,
  status text default 'draft',
  needs_review boolean default true,
  created_at timestamptz default now()
);

-- 3. FUNCTIONS & TRIGGERS
-- Auto-Admin Logic for First User
create or replace function public.handle_new_user()
returns trigger as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

  if is_first_user then
    insert into public.profiles (id, full_name, role, is_activated)
    values (new.id, 'Administrator LakuKelas', 'admin', true);
  else
    insert into public.profiles (id, full_name, role, is_activated)
    values (new.id, 'User LakuKelas', 'teacher', false);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Activity Count RPC
create or replace function get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) as $$
begin
    return query
    select 
        p.id as teacher_id,
        (select count(distinct date) from attendance_records where teacher_id = p.id) as attendance_count,
        (select count(distinct assessment_type) from grade_records where teacher_id = p.id) as grades_count,
        (select count(*) from journal_entries where teacher_id = p.id) as journal_count,
        (select count(distinct class_id) from schedule where teacher_id = p.id) as classes_handled_count
    from profiles p
    where p.role in ('teacher', 'headmaster', 'admin');
end;
$$ language plpgsql security definer;

-- 4. VIEWS
create or replace view journal_entries_with_names as
select 
  j.*,
  c.name as "className",
  s.name as "subjectName"
from journal_entries j
left join classes c on j.class_id = c.id
left join subjects s on j.subject_id = s.id;

create or replace view attendance_history as
select 
  a.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  p.full_name as teacher_name
from attendance_records a
join students s on a.student_id = s.id
join classes c on a.class_id = c.id
join subjects sub on a.subject_id = sub.id
join profiles p on a.teacher_id = p.id;

create or replace view grades_history as
select 
  g.*,
  s.name as student_name,
  c.name as class_name,
  sub.name as subject_name,
  sub.kkm as subject_kkm,
  p.full_name as teacher_name
from grade_records g
join students s on g.student_id = s.id
join classes c on g.class_id = c.id
join subjects sub on g.subject_id = sub.id
join profiles p on g.teacher_id = p.id;

-- 5. RLS POLICIES
alter table profiles enable row level security;
alter table school_years enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table schedule enable row level security;
alter table journal_entries enable row level security;
alter table attendance_records enable row level security;
alter table grade_records enable row level security;
alter table teacher_attendance enable row level security;
alter table agendas enable row level security;
alter table holidays enable row level security;
alter table questions enable row level security;
alter table google_drive_integrations enable row level security;
alter table ai_documents enable row level security;

-- Profile: Open select for middleware, restricted updates
create policy "profile_select" on profiles for select using (true);
create policy "profile_update_own" on profiles for update using (auth.uid() = id);

-- Master Data: Admin ALL, Teacher/Headmaster SELECT
create policy "master_admin_all" on school_years for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "master_select_all" on school_years for select using (true);

create policy "classes_admin_all" on classes for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "classes_select_all" on classes for select using (true);

create policy "subjects_admin_all" on subjects for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "subjects_select_all" on subjects for select using (true);

create policy "students_admin_all" on students for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "students_select_all" on students for select using (true);

-- Records: Own or Admin or Headmaster (Monitoring) or Homeroom (Leger)
create policy "journal_own_or_monitor" on journal_entries for select 
using (teacher_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'headmaster')));

create policy "attendance_own_or_monitor" on attendance_records for select 
using (
    teacher_id = auth.uid() 
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'headmaster'))
    or exists (select 1 from classes where id = attendance_records.class_id and teacher_id = auth.uid())
);

create policy "grades_own_or_monitor" on grade_records for select 
using (
    teacher_id = auth.uid() 
    or exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'headmaster'))
    or exists (select 1 from classes where id = grade_records.class_id and teacher_id = auth.uid())
);

create policy "teacher_attendance_all" on teacher_attendance for select using (true);
create policy "teacher_attendance_insert" on teacher_attendance for insert with check (teacher_id = auth.uid());
create policy "teacher_attendance_update" on teacher_attendance for update using (teacher_id = auth.uid());

-- AI & Drive: Private per user
create policy "questions_private" on questions for all using (created_by = auth.uid());
create policy "drive_private" on google_drive_integrations for all using (user_id = auth.uid());
create policy "ai_docs_private" on ai_documents for all using (user_id = auth.uid());

-- 6. EXPLICIT GRANTS (Fix Permission Denied Vercel)
grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant select on all tables in schema public to anon;
