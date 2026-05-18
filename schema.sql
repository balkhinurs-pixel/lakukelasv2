-- ==========================================================
-- MASTER BLUEPRINT DATABASE LAKUKELAS
-- Versi: Ultimate Master Blueprint (V19.7)
-- Fitur: Auto-Admin, Academic Management, Monitoring KS, 
--        Homeroom Logic, AI Bank Soal, Google Drive, Holidays.
-- ==========================================================

-- EXTENSIONS
create extension if not exists "uuid-ossp";

-- 1. TABEL PROFILES (Pusat Identitas Pengguna)
create table public.profiles (
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
  gemini_api_key text,
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  created_at timestamptz default now()
);

-- 2. TABEL AKADEMIK (Master Data)
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id), -- Wali Kelas
  created_at timestamptz default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete set null,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. TABEL OPERASIONAL (Harian)
create table public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  meeting_number int,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  date date default current_date,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  assessment_type text not null,
  score int check (score >= 0 and score <= 100),
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- 4. TABEL MONITORING & PENGATURAN
create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  location_lat text,
  location_lng text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'school' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

create table public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
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

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  title text not null,
  description text,
  link_url text not null,
  created_at timestamptz default now()
);

create table public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- 5. TABEL AI & GOOGLE DRIVE
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
  status text default 'draft',
  needs_review boolean default true,
  image_url text,
  created_at timestamptz default now()
);

create table public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  folder_id text,
  folder_url text,
  folder_name text default 'LakuKelas AI',
  status text default 'connected',
  connected_at timestamptz default now(),
  disconnected_at timestamptz
);

create table public.ai_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  document_type text,
  title text not null,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  status text default 'created',
  created_at timestamptz default now()
);

-- ==========================================================
-- LOGIKA OTOMATISASI (TRIGGERS & FUNCTIONS)
-- ==========================================================

-- 1. Fungsi Handle User Baru (Auto-Admin Logic)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  -- Cek apakah pendaftar pertama
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================================
-- VIEWS (Untuk Report & Sejarah)
-- ==========================================================

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

-- ==========================================================
-- RLS (ROW LEVEL SECURITY)
-- ==========================================================

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.journal_entries enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.holidays enable row level security;
alter table public.settings enable row level security;
alter table public.questions enable row level security;

-- Global Policies (Admin & Headmaster)
create policy "Admin and KS can view all profiles" on public.profiles for select to authenticated using (true);
create policy "Admin can do anything on profiles" on public.profiles for all to authenticated using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- Master Data Policies (Admin full access, others read only)
create policy "Admin can manage school_years" on public.school_years for all to authenticated using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Everyone can view school_years" on public.school_years for select to authenticated using (true);

create policy "Admin can manage classes" on public.classes for all to authenticated using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Everyone can view classes" on public.classes for select to authenticated using (true);

create policy "Admin can manage subjects" on public.subjects for all to authenticated using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Everyone can view subjects" on public.subjects for select to authenticated using (true);

create policy "Admin can manage students" on public.students for all to authenticated using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
create policy "Everyone can view students" on public.students for select to authenticated using (true);

-- Transactional Data (Teachers can manage own, KS & Admin can view all)
create policy "Teachers can manage own journal" on public.journal_entries for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "KS and Admin can view all journal" on public.journal_entries for select to authenticated using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'headmaster')
);

create policy "Teachers can manage own attendance" on public.attendance_records for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "Wali Kelas and KS can view attendance" on public.attendance_records for select to authenticated using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'headmaster') OR
  class_id in (select id from public.classes where teacher_id = auth.uid())
);

create policy "Teachers can manage own grades" on public.grade_records for all to authenticated using (teacher_id = auth.uid()) with check (teacher_id = auth.uid());
create policy "Wali Kelas and KS can view grades" on public.grade_records for select to authenticated using (
  (select role from public.profiles where id = auth.uid()) in ('admin', 'headmaster') OR
  class_id in (select id from public.classes where teacher_id = auth.uid())
);

-- ==========================================================
-- RPC FUNCTIONS (FOR FRONTEND)
-- ==========================================================

create or replace function public.get_teacher_activity_counts()
returns table (
    id uuid,
    attendance_count bigint,
    journal_count bigint,
    grades_count bigint,
    classes_handled_count bigint
) language sql security definer set search_path = public as $$
    select 
        p.id,
        (select count(distinct date) from public.teacher_attendance where teacher_id = p.id) as attendance_count,
        (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
        (select count(distinct assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
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
) language plpgsql security definer set search_path = public as $$
declare
    v_expected bigint;
    v_present bigint;
    v_late bigint;
begin
    -- Hitung jumlah guru yang wajib hadir (semua staf aktif)
    select count(*) into v_expected from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    
    -- Hitung yang sudah absen
    select count(*) into v_present from public.teacher_attendance where date = p_date;
    select count(*) into v_late from public.teacher_attendance where date = p_date and status = 'Terlambat';
    
    return query 
    select 
        v_expected, 
        v_present, 
        v_late, 
        v_expected - v_present,
        case when v_expected > 0 then round((v_present::numeric / v_expected::numeric) * 100, 1) else 100::numeric end;
end;
$$;

-- ==========================================================
-- FINAL GRANTS (Anti "Permission Denied")
-- ==========================================================

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- Ensure public profile visibility for the system
create policy "Public profile read access" on public.profiles for select to authenticated, anon using (true);