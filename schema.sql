
-- ==========================================================
-- LAKUKELAS DATABASE BLUEPRINT - VERSION 19.3
-- ==========================================================
-- Deskripsi: Skema lengkap untuk instalasi baru.
-- Fitur: Auto-Admin pendaftar pertama, RLS Open Policy, Grant Permissions.
-- ==========================================================

-- 0. BERSIHKAN DATA LAMA (Hati-hati: Menghapus semua tabel)
-- drop schema public cascade;
-- create schema public;

-- 1. EKSTENSI
create extension if not exists "uuid-ossp";

-- 2. TABEL PROFILES (Pusat Identitas)
-- ID harus merujuk ke auth.users agar Middleware berfungsi
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
  role text check (role in ('admin', 'teacher', 'headmaster')) default 'teacher',
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  gemini_api_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABEL MASTER DATA
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
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
  kkm int default 75,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active',
  avatar_url text,
  created_at timestamptz default now()
);

-- 4. TABEL TRANSAKSIONAL (Jadwal & Absensi)
create table public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null,
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  meeting_number int not null,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  assessment_type text not null,
  score int not null,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  date timestamptz default now(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- 5. TABEL PENDUKUNG (Agenda & Libur)
create table public.agendas (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,
  description text,
  tag text,
  color text,
  start_time time,
  end_time time,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text check (type in ('national', 'school')) default 'school'
);

create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text,
  reason text,
  created_at timestamptz default now()
);

-- 6. TABEL INTEGRASI AI & DRIVE
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

-- 7. TABEL SETTINGS SISTEM
create table public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

-- 8. FUNGSI LOGIKA (RPC)

-- 8.1. Sinkronisasi User Baru & Auto-Admin Pertama
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text := 'teacher';
  v_activated boolean := false;
begin
  -- Jika tabel profil masih kosong, jadikan pendaftar pertama sebagai ADMIN AKTIF
  if not exists (select 1 from public.profiles) then
    v_role := 'admin';
    v_activated := true;
  end if;

  insert into public.profiles (id, full_name, avatar_url, role, is_activated)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'),
    new.raw_user_meta_data->>'avatar_url',
    v_role,
    v_activated
  );
  return new;
end;
$$;

-- 8.2. Trigger User Baru
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 8.3. Fungsi Hitung Aktivitas Guru
create or replace function public.get_teacher_activity_counts()
returns table (
    id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) language sql security definer as $$
  select 
    p.id,
    (select count(distinct date::text || class_id::text || subject_id::text || meeting_number::text) from public.attendance_records where teacher_id = p.id) as attendance_count,
    (select count(distinct date::text || class_id::text || subject_id::text || assessment_type) from public.grade_records where teacher_id = p.id) as grades_count,
    (select count(*) from public.journal_entries where teacher_id = p.id) as journal_count,
    (select count(distinct class_id) from public.schedule where teacher_id = p.id) as classes_handled_count
  from public.profiles p;
$$;

-- 8.4. Summary Kehadiran Guru
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
    v_present_count bigint;
    v_late_count bigint;
    v_day_name text;
begin
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');
    
    select 
        case extract(dow from p_date)
            when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa'
            when 3 then 'Rabu' when 4 then 'Kamis' when 5 then 'Jumat'
            when 6 then 'Sabtu'
        end into v_day_name;

    if v_policy = 'daily_based' then
        select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into v_expected_count from public.schedule where day = v_day_name;
    end if;

    select count(*) into v_present_count from public.teacher_attendance where date = p_date and (status = 'Tepat Waktu' or status = 'Terlambat');
    select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';
    
    v_expected_count := coalesce(v_expected_count, 0);
    return query select 
        v_expected_count,
        v_present_count,
        v_late_count,
        (v_expected_count - v_present_count) as v_absent,
        case when v_expected_count > 0 then round((v_present_count::numeric / v_expected_count::numeric) * 100, 1) else 100.0 end;
end;
$$;

-- 9. VIEW (Data Gabungan)
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
    p.full_name as teacher_name
from public.attendance_records ar
join public.classes c on ar.class_id = c.id
join public.subjects s on ar.subject_id = s.id
join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
    gr.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name
from public.grade_records gr
join public.classes c on gr.class_id = c.id
join public.subjects s on gr.subject_id = s.id
join public.profiles p on gr.teacher_id = p.id;

-- 10. RLS & KEBIJAKAN KEAMANAN (SANGAT PENTING)
alter table public.profiles enable row level security;

-- Agar Middleware bisa membaca role tanpa error loop
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Berikan izin akses teknis ke Postgres
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 11. INDEXES
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_date on public.grade_records(date);
