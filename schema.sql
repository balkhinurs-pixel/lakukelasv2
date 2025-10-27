
-- ### PROFILES ###
-- This table is managed by Supabase Auth.
-- It will be populated automatically when a new user signs up.
-- We add a function to handle this automatically.

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  role text default 'teacher',
  is_homeroom_teacher boolean default false,
  -- School specific data, managed by admin
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  -- For global settings
  active_school_year_id uuid references public.school_years(id) on delete set null
);

-- Set up Row Level Security (RLS)
alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile for new users.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$;

-- set up the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ### CLASSES, STUDENTS, SUBJECTS, SCHOOL YEARS ###

create table classes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null -- Wali Kelas
);
alter table classes enable row level security;
create policy "Classes are viewable by authenticated users." on classes for select using (auth.role() = 'authenticated');
create policy "Admins can manage classes." on classes for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create table subjects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  kkm integer not null default 75
);
alter table subjects enable row level security;
create policy "Subjects are viewable by authenticated users." on subjects for select using (auth.role() = 'authenticated');
create policy "Admins can manage subjects." on subjects for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create type student_status as enum ('active', 'graduated', 'dropout', 'inactive');
create table students (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  nis text,
  gender text not null,
  class_id uuid references public.classes(id) on delete set null,
  status student_status not null default 'active'
);
alter table students enable row level security;
create policy "Students are viewable by authenticated users." on students for select using (auth.role() = 'authenticated');
create policy "Admins can manage students." on students for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create table school_years (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null unique
);
alter table school_years enable row level security;
create policy "School years are viewable by authenticated users." on school_years for select using (auth.role() = 'authenticated');
create policy "Admins can manage school years." on school_years for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- ### SCHEDULE ###
create type day_of_week as enum ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
create table schedule (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  day day_of_week not null,
  start_time time not null,
  end_time time not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table schedule enable row level security;
create policy "Schedules are viewable by authenticated users." on schedule for select using (auth.role() = 'authenticated');
create policy "Admins can manage schedules." on schedule for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));


-- ### RECORDS ###
create type attendance_status as enum ('Hadir', 'Sakit', 'Izin', 'Alpha');
create table attendance_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  meeting_number integer not null,
  status attendance_status not null,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade
);
alter table attendance_records enable row level security;
create policy "Users can manage their own attendance records." on attendance_records for all using (auth.uid() = teacher_id);
create policy "Admins and Headmasters can view all attendance records." on attendance_records for select using (exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));


create table grade_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  assessment_type text not null,
  score integer not null,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade
);
alter table grade_records enable row level security;
create policy "Users can manage their own grade records." on grade_records for all using (auth.uid() = teacher_id);
create policy "Admins and Headmasters can view all grade records." on grade_records for select using (exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));


create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date date not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table journal_entries enable row level security;
create policy "Users can manage their own journal entries." on journal_entries for all using (auth.uid() = teacher_id);
create policy "Admins and Headmasters can view all journal entries." on journal_entries for select using (exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));

-- ### AGENDAS ###
create table agendas (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid not null references public.profiles(id) on delete cascade
);
alter table agendas enable row level security;
create policy "Users can manage their own agendas." on agendas for all using (auth.uid() = teacher_id);

-- ### TEACHER ATTENDANCE ###
create type teacher_attendance_status as enum ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin');
create table teacher_attendance (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    date date not null,
    check_in time,
    check_out time,
    status teacher_attendance_status not null,
    reason text,
    unique(teacher_id, date)
);
alter table teacher_attendance enable row level security;
create policy "Users can manage their own attendance." on teacher_attendance for all using (auth.uid() = teacher_id);
create policy "Admins and Headmasters can view all attendance." on teacher_attendance for select using (exists (select 1 from profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));


