
-- ==========================================================
-- LAKUKELAS DATABASE BLUEPRINT - VERSION 19.4 (FINAL)
-- ==========================================================

-- 0. CLEANUP (Jalankan ini jika ingin reset struktur)
-- drop view if exists public.journal_entries_with_names;
-- drop view if exists public.attendance_history;
-- drop view if exists public.grades_history;
-- drop view if exists public.student_notes_with_teacher;
-- drop function if exists public.get_teacher_activity_counts;
-- drop function if exists public.get_teacher_attendance_summary;

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- A. SETTINGS (Global Config)
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- B. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
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
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- C. SCHOOL YEARS
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- D. CLASSES
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id), -- Homeroom Teacher
  created_at timestamptz default now()
);

-- E. SUBJECTS
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- F. STUDENTS
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete set null,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- G. SCHEDULE
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  day text not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

-- H. ATTENDANCE RECORDS (Siswa)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  date date not null,
  meeting_number int,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- I. GRADE RECORDS
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  date date not null,
  assessment_type text not null,
  score numeric(5,2) not null,
  created_at timestamptz default now()
);

-- J. JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date timestamptz not null,
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- K. AGENDAS (Personal Guru)
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

-- L. TEACHER ATTENDANCE (Presensi Guru)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- M. MATERIALS (Link Sumber Belajar)
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

-- N. STUDENT NOTES (Catatan Karakter)
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- O. ACTIVATION TOKENS (Manajemen Pendaftaran)
create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- P. QUESTIONS (AI Bank Soal)
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete cascade,
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
  question_text text,
  options_json jsonb,
  correct_answer text,
  explanation text,
  difficulty text,
  cognitive_level text,
  language_direction text default 'ltr',
  status text default 'draft',
  needs_review boolean default true,
  image_url text,
  created_at timestamptz default now()
);

-- Q. GOOGLE DRIVE INTEGRATIONS
create table if not exists public.google_drive_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  folder_id text,
  folder_url text,
  folder_name text,
  status text,
  connected_at timestamptz default now(),
  disconnected_at timestamptz
);

-- R. AI DOCUMENTS
create table if not exists public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  document_type text,
  title text,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text,
  created_at timestamptz default now()
);

-- S. HOLIDAYS
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text,
  type text check (type in ('national', 'school')),
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
left join public.profiles p on n.teacher_id = p.id;

-- 4. FUNCTIONS (RPC)

-- A. Helper Role
create or replace function public.current_user_role()
returns text language sql security definer as $$
  select role from public.profiles where id = auth.uid();
$$;

-- B. Activity Counts
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
  where p.is_activated = true;
$$;

-- C. Attendance Summary
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
    v_total_staff bigint;
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    
    if v_policy = 'daily_based' then
        select count(*) into total_expected from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into total_expected from public.schedule where day = (
            select case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
                when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
            end
        );
    end if;

    select count(*) into total_present from public.teacher_attendance where date = p_date and check_in is not null;
    select count(*) into total_late from public.teacher_attendance where date = p_date and status = 'Terlambat';
    
    total_absent := total_expected - total_present;
    if total_absent < 0 then total_absent := 0; end if;
    
    if total_expected > 0 then
        attendance_rate := round((total_present::numeric / total_expected::numeric) * 100, 2);
    else
        attendance_rate := 100;
    end if;

    return next;
end;
$$;

-- D. Handle New User (Auto Admin First User)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first_user boolean;
begin
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

-- 5. TRIGGERS
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. RLS POLICIES

alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.attendance_records enable row level security;
create policy "Attendance viewable by teacher, admin, headmaster, or homeroom" on public.attendance_records for select
using (
  teacher_id = auth.uid() 
  or public.current_user_role() in ('admin', 'headmaster')
  or student_id in (select id from public.students where class_id in (select id from public.classes where teacher_id = auth.uid()))
);
create policy "Teachers can insert own attendance" on public.attendance_records for insert with check (teacher_id = auth.uid());

alter table public.journal_entries enable row level security;
create policy "Journals viewable by teacher, admin, or headmaster" on public.journal_entries for select
using (teacher_id = auth.uid() or public.current_user_role() in ('admin', 'headmaster'));
create policy "Teachers can manage own journals" on public.journal_entries for all using (teacher_id = auth.uid());

-- (RLS lain mengikuti pola yang sama: Milik Sendiri OR Admin/Headmaster)
alter table public.grade_records enable row level security;
create policy "Grades management" on public.grade_records for all using (teacher_id = auth.uid() or public.current_user_role() in ('admin', 'headmaster'));

alter table public.questions enable row level security;
create policy "Own questions" on public.questions for all using (auth.uid() = created_by);

alter table public.google_drive_integrations enable row level security;
create policy "Own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);

-- 7. PERMISSIONS (GRANTS)
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;
