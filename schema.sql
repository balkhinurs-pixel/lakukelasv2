
-- ==========================================
-- 1. TABEL UTAMA & EKSTENSI
-- ==========================================

-- Ekstensi untuk UUID
create extension if not exists "uuid-ossp";

-- Tabel Profil Pengguna
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
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
  is_homeroom_teacher boolean default false
);

-- Tabel Tahun Ajaran
create table if not exists public.school_years (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null, -- Contoh: "2023/2024 - Ganjil"
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  is_active boolean default false
);

-- Tabel Kelas
create table if not exists public.classes (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  teacher_id uuid references public.profiles(id) on delete set null -- Wali Kelas
);

-- Tabel Mata Pelajaran
create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  kkm integer default 75,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Tabel Siswa
create table if not exists public.students (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  nis text unique not null,
  gender text check (gender in ('Laki-laki', 'Perempuan')),
  class_id uuid references public.classes(id) on delete cascade,
  avatar_url text,
  status text check (status in ('active', 'graduated', 'dropout', 'inactive')) default 'active'
);

-- Tabel Jadwal Mengajar
create table if not exists public.schedule (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  day text not null check (day in ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')),
  start_time time not null,
  end_time time not null,
  subject_id uuid references public.subjects(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Tabel Jurnal Mengajar
create table if not exists public.journal_entries (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer,
  learning_objectives text not null,
  learning_activities text not null,
  assessment text,
  reflection text,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Tabel Presensi Siswa (Harian/Per Mapel)
create table if not exists public.attendance_records (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  meeting_number integer not null,
  status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha')) not null,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Tabel Nilai Siswa
create table if not exists public.grade_records (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  student_id uuid references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  school_year_id uuid references public.school_years(id) on delete cascade,
  assessment_type text not null, -- Contoh: "UH 1", "Tugas 1", "UTS"
  score numeric check (score >= 0 and score <= 100) not null,
  teacher_id uuid references public.profiles(id) on delete cascade
);

-- Tabel Agenda Pribadi Guru
create table if not exists public.agendas (
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

-- Tabel Pengaturan Sistem
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- Tabel Absensi Guru (V4.6)
create table if not exists public.teacher_attendance (
  id uuid default uuid_generate_v4() primary key,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  check_in time,
  check_out time,
  status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')) default 'Tepat Waktu',
  reason text, -- Alasan jika izin/sakit
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Tabel Hari Libur (V4.6)
create table if not exists public.holidays (
  id uuid default uuid_generate_v4() primary key,
  date date unique not null,
  description text not null
);

-- Tabel Catatan Khusus Siswa (V4.5)
create table if not exists public.student_notes (
  id uuid default uuid_generate_v4() primary key,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  student_id uuid references public.students(id) on delete cascade,
  teacher_id uuid references public.profiles(id) on delete cascade,
  note text not null,
  type text check (type in ('positive', 'improvement', 'neutral')) default 'neutral'
);

-- Tabel Materi Pembelajaran (V4.10)
create table if not exists public.materials (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  class_id uuid references public.classes(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  description text,
  link_url text not null
);

-- ==========================================
-- 2. VIEW / VIRTUAL TABLES
-- ==========================================

-- View Jurnal dengan Nama Kelas & Mapel
create or replace view public.journal_entries_with_names as
select 
  j.*,
  c.name as "className",
  s.name as "subjectName"
from public.journal_entries j
join public.classes c on j.class_id = c.id
join public.subjects s on j.subject_id = s.id;

-- View Riwayat Presensi dengan Info Lengkap
create or replace view public.attendance_history as
select 
  a.id, a.date, a.meeting_number, a.status, a.student_id, a.class_id, a.subject_id, a.teacher_id, a.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  p.full_name as teacher_name
from public.attendance_records a
join public.classes c on a.class_id = c.id
join public.subjects s on a.subject_id = s.id
join public.profiles p on a.teacher_id = p.id;

-- View Riwayat Nilai dengan Info Lengkap
create or replace view public.grades_history as
select 
  g.id, g.date, g.assessment_type, g.score, g.student_id, g.class_id, g.subject_id, g.teacher_id, g.school_year_id,
  c.name as class_name,
  s.name as subject_name,
  s.kkm as subject_kkm,
  p.full_name as teacher_name
from public.grade_records g
join public.classes c on g.class_id = c.id
join public.subjects s on g.subject_id = s.id
join public.profiles p on g.teacher_id = p.id;

-- View Catatan Siswa dengan Nama Guru
create or replace view public.student_notes_with_teacher as
select 
  n.*,
  p.full_name as teacher_name
from public.student_notes n
join public.profiles p on n.teacher_id = p.id;

-- ==========================================
-- 3. FUNCTIONS & RPC
-- ==========================================

-- Fungsi untuk menangani pendaftaran pengguna baru (Webhook)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'role', 'teacher'));
  return new;
end;
$$;

-- Trigger pendaftaran baru (Jalankan ini jika belum ada)
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();

-- Fungsi menghitung statistik aktivitas guru
create or replace function public.get_teacher_activity_counts()
returns table (
    teacher_id uuid,
    attendance_count bigint,
    grades_count bigint,
    journal_count bigint,
    classes_handled_count bigint
) language sql as $$
    select 
        p.id as teacher_id,
        (select count(distinct date || class_id || subject_id || meeting_number) from attendance_records where teacher_id = p.id) as attendance_count,
        (select count(distinct date || class_id || subject_id || assessment_type) from grade_records where teacher_id = p.id) as grades_count,
        (select count(*) from journal_entries where teacher_id = p.id) as journal_count,
        (select count(distinct class_id) from schedule where teacher_id = p.id) as classes_handled_count
    from profiles p
    where p.role in ('teacher', 'headmaster');
$$;

-- Fungsi Monitoring Kehadiran Guru (Cerdas)
create or replace function public.get_teacher_attendance_summary(p_date date)
returns table (
    total_expected bigint,
    total_present bigint,
    total_late bigint,
    total_absent bigint,
    attendance_rate numeric
) language plpgsql as $$
declare
    v_policy text;
    v_is_holiday boolean;
    v_expected_ids uuid[];
begin
    -- 1. Cek Libur
    select exists(select 1 from holidays where date = p_date) into v_is_holiday;
    
    -- 2. Ambil Kebijakan
    select value into v_policy from settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    if v_is_holiday then
        return query select 0::bigint, 0::bigint, 0::bigint, 0::bigint, 0::numeric;
        return;
    end if;

    -- 3. Tentukan siapa yang wajib hadir
    if v_policy = 'daily_based' then
        select array_agg(id) into v_expected_ids from profiles where role in ('teacher', 'headmaster');
    else
        -- Cari hari (Indonesian)
        declare
            v_day_name text;
        begin
            SELECT 
                CASE extract(dow from p_date)
                    WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
                    WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
                    WHEN 6 THEN 'Sabtu'
                END INTO v_day_name;
            
            select array_agg(distinct teacher_id) into v_expected_ids from schedule where day = v_day_name;
        end;
    end if;

    v_expected_ids := coalesce(v_expected_ids, ARRAY[]::uuid[]);

    return query
    with stats as (
        select 
            cardinality(v_expected_ids) as expected,
            count(id) filter (where teacher_id = any(v_expected_ids)) as present,
            count(id) filter (where teacher_id = any(v_expected_ids) and status = 'Terlambat') as late
        from teacher_attendance
        where date = p_date
    )
    select 
        expected::bigint,
        present::bigint,
        late::bigint,
        (expected - present)::bigint,
        case when expected > 0 then round((present::numeric / expected::numeric) * 100, 1) else 0 end
    from stats;
end;
$$;

-- Fungsi Diagnosis (Alat bantu admin via SQL)
create or replace function public.diagnose_attendance_logic(p_date date)
returns json language plpgsql as $$
declare
    res json;
    v_day text;
    v_policy text;
begin
    SELECT CASE extract(dow from p_date)
        WHEN 0 THEN 'Minggu' WHEN 1 THEN 'Senin' WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu' WHEN 4 THEN 'Kamis' WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu'
    END INTO v_day;

    select value into v_policy from settings where key = 'attendance_policy';

    select json_build_object(
        'input_date', p_date,
        'calculated_day', v_day,
        'active_policy', coalesce(v_policy, 'not set (default schedule)'),
        'total_teachers_in_db', (select count(*) from profiles where role in ('teacher', 'headmaster')),
        'teachers_with_schedule_today', (select count(distinct teacher_id) from schedule where day = v_day),
        'teachers_already_checked_in', (select count(*) from teacher_attendance where date = p_date)
    ) into res;
    
    return res;
end;
$$;

-- ==========================================
-- 4. STORAGE CONFIGURATION (V4.11)
-- ==========================================

-- Menambahkan bucket 'avatars' secara otomatis jika belum ada
-- Catatan: Ekstensi ini memerlukan 'insert' ke storage.buckets
-- Jika error di SQL Editor karena permission, Anda bisa mengabaikan bagian ini 
-- dan tetap membuatnya secara manual di dashboard.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Kebijakan Keamanan Storage (RLS for Storage)
-- 1. Izinkan semua orang melihat file (Public Access)
create policy "Avatar Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- 2. Izinkan user yang login untuk mengunggah file
create policy "Authenticated User Upload"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- 3. Izinkan user memperbarui/menghapus file miliknya (berdasarkan path user_id)
create policy "User Update Own Avatar"
on storage.objects for update
using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

create policy "User Delete Own Avatar"
on storage.objects for delete
using ( bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text );

-- 4. Kebijakan Khusus untuk Logo Sekolah (Hanya Admin)
create policy "Admin Manage School Logo"
on storage.objects for all
using (
  bucket_id = 'avatars' 
  and name like 'school_logo_%'
  and (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- ==========================================
-- 5. KEBIJAKAN KEAMANAN (RLS - TABLES)
-- ==========================================

alter table public.profiles enable row level security;
create policy "Profil dapat dilihat oleh semua pengguna terautentikasi" on public.profiles for select to authenticated using (true);
create policy "Pengguna dapat mengubah profil sendiri" on public.profiles for update to authenticated using (auth.uid() = id);

alter table public.school_years enable row level security;
create policy "Tahun ajaran dapat dilihat semua staf" on public.school_years for select to authenticated using (true);
create policy "Admin dapat mengelola tahun ajaran" on public.school_years for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.classes enable row level security;
create policy "Kelas dapat dilihat semua staf" on public.classes for select to authenticated using (true);
create policy "Admin dapat mengelola kelas" on public.classes for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.subjects enable row level security;
create policy "Mapel dapat dilihat semua staf" on public.subjects for select to authenticated using (true);
create policy "Admin dapat mengelola mapel" on public.subjects for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.students enable row level security;
create policy "Siswa dapat dilihat semua staf" on public.students for select to authenticated using (true);
create policy "Admin dapat mengelola siswa" on public.students for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.schedule enable row level security;
create policy "Jadwal dapat dilihat semua staf" on public.schedule for select to authenticated using (true);
create policy "Admin dapat mengelola jadwal" on public.schedule for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.journal_entries enable row level security;
create policy "Guru dapat mengelola jurnal sendiri" on public.journal_entries for all to authenticated using (auth.uid() = teacher_id);
create policy "Staf dapat melihat semua jurnal" on public.journal_entries for select to authenticated using (true);

alter table public.attendance_records enable row level security;
create policy "Guru dapat mengelola presensi sendiri" on public.attendance_records for all to authenticated using (auth.uid() = teacher_id);
create policy "Staf dapat melihat semua presensi" on public.attendance_records for select to authenticated using (true);

alter table public.grade_records enable row level security;
create policy "Guru dapat mengelola nilai sendiri" on public.grade_records for all to authenticated using (auth.uid() = teacher_id);
create policy "Staf dapat melihat semua nilai" on public.grade_records for select to authenticated using (true);

alter table public.agendas enable row level security;
create policy "Guru dapat mengelola agenda sendiri" on public.agendas for all to authenticated using (auth.uid() = teacher_id);

alter table public.settings enable row level security;
create policy "Pengaturan dapat dilihat semua staf" on public.settings for select to authenticated using (true);
create policy "Admin dapat mengelola pengaturan" on public.settings for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.teacher_attendance enable row level security;
create policy "Guru dapat mengelola absen masuk sendiri" on public.teacher_attendance for all to authenticated using (auth.uid() = teacher_id);
create policy "Kepala sekolah dan Admin dapat melihat semua absen guru" on public.teacher_attendance for select to authenticated using ((select role from profiles where id = auth.uid()) in ('admin', 'headmaster'));

alter table public.holidays enable row level security;
create policy "Hari libur dapat dilihat semua staf" on public.holidays for select to authenticated using (true);
create policy "Admin dapat mengelola hari libur" on public.holidays for all to authenticated using ((select role from profiles where id = auth.uid()) = 'admin');

alter table public.student_notes enable row level security;
create policy "Guru dapat mengelola catatan sendiri" on public.student_notes for all to authenticated using (auth.uid() = teacher_id);
create policy "Wali kelas dapat melihat catatan siswanya" on public.student_notes for select to authenticated using (
  (select is_homeroom_teacher from profiles where id = auth.uid()) = true
);

alter table public.materials enable row level security;
create policy "Guru dapat mengelola materi sendiri" on public.materials for all to authenticated using (auth.uid() = teacher_id);
create policy "Semua staf dapat melihat materi" on public.materials for select to authenticated using (true);
