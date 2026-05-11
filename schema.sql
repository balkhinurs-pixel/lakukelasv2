-- LakuKelas Database Schema
-- Last Updated: Complete Setup with RLS and Functions

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES
-- Profiles: User data (Admin, Teacher, Headmaster)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  role text check (role in ('admin', 'teacher', 'headmaster')) default 'teacher',
  is_homeroom_teacher boolean default false,
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text
);

-- School Years
create table public.school_years (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null unique -- e.g., "2023/2024 - Ganjil"
);

-- Settings (Global configuration)
create table public.settings (
  key text primary key,
  value text not null,
  description text
);

-- Classes
create table public.classes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null -- Homeroom Teacher
);

-- Subjects
create table public.subjects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  kkm integer default 75
);

-- Students
create table public.students (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete set null,
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active',
  avatar_url text
);

-- Schedule
create table public.schedule (
  id uuid default uuid_generate_v4() primary key,
  day text check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')) not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Attendance Records (Student Attendance)
create table public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')) not null,
  meeting_number integer
);

-- Grade Records (Student Grades)
create table public.grade_records (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  assessment_type text not null, -- e.g., "UH1", "UTS"
  score numeric check (score >= 0 and score <= 100) not null
);

-- Journal Entries
create table public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text
);

-- Agendas (Personal teacher reminders)
create table public.agendas (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Teacher Attendance (Staff check-in)
create table public.teacher_attendance (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date default current_date not null,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')) not null,
  reason text,
  unique(teacher_id, date)
);

-- Materials (Links to learning resources)
create table public.materials (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  description text,
  link_url text not null
);

-- Student Notes (Observations)
create table public.student_notes (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  note text not null,
  type text check (type in ('positive', 'improvement', 'neutral')) default 'neutral'
);

-- Holidays
create table public.holidays (
  id uuid default uuid_generate_v4() primary key,
  date date not null unique,
  description text not null
);

-- 3. VIEWS
-- Combined Attendance History
create or replace view public.attendance_history as
select 
  ar.id, ar.date, ar.meeting_number, ar.status, ar.student_id, ar.class_id, ar.subject_id, ar.teacher_id, ar.school_year_id,
  s.name as student_name, c.name as class_name, sub.name as subject_name, p.full_name as teacher_name
from attendance_records ar
join students s on ar.student_id = s.id
join classes c on ar.class_id = c.id
join subjects sub on ar.subject_id = sub.id
join profiles p on ar.teacher_id = p.id;

-- Combined Grades History
create or replace view public.grades_history as
select 
  gr.id, gr.date, gr.assessment_type, gr.score, gr.student_id, gr.class_id, gr.subject_id, gr.teacher_id, gr.school_year_id,
  s.name as student_name, c.name as class_name, sub.name as subject_name, sub.kkm as subject_kkm, p.full_name as teacher_name
from grade_records gr
join students s on gr.student_id = s.id
join classes c on gr.class_id = c.id
join subjects sub on gr.subject_id = sub.id
join profiles p on gr.teacher_id = p.id;

-- Journal Entries with Names
create or replace view public.journal_entries_with_names as
select 
  je.*, c.name as "className", s.name as "subjectName"
from journal_entries je
join classes c on je.class_id = c.id
join subjects s on je.subject_id = s.id;

-- Student Notes with Teacher Names
create or replace view public.student_notes_with_teacher as
select 
  sn.*, p.full_name as teacher_name
from student_notes sn
join profiles p on sn.teacher_id = p.id;

-- 4. FUNCTIONS & TRIGGERS
-- Trigger: Handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'teacher'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC: Get teacher activity counts for admin
create or replace function get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint
) as $$
begin
    return query
    select 
        p.id as teacher_id,
        (select count(*) from attendance_records ar where ar.teacher_id = p.id) as attendance_count,
        (select count(*) from grade_records gr where gr.teacher_id = p.id) as grades_count,
        (select count(*) from journal_entries je where je.teacher_id = p.id) as journal_count
    from profiles p
    where p.role in ('teacher', 'headmaster');
end;
$$ language plpgsql;

-- 5. RLS POLICIES (Enable RLS for all tables)
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.settings enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.holidays enable row level security;

-- Example Policies (Admin gets everything, teachers get their own data)
-- Profiles
create policy "Public profiles are viewable by authenticated users" on public.profiles for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can manage all profiles" on public.profiles for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Global Data (Viewable by all auth users)
create policy "School years are viewable by all" on public.school_years for select using (true);
create policy "Settings are viewable by all" on public.settings for select using (true);
create policy "Classes are viewable by all" on public.classes for select using (true);
create policy "Subjects are viewable by all" on public.subjects for select using (true);
create policy "Students are viewable by all" on public.students for select using (true);
create policy "Holidays are viewable by all" on public.holidays for select using (true);

-- Teacher Specific Data (RLS prevents cross-teacher viewing where appropriate)
create policy "Teachers can manage own schedule" on public.schedule for all using (teacher_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Teachers can manage own journals" on public.journal_entries for all using (teacher_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));
create policy "Teachers can manage own attendance records" on public.attendance_records for all using (teacher_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Teachers can manage own grade records" on public.grade_records for all using (teacher_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Teachers can manage own materials" on public.materials for all using (teacher_id = auth.uid());
create policy "Teachers can manage own agendas" on public.agendas for all using (teacher_id = auth.uid());
create policy "Teachers can manage own check-in" on public.teacher_attendance for all using (teacher_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and (role = 'admin' or role = 'headmaster')));

-- Admin only inserts
create policy "Admins can manage school years" on public.school_years for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage classes" on public.classes for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage subjects" on public.subjects for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage students" on public.students for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
create policy "Admins can manage settings" on public.settings for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- INITIAL DATA (Active School Year Placeholder)
-- Note: Replace with actual ID after first run if needed
insert into public.settings (key, value, description) values ('active_school_year_id', '', 'ID of the currently active school year');
insert into public.settings (key, value, description) values ('attendance_latitude', '-6.2088', 'Default school latitude');
insert into public.settings (key, value, description) values ('attendance_longitude', '106.8456', 'Default school longitude');
insert into public.settings (key, value, description) values ('attendance_radius', '30', 'Default attendance radius in meters');
insert into public.settings (key, value, description) values ('attendance_check_in_start', '06:30', 'Early check-in time');
insert into public.settings (key, value, description) values ('attendance_check_in_deadline', '07:15', 'Late check-in deadline');