-- ### STUDENT NOTES ###
create type student_note_type as enum ('positive', 'improvement', 'neutral');
create table student_notes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    date timestamptz not null,
    student_id uuid not null references public.students(id) on delete cascade,
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    note text not null,
    type student_note_type not null default 'neutral'
);
alter table student_notes enable row level security;
create policy "Homeroom teachers can manage notes for their students." on student_notes
  for all using (
    -- check if user is the homeroom teacher for the student's class
    exists (
      select 1 from classes c
      join students s on s.class_id = c.id
      where c.teacher_id = auth.uid() and s.id = student_notes.student_id
    )
    or
    -- Allow admins to do everything
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Teachers can view notes for students they teach." on student_notes
  for select using (
    -- check if teacher has the student in any of their scheduled classes
    exists (
      select 1 from schedule sch
      join students s on s.class_id = sch.class_id
      where sch.teacher_id = auth.uid() and s.id = student_notes.student_id
    )
  );

-- ### SETTINGS ###
create table settings (
  key text primary key,
  value text
);
alter table settings enable row level security;
create policy "Settings are viewable by everyone." on settings for select using (true);
create policy "Admins can manage settings." on settings for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Set default active school year after creating at least one
-- INSERT INTO settings (key, value) VALUES ('active_school_year_id', 'YOUR_SCHOOL_YEAR_ID');


-- ### VIEWS for simplified data fetching ###

create or replace view public.attendance_history as
select
  ar.id,
  ar.date,
  ar.meeting_number,
  ar.class_id,
  ar.subject_id,
  ar.teacher_id,
  ar.school_year_id,
  ar.status,
  ar.student_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
from
  attendance_records ar
  join classes c on ar.class_id = c.id
  join subjects s on ar.subject_id = s.id
  join profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select
  gr.id,
  gr.date,
  gr.assessment_type,
  gr.class_id,
  gr.subject_id,
  gr.teacher_id,
  gr.school_year_id,
  gr.score,
  gr.student_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
from
  grade_records gr
  join classes c on gr.class_id = c.id
  join subjects s on gr.subject_id = s.id
  join profiles p on gr.teacher_id = p.id;
  
create or replace view public.journal_entries_with_names as
select
  j.id,
  j.date,
  j.class_id,
  j.subject_id,
  j.school_year_id,
  j.meeting_number,
  j.learning_objectives,
  j.learning_activities,
  j.assessment,
  j.reflection,
  j.teacher_id,
  c.name as "className",
  s.name as "subjectName"
from
  journal_entries j
  join classes c on j.class_id = c.id
  join subjects s on j.subject_id = s.id;
  
create or replace view public.student_notes_with_teacher as
select
    sn.id,
    sn.date,
    sn.student_id,
    sn.note,
    sn.type,
    p.full_name as teacher_name
from
    student_notes sn
join
    profiles p on sn.teacher_id = p.id;

-- ### RPC Functions ###

-- Get Student Ledger Data
create or replace function get_student_grades_ledger(p_student_id uuid)
returns table (
  id uuid,
  "subjectName" text,
  assessment_type text,
  date date,
  score int,
  kkm int
) as $$
begin
  return query
  select
    gh.id,
    gh.subject_name as "subjectName",
    gh.assessment_type,
    gh.date,
    gh.score,
    gh.subject_kkm as kkm
  from grades_history gh
  where gh.student_id = p_student_id
  and gh.school_year_id = (select value from settings where key = 'active_school_year_id');
end;
$$ language plpgsql;

create or replace function get_student_attendance_ledger(p_student_id uuid)
returns table (
  id uuid,
  "subjectName" text,
  date date,
  meeting_number int,
  status attendance_status
) as $$
begin
  return query
  select
    ah.id,
    ah.subject_name as "subjectName",
    ah.date,
    ah.meeting_number,
    ah.status
  from attendance_history ah
  where ah.student_id = p_student_id
  and ah.school_year_id = (select value from settings where key = 'active_school_year_id');
end;
$$ language plpgsql;


-- Function to get active school year ID
create or replace function get_active_school_year_id()
returns uuid as $$
declare
  active_year_id uuid;
begin
  select value::uuid into active_year_id from settings where key = 'active_school_year_id' limit 1;
  return active_year_id;
end;
$$ language plpgsql;


-- Get Student Performance for a Class
create or replace function get_student_performance_for_class(p_class_id uuid)
returns table (
  id uuid,
  name text,
  nis text,
  average_grade numeric,
  attendance_percentage numeric,
  status text
) as $$
declare
  active_year_id uuid;
begin
  -- Get active school year
  active_year_id := get_active_school_year_id();

  return query
  with student_grades as (
    select
      student_id,
      avg(score)::numeric as avg_score
    from grade_records
    where class_id = p_class_id and school_year_id = active_year_id
    group by student_id
  ),
  student_attendance as (
    select
      student_id,
      (count(*) filter (where status = 'Hadir'))::numeric * 100 / count(*)::numeric as att_percentage
    from attendance_records
    where class_id = p_class_id and school_year_id = active_year_id
    group by student_id
  )
  select
    s.id,
    s.name,
    s.nis,
    coalesce(round(sg.avg_score, 1), 0) as average_grade,
    coalesce(round(sa.att_percentage, 1), 100) as attendance_percentage,
    case
      when coalesce(sg.avg_score, 0) >= 85 and coalesce(sa.att_percentage, 100) >= 95 then 'Sangat Baik'
      when coalesce(sg.avg_score, 0) < 70 and coalesce(sa.att_percentage, 100) < 85 then 'Berisiko'
      when coalesce(sg.avg_score, 0) < 78 or coalesce(sa.att_percentage, 100) < 92 then 'Butuh Perhatian'
      else 'Stabil'
    end as status
  from students s
  left join student_grades sg on s.id = sg.student_id
  left join student_attendance sa on s.id = sa.student_id
  where s.class_id = p_class_id and s.status = 'active';

end;
$$ language plpgsql;


-- Function to get teacher activity counts
create or replace function get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint
) as $$
begin
    return query
    with attendance as (
        select ar.teacher_id, count(distinct (ar.date, ar.class_id, ar.subject_id, ar.meeting_number)) as total
        from attendance_records ar
        group by ar.teacher_id
    ),
    grades as (
        select gr.teacher_id, count(distinct (gr.date, gr.class_id, gr.subject_id, gr.assessment_type)) as total
        from grade_records gr
        group by gr.teacher_id
    ),
    journals as (
        select je.teacher_id, count(*) as total
        from journal_entries je
        group by je.teacher_id
    )
    select
        p.id as teacher_id,
        coalesce(a.total, 0) as attendance_count,
        coalesce(g.total, 0) as grades_count,
        coalesce(j.total, 0) as journal_count
    from profiles p
    left join attendance a on p.id = a.teacher_id
    left join grades g on p.id = g.teacher_id
    left join journals j on p.id = j.teacher_id
    where p.role in ('teacher', 'headmaster');
end;
$$ language plpgsql;
