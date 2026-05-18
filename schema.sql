-- LakuKelas Database Blueprint
-- Version: V18.2
-- Description: Full schema including Teacher Management, Roster, Attendance, Grades, Journals, AI Bank Soal, and Google Drive Integration.

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- 1. PROFILES (Extends Auth.Users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default 'User LakuKelas',
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text not null default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
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

-- 2. SCHOOL YEARS
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- 3. CLASSES
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. SUBJECTS
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. STUDENTS
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- 6. ATTENDANCE RECORDS (STUDENTS)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number int not null,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

-- 7. GRADE RECORDS
create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  assessment_type text not null,
  score numeric(5,2) not null,
  created_at timestamptz default now()
);

-- 8. JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- 9. SCHEDULE
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 10. TEACHER ATTENDANCE (PRESENSI GURU)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null check (status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin', 'Tidak Hadir')),
  reason text,
  location_lat numeric,
  location_lng numeric,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

-- 11. AGENDAS
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

-- 12. MATERIALS (SUMBER BELAJAR)
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

-- 13. HOLIDAYS
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'national' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

-- 14. SETTINGS (SISTEM)
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- 15. ACTIVATION TOKENS
create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- 16. STUDENT NOTES
create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- 17. QUESTIONS (AI BANK SOAL)
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
  image_prompt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 18. GOOGLE DRIVE INTEGRATIONS
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
  unique(user_id)
);

-- 19. AI DOCUMENTS (RIWAYAT DRIVE)
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

-- VIEWS
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
  ar.*, 
  c.name as class_name, 
  s.name as subject_name, 
  st.name as student_name,
  p.full_name as teacher_name
from public.attendance_records ar
left join public.classes c on ar.class_id = c.id
left join public.subjects s on ar.subject_id = s.id
left join public.students st on ar.student_id = st.id
left join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
  gr.*, 
  c.name as class_name, 
  s.name as subject_name, 
  s.kkm as subject_kkm,
  st.name as student_name,
  p.full_name as teacher_name
from public.grade_records gr
left join public.classes c on gr.class_id = c.id
left join public.subjects s on gr.subject_id = s.id
left join public.students st on gr.student_id = st.id
left join public.profiles p on gr.teacher_id = p.id;

-- FUNCTIONS & RPC
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
    -- Schedule based logic
    select count(distinct teacher_id) into v_expected_count 
    from public.schedule 
    where day = (select 
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
    count(case when status in ('Tepat Waktu', 'Terlambat') then 1 end)::bigint as total_present,
    count(case when status = 'Terlambat' then 1 end)::bigint as total_late,
    (v_expected_count - count(case when status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin') then 1 end))::bigint as total_absent,
    case when v_expected_count > 0 then 
      round((count(case when status in ('Tepat Waktu', 'Terlambat') then 1 end)::numeric / v_expected_count) * 100, 2)
    else 100.00 end as attendance_rate
  from public.teacher_attendance
  where date = p_date;
end;
$$;

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
    (select count(distinct date || class_id || subject_id || meeting_number) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date || class_id || subject_id || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p
  where p.role in ('teacher', 'headmaster') and p.is_activated = true;
$$;

-- TRIGGERS
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'), new.raw_user_meta_data->>'avatar_url', 'teacher');
  return new;
end;
$$;

-- RLS & POLICIES
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

alter table public.questions enable row level security;
create policy "Users can manage own questions" on public.questions for all using (auth.uid() = created_by);

alter table public.google_drive_integrations enable row level security;
create policy "Users can manage own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);

alter table public.ai_documents enable row level security;
create policy "Users can manage own ai docs" on public.ai_documents for all using (auth.uid() = user_id);

-- INDEXES
create index if not exists idx_students_class on public.students(class_id);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
create index if not exists idx_questions_topic on public.questions(topic);
create index if not exists idx_questions_subject on public.questions(subject);
create index if not exists idx_teacher_attendance_date on public.teacher_attendance(date);
