-- ==========================================
-- LAKUKELAS MASTER BLUEPRINT V21.0 (FINAL GOLD)
-- Comprehensive Database Schema & Security
-- ==========================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- PROFILES: Inti identitas pengguna
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    full_name text default 'User LakuKelas',
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
    is_homeroom_teacher boolean default false
);

-- SCHOOL YEARS: Manajemen semester
create table public.school_years (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    name text not null, -- e.g. 2024/2025 - Ganjil
    teacher_id uuid references public.profiles(id),
    is_active boolean default false
);

-- CLASSES: Rombongan belajar
create table public.classes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    name text not null,
    teacher_id uuid references public.profiles(id) -- Wali Kelas
);

-- SUBJECTS: Mata pelajaran & KKM
create table public.subjects (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    name text not null,
    kkm int default 75,
    teacher_id uuid references public.profiles(id)
);

-- STUDENTS: Data induk siswa
create table public.students (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    name text not null,
    nis text unique not null,
    gender text check (gender in ('Laki-laki', 'Perempuan')),
    class_id uuid references public.classes(id) on delete set null,
    status text default 'active' check (status in ('active', 'graduated', 'dropout', 'inactive')),
    avatar_url text
);

-- SCHEDULE: Jadwal mengajar guru
create table public.schedule (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    day text not null,
    start_time time not null,
    end_time time not null,
    subject_id uuid references public.subjects(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade
);

-- ATTENDANCE RECORDS: Presensi harian siswa
create table public.attendance_records (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date date not null,
    meeting_number int,
    student_id uuid references public.students(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade,
    status text check (status in ('Hadir', 'Sakit', 'Izin', 'Alpha'))
);

-- GRADE RECORDS: Penilaian akademik
create table public.grade_records (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date date not null,
    assessment_type text not null,
    score numeric not null,
    student_id uuid references public.students(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    class_id uuid references public.classes(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade
);

-- JOURNAL ENTRIES: Jurnal harian mengajar
create table public.journal_entries (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date timestamptz default now(),
    meeting_number int,
    class_id uuid references public.classes(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    school_year_id uuid references public.school_years(id) on delete cascade,
    learning_objectives text not null,
    learning_activities text not null,
    assessment text,
    reflection text
);

-- AGENDAS: Kalender kegiatan guru
create table public.agendas (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date date not null,
    title text not null,
    description text,
    tag text,
    color text,
    start_time time,
    end_time time,
    teacher_id uuid references public.profiles(id) on delete cascade
);

-- MATERIALS: Berbagi link sumber belajar
create table public.materials (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    title text not null,
    description text,
    link_url text not null,
    class_id uuid references public.classes(id) on delete cascade,
    subject_id uuid references public.subjects(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade
);

-- STUDENT NOTES: Catatan khusus perkembangan siswa
create table public.student_notes (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    date timestamptz default now(),
    student_id uuid references public.students(id) on delete cascade,
    teacher_id uuid references public.profiles(id) on delete cascade,
    note text not null,
    type text default 'neutral' check (type in ('positive', 'improvement', 'neutral'))
);

-- TEACHER ATTENDANCE: Absensi staf pengajar (GPS based)
create table public.teacher_attendance (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz default now(),
    teacher_id uuid references public.profiles(id) on delete cascade,
    date date not null,
    check_in time,
    check_out time,
    status text check (status in ('Tepat Waktu', 'Terlambat', 'Tidak Hadir', 'Sakit', 'Izin')),
    reason text,
    location_lat numeric,
    location_lng numeric
);

-- HOLIDAYS: Manajemen hari libur
create table public.holidays (
    id uuid primary key default gen_random_uuid(),
    date date unique not null,
    description text not null,
    type text default 'national' check (type in ('national', 'school'))
);

-- SETTINGS: Konfigurasi sistem global
create table public.settings (
    key text primary key,
    value text not null,
    updated_at timestamptz default now()
);

-- ACTIVATION TOKENS: Sistem pendaftaran terkontrol
create table public.activation_tokens (
    id uuid primary key default gen_random_uuid(),
    token text unique not null,
    created_at timestamptz default now(),
    used_by uuid references public.profiles(id),
    used_at timestamptz
);

-- QUESTIONS: Bank Soal AI
create table public.questions (
    id uuid primary key default gen_random_uuid(),
    school_id uuid, -- Reserved for future multi-school
    created_by uuid references public.profiles(id),
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
    question_type text, -- multiple_choice / essay
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
    created_at timestamptz default now()
);

-- GOOGLE DRIVE: Integrasi Cloud Storage
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
    document_type text, -- rpp / soal / lkpd
    title text not null,
    drive_file_id text,
    drive_file_url text,
    drive_folder_id text,
    status text default 'created',
    created_at timestamptz default now()
);

-- 3. VIEWS (RIWAYAT & JOIN DATA)

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
    c.name as class_name,
    s.name as subject_name,
    p.full_name as teacher_name,
    st.name as student_name
from public.attendance_records a
left join public.classes c on a.class_id = c.id
left join public.subjects s on a.subject_id = s.id
left join public.profiles p on a.teacher_id = p.id
left join public.students st on a.student_id = st.id;

create or replace view public.grades_history as
select 
    g.*,
    c.name as class_name,
    s.name as subject_name,
    s.kkm as subject_kkm,
    p.full_name as teacher_name,
    st.name as student_name
from public.grade_records g
left join public.classes c on g.class_id = c.id
left join public.subjects s on g.subject_id = s.id
left join public.profiles p on g.teacher_id = p.id
left join public.students st on g.student_id = st.id;

create or replace view public.student_notes_with_teacher as
select 
    sn.*,
    p.full_name as teacher_name
from public.student_notes sn
left join public.profiles p on sn.teacher_id = p.id;

-- 4. FUNCTIONS & TRIGGERS

-- Function: Cek Role Admin
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Function: Cek Wali Kelas
create or replace function public.is_homeroom_teacher(p_student_id uuid)
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.classes c
    join public.students s on s.class_id = c.id
    where c.teacher_id = auth.uid() and s.id = p_student_id
  );
end;
$$;

-- Trigger: Auto-Admin for first user
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
    is_first_user boolean;
begin
    select not exists (select 1 from public.profiles) into is_first_user;
    
    if is_first_user then
        insert into public.profiles (id, full_name, role, is_activated)
        values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Administrator LakuKelas'), 'admin', true);
    else
        insert into public.profiles (id, full_name, role, is_activated)
        values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'User LakuKelas'), 'teacher', false);
    end if;
    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RPC: Ringkasan kehadiran guru hari ini
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
    v_total_staff bigint;
    v_expected_ids uuid[];
begin
    -- 1. Ambil Kebijakan
    select value into v_policy from public.settings where key = 'attendance_policy';
    v_policy := coalesce(v_policy, 'schedule_based');

    -- 2. Tentukan Guru yang Wajib Hadir
    if v_policy = 'daily_based' then
        v_expected_ids := array(select id from public.profiles where role in ('teacher', 'headmaster') and is_activated = true);
    else
        v_expected_ids := array(
            select distinct teacher_id from public.schedule 
            where day = trim(to_char(p_date, 'Day', 'NLS_DATE_LANGUAGE = INDONESIAN'))
        );
    end if;

    v_total_staff := coalesce(array_length(v_expected_ids, 1), 0);

    return query
    select 
        v_total_staff as total_expected,
        count(*) filter (where status in ('Tepat Waktu', 'Terlambat')) as total_present,
        count(*) filter (where status = 'Terlambat') as total_late,
        (v_total_staff - count(*) filter (where status in ('Tepat Waktu', 'Terlambat', 'Sakit', 'Izin'))) as total_absent,
        case when v_total_staff = 0 then 100 
             else round((count(*) filter (where status in ('Tepat Waktu', 'Terlambat'))::numeric / v_total_staff) * 100, 1) 
        end as attendance_rate
    from public.teacher_attendance
    where date = p_date and teacher_id = any(v_expected_ids);
end;
$$;

-- RPC: Statistik aktivitas per guru (untuk monitoring)
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
        (select count(distinct concat(a.date, a.meeting_number, a.class_id)) from public.attendance_records a where a.teacher_id = p.id) as attendance_count,
        (select count(distinct concat(g.date, g.assessment_type, g.class_id)) from public.grade_records g where g.teacher_id = p.id) as grades_count,
        (select count(*) from public.journal_entries j where j.teacher_id = p.id) as journal_count,
        (select count(distinct class_id) from public.schedule s where s.teacher_id = p.id) as classes_handled_count
    from public.profiles p
    where p.role in ('teacher', 'headmaster') and p.is_activated = true;
$$;

-- 5. RLS POLICIES (SECURITY LAYER)

alter table public.profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.classes enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.schedule enable row level security;
alter table public.attendance_records enable row level security;
alter table public.grade_records enable row level security;
alter table public.journal_entries enable row level security;
alter table public.agendas enable row level security;
alter table public.materials enable row level security;
alter table public.student_notes enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.holidays enable row level security;
alter table public.settings enable row level security;
alter table public.activation_tokens enable row level security;
alter table public.questions enable row level security;
alter table public.google_drive_integrations enable row level security;
alter table public.ai_documents enable row level security;

-- Global Grant for Vercel/Supabase Authenticated Users
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all functions in schema public to anon, authenticated;

-- Master Data Policy (Admin Full Access, Others Select)
create policy "admin_master_all" on public.school_years for all using (public.is_admin());
create policy "others_master_select" on public.school_years for select using (true);

create policy "admin_classes_all" on public.classes for all using (public.is_admin());
create policy "others_classes_select" on public.classes for select using (true);

create policy "admin_subjects_all" on public.subjects for all using (public.is_admin());
create policy "others_subjects_select" on public.subjects for select using (true);

create policy "admin_students_all" on public.students for all using (public.is_admin());
create policy "others_students_select" on public.students for select using (true);

create policy "admin_schedule_all" on public.schedule for all using (public.is_admin());
create policy "others_schedule_select" on public.schedule for select using (true);

-- Profiles Policy
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles for all using (public.is_admin());

-- Records Policy (Guru own data, Wali Kelas monitoring, Kepsek monitoring)
create policy "records_all_own" on public.attendance_records for all using (auth.uid() = teacher_id);
create policy "records_select_monitoring" on public.attendance_records for select using (
    public.is_admin() or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'headmaster') or
    public.is_homeroom_teacher(student_id)
);

create policy "grades_all_own" on public.grade_records for all using (auth.uid() = teacher_id);
create policy "grades_select_monitoring" on public.grade_records for select using (
    public.is_admin() or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'headmaster') or
    public.is_homeroom_teacher(student_id)
);

create policy "journal_all_own" on public.journal_entries for all using (auth.uid() = teacher_id);
create policy "journal_select_monitoring" on public.journal_entries for select using (
    public.is_admin() or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'headmaster')
);

-- AI & Drive Policy
create policy "ai_own_access" on public.questions for all using (auth.uid() = created_by);
create policy "ai_admin_monitoring" on public.questions for select using (public.is_admin());

create policy "drive_integration_own" on public.google_drive_integrations for all using (auth.uid() = user_id);
create policy "ai_docs_own" on public.ai_documents for all using (auth.uid() = user_id);

-- Settings & Tokens
create policy "settings_admin_all" on public.settings for all using (public.is_admin());
create policy "settings_public_select" on public.settings for select using (true);

create policy "tokens_admin_all" on public.activation_tokens for all using (public.is_admin());
create policy "tokens_public_select" on public.activation_tokens for select using (true);

-- Holidays
create policy "holidays_admin_all" on public.holidays for all using (public.is_admin());
create policy "holidays_public_select" on public.holidays for select using (true);
