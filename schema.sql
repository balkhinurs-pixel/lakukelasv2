-- ==========================================
-- LAKUKELAS MASTER BLUEPRINT V19.7 (ULTIMATE)
-- ==========================================
-- Skrip ini membangun seluruh infrastruktur database.
-- Jalankan di SQL Editor Supabase.

-- 1. EKSTENSI & CLEANUP
create extension if not exists "uuid-ossp";

-- Hapus objek lama untuk menghindari konflik
drop view if exists public.student_notes_with_teacher cascade;
drop view if exists public.journal_entries_with_names cascade;
drop view if exists public.attendance_history cascade;
drop view if exists public.grades_history cascade;

-- 2. TABEL UTAMA (PROFIL & AUTH)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  role text check (role in ('admin', 'teacher', 'headmaster')) default 'teacher',
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  school_name text,
  school_address text,
  school_logo_url text,
  headmaster_name text,
  headmaster_nip text,
  gemini_api_key text,
  created_at timestamptz default now()
);

-- 3. TABEL MASTER DATA
create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id),
  is_active boolean default false,
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
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active',
  avatar_url text,
  created_at timestamptz default now()
);

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

-- 4. TABEL TRANSAKSIONAL (ABSENSI, NILAI, JURNAL)
create table public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text,
  reason text,
  created_at timestamptz default now(),
  unique(teacher_id, date)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  meeting_number int not null,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')) not null,
  created_at timestamptz default now()
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date date not null,
  assessment_type text not null,
  score numeric(5,2) not null,
  created_at timestamptz default now()
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  date timestamptz not null default now(),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

-- 5. FITUR PRODUKTIVITAS & SISTEM
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
  type text check (type in ('positive', 'improvement', 'neutral')) default 'neutral',
  date timestamptz default now(),
  created_at timestamptz default now()
);

create table public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text check (type in ('national', 'school')) default 'school',
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

-- 6. FITUR AI & GOOGLE DRIVE
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid, -- Reserved for future multi-school
  created_by uuid references public.profiles(id) on delete cascade,
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
  image_url text,
  needs_review boolean default true,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.google_drive_integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'google',
  drive_email text,
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
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  title text not null,
  subject text,
  class_level text,
  semester text,
  drive_file_id text,
  drive_file_url text,
  drive_folder_id text,
  mime_type text,
  is_public boolean default false,
  status text default 'created',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. VIEW (DATA GABUNGAN)
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
  sn.*,
  p.full_name as teacher_name
from public.student_notes sn
join public.profiles p on sn.teacher_id = p.id;

-- 8. FUNGSI & TRIGGER (AUTO ADMIN)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  -- Cek apakah ini user pertama kali di tabel profiles
  select not exists (select 1 from public.profiles) into is_first_user;

  if is_first_user then
    -- Pendaftar pertama otomatis jadi Admin aktif
    insert into public.profiles (id, full_name, avatar_url, role, is_activated)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'full_name', 'Administrator LakuKelas'),
      new.raw_user_meta_data->>'avatar_url',
      'admin',
      true
    );
  else
    -- Pendaftar selanjutnya jadi Guru pending
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

-- 9. FUNGSI ANALITIK (MONITORING)
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
    v_absent_count bigint;
begin
    -- 1. Ambil kebijakan absensi
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    -- 2. Tentukan jumlah guru yang WAJIB hadir hari ini
    if v_policy = 'daily_based' then
        select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into v_expected_count from public.schedule where day = (
            select case extract(dow from p_date)
                when 0 then 'Minggu' when 1 then 'Senin' when 2 then 'Selasa' when 3 then 'Rabu'
                when 4 then 'Kamis' when 5 then 'Jumat' when 6 then 'Sabtu'
            end
        );
    end if;

    -- 3. Hitung yang sudah absen
    select count(*) into v_present_count from public.teacher_attendance where date = p_date and check_in is not null;
    select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';
    
    v_absent_count := v_expected_count - v_present_count;
    if v_absent_count < 0 then v_absent_count := 0; end if;

    return query select 
        v_expected_count, 
        v_present_count, 
        v_late_count, 
        v_absent_count,
        case when v_expected_count = 0 then 100.0 else round((v_present_count::numeric / v_expected_count::numeric) * 100, 2) end;
end;
$$;

-- 10. KEAMANAN (RLS)
alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.questions enable row level security;

-- Kebijakan Profil (Sangat Penting untuk Middleware)
create policy "profile_select_all" on public.profiles for select using (true);
create policy "profile_update_own" on public.profiles for update using (auth.uid() = id);

-- Kebijakan Master Data (Admin Power)
create policy "master_admin_all" on public.school_years for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "master_teacher_select" on public.school_years for select using (true);

create policy "classes_admin_all" on public.classes for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "classes_teacher_select" on public.classes for select using (true);

create policy "subjects_admin_all" on public.subjects for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
create policy "subjects_teacher_select" on public.subjects for select using (true);

-- Kebijakan Transaksional
create policy "transaction_own_access" on public.attendance_records for all using (
  teacher_id = auth.uid() or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

create policy "transaction_grades_access" on public.grade_records for all using (
  teacher_id = auth.uid() or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

create policy "journal_access" on public.journal_entries for all using (
  teacher_id = auth.uid() or 
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

-- 11. IZIN AKHIR (GRANTS)
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Pastikan RLS tidak memblokir service_role (Vercel/Internal)
alter table public.profiles force row level security;
