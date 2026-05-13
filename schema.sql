
-- LakuKelas Database Schema (V4.8)
-- Includes: Profiles, Academic Data, Teacher Attendance, WhatsApp Settings, and Monitoring Functions

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles (Users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_homeroom_teacher boolean default false,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text
);

-- School Years
create table if not exists public.school_years (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Classes
create table if not exists public.classes (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null -- Wali Kelas
);

-- Subjects
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Students
create table if not exists public.students (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  nis text unique,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text
);

-- Schedule (Guru mengampu kelas apa, hari apa)
create table if not exists public.schedule (
  id uuid default uuid_generate_v4() primary key,
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Student Attendance Records (Presensi Siswa)
create table if not exists public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  date date not null,
  meeting_number integer,
  status text not null check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade
);

-- Grade Records (Nilai Siswa)
create table if not exists public.grade_records (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score numeric not null check (score >= 0 and score <= 100),
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade
);

-- Journal Entries (Jurnal Mengajar Guru)
create table if not exists public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text,
  learning_activities text,
  assessment text,
  reflection text,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Agendas (Agenda Pribadi Guru)
create table if not exists public.agendas (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  title text not null,
  description text,
  tag text,
  color text default '#6b7280',
  start_time time,
  end_time time,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Teacher Attendance (Absensi Guru/Staf - NEW V4.6)
create table if not exists public.teacher_attendance (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  latitude text,
  longitude text,
  unique(teacher_id, date)
);

-- Holidays (NEW V4.6)
create table if not exists public.holidays (
  id uuid default uuid_generate_v4() primary key,
  date date unique not null,
  description text
);

-- Settings (Global configuration - NEW V4.7)
create table if not exists public.settings (
  key text primary key,
  value text
);

-- Materials (Links to learning resources)
create table if not exists public.materials (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  link_url text not null,
  created_at timestamp with time zone default now()
);

-- Student Notes (Catatan dari Guru untuk Siswa)
create table if not exists public.student_notes (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
    date timestamp with time zone default now()
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
  ar.id,
  ar.date,
  ar.meeting_number,
  ar.status,
  ar.student_id,
  ar.class_id,
  ar.subject_id,
  ar.teacher_id,
  ar.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records ar
left join public.classes c on ar.class_id = c.id
left join public.subjects s on ar.subject_id = s.id
left join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
  gr.id,
  gr.date,
  gr.assessment_type,
  gr.score,
  gr.student_id,
  gr.class_id,
  gr.subject_id,
  gr.teacher_id,
  gr.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records gr
left join public.classes c on gr.class_id = c.id
left join public.subjects s on gr.subject_id = s.id
left join public.profiles p on gr.teacher_id = p.id;

create or replace view public.student_notes_with_teacher as
select 
    sn.*,
    p.full_name as teacher_name
from public.student_notes sn
left join public.profiles p on sn.teacher_id = p.id;

-- 4. FUNCTIONS & RPC

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(new.raw_user_meta_data->>'role', 'teacher')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Get Teacher Activity Counts (For Dashboard Monitoring)
create or replace function public.get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    journal_count bigint,
    grades_count bigint,
    classes_handled_count bigint
) as $$
begin
    return query
    select 
        p.id as teacher_id,
        (select count(distinct date || class_id || subject_id || meeting_number) from attendance_records where teacher_id = p.id) as attendance_count,
        (select count(*) from journal_entries where teacher_id = p.id) as journal_count,
        (select count(distinct date || class_id || subject_id || assessment_type) from grade_records where teacher_id = p.id) as grades_count,
        (select count(distinct class_id) from schedule where teacher_id = p.id) as classes_handled_count
    from profiles p
    where p.role in ('teacher', 'headmaster');
end;
$$ language plpgsql security definer;

-- Get Teacher Attendance Summary (Cek Kewajiban vs Realita - NEW V4.6)
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
    v_is_holiday boolean;
    v_day_name text;
begin
    -- 1. Ambil kebijakan absensi
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');
    
    -- 2. Cek apakah hari libur
    select exists(select 1 from public.holidays where date = p_date) into v_is_holiday;
    
    -- 3. Ambil nama hari (Indonesian)
    select 
        case extract(dow from p_date)
            when 0 then 'Minggu'
            when 1 then 'Senin'
            when 2 then 'Selasa'
            when 3 then 'Rabu'
            when 4 then 'Kamis'
            when 5 then 'Jumat'
            when 6 then 'Sabtu'
        end into v_day_name;

    -- Jika hari libur atau Minggu, kewajiban 0
    if v_is_holiday or v_day_name = 'Minggu' then
        return query select 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::numeric;
        return;
    end if;

    return query
    with expected_teachers as (
        -- Guru yang wajib hadir
        select distinct p.id
        from public.profiles p
        where p.role in ('teacher', 'headmaster')
        and (
            v_policy = 'daily_based'
            or (v_policy = 'schedule_based' and exists(select 1 from public.schedule where teacher_id = p.id and day = v_day_name))
        )
    ),
    actual_attendance as (
        -- Guru yang benar-benar absen
        select teacher_id, status
        from public.teacher_attendance
        where date = p_date
    )
    select 
        (select count(*) from expected_teachers) as total_expected,
        (select count(*) from expected_teachers et join actual_attendance aa on et.id = aa.teacher_id where aa.status in ('Tepat Waktu', 'Terlambat')) as total_present,
        (select count(*) from expected_teachers et join actual_attendance aa on et.id = aa.teacher_id where aa.status = 'Terlambat') as total_late,
        (select count(*) from expected_teachers et left join actual_attendance aa on et.id = aa.teacher_id where aa.teacher_id is null) as total_absent,
        case 
            when (select count(*) from expected_teachers) = 0 then 0::numeric
            else round(((select count(*) from expected_teachers et join actual_attendance aa on et.id = aa.teacher_id where aa.status in ('Tepat Waktu', 'Terlambat'))::numeric / (select count(*) from expected_teachers)::numeric) * 100, 2)
        end as attendance_rate;
end;
$$ language plpgsql security definer;

-- Diagnosis function to debug attendance logic
create or replace function public.diagnose_attendance_logic(p_date date)
returns json as $$
declare
    v_policy text;
    v_day_name text;
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');
    
    select 
        case extract(dow from p_date)
            when 0 then 'Minggu'
            when 1 then 'Senin'
            when 2 then 'Selasa'
            when 3 then 'Rabu'
            when 4 then 'Kamis'
            when 5 then 'Jumat'
            when 6 then 'Sabtu'
        end into v_day_name;

    return json_build_object(
        'date', p_date,
        'day_name', v_day_name,
        'policy', v_policy,
        'expected_ids', (
            select array_agg(distinct p.id)
            from public.profiles p
            where p.role in ('teacher', 'headmaster')
            and (v_policy = 'daily_based' or (v_policy = 'schedule_based' and exists(select 1 from public.schedule where teacher_id = p.id and day = v_day_name)))
        ),
        'actual_attendance', (
            select json_agg(json_build_object('id', teacher_id, 'status', status))
            from public.teacher_attendance where date = p_date
        )
    );
end;
$$ language plpgsql security definer;

-- 5. SEEDING INITIAL DATA
insert into public.settings (key, value) values ('attendance_policy', 'schedule_based') on conflict (key) do nothing;
insert into public.settings (key, value) values ('wa_reminder_enabled', 'false') on conflict (key) do nothing;
insert into public.settings (key, value) values ('wa_reminder_time', '06:00') on conflict (key) do nothing;
