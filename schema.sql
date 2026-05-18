
-- LakuKelas Database Schema (Blueprint V19.1)
-- Last Updated: 2024-05-21
-- Purpose: Total Reset with Open RLS for Middleware Stability

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. DROP OLD OBJECTS
drop view if exists public.journal_entries_with_names cascade;
drop view if exists public.attendance_history cascade;
drop view if exists public.grades_history cascade;
drop view if exists public.student_notes_with_teacher cascade;
drop function if exists public.get_teacher_activity_counts() cascade;
drop function if exists public.get_teacher_attendance_summary(date) cascade;
drop function if exists public.handle_new_user() cascade;

-- 3. TABLES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
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

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- e.g. "2023/2024 - Ganjil"
  is_active boolean default false,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

create table public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null, -- "Senin", "Selasa", etc.
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number integer not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score decimal not null,
  created_at timestamptz default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

create table public.agendas (
    id uuid primary key default gen_random_uuid(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text default '#6b7280',
    start_time time,
    end_time time,
    teacher_id uuid references public.profiles(id) on delete cascade,
    created_at timestamptz default now()
);

create table public.teacher_attendance (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    date date not null,
    check_in time,
    check_out time,
    status text not null check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason text,
    created_at timestamptz default now()
);

create table public.materials (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    title text not null,
    description text,
    link_url text not null,
    created_at timestamptz default now()
);

create table public.student_notes (
    id uuid primary key default gen_random_uuid(),
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
    date timestamptz default now()
);

create table public.activation_tokens (
    id uuid primary key default gen_random_uuid(),
    token text unique not null,
    used_by uuid references public.profiles(id),
    used_at timestamptz,
    created_at timestamptz default now()
);

create table public.settings (
    key text primary key,
    value text,
    updated_at timestamptz default now()
);

create table public.holidays (
    id uuid primary key default gen_random_uuid(),
    date date unique not null,
    description text not null,
    type text default 'national' check (type in ('national', 'school')),
    created_at timestamptz default now()
);

create table public.questions (
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

create table public.google_drive_integrations (
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

create table public.ai_documents (
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

-- 4. VIEWS
create or replace view public.journal_entries_with_names as
select 
    j.*, 
    c.name as "className", 
    s.name as "subjectName"
from public.journal_entries j
join public.classes c on j.class_id = c.id
join public.subjects s on j.subject_id = s.id;

create or replace view public.attendance_history as
select 
    ar.*, 
    c.name as class_name, 
    s.name as subject_name, 
    st.name as student_name,
    p.full_name as teacher_name
from public.attendance_records ar
join public.classes c on ar.class_id = c.id
join public.subjects s on ar.subject_id = s.id
join public.students st on ar.student_id = st.id
join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
    gr.*, 
    c.name as class_name, 
    s.name as subject_name, 
    s.kkm as subject_kkm,
    st.name as student_name,
    p.full_name as teacher_name
from public.grade_records gr
join public.classes c on gr.class_id = c.id
join public.subjects s on gr.subject_id = s.id
join public.students st on gr.student_id = st.id
join public.profiles p on gr.teacher_id = p.id;

create or replace view public.student_notes_with_teacher as
select 
    sn.*, 
    p.full_name as teacher_name
from public.student_notes sn
join public.profiles p on sn.teacher_id = p.id;

-- 5. FUNCTIONS
create or replace function public.get_teacher_activity_counts()
returns table (
    id uuid,
    attendance_count bigint,
    grades_count integer,
    journal_count bigint,
    classes_handled_count bigint
) language sql security definer set search_path = public as $$
select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id)::integer as grades_count,
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
    v_day_name text;
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');
    
    select trim(to_char(p_date, 'Day', 'NLS_DATE_LANGUAGE = INDONESIAN')) into v_day_name;

    if v_policy = 'daily_based' then
        select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into v_expected_count from public.schedule where day = v_day_name;
    end if;

    select count(*) into v_present_count from public.teacher_attendance where date = p_date and check_in is not null;
    select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';
    
    v_expected_count := coalesce(v_expected_count, 0);
    if v_expected_count = 0 then
        return query select 0::big bigint, 0::bigint, 0::bigint, 0::bigint, 100::numeric;
    else
        return query select 
            v_expected_count, 
            v_present_count, 
            v_late_count, 
            (v_expected_count - v_present_count),
            round((v_present_count::numeric / v_expected_count::numeric) * 100, 1);
    end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;

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

-- 6. TRIGGER
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. RLS SECURITY (BLUEPRINT V19.1 - STABILITY FOCUS)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.school_years enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.settings enable row level security;
alter table public.holidays enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- OPEN POLICIES (Allow Middleware to read data easily)
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Classes are viewable by everyone" on public.classes for select using (true);
create policy "Admins can manage classes" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Subjects are viewable by everyone" on public.subjects for select using (true);
create policy "Teachers can manage own subjects" on public.subjects for all using (auth.uid() = teacher_id);

create policy "School years are viewable by everyone" on public.school_years for select using (true);
create policy "Admins can manage school years" on public.school_years for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Students are viewable by everyone" on public.students for select using (true);
create policy "Admins can manage students" on public.students for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Schedule is viewable by everyone" on public.schedule for select using (true);
create policy "Admins can manage schedule" on public.schedule for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Own attendance records are viewable by teachers" on public.attendance_records for select using (auth.uid() = teacher_id);
create policy "Teachers can manage own attendance records" on public.attendance_records for all using (auth.uid() = teacher_id);

create policy "Own grade records are viewable by teachers" on public.grade_records for select using (auth.uid() = teacher_id);
create policy "Teachers can manage own grade records" on public.grade_records for all using (auth.uid() = teacher_id);

create policy "Own journals are viewable by teachers" on public.journal_entries for select using (auth.uid() = teacher_id);
create policy "Teachers can manage own journals" on public.journal_entries for all using (auth.uid() = teacher_id);

create policy "Own agendas are viewable by teachers" on public.agendas for select using (auth.uid() = teacher_id);
create policy "Teachers can manage own agendas" on public.agendas for all using (auth.uid() = teacher_id);

create policy "Teacher attendance is viewable by everyone" on public.teacher_attendance for select using (true);
create policy "Teachers can record own attendance" on public.teacher_attendance for all using (auth.uid() = teacher_id);

create policy "Settings are viewable by everyone" on public.settings for select using (true);
create policy "Admins can manage settings" on public.settings for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Holidays are viewable by everyone" on public.holidays for select using (true);
create policy "Admins can manage holidays" on public.holidays for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Users can manage own drive integration" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Users can manage own AI documents" on public.ai_documents for all using (auth.uid() = user_id);

-- 8. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_activated on public.profiles(is_activated);
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grade_date on public.grade_records(date);
create index if not exists idx_schedule_day on public.schedule(day);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(date);
create index if not exists idx_questions_topic on public.questions(topic);
