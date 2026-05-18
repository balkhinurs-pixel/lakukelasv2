-- ==========================================
-- LAKUKELAS DATABASE BLUEPRINT V18.8
-- Fitur: Auth Sync, Auto-Admin First User, 
-- RLS Anti-Recursion, AI Module & Drive
-- ==========================================

-- 0. BERSIHKAN DATA LAMA (OPSIONAL - GUNAKAN HATI-HATI)
-- drop view if exists public.journal_entries_with_names cascade;
-- drop view if exists public.attendance_history cascade;
-- drop view if exists public.grades_history cascade;
-- drop view if exists public.student_notes_with_teacher cascade;

-- 1. EKSTENSI & SETUP AWAL
create extension if not exists "uuid-ossp";

-- 2. TABEL PROFILES (DENGAN KOLOM SEKOLAH & AI)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  nip text,
  pangkat text,
  jabatan text,
  phone_number text,
  
  -- Data Sekolah (Khusus Admin)
  school_name text,
  school_address text,
  headmaster_name text,
  headmaster_nip text,
  school_logo_url text,
  
  -- Role & Status
  role text default 'teacher' check (role in ('admin', 'teacher', 'headmaster')),
  is_activated boolean default false,
  is_homeroom_teacher boolean default false,
  
  -- AI Config
  gemini_api_key text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. TABEL MASTER DATA (TAHUN AJARAN, KELAS, MAPEL)
create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean default false,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id), -- Wali Kelas
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kkm int default 75,
  teacher_id uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete set null,
  status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
  created_at timestamptz default now()
);

-- 4. TABEL JADWAL & AGENDA
create table if not exists public.schedule (
  id uuid primary key default gen_random_uuid(),
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

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

-- 5. TABEL TRANSAKSI (PRESENSI & NILAI SISWA)
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  school_year_id uuid references public.school_years(id),
  teacher_id uuid references public.profiles(id),
  date date not null,
  meeting_number int not null,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')),
  created_at timestamptz default now()
);

create table if not exists public.grade_records (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  class_id uuid references public.classes(id),
  school_year_id uuid references public.school_years(id),
  teacher_id uuid references public.profiles(id),
  date date not null,
  assessment_type text not null,
  score numeric not null,
  created_at timestamptz default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  class_id uuid references public.classes(id),
  subject_id uuid references public.subjects(id),
  school_year_id uuid references public.school_years(id),
  date timestamptz default now(),
  meeting_number int,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  created_at timestamptz default now()
);

create table if not exists public.student_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id),
  note text not null,
  type text default 'neutral' check (type in ('positive', 'improvement', 'neutral')),
  date timestamptz default now()
);

-- 6. TABEL ABSENSI GURU (LOKASI)
create table if not exists public.teacher_attendance (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.profiles(id) on delete cascade,
  date date default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
  reason text,
  created_at timestamptz default now()
);

-- 7. TABEL MATERI & HOLIDAYS
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

create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  description text not null,
  type text default 'school' check (type in ('national', 'school')),
  created_at timestamptz default now()
);

-- 8. TABEL SETTINGS & TOKEN
create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

create table if not exists public.activation_tokens (
  id uuid primary key default gen_random_uuid(),
  token text unique not null,
  used_by uuid references public.profiles(id),
  used_at timestamptz,
  created_at timestamptz default now()
);

-- 9. TABEL MODUL AI & DRIVE
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
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
  updated_at timestamptz default now(),
  unique(user_id)
);

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

-- 10. VIEW UNTUK MEMPERMUDAH QUERY
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
left join public.classes c on ar.class_id = c.id
left join public.subjects s on ar.subject_id = s.id
left join public.profiles p on ar.teacher_id = p.id;

create or replace view public.grades_history as
select 
  gr.*,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records gr
left join public.classes c on gr.class_id = c.id
left join public.subjects s on gr.subject_id = s.id
left join public.profiles p on gr.teacher_id = p.id;

-- 11. FUNGSI RPC (LOGIKA BISNIS)

-- Fungsi untuk mendapatkan Aktivitas Guru (Semester Aktif)
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
  from public.profiles p
  where p.is_activated = true;
$$;

-- Fungsi Rekap Absensi Guru Harian
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
begin
    -- 1. Cek Kebijakan
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    -- 2. Hitung Wajib Hadir
    if v_policy = 'daily_based' then
        select count(*) into v_expected_count from public.profiles where role in ('teacher', 'headmaster') and is_activated = true;
    else
        select count(distinct teacher_id) into v_expected_count from public.schedule where day = (
            select 
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

    -- 3. Hitung Realisasi
    select count(*) into v_present_count from public.teacher_attendance where date = p_date and check_in is not null;
    select count(*) into v_late_count from public.teacher_attendance where date = p_date and status = 'Terlambat';

    return query select 
        v_expected_count,
        v_present_count,
        v_late_count,
        greatest(0, v_expected_count - v_present_count),
        case when v_expected_count = 0 then 100 else round((v_present_count::numeric / v_expected_count::numeric) * 100, 1) end;
end;
$$;

-- 12. FUNGSI AUTH SYNC & AUTO-ADMIN
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
      coalesce(new.raw_user_meta_data->>'full_name', 'Admin LakuKelas'),
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

-- 13. KEBIJAKAN RLS (KEAMANAN)
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.schedule enable row level security;
alter table public.agendas enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.holidays enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- Pola Kebijakan Sederhana (Anti-Recursion)
-- PROFILES: Semua user bisa baca profil orang lain (untuk dropdown), tapi hanya bisa ubah milik sendiri.
create policy "Public Profiles Access" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

-- DATA MASTER: Baca oleh semua user aktif, modifikasi oleh Admin.
create policy "Active users view classes" on public.classes for select using (true);
create policy "Admin manage classes" on public.classes for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "Active users view subjects" on public.subjects for select using (true);
create policy "Admin manage subjects" on public.subjects for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- TRANSAKSI: Guru kelola data sendiri, Kepala Sekolah & Admin bisa lihat semua.
create policy "Manage own attendance" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "View all attendance" on public.attendance_records for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

create policy "Manage own grades" on public.grade_records for all using (auth.uid() = teacher_id);
create policy "View all grades" on public.grade_records for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

create policy "Manage own journal" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "View all journals" on public.journal_entries for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'headmaster'))
);

create policy "Manage own questions" on public.questions for all using (auth.uid() = created_by);
create policy "Manage own drive" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "Manage own ai docs" on public.ai_documents for all using (auth.uid() = user_id);

-- 14. INDEKS UNTUK PERFORMA
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_attendance_date on public.attendance_records(date);
create index if not exists idx_grades_student on public.grade_records(student_id);
create index if not exists idx_schedule_day on public.schedule(day);
create index if not exists idx_questions_topic on public.questions(topic);